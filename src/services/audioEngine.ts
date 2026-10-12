import { SynthMood } from '../types';

class AudioEngine {
  private audioCtx: AudioContext | null = null;
  private audioElement: HTMLAudioElement | null = null;
  private sourceNode: MediaElementAudioSourceNode | null = null;
  private eqFilters: BiquadFilterNode[] = [];
  private pannerNode: StereoPannerNode | null = null;
  private gainNode: GainNode | null = null;
  private analyserNode: AnalyserNode | null = null;

  // Procedural synthesizer nodes for fallback/ambient generation
  private synthInterval: number | null = null;
  private isSynthPlaying = false;
  private synthGain: GainNode | null = null;
  private currentTrackDuration = 180;
  private synthCurrentTime = 0;
  private synthTimer: number | null = null;

  // Listeners
  private onTimeUpdateCallback: ((time: number, duration: number) => void) | null = null;
  private onEndedCallback: (() => void) | null = null;
  private onErrorCallback: ((error: string) => void) | null = null;

  private isUsingSynth = false;
  private vinylNoiseNode: AudioBufferSourceNode | null = null;
  private vinylNoiseGain: GainNode | null = null;

  constructor() {
    // Lazy init on first user interaction
  }

  private initContext() {
    if (this.audioCtx) return;

    const AudioContextClass = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
    this.audioCtx = new AudioContextClass();

    this.audioElement = new Audio();
    this.audioElement.crossOrigin = 'anonymous';
    this.audioElement.preload = 'auto';

    try {
      this.sourceNode = this.audioCtx.createMediaElementSource(this.audioElement);
    } catch (e) {
      console.warn('Could not create MediaElementSource, using direct audio element mode', e);
    }

    // 5-band EQ
    const frequencies = [60, 230, 910, 3600, 14000];
    const types: BiquadFilterType[] = ['lowshelf', 'peaking', 'peaking', 'peaking', 'highshelf'];

    this.eqFilters = frequencies.map((freq, idx) => {
      const filter = this.audioCtx!.createBiquadFilter();
      filter.type = types[idx];
      filter.frequency.value = freq;
      filter.gain.value = 0;
      if (types[idx] === 'peaking') {
        filter.Q.value = 1.0;
      }
      return filter;
    });

    // Panner
    if (this.audioCtx.createStereoPanner) {
      this.pannerNode = this.audioCtx.createStereoPanner();
    }

    // Master Gain
    this.gainNode = this.audioCtx.createGain();
    this.gainNode.gain.value = 0.85;

    // Synth Gain
    this.synthGain = this.audioCtx.createGain();
    this.synthGain.gain.value = 0.35;

    // Analyser
    this.analyserNode = this.audioCtx.createAnalyser();
    this.analyserNode.fftSize = 256;
    this.analyserNode.smoothingTimeConstant = 0.82;

    // Connect node chain:
    // Source -> EQ0 -> EQ1 -> EQ2 -> EQ3 -> EQ4 -> Panner -> Gain -> Analyser -> Destination
    let lastNode: AudioNode | null = this.sourceNode;

    if (lastNode) {
      for (const filter of this.eqFilters) {
        lastNode.connect(filter);
        lastNode = filter;
      }

      if (this.pannerNode) {
        lastNode.connect(this.pannerNode);
        lastNode = this.pannerNode;
      }

      lastNode.connect(this.gainNode);
    }

    // Connect synthGain into EQ chain as well
    if (this.eqFilters.length > 0) {
      this.synthGain.connect(this.eqFilters[0]);
    } else {
      this.synthGain.connect(this.gainNode);
    }

    this.gainNode.connect(this.analyserNode);
    this.analyserNode.connect(this.audioCtx.destination);

    // Audio element event listeners
    this.audioElement.addEventListener('timeupdate', () => {
      if (!this.isUsingSynth && this.audioElement) {
        const current = this.audioElement.currentTime;
        const duration = this.audioElement.duration || this.currentTrackDuration;
        this.onTimeUpdateCallback?.(current, duration);
      }
    });

    this.audioElement.addEventListener('ended', () => {
      if (!this.isUsingSynth) {
        this.onEndedCallback?.();
      }
    });

    this.audioElement.addEventListener('error', () => {
      // If external streaming fails or CORS is blocked, gracefully fallback to procedural synthesis
      console.warn('Audio URL playback error, switching to audiophile synth fallback');
      this.startSynthFallback();
    });
  }

  public async playTrack(audioUrl: string, duration = 180, synthMood: SynthMood = 'chill', startTime = 0) {
    this.initContext();
    if (this.audioCtx?.state === 'suspended') {
      await this.audioCtx.resume();
    }

    this.stopSynth();
    this.isUsingSynth = false;
    this.currentTrackDuration = duration;

    if (this.audioElement) {
      try {
        this.audioElement.src = audioUrl;
        if (startTime > 0) {
          this.audioElement.currentTime = startTime;
        }
        const playPromise = this.audioElement.play();
        if (playPromise !== undefined) {
          await playPromise.catch((err) => {
            console.warn('Audio play was prevented or failed:', err);
            // Engage ambient synthesized generator
            this.startSynthFallback(synthMood, startTime);
          });
        }
      } catch (err) {
        console.warn('Exception during audio element play, fallback engaging:', err);
        this.startSynthFallback(synthMood, startTime);
      }
    }
  }

