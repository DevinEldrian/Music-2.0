import React, { useState, useEffect } from 'react';
import { Track, VisualizerMode } from '../types';
import { Visualizer } from './Visualizer';
import { Minimize2, Pause, Play, SkipBack, SkipForward, Volume2, VolumeX } from 'lucide-react';
import { formatTime } from '../utils/formatters';

interface FocusModeOverlayProps {
  isOpen: boolean;
  onClose: () => void;
  track: Track | null;
  isPlaying: boolean;
  currentTime: number;
  duration: number;
  visualizerMode: VisualizerMode;
  onPlayPause: () => void;
  onPrev: () => void;
  onNext: () => void;
}

export const FocusModeOverlay: React.FC<FocusModeOverlayProps> = ({
  isOpen,
  onClose,
  track,
  isPlaying,
  currentTime,
  duration,
  visualizerMode,
  onPlayPause,
  onPrev,
  onNext,
}) => {
  const [clock, setClock] = useState('');

  useEffect(() => {
    const updateTime = () => {
      const now = new Date();
      setClock(
        now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })
      );
    };
    updateTime();
    const interval = setInterval(updateTime, 1000);
    return () => clearInterval(interval);
  }, []);

  if (!isOpen || !track) return null;

  // Find active lyric line
  const lyrics = track.lyrics || [];
  let activeLyric = '';
  for (let i = lyrics.length - 1; i >= 0; i--) {
    if (currentTime >= lyrics[i].time) {
      activeLyric = lyrics[i].text;
      break;
    }
  }

  return (
    <div className="fixed inset-0 z-50 bg-[#06080d] text-white flex flex-col justify-between p-8 sm:p-12 select-none overflow-hidden">
      {/* Background ambient lighting orbs for glass refraction */}
      <div className="absolute top-[10%] left-[20%] w-[500px] h-[500px] rounded-full bg-amber-500/15 blur-[140px] pointer-events-none animate-orb-1" />
      <div className="absolute bottom-[15%] right-[20%] w-[550px] h-[550px] rounded-full bg-cyan-500/15 blur-[150px] pointer-events-none animate-orb-2" />

      {/* Background ambient visualizer canvas */}
      <div className="absolute inset-0 opacity-45 pointer-events-none">
        <Visualizer mode={visualizerMode} isPlaying={isPlaying} accentColor="#f59e0b" />
      </div>
      <div className="absolute inset-0 bg-gradient-to-t from-[#06080d] via-black/30 to-[#06080d]/80 pointer-events-none" />

      {/* Top Bar: Digital Clock & Close */}
      <div className="relative z-10 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <span className="font-mono text-xs uppercase tracking-widest text-amber-400">
            AURA FOCUS AMBIENT
          </span>
          <span className="text-slate-600">·</span>
          <span className="font-mono text-xs text-slate-300 tabular-nums">{clock}</span>
        </div>

        <button
          onClick={onClose}
          className="flex items-center gap-2 px-3.5 py-1.5 rounded-xl glass-pill text-xs font-mono text-slate-300 hover:text-white hover:bg-white/10 transition-colors"
        >
          <Minimize2 className="w-4 h-4" />
          <span>Exit Focus (Esc)</span>
        </button>
      </div>

      {/* Center Stage: Album Art, Info & Dynamic Lyric Line */}
      <div className="relative z-10 flex flex-col items-center text-center my-auto max-w-2xl mx-auto">
        {/* Cover Art */}
        <div className="relative w-52 h-52 sm:w-68 sm:h-68 rounded-3xl overflow-hidden shadow-[0_30px_70px_rgba(0,0,0,0.8),inset_0_1px_2px_rgba(255,255,255,0.2)] border border-white/20 mb-8 backdrop-blur-xl">
          <img
            src={track.coverUrl}
            alt={track.title}
            referrerPolicy="no-referrer"
            className="w-full h-full object-cover"
          />
        </div>

        {/* Title & Artist */}
        <h1 className="text-2xl sm:text-4xl font-bold tracking-tight text-white mb-2">
          {track.title}
        </h1>
        <p className="text-base sm:text-lg text-slate-300 font-mono mb-6">
          {track.artist}
        </p>

        {/* Synchronized Lyric Focus Ribbon */}
        {activeLyric && (
          <div className="px-6 py-3 rounded-2xl glass-surface text-amber-300 text-base sm:text-xl font-medium tracking-wide border border-white/15 shadow-2xl animate-pulse">
            "{activeLyric}"
          </div>
        )}
      </div>

      {/* Bottom Minimal Transport Controls */}
      <div className="relative z-10 flex flex-col items-center gap-4 max-w-md mx-auto w-full glass-modal p-4 rounded-3xl border border-white/15">
        {/* Time Progress Bar */}
        <div className="w-full flex items-center gap-3 text-xs font-mono text-slate-400">
          <span className="tabular-nums">{formatTime(currentTime)}</span>
          <div className="flex-1 h-1 bg-white/15 rounded-full overflow-hidden">
            <div
              className="h-full bg-amber-400 rounded-full"
              style={{ width: `${(currentTime / duration) * 100}%` }}
            />
          </div>
          <span className="tabular-nums">{formatTime(duration)}</span>
        </div>

        {/* Media Buttons */}
        <div className="flex items-center gap-6">
          <button
            onClick={onPrev}
            className="p-2 text-slate-400 hover:text-white transition-colors"
          >
            <SkipBack className="w-5 h-5" />
          </button>

          <button
            onClick={onPlayPause}
            className="w-12 h-12 rounded-full bg-amber-500 text-slate-950 flex items-center justify-center shadow-lg hover:scale-105 active:scale-95 transition-transform shadow-amber-500/25"
          >
            {isPlaying ? (
              <Pause className="w-6 h-6 fill-current" />
            ) : (
              <Play className="w-6 h-6 fill-current translate-x-0.5" />
            )}
          </button>

          <button
            onClick={onNext}
            className="p-2 text-slate-400 hover:text-white transition-colors"
          >
            <SkipForward className="w-5 h-5" />
          </button>
        </div>
      </div>
    </div>
  );
};
