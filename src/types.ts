export interface LyricLine {
  time: number; // in seconds
  text: string;
}

export type SynthMood = 'synthwave' | 'ambient' | 'lofi' | 'classical' | 'chill';

export interface Track {
  id: string;
  title: string;
  artist: string;
  album: string;
  duration: number; // seconds
  coverUrl: string;
  audioUrl: string;
  genre: string;
  year?: number;
  lyrics?: LyricLine[];
  isCustom?: boolean;
  driveFileId?: string;
  synthMood: SynthMood;
}

export interface Playlist {
  id: string;
  name: string;
  description: string;
  trackIds: string[];
  coverUrl?: string;
  createdAt: string;
}

export type VisualizerMode = 'bars' | 'wave' | 'radial' | 'vu';

export type DeckViewMode = 'modern' | 'vinyl' | 'cassette';

export type RepeatMode = 'off' | 'all' | 'one';

export interface EqualizerPreset {
  name: string;
  gains: [number, number, number, number, number]; // 60Hz, 230Hz, 910Hz, 3.6kHz, 14kHz in dB
}