  public pause() {
    if (this.isUsingSynth) {
      this.pauseSynth();
    } else if (this.audioElement) {
      this.audioElement.pause();
    }
  }

  public async resume() {
    if (this.audioCtx?.state === 'suspended') {
      await this.audioCtx.resume();
    }
    if (this.isUsingSynth) {
      this.resumeSynth();
    } else if (this.audioElement) {
      try {
        await this.audioElement.play();
      } catch (e) {
        console.warn('Resume failed, engaging synth fallback', e);
        this.startSynthFallback();
      }
    }
  }

  public seek(seconds: number) {
    if (this.isUsingSynth) {
      this.synthCurrentTime = Math.max(0, Math.min(seconds, this.currentTrackDuration));
      this.onTimeUpdateCallback?.(this.synthCurrentTime, this.currentTrackDuration);
    } else if (this.audioElement) {
      this.audioElement.currentTime = seconds;
    }
  }

  public setVolume(volume: number) { // 0 to 1
    const clamped = Math.max(0, Math.min(1, volume));
    if (this.gainNode && this.audioCtx) {
      this.gainNode.gain.setValueAtTime(clamped, this.audioCtx.currentTime);
    }
    if (this.audioElement) {
      this.audioElement.volume = clamped;
    }
  }

  public setPlaybackRate(rate: number) {
    if (this.audioElement) {
      this.audioElement.playbackRate = rate;
    }
  }

  public setStereoPan(pan: number) { // -1 (left) to 1 (right)
    if (this.pannerNode && this.audioCtx) {
      this.pannerNode.pan.setValueAtTime(Math.max(-1, Math.min(1, pan)), this.audioCtx.currentTime);
    }
  }

  public setEqGain(bandIndex: number, gainDb: number) {
    if (this.eqFilters[bandIndex] && this.audioCtx) {
      const clamped = Math.max(-12, Math.min(12, gainDb));
      this.eqFilters[bandIndex].gain.setValueAtTime(clamped, this.audioCtx.currentTime);
    }
  }

  public setAllEqGains(gains: [number, number, number, number, number]) {
    gains.forEach((g, idx) => this.setEqGain(idx, g));
  }

  public getFrequencyData(): Uint8Array {
    if (!this.analyserNode) return new Uint8Array(64);
    const data = new Uint8Array(this.analyserNode.frequencyBinCount);
    this.analyserNode.getByteFrequencyData(data);
    return data;
  }

  public getTimeDomainData(): Uint8Array {
    if (!this.analyserNode) return new Uint8Array(64);
    const data = new Uint8Array(this.analyserNode.frequencyBinCount);
    this.analyserNode.getByteTimeDomainData(data);
    return data;
  }

  public onTimeUpdate(cb: (time: number, duration: number) => void) {
    this.onTimeUpdateCallback = cb;
  }

  public onEnded(cb: () => void) {
    this.onEndedCallback = cb;
  }

  public onError(cb: (error: string) => void) {
    this.onErrorCallback = cb;
  }

