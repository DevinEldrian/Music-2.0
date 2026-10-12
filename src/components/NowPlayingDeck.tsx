import React, { useState } from 'react';
import { DeckViewMode, Track } from '../types';
import { Disc3, Heart, ListPlus, Radio, Sparkles, Volume2 } from 'lucide-react';
import { formatTime } from '../utils/formatters';
import { audioEngine } from '../services/audioEngine';

interface NowPlayingDeckProps {
  track: Track;
  isPlaying: boolean;
  viewMode: DeckViewMode;
  currentTime: number;
  duration: number;
  isLiked: boolean;
  onToggleLike: (trackId: string) => void;
  onAddToQueue: (track: Track) => void;
  onOpenLyrics?: () => void;
}

export const NowPlayingDeck: React.FC<NowPlayingDeckProps> = ({
  track,
  isPlaying,
  viewMode,
  currentTime,
  duration,
  isLiked,
  onToggleLike,
  onAddToQueue,
  onOpenLyrics,
}) => {
  const [rpmSpeed, setRpmSpeed] = useState<'33' | '45'>('33');
  const [vinylCrackle, setVinylCrackle] = useState(false);

  // Calculate percentage for tonearm & cassette tape winding
  const progressPercent = duration > 0 ? (currentTime / duration) : 0;
  // Tonearm angle: starts at ~12 deg (outer edge) and moves to ~32 deg (inner run-out groove)
  const tonearmAngle = isPlaying ? 14 + progressPercent * 18 : 0;

  return (
    <div className="relative w-full h-full flex items-center justify-center p-4 select-none">
      {/* View: Modern Sleek Glass Deck */}
      {viewMode === 'modern' && (
        <div className="flex flex-col lg:flex-row items-center gap-8 max-w-4xl w-full">
          {/* Cover & Vinyl Peek */}
          <div className="relative group shrink-0">
            {/* Ambient Backlight Glow */}
            <div
              className="absolute -inset-4 rounded-3xl opacity-30 blur-2xl transition-opacity duration-700 pointer-events-none"
              style={{
                background: `radial-gradient(circle, #f59e0b 0%, #ec4899 40%, transparent 70%)`,
              }}
            />

            {/* Simulated vinyl disc peeking behind sleeve */}
            <div
              className={`absolute top-0 right-0 w-64 h-64 sm:w-80 sm:h-80 rounded-full bg-[#121318] border border-neutral-700/60 shadow-2xl transition-transform duration-700 pointer-events-none flex items-center justify-center ${
                isPlaying ? 'translate-x-16 sm:translate-x-20 rotate-45' : 'translate-x-4'
              }`}
            >
              <div
                className={`w-full h-full rounded-full flex items-center justify-center ${
                  isPlaying ? 'animate-vinyl-spin' : ''
                }`}
              >
                {/* Vinyl Grooves */}
                <div className="w-[88%] h-[88%] rounded-full border border-neutral-800/80 flex items-center justify-center">
                  <div className="w-[76%] h-[76%] rounded-full border border-neutral-800 flex items-center justify-center">
                    <div className="w-[62%] h-[62%] rounded-full border border-neutral-800/70 flex items-center justify-center">
                      <div className="w-24 h-24 rounded-full overflow-hidden border border-neutral-700 shadow-inner">
                        <img
                          src={track.coverUrl}
                          alt={track.title}
                          referrerPolicy="no-referrer"
                          className="w-full h-full object-cover"
                        />
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Album Cover Sleeve */}
            <div className="relative z-10 w-64 h-64 sm:w-80 sm:h-80 rounded-2xl overflow-hidden shadow-2xl border border-white/10 bg-neutral-900 group-hover:scale-[1.01] transition-transform">
              <img
                src={track.coverUrl}
                alt={track.title}
                referrerPolicy="no-referrer"
                className="w-full h-full object-cover"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-black/20 pointer-events-none" />

              {/* Floating Quality Tag */}
              <div className="absolute top-3 left-3 bg-black/60 backdrop-blur-md border border-white/10 px-2.5 py-1 rounded-md text-[11px] font-mono tracking-wider text-amber-300">
                Hi-Res 96kHz / 24-bit
              </div>
            </div>
          </div>

          {/* Track Info & Metadata */}
          <div className="flex-1 flex flex-col justify-center text-center lg:text-left z-10 min-w-0">
            <div className="flex items-center justify-center lg:justify-start gap-2 text-xs font-mono text-amber-400 mb-1">
              <span>{track.genre.toUpperCase()}</span>
              <span>·</span>
              <span>{track.year || 2024}</span>
              <span>·</span>
              <span className="text-slate-400">{formatTime(duration)}</span>
            </div>

            <h1 className="text-2xl sm:text-4xl font-bold text-white tracking-tight truncate mb-2">
              {track.title}
            </h1>
            <p className="text-base sm:text-lg text-slate-300 truncate mb-1">
              {track.artist}
            </p>
            <p className="text-xs sm:text-sm text-slate-500 truncate mb-6">
              {track.album}
            </p>

            {/* Quick Action Badges */}
            <div className="flex items-center justify-center lg:justify-start gap-3">
              <button
                onClick={() => onToggleLike(track.id)}
                className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-medium transition-colors ${
                  isLiked
                    ? 'bg-rose-500/15 border border-rose-500/40 text-rose-300 shadow-sm'
                    : 'glass-pill text-slate-300 hover:text-white hover:bg-white/10'
                }`}
              >
                <Heart className={`w-3.5 h-3.5 ${isLiked ? 'fill-current text-rose-400' : ''}`} />
                <span>{isLiked ? 'Liked' : 'Favorite'}</span>
              </button>

              <button
                onClick={() => onAddToQueue(track)}
                className="flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-medium glass-pill text-slate-300 hover:text-white hover:bg-white/10 transition-colors"
              >
                <ListPlus className="w-3.5 h-3.5" />
                <span>Queue</span>
              </button>

              {onOpenLyrics && (
                <button
                  onClick={onOpenLyrics}
                  className="flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-medium glass-pill text-slate-300 hover:text-white hover:bg-white/10 transition-colors"
                >
                  <Sparkles className="w-3.5 h-3.5 text-amber-400" />
                  <span>Lyrics</span>
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      {/* View: Vintage Vinyl Turntable Deck */}
      {viewMode === 'vinyl' && (
        <div className="flex flex-col items-center">
          {/* Turntable Plinth */}
          <div className="relative w-[340px] sm:w-[460px] h-[340px] sm:h-[460px] glass-surface rounded-3xl p-6 sm:p-8 shadow-[0_25px_60px_-15px_rgba(0,0,0,0.8),inset_0_1px_2px_rgba(255,255,255,0.15)] border border-white/15">
            {/* Turntable Platter Rim */}
            <div className="relative w-full h-full rounded-2xl bg-black/50 border border-white/10 shadow-inner flex items-center justify-center overflow-hidden">
              {/* Platter Mat & Vinyl Disc */}
              <div
                className={`relative w-[240px] sm:w-[320px] h-[240px] sm:h-[320px] rounded-full bg-[#0a0b0d] border-4 border-neutral-900 shadow-2xl flex items-center justify-center transition-transform ${
                  isPlaying ? 'animate-vinyl-spin' : 'animate-vinyl-spin-paused'
                }`}
                style={{
                  animationDuration: rpmSpeed === '33' ? '18s' : '13s',
                }}
              >
                {/* Vinyl Grooves Rings */}
                <div className="w-[92%] h-[92%] rounded-full border border-neutral-800/80 flex items-center justify-center">
                  <div className="w-[82%] h-[82%] rounded-full border border-neutral-800/60 flex items-center justify-center">
                    <div className="w-[72%] h-[72%] rounded-full border border-neutral-800/70 flex items-center justify-center">
                      <div className="w-[60%] h-[60%] rounded-full border border-neutral-800/90 flex items-center justify-center">
                        {/* Center Album Art Label */}
                        <div className="relative w-24 sm:w-28 h-24 sm:h-28 rounded-full overflow-hidden border-2 border-neutral-700 shadow-lg">
                          <img
                            src={track.coverUrl}
                            alt={track.title}
                            referrerPolicy="no-referrer"
                            className="w-full h-full object-cover"
                          />
                          <div className="absolute inset-0 bg-black/20" />
                          {/* Center Spindle Hole */}
                          <div className="absolute inset-0 m-auto w-4 h-4 rounded-full bg-[#181a22] border-2 border-neutral-600 shadow-inner" />
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Tonearm Assembly */}
              <div className="absolute top-6 right-6 sm:top-8 sm:right-8 w-24 h-64 pointer-events-none">
                {/* Tonearm Pivot Base */}
                <div className="absolute top-0 right-2 w-10 h-10 rounded-full bg-[#2a2e3d] border-2 border-slate-600 shadow-lg flex items-center justify-center">
                  <div className="w-5 h-5 rounded-full bg-[#15171f] border border-slate-500" />
                </div>

                {/* Tonearm Metallic Bar */}
                <div
                  className="absolute top-5 right-6 w-2 origin-top transition-transform duration-700 ease-out"
                  style={{
                    height: '190px',
                    transform: `rotate(${tonearmAngle}deg)`,
                  }}
                >
                  <div className="w-1.5 h-full bg-gradient-to-b from-slate-300 via-slate-400 to-slate-600 rounded-full shadow-md" />
                  {/* Cartridge & Needle Head */}
                  <div className="absolute bottom-0 -left-1 w-4 h-6 bg-[#d97706] rounded-sm border border-amber-300/40 shadow-sm flex items-center justify-center">
                    <div className="w-1 h-2 bg-slate-900 rounded-full" />
                  </div>
                </div>
              </div>

              {/* 33/45 RPM Speed Switch & Dust Warmth */}
              <div className="absolute bottom-3 left-4 flex items-center gap-3 z-10">
                <div className="flex items-center bg-[#181b24] p-1 rounded-lg border border-slate-700/60">
                  <button
                    onClick={() => setRpmSpeed('33')}
                    className={`px-2 py-0.5 text-[10px] font-mono rounded ${
                      rpmSpeed === '33'
                        ? 'bg-amber-500 text-slate-950 font-bold'
                        : 'text-slate-400 hover:text-white'
                    }`}
                  >
                    33 RPM
                  </button>
                  <button
                    onClick={() => setRpmSpeed('45')}
                    className={`px-2 py-0.5 text-[10px] font-mono rounded ${
                      rpmSpeed === '45'
                        ? 'bg-amber-500 text-slate-950 font-bold'
                        : 'text-slate-400 hover:text-white'
                    }`}
                  >
                    45 RPM
                  </button>
                </div>

                <button
                  onClick={() => {
                    const nextVal = !vinylCrackle;
                    setVinylCrackle(nextVal);
                    audioEngine.toggleVinylCrackle(nextVal);
                  }}
                  className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-[10px] font-mono border transition-colors ${
                    vinylCrackle
                      ? 'bg-amber-500/20 border-amber-500/50 text-amber-300'
                      : 'bg-[#181b24] border-slate-700/60 text-slate-400 hover:text-white'
                  }`}
                  title="Simulate analog needle warm crackle"
                >
                  <Disc3 className="w-3 h-3" />
                  <span>Vinyl Warmth</span>
                </button>
              </div>

              {/* Strobe Light Dots on Rim */}
              <div className="absolute top-4 left-4 w-3 h-3 rounded-full bg-amber-500/80 shadow-[0_0_8px_#f59e0b] animate-pulse" />
            </div>
          </div>

          <div className="mt-4 text-center">
            <h2 className="text-lg font-bold text-white">{track.title}</h2>
            <p className="text-xs text-slate-400">{track.artist} · {track.album}</p>
          </div>
        </div>
      )}

      {/* View: Retro Tape Cassette Deck */}
      {viewMode === 'cassette' && (
        <div className="flex flex-col items-center">
          {/* Cassette Shell */}
          <div className="relative w-[340px] sm:w-[460px] h-[210px] sm:h-[280px] bg-gradient-to-b from-[#1e2330]/85 to-[#0f1118]/85 backdrop-blur-xl rounded-2xl p-4 sm:p-5 shadow-[0_25px_60px_-15px_rgba(0,0,0,0.8),inset_0_1px_2px_rgba(255,255,255,0.18)] border border-white/20 flex flex-col justify-between">
            {/* Top Tape Head Notch */}
            <div className="flex justify-between items-center px-4">
              <span className="text-[10px] font-mono tracking-widest text-slate-400">TYPE II · CHROME EQ 70µs</span>
              <span className="text-[10px] font-mono font-bold text-amber-400">SIDE A</span>
            </div>

            {/* Handwritten Label Plate */}
            <div className="relative bg-[#f8fafc] text-slate-900 rounded-lg p-2.5 sm:p-3 shadow-md mx-2 border border-slate-300">
              <div className="flex items-center justify-between border-b border-slate-300 pb-1 mb-1.5">
                <span className="font-mono text-[10px] uppercase tracking-wider text-slate-600 font-bold">
                  {track.genre} MIXTAPE
                </span>
                <span className="font-mono text-[10px] text-slate-500">
                  {formatTime(currentTime)} / {formatTime(duration)}
                </span>
              </div>
              <p className="font-bold text-sm sm:text-base text-slate-950 truncate tracking-tight">
                {track.title}
              </p>
              <p className="text-xs text-slate-700 truncate">
                {track.artist} — {track.album}
              </p>
            </div>

            {/* Tape Window with Rotating Reels */}
            <div className="relative bg-[#0d0e14] rounded-xl h-20 sm:h-28 mx-4 border border-slate-700/70 flex items-center justify-between px-6 sm:px-12 overflow-hidden">
              {/* Left Spool */}
              <div className="relative flex items-center justify-center">
                {/* Magnetic Tape Pack Left (shrinks as playback progresses) */}
                <div
                  className="absolute rounded-full bg-[#3e2723] border border-amber-950 shadow-md"
                  style={{
                    width: `${56 - progressPercent * 24}px`,
                    height: `${56 - progressPercent * 24}px`,
                  }}
                />
                {/* Spool Gear Cog */}
                <div
                  className={`relative z-10 w-9 h-9 sm:w-11 sm:h-11 rounded-full bg-white/90 border border-slate-400 flex items-center justify-center shadow-inner ${
                    isPlaying ? 'animate-vinyl-spin' : ''
                  }`}
                  style={{ animationDuration: '4s' }}
                >
                  <div className="w-3.5 h-3.5 rounded-full bg-slate-900" />
                  <div className="absolute w-1 h-7 bg-slate-400 rotate-0" />
                  <div className="absolute w-1 h-7 bg-slate-400 rotate-60" />
                  <div className="absolute w-1 h-7 bg-slate-400 -rotate-60" />
                </div>
              </div>

              {/* Tape Counter in Center */}
              <div className="flex flex-col items-center z-10">
                <div className="bg-[#11131a] px-2.5 py-1 rounded border border-slate-700 font-mono text-xs text-amber-400 tabular-nums font-bold tracking-widest shadow-inner">
                  {Math.floor(currentTime * 10).toString().padStart(4, '0')}
                </div>
                <span className="text-[9px] font-mono text-slate-500 mt-1">COUNTER</span>
              </div>

              {/* Right Spool */}
              <div className="relative flex items-center justify-center">
                {/* Magnetic Tape Pack Right (expands as playback progresses) */}
                <div
                  className="absolute rounded-full bg-[#3e2723] border border-amber-950 shadow-md"
                  style={{
                    width: `${32 + progressPercent * 24}px`,
                    height: `${32 + progressPercent * 24}px`,
                  }}
                />
                {/* Spool Gear Cog */}
                <div
                  className={`relative z-10 w-9 h-9 sm:w-11 sm:h-11 rounded-full bg-white/90 border border-slate-400 flex items-center justify-center shadow-inner ${
                    isPlaying ? 'animate-vinyl-spin' : ''
                  }`}
                  style={{ animationDuration: '4s' }}
                >
                  <div className="w-3.5 h-3.5 rounded-full bg-slate-900" />
                  <div className="absolute w-1 h-7 bg-slate-400 rotate-0" />
                  <div className="absolute w-1 h-7 bg-slate-400 rotate-60" />
                  <div className="absolute w-1 h-7 bg-slate-400 -rotate-60" />
                </div>
              </div>

              {/* Tape Guide Line */}
              <div className="absolute bottom-2 left-10 right-10 h-0.5 bg-[#4e342e]" />
            </div>

            {/* Bottom Mechanical Screws & Cutouts */}
            <div className="flex justify-between items-center px-3 text-[10px] font-mono text-slate-500">
              <span>MADE IN JAPAN</span>
              <span>STEREO TAPE</span>
            </div>
          </div>

          <div className="mt-4 text-center">
            <h2 className="text-lg font-bold text-white">{track.title}</h2>
            <p className="text-xs text-slate-400">{track.artist} · {track.album}</p>
          </div>
        </div>
      )}
    </div>
  );
};
