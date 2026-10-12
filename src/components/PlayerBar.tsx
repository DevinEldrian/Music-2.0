import React, { useState, useRef } from 'react';
import {
  DeckViewMode,
  RepeatMode,
  Track,
  VisualizerMode,
} from '../types';
import {
  Heart,
  Maximize2,
  Mic2,
  Pause,
  Play,
  Repeat,
  Repeat1,
  RotateCcw,
  Shuffle,
  SkipBack,
  SkipForward,
  Sliders,
  Timer,
  Volume2,
  VolumeX,
  ListMusic,
  Activity,
  Disc3,
  CassetteTape,
  Radio,
} from 'lucide-react';
import { formatTime } from '../utils/formatters';

interface PlayerBarProps {
  currentTrack: Track | null;
  isPlaying: boolean;
  currentTime: number;
  duration: number;
  volume: number;
  isMuted: boolean;
  isShuffle: boolean;
  repeatMode: RepeatMode;
  playbackRate: number;
  visualizerMode: VisualizerMode;
  deckMode: DeckViewMode;
  isLiked: boolean;
  sleepTimerSeconds: number | null;
  showLyrics: boolean;
  showQueue: boolean;
  onPlayPause: () => void;
  onSeek: (seconds: number) => void;
  onPrev: () => void;
  onNext: () => void;
  onVolumeChange: (vol: number) => void;
  onToggleMute: () => void;
  onToggleShuffle: () => void;
  onCycleRepeat: () => void;
  onCyclePlaybackRate: () => void;
  onCycleVisualizer: () => void;
  onCycleDeckMode: () => void;
  onToggleLike: (trackId: string) => void;
  onToggleLyrics: () => void;
  onToggleQueue: () => void;
  onOpenEqualizer: () => void;
  onSetSleepTimer: (minutes: number | null) => void;
  onEnterFocusMode: () => void;
}

