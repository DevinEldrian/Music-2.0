import React from 'react';
import { Track } from '../types';
import { ListMusic, Play, Trash2, X } from 'lucide-react';
import { formatDurationLong, formatTime } from '../utils/formatters';

interface QueueDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  currentTrack: Track | null;
  queue: Track[];
  onPlayTrack: (track: Track) => void;
  onRemoveFromQueue: (index: number) => void;
  onClearQueue: () => void;
}

export const QueueDrawer: React.FC<QueueDrawerProps> = ({
  isOpen,
  onClose,
  currentTrack,
  queue,
  onPlayTrack,
  onRemoveFromQueue,
  onClearQueue,
}) => {
  if (!isOpen) return null;

  const totalDuration = queue.reduce((acc, t) => acc + t.duration, 0);

  return (
    <aside className="w-80 md:w-96 bg-[#090b10]/70 backdrop-blur-3xl border-l border-white/10 flex flex-col h-full z-30 shadow-2xl select-none animate-in slide-in-from-right duration-300 shrink-0 pb-24">
      {/* Header */}
      <div className="h-16 px-6 border-b border-white/10 bg-white/[0.02] flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <ListMusic className="w-4 h-4 text-amber-400" />
          <h3 className="text-sm font-bold text-white font-mono tracking-tight">
            PLAY QUEUE
          </h3>
          <span className="text-xs font-mono text-slate-400">
            ({queue.length})
          </span>
        </div>
        <button
          onClick={onClose}
          className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-white/10 transition-colors"
        >
          <X className="w-4 h-4" />
        </button>
      </div>

      {/* Queue Content */}
      <div className="flex-1 overflow-y-auto px-4 py-4 space-y-4">
        {/* Now Playing Section */}
        {currentTrack && (
          <div>
            <span className="text-[10px] font-mono uppercase tracking-wider text-amber-400 font-semibold block px-2 mb-2">
              Now Playing
            </span>
            <div className="flex items-center gap-3 p-2.5 rounded-xl bg-amber-500/10 border border-amber-500/20">
              <div className="w-10 h-10 rounded-lg overflow-hidden shrink-0 border border-amber-500/30">
                <img
                  src={currentTrack.coverUrl}
                  alt={currentTrack.title}
                  referrerPolicy="no-referrer"
                  className="w-full h-full object-cover"
                />
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-xs font-semibold text-white truncate">
                  {currentTrack.title}
                </p>
                <p className="text-[11px] text-slate-400 truncate">
                  {currentTrack.artist}
                </p>
              </div>
              <span className="text-xs font-mono tabular-nums text-amber-400">
                {formatTime(currentTrack.duration)}
              </span>
            </div>
          </div>
        )}

        {/* Up Next List */}
        <div>
          <div className="flex items-center justify-between px-2 mb-2">
            <span className="text-[10px] font-mono uppercase tracking-wider text-slate-400 font-semibold">
              Next In Queue
            </span>
            {queue.length > 0 && (
              <button
                onClick={onClearQueue}
                className="text-[10px] font-mono text-slate-400 hover:text-rose-400 transition-colors"
              >
                Clear All
              </button>
            )}
          </div>

          {queue.length > 0 ? (
            <div className="space-y-1">
              {queue.map((track, idx) => (
                <div
                  key={`${track.id}-${idx}`}
                  className="flex items-center gap-3 p-2 rounded-xl group hover:bg-white/5 transition-colors"
                >
                  <button
                    onClick={() => onPlayTrack(track)}
                    className="w-9 h-9 rounded-lg overflow-hidden shrink-0 border border-white/10 relative group/cover"
                  >
                    <img
                      src={track.coverUrl}
                      alt={track.title}
                      referrerPolicy="no-referrer"
                      className="w-full h-full object-cover"
                    />
                    <div className="absolute inset-0 bg-black/40 opacity-0 group-hover/cover:opacity-100 flex items-center justify-center text-white transition-opacity">
                      <Play className="w-3.5 h-3.5 fill-current" />
                    </div>
                  </button>

                  <div className="min-w-0 flex-1">
                    <p className="text-xs font-medium text-slate-200 truncate">
                      {track.title}
                    </p>
                    <p className="text-[10px] text-slate-400 truncate">
                      {track.artist}
                    </p>
                  </div>

                  <span className="text-[11px] font-mono tabular-nums text-slate-400">
                    {formatTime(track.duration)}
                  </span>

                  <button
                    onClick={() => onRemoveFromQueue(idx)}
                    className="p-1 text-slate-400 hover:text-rose-400 rounded transition-colors opacity-0 group-hover:opacity-100"
                    title="Remove from queue"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-12 text-slate-400 space-y-1">
              <p className="text-xs font-mono">Queue is empty</p>
              <p className="text-[11px] text-slate-400">
                Add tracks from your library to keep the music playing.
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Footer Summary */}
      {queue.length > 0 && (
        <div className="p-4 border-t border-white/10 bg-black/40 backdrop-blur-md text-xs font-mono text-slate-400 flex justify-between">
          <span>{queue.length} Tracks</span>
          <span>{formatDurationLong(totalDuration)}</span>
        </div>
      )}
    </aside>
  );
};
