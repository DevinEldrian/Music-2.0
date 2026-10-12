import React from 'react';
import { Playlist, Track } from '../types';
import {
  Heart,
  ListPlus,
  MoreHorizontal,
  Music,
  Pause,
  Play,
  Trash2,
} from 'lucide-react';
import { formatTime } from '../utils/formatters';

interface TrackListProps {
  tracks: Track[];
  currentTrackId: string | null;
  isPlaying: boolean;
  likedTrackIds: Set<string>;
  playlists: Playlist[];
  onPlayTrack: (track: Track) => void;
  onPauseTrack: () => void;
  onToggleLike: (trackId: string) => void;
  onAddToQueue: (track: Track) => void;
  onAddToPlaylist: (playlistId: string, trackId: string) => void;
  onDeleteCustomTrack?: (trackId: string) => void;
  emptyMessage?: string;
}

export const TrackList: React.FC<TrackListProps> = ({
  tracks,
  currentTrackId,
  isPlaying,
  likedTrackIds,
  playlists,
  onPlayTrack,
  onPauseTrack,
  onToggleLike,
  onAddToQueue,
  onAddToPlaylist,
  onDeleteCustomTrack,
  emptyMessage = 'No tracks found.',
}) => {
  const [activeMenuTrackId, setActiveMenuTrackId] = React.useState<string | null>(null);

  if (tracks.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-16 text-center select-none">
        <div className="w-12 h-12 rounded-full bg-slate-800/80 flex items-center justify-center text-slate-500 mb-3">
          <Music className="w-6 h-6" />
        </div>
        <p className="text-sm text-slate-400 font-medium">{emptyMessage}</p>
        <p className="text-xs text-slate-400 mt-1 font-mono">
          Try adjusting your search or import audio files from your drive.
        </p>
      </div>
    );
  }

  return (
    <div className="w-full select-none" onClick={() => setActiveMenuTrackId(null)}>
      {/* Table Header */}
      <div className="grid grid-cols-[36px_1fr_180px_110px_70px_80px] gap-4 px-4 py-2 border-b border-slate-800/70 text-[11px] font-mono uppercase tracking-wider text-slate-400">
        <span className="text-center">#</span>
        <span>Title</span>
        <span className="hidden md:block">Album</span>
        <span className="hidden lg:block">Genre</span>
        <span className="text-right">Time</span>
        <span className="text-center">Actions</span>
      </div>

      {/* Track Rows */}
      <div className="divide-y divide-slate-800/30">
        {tracks.map((track, index) => {
          const isCurrent = currentTrackId === track.id;
          const isLiked = likedTrackIds.has(track.id);

          return (
            <div
              key={track.id}
              onDoubleClick={() => onPlayTrack(track)}
              className={`grid grid-cols-[36px_1fr_180px_110px_70px_80px] gap-4 px-4 py-2.5 items-center rounded-xl group transition-all text-xs ${
                isCurrent
                  ? 'bg-amber-500/15 backdrop-blur-md text-white font-medium border border-amber-500/25 shadow-sm'
                  : 'text-slate-300 hover:bg-white/[0.05] hover:backdrop-blur-sm'
              }`}
            >
              {/* Column 1: Index / Play Icon / Equalizer Animation */}
              <div className="flex items-center justify-center">
                {isCurrent && isPlaying ? (
                  <div className="flex items-end gap-0.5 h-3.5 w-3.5">
                    <div className="w-1 bg-amber-400 rounded-full animate-bounce [animation-delay:0ms] h-full" />
                    <div className="w-1 bg-amber-400 rounded-full animate-bounce [animation-delay:150ms] h-2/3" />
                    <div className="w-1 bg-amber-400 rounded-full animate-bounce [animation-delay:300ms] h-full" />
                  </div>
                ) : (
                  <>
                    <span className="font-mono tabular-nums text-slate-400 group-hover:hidden text-[11px]">
                      {index + 1}
                    </span>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        if (isCurrent && isPlaying) {
                          onPauseTrack();
                        } else {
                          onPlayTrack(track);
                        }
                      }}
                      className="hidden group-hover:flex items-center justify-center text-white hover:text-amber-400"
                    >
                      {isCurrent && isPlaying ? (
                        <Pause className="w-3.5 h-3.5 fill-current" />
                      ) : (
                        <Play className="w-3.5 h-3.5 fill-current" />
                      )}
                    </button>
                  </>
                )}
              </div>

              {/* Column 2: Artwork & Title & Artist */}
              <div className="flex items-center gap-3 min-w-0">
                <div className="w-9 h-9 rounded-lg overflow-hidden bg-slate-800 shrink-0 border border-white/10">
                  <img
                    src={track.coverUrl}
                    alt={track.title}
                    referrerPolicy="no-referrer"
                    className="w-full h-full object-cover"
                  />
                </div>
                <div className="min-w-0 flex-1">
                  <p
                    className={`truncate font-medium text-xs tracking-tight ${
                      isCurrent ? 'text-amber-300' : 'text-slate-200'
                    }`}
                  >
                    {track.title}
                  </p>
                  <p className="truncate text-[11px] text-slate-400">
                    {track.artist}
                  </p>
                </div>
              </div>

              {/* Column 3: Album */}
              <div className="hidden md:block truncate text-[11px] text-slate-400">
                {track.album}
              </div>

              {/* Column 4: Genre */}
              <div className="hidden lg:block">
                <span className="text-[10px] font-mono uppercase text-slate-400">
                  {track.genre}
                </span>
              </div>

              {/* Column 5: Duration */}
              <div className="text-right font-mono tabular-nums text-[11px] text-slate-400">
                {formatTime(track.duration)}
              </div>

              {/* Column 6: Actions */}
              <div className="flex items-center justify-center gap-1 relative">
                {/* Like Button */}
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    onToggleLike(track.id);
                  }}
                  className={`p-1.5 rounded-lg transition-colors ${
                    isLiked
                      ? 'text-rose-400'
                      : 'text-slate-500 opacity-0 group-hover:opacity-100 hover:text-white'
                  }`}
                  title={isLiked ? 'Unlike' : 'Like'}
                >
                  <Heart className={`w-3.5 h-3.5 ${isLiked ? 'fill-current' : ''}`} />
                </button>

                {/* More / Add to Playlist Dropdown */}
                <div className="relative">
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      setActiveMenuTrackId(activeMenuTrackId === track.id ? null : track.id);
                    }}
                    className="p-1.5 text-slate-400 hover:text-white rounded-lg opacity-0 group-hover:opacity-100 transition-opacity"
                    title="Track actions"
                  >
                    <MoreHorizontal className="w-3.5 h-3.5" />
                  </button>

                  {activeMenuTrackId === track.id && (
                    <div
                      onClick={(e) => e.stopPropagation()}
                      className="absolute right-0 top-7 w-44 glass-modal rounded-xl p-1 shadow-2xl z-50 flex flex-col gap-0.5"
                    >
                      <button
                        onClick={() => {
                          onAddToQueue(track);
                          setActiveMenuTrackId(null);
                        }}
                        className="flex items-center gap-2 px-2.5 py-1.5 text-[11px] text-slate-300 hover:text-white hover:bg-white/10 rounded-lg text-left transition-colors"
                      >
                        <ListPlus className="w-3.5 h-3.5 text-amber-400" />
                        <span>Add to Queue</span>
                      </button>

                      {playlists.length > 0 && (
                        <div className="border-t border-white/10 pt-1 mt-1">
                          <span className="px-2.5 py-1 text-[9px] font-mono text-slate-400 uppercase tracking-wider block">
                            Add to Playlist
                          </span>
                          {playlists.map((pl) => (
                            <button
                              key={pl.id}
                              onClick={() => {
                                onAddToPlaylist(pl.id, track.id);
                                setActiveMenuTrackId(null);
                              }}
                              className="w-full text-left px-2.5 py-1 text-[11px] text-slate-300 hover:text-white hover:bg-white/10 rounded-lg truncate transition-colors"
                            >
                              + {pl.name}
                            </button>
                          ))}
                        </div>
                      )}

                      {track.isCustom && onDeleteCustomTrack && (
                        <button
                          onClick={() => {
                            onDeleteCustomTrack(track.id);
                            setActiveMenuTrackId(null);
                          }}
                          className="flex items-center gap-2 px-2.5 py-1.5 text-[11px] text-rose-400 hover:bg-rose-500/15 rounded-lg text-left border-t border-white/10 transition-colors"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                          <span>Delete Local Track</span>
                        </button>
                      )}
                    </div>
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
