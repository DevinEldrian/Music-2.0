import React, { useEffect, useRef } from 'react';
import { Track } from '../types';
import { Mic2, X } from 'lucide-react';
import { formatTime } from '../utils/formatters';

interface LyricsDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  track: Track | null;
  currentTime: number;
  onSeek: (time: number) => void;
}

export const LyricsDrawer: React.FC<LyricsDrawerProps> = ({
  isOpen,
  onClose,
  track,
  currentTime,
  onSeek,
}) => {
  const activeLineRef = useRef<HTMLDivElement | null>(null);
  const containerRef = useRef<HTMLDivElement | null>(null);

  const lyrics = track?.lyrics || [];

  // Find active lyric index
  let activeIndex = -1;
  for (let i = lyrics.length - 1; i >= 0; i--) {
    if (currentTime >= lyrics[i].time) {
      activeIndex = i;
      break;
    }
  }

  // Auto scroll to active lyric
  useEffect(() => {
    if (activeLineRef.current && containerRef.current) {
      activeLineRef.current.scrollIntoView({
        behavior: 'smooth',
        block: 'center',
      });
    }
  }, [activeIndex]);

  if (!isOpen || !track) return null;

  return (
    <aside className="w-80 md:w-96 bg-[#090b10]/70 backdrop-blur-3xl border-l border-white/10 flex flex-col h-full z-30 shadow-2xl select-none animate-in slide-in-from-right duration-300 shrink-0 pb-24">
      {/* Header */}
      <div className="h-16 px-6 border-b border-white/10 bg-white/[0.02] flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <Mic2 className="w-4 h-4 text-amber-400" />
          <h3 className="text-sm font-bold text-white font-mono tracking-tight">
            SYNCED LYRICS
          </h3>
        </div>
        <button
          onClick={onClose}
          className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-white/10 transition-colors"
        >
          <X className="w-4 h-4" />
        </button>
      </div>

      {/* Lyrics Content */}
      <div
        ref={containerRef}
        className="flex-1 overflow-y-auto px-6 py-10 space-y-6 scroll-smooth"
      >
        {lyrics.length > 0 ? (
          lyrics.map((line, idx) => {
            const isActive = idx === activeIndex;
            const isPassed = idx < activeIndex;

            return (
              <div
                key={idx}
                ref={isActive ? activeLineRef : null}
                onClick={() => onSeek(line.time)}
                className={`cursor-pointer transition-all duration-300 py-1.5 px-3 rounded-xl group ${
                  isActive
                    ? 'text-lg md:text-xl font-bold text-amber-300 scale-105 bg-amber-500/10'
                    : isPassed
                    ? 'text-sm md:text-base text-slate-400 hover:text-slate-200'
                    : 'text-sm md:text-base text-slate-500 hover:text-slate-300'
                }`}
              >
                <div className="flex items-baseline justify-between gap-2">
                  <p className="leading-relaxed">{line.text}</p>
                  <span className="text-[10px] font-mono tabular-nums text-slate-400 opacity-0 group-hover:opacity-100 transition-opacity shrink-0">
                    {formatTime(line.time)}
                  </span>
                </div>
              </div>
            );
          })
        ) : (
          <div className="text-center py-20 text-slate-400 space-y-2">
            <p className="text-sm font-medium">Instrumental Composition</p>
            <p className="text-xs font-mono text-slate-400">
              No vocal lyrics available for this audio track.
            </p>
          </div>
        )}
      </div>

      {/* Footer Track Info */}
      <div className="p-4 border-t border-white/10 bg-black/40 backdrop-blur-md flex items-center gap-3">
        <div className="w-10 h-10 rounded-lg overflow-hidden shrink-0 border border-white/10">
          <img
            src={track.coverUrl}
            alt={track.title}
            referrerPolicy="no-referrer"
            className="w-full h-full object-cover"
          />
        </div>
        <div className="min-w-0 flex-1">
          <p className="text-xs font-semibold text-white truncate">{track.title}</p>
          <p className="text-[11px] text-slate-400 truncate">{track.artist}</p>
        </div>
      </div>
    </aside>
  );
};