export const PlayerBar: React.FC<PlayerBarProps> = ({
  currentTrack,
  isPlaying,
  currentTime,
  duration,
  volume,
  isMuted,
  isShuffle,
  repeatMode,
  playbackRate,
  visualizerMode,
  deckMode,
  isLiked,
  sleepTimerSeconds,
  showLyrics,
  showQueue,
  onPlayPause,
  onSeek,
  onPrev,
  onNext,
  onVolumeChange,
  onToggleMute,
  onToggleShuffle,
  onCycleRepeat,
  onCyclePlaybackRate,
  onCycleVisualizer,
  onCycleDeckMode,
  onToggleLike,
  onToggleLyrics,
  onToggleQueue,
  onOpenEqualizer,
  onSetSleepTimer,
  onEnterFocusMode,
}) => {
  const [isHoveringTimeline, setIsHoveringTimeline] = useState(false);
  const [hoverTime, setHoverTime] = useState<number | null>(null);
  const [showSleepTimerMenu, setShowSleepTimerMenu] = useState(false);
  const timelineRef = useRef<HTMLDivElement | null>(null);

  if (!currentTrack) return null;

  const handleTimelineClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!timelineRef.current || duration <= 0) return;
    const rect = timelineRef.current.getBoundingClientRect();
    const pos = (e.clientX - rect.left) / rect.width;
    const target = Math.max(0, Math.min(duration, pos * duration));
    onSeek(target);
  };

  const handleTimelineMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!timelineRef.current || duration <= 0) return;
    const rect = timelineRef.current.getBoundingClientRect();
    const pos = (e.clientX - rect.left) / rect.width;
    setHoverTime(Math.max(0, Math.min(duration, pos * duration)));
  };

  const progressPercent = duration > 0 ? (currentTime / duration) * 100 : 0;

  return (
    <footer className="h-24 glass-dock px-4 sm:px-6 flex items-center justify-between z-40 select-none">
      {/* Zone 1: Current Track Info */}
      <div className="flex items-center gap-3.5 min-w-[200px] w-1/4 max-w-xs">
        <div className="relative group shrink-0 w-14 h-14 rounded-xl overflow-hidden bg-neutral-800/80 border border-white/15 shadow-md">
          <img
            src={currentTrack.coverUrl}
            alt={currentTrack.title}
            referrerPolicy="no-referrer"
            className="w-full h-full object-cover"
          />
          <button
            onClick={onCycleDeckMode}
            className="absolute inset-0 bg-black/60 backdrop-blur-sm opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity text-white"
            title={`Current View: ${deckMode}. Click to switch.`}
          >
            {deckMode === 'modern' ? (
              <Radio className="w-5 h-5 text-amber-400" />
            ) : deckMode === 'vinyl' ? (
              <Disc3 className="w-5 h-5 text-amber-400" />
            ) : (
              <CassetteTape className="w-5 h-5 text-amber-400" />
            )}
          </button>
        </div>

        <div className="min-w-0 flex-1">
          <p className="text-sm font-semibold text-white truncate tracking-tight">
            {currentTrack.title}
          </p>
          <p className="text-xs text-slate-400 truncate">
            {currentTrack.artist}
          </p>
        </div>

        <button
          onClick={() => onToggleLike(currentTrack.id)}
          className={`p-2 rounded-lg transition-colors shrink-0 ${
            isLiked ? 'text-rose-500' : 'text-slate-500 hover:text-slate-300'
          }`}
          title={isLiked ? 'Remove from favorites' : 'Add to favorites'}
        >
          <Heart className={`w-4 h-4 ${isLiked ? 'fill-current' : ''}`} />
        </button>
      </div>

      {/* Zone 2: Playback Controls & Timeline Scrubber */}
      <div className="flex-1 max-w-2xl px-4 flex flex-col items-center justify-center">
        {/* Buttons Row */}
        <div className="flex items-center gap-4 sm:gap-6 mb-2">
          {/* Shuffle */}
          <button
            onClick={onToggleShuffle}
            className={`p-1.5 rounded-lg transition-colors ${
              isShuffle ? 'text-amber-400 bg-amber-400/10' : 'text-slate-400 hover:text-white'
            }`}
            title={isShuffle ? 'Shuffle enabled' : 'Shuffle disabled'}
          >
            <Shuffle className="w-4 h-4" />
          </button>

          {/* Previous Track */}
          <button
            onClick={onPrev}
            className="p-1.5 text-slate-300 hover:text-white transition-colors"
            title="Previous track"
          >
            <SkipBack className="w-5 h-5" />
          </button>

          {/* Play / Pause button */}
          <button
            onClick={onPlayPause}
            className="w-10 h-10 rounded-full bg-gradient-to-tr from-amber-500 to-amber-400 text-slate-950 flex items-center justify-center shadow-lg shadow-amber-500/25 hover:scale-105 active:scale-95 transition-transform"
            title={isPlaying ? 'Pause (Space)' : 'Play (Space)'}
          >
            {isPlaying ? (
              <Pause className="w-5 h-5 fill-current" />
            ) : (
              <Play className="w-5 h-5 fill-current translate-x-0.5" />
            )}
          </button>

          {/* Next Track */}
          <button
            onClick={onNext}
            className="p-1.5 text-slate-300 hover:text-white transition-colors"
            title="Next track"
          >
            <SkipForward className="w-5 h-5" />
          </button>

          {/* Repeat */}
          <button
            onClick={onCycleRepeat}
            className={`p-1.5 rounded-lg transition-colors relative ${
              repeatMode !== 'off' ? 'text-amber-400 bg-amber-400/10' : 'text-slate-400 hover:text-white'
            }`}
            title={`Repeat mode: ${repeatMode}`}
          >
            {repeatMode === 'one' ? (
              <Repeat1 className="w-4 h-4" />
            ) : (
              <Repeat className="w-4 h-4" />
            )}
          </button>

          {/* Playback speed toggle */}
          <button
            onClick={onCyclePlaybackRate}
            className="hidden sm:inline-flex px-1.5 py-0.5 rounded text-[11px] font-mono border border-slate-700/80 text-slate-300 hover:border-slate-500 transition-colors"
            title="Playback speed"
          >
            {playbackRate}x
          </button>
        </div>

        {/* Timeline Scrubber Row */}
        <div className="w-full flex items-center gap-3">
          <span className="text-xs font-mono tabular-nums text-slate-400 w-9 text-right shrink-0">
            {formatTime(currentTime)}
          </span>

          <div
            ref={timelineRef}
            onClick={handleTimelineClick}
            onMouseEnter={() => setIsHoveringTimeline(true)}
            onMouseLeave={() => setIsHoveringTimeline(false)}
            onMouseMove={handleTimelineMouseMove}
            className="relative flex-1 h-3 flex items-center cursor-pointer group"
          >
            {/* Background track */}
            <div className="w-full h-1 bg-slate-800 rounded-full group-hover:h-1.5 transition-all overflow-hidden relative">
              {/* Progress bar */}
              <div
                className="h-full bg-gradient-to-r from-amber-500 to-amber-400 rounded-full"
                style={{ width: `${progressPercent}%` }}
              />
            </div>

            {/* Scrubber thumb */}
            <div
              className="absolute w-3 h-3 bg-white rounded-full shadow-md scale-0 group-hover:scale-100 transition-transform -translate-x-1/2"
              style={{ left: `${progressPercent}%` }}
            />

            {/* Hover timestamp tooltip */}
            {isHoveringTimeline && hoverTime !== null && (
              <div
                className="absolute -top-7 px-2 py-0.5 rounded bg-slate-900 border border-slate-700 text-[10px] font-mono text-white -translate-x-1/2 pointer-events-none shadow"
                style={{
                  left: `${(hoverTime / duration) * 100}%`,
                }}
              >
                {formatTime(hoverTime)}
              </div>
            )}
          </div>

          <span className="text-xs font-mono tabular-nums text-slate-400 w-9 text-left shrink-0">
            {formatTime(duration)}
          </span>
        </div>
      </div>

      {/* Zone 3: Audio Hardware Controls & Aux Modals */}
      <div className="flex items-center justify-end gap-2.5 min-w-[200px] w-1/4 max-w-xs">
        {/* Visualizer Mode Button */}
        <button
          onClick={onCycleVisualizer}
          className="p-2 text-slate-400 hover:text-white rounded-lg hover:bg-white/5 transition-colors"
          title={`Visualizer: ${visualizerMode.toUpperCase()} (Click to toggle style)`}
        >
          <Activity className="w-4 h-4 text-amber-400" />
        </button>

        {/* Lyrics Button */}
        <button
          onClick={onToggleLyrics}
          className={`p-2 rounded-lg transition-colors ${
            showLyrics ? 'text-amber-400 bg-amber-400/10' : 'text-slate-400 hover:text-white'
          }`}
          title="Synced lyrics"
        >
          <Mic2 className="w-4 h-4" />
        </button>

        {/* Equalizer Modal Trigger */}
        <button
          onClick={onOpenEqualizer}
          className="p-2 text-slate-400 hover:text-white rounded-lg hover:bg-white/5 transition-colors"
          title="5-Band Hardware Equalizer"
        >
          <Sliders className="w-4 h-4" />
        </button>

        {/* Sleep Timer Popover */}
        <div className="relative">
          <button
            onClick={() => setShowSleepTimerMenu(!showSleepTimerMenu)}
            className={`p-2 rounded-lg transition-colors ${
              sleepTimerSeconds !== null ? 'text-emerald-400 bg-emerald-400/10' : 'text-slate-400 hover:text-white'
            }`}
            title="Sleep timer"
          >
            <Timer className="w-4 h-4" />
          </button>

          {showSleepTimerMenu && (
            <div className="absolute bottom-12 right-0 w-36 glass-modal rounded-xl p-1.5 shadow-2xl z-50 flex flex-col gap-1">
              <span className="text-[10px] font-mono text-slate-400 px-2 py-1 uppercase tracking-wider">
                Sleep Timer
              </span>
              {[15, 30, 45, 60].map((mins) => (
                <button
                  key={mins}
                  onClick={() => {
                    onSetSleepTimer(mins);
                    setShowSleepTimerMenu(false);
                  }}
                  className="px-2 py-1 text-xs text-left text-slate-300 hover:text-white hover:bg-white/10 rounded-lg font-mono transition-colors"
                >
                  {mins} Minutes
                </button>
              ))}
              {sleepTimerSeconds !== null && (
                <button
                  onClick={() => {
                    onSetSleepTimer(null);
                    setShowSleepTimerMenu(false);
                  }}
                  className="px-2 py-1 text-xs text-left text-rose-400 hover:bg-rose-500/15 rounded-lg font-mono border-t border-white/10 transition-colors"
                >
                  Turn Off Timer
                </button>
              )}
            </div>
          )}
        </div>

        {/* Volume Controls */}
        <div className="hidden sm:flex items-center gap-2">
          <button
            onClick={onToggleMute}
            className="p-1 text-slate-400 hover:text-white transition-colors"
            title={isMuted ? 'Unmute' : 'Mute'}
          >
            {isMuted || volume === 0 ? (
              <VolumeX className="w-4 h-4 text-rose-400" />
            ) : (
              <Volume2 className="w-4 h-4" />
            )}
          </button>
          <input
            type="range"
            min={0}
            max={1}
            step={0.01}
            value={isMuted ? 0 : volume}
            onChange={(e) => onVolumeChange(parseFloat(e.target.value))}
            className="w-16 h-1 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-amber-500"
            title={`Volume: ${Math.round((isMuted ? 0 : volume) * 100)}%`}
          />
        </div>

        {/* Queue Drawer Button */}
        <button
          onClick={onToggleQueue}
          className={`p-2 rounded-lg transition-colors ${
            showQueue ? 'text-amber-400 bg-amber-400/10' : 'text-slate-400 hover:text-white'
          }`}
          title="Play queue"
        >
          <ListMusic className="w-4 h-4" />
        </button>

        {/* Focus Ambient Mode Fullscreen */}
        <button
          onClick={onEnterFocusMode}
          className="p-2 text-slate-400 hover:text-white rounded-lg hover:bg-white/5 transition-colors hidden lg:block"
          title="Enter Fullscreen Ambient Experience"
        >
          <Maximize2 className="w-4 h-4" />
        </button>
      </div>
    </footer>
  );
};