  // --- Procedural High-Fidelity Music Synthesizer Fallback ---
  // If external stream encounters network restriction or CORS error, this generates genuine soothing musical progressions!
  private startSynthFallback(mood: SynthMood = 'chill', startTime = 0) {
    this.initContext();
    this.isUsingSynth = true;
    this.synthCurrentTime = startTime;
    this.isSynthPlaying = true;

    // Mood scales and chord structures
    const moodScales: Record<SynthMood, number[][]> = {
      lofi: [
        [261.63, 329.63, 392.0, 493.88], // Cmaj7
        [220.0, 261.63, 329.63, 392.0],  // Am7
        [174.61, 220.0, 261.63, 329.63], // Fmaj7
        [196.0, 246.94, 293.66, 349.23], // G7
      ],
      synthwave: [
        [130.81, 164.81, 196.0, 246.94], // C3 bass
        [110.0, 130.81, 164.81, 196.0],  // A2 bass
        [87.31, 110.0, 130.81, 164.81],  // F2 bass
        [98.0, 123.47, 146.83, 174.61],  // G2 bass
      ],
      ambient: [
        [196.0, 293.66, 392.0, 587.33], // G sus2
        [174.61, 261.63, 349.23, 523.25], // F sus2
        [220.0, 329.63, 440.0, 659.25], // A min
        [164.81, 246.94, 329.63, 493.88], // E min
      ],
      classical: [
        [261.63, 329.63, 392.0, 523.25],
        [196.0, 246.94, 293.66, 392.0],
        [220.0, 261.63, 329.63, 440.0],
        [174.61, 220.0, 261.63, 349.23],
      ],
      chill: [
        [220.0, 261.63, 329.63, 392.0, 440.0],
        [174.61, 220.0, 261.63, 329.63, 392.0],
        [130.81, 164.81, 196.0, 246.94, 261.63],
        [146.83, 174.61, 220.0, 261.63, 293.66],
      ],
    };

    const chords = moodScales[mood] || moodScales.chill;
    let chordIndex = 0;

    const playNote = (freq: number, type: OscillatorType, duration: number, gainAmt: number) => {
      if (!this.audioCtx || !this.synthGain) return;
      try {
        const osc = this.audioCtx.createOscillator();
        const noteGain = this.audioCtx.createGain();
        osc.type = type;
        osc.frequency.setValueAtTime(freq, this.audioCtx.currentTime);

        noteGain.gain.setValueAtTime(0.001, this.audioCtx.currentTime);
        noteGain.gain.exponentialRampToValueAtTime(gainAmt, this.audioCtx.currentTime + 0.08);
        noteGain.gain.exponentialRampToValueAtTime(0.0001, this.audioCtx.currentTime + duration);

        osc.connect(noteGain);
        noteGain.connect(this.synthGain);

        osc.start();
        osc.stop(this.audioCtx.currentTime + duration);
      } catch {
        // Safe guard against audio context state
      }
    };

    // Play initial sound pulse
    const step = () => {
      if (!this.isSynthPlaying || !this.audioCtx) return;

      const currentChord = chords[chordIndex % chords.length];
      chordIndex++;

      // Play soothing chord pad notes
      currentChord.forEach((freq, i) => {
        const delay = i * 0.12;
        setTimeout(() => {
          if (!this.isSynthPlaying) return;
          const oscType: OscillatorType = mood === 'synthwave' ? 'sawtooth' : mood === 'classical' ? 'triangle' : 'sine';
          playNote(freq, oscType, 2.4, 0.08 / (i + 1));
        }, delay * 1000);
      });

      // Ambient subtle sub-bass
      const root = currentChord[0] / 2;
      playNote(root, 'sine', 2.8, 0.12);
    };

    step();
    this.synthInterval = window.setInterval(step, 2400);

    // Timeline tracker
    if (this.synthTimer) clearInterval(this.synthTimer);
    this.synthTimer = window.setInterval(() => {
      if (!this.isSynthPlaying) return;
      this.synthCurrentTime += 0.25;
      if (this.synthCurrentTime >= this.currentTrackDuration) {
        this.stopSynth();
        this.onEndedCallback?.();
      } else {
        this.onTimeUpdateCallback?.(this.synthCurrentTime, this.currentTrackDuration);
      }
    }, 250);
  }

  private pauseSynth() {
    this.isSynthPlaying = false;
  }

  private resumeSynth() {
    this.isSynthPlaying = true;
  }

  private stopSynth() {
    this.isSynthPlaying = false;
    if (this.synthInterval) {
      clearInterval(this.synthInterval);
      this.synthInterval = null;
    }
    if (this.synthTimer) {
      clearInterval(this.synthTimer);
      this.synthTimer = null;
    }
  }

  public toggleVinylCrackle(enabled: boolean) {
    this.initContext();
    if (!this.audioCtx) return;

    if (!enabled) {
      if (this.vinylNoiseNode) {
        try {
          this.vinylNoiseNode.stop();
          this.vinylNoiseNode.disconnect();
        } catch {
          // ignore
        }
        this.vinylNoiseNode = null;
      }
      return;
    }

    if (this.vinylNoiseNode) return;

    // Generate 5-second buffer of gentle vinyl noise and random dust clicks
    const bufferSize = this.audioCtx.sampleRate * 4;
    const buffer = this.audioCtx.createBuffer(1, bufferSize, this.audioCtx.sampleRate);
    const data = buffer.getChannelData(0);

    for (let i = 0; i < bufferSize; i++) {
      // Subtle background pinkish hiss
      let val = (Math.random() * 2 - 1) * 0.015;
      // Random subtle needle pop / crackle
      if (Math.random() < 0.0003) {
        val += (Math.random() * 2 - 1) * 0.25;
      }
      data[i] = val;
    }

    this.vinylNoiseNode = this.audioCtx.createBufferSource();
    this.vinylNoiseNode.buffer = buffer;
    this.vinylNoiseNode.loop = true;

    this.vinylNoiseGain = this.audioCtx.createGain();
    this.vinylNoiseGain.gain.value = 0.08;

    this.vinylNoiseNode.connect(this.vinylNoiseGain);
    if (this.gainNode) {
      this.vinylNoiseGain.connect(this.gainNode);
    } else {
      this.vinylNoiseGain.connect(this.audioCtx.destination);
    }

    this.vinylNoiseNode.start();
  }

  public destroy() {
    this.stopSynth();
    if (this.audioElement) {
      this.audioElement.pause();
      this.audioElement.src = '';
    }
    if (this.audioCtx) {
      this.audioCtx.close();
    }
  }
}

export const audioEngine = new AudioEngine();
