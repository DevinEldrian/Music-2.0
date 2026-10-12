import React, { useRef } from 'react';
import { Playlist, Track } from '../types';
import {
  Compass,
  Disc,
  FolderPlus,
  Headphones,
  Heart,
  ListMusic,
  Mic,
  Music2,
  Plus,
  Radio,
  Upload,
} from 'lucide-react';

interface SidebarProps {
  currentTab: string;
  onSelectTab: (tab: string) => void;
  playlists: Playlist[];
  activePlaylistId: string | null;
  onSelectPlaylist: (playlistId: string) => void;
  onCreatePlaylist: () => void;
  onImportFiles: (files: FileList) => void;
  favoritesCount: number;
  totalTracksCount: number;
  isOpenMobile?: boolean;
  onCloseMobile?: () => void;
  isCloudOnline?: boolean;
}

export const Sidebar: React.FC<SidebarProps> = ({
  currentTab,
  onSelectTab,
  playlists,
  activePlaylistId,
  onSelectPlaylist,
  onCreatePlaylist,
  onImportFiles,
  favoritesCount,
  totalTracksCount,
  isOpenMobile = false,
  onCloseMobile,
  isCloudOnline = false,
}) => {
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      onImportFiles(e.target.files);
      e.target.value = '';
    }
  };

  const sidebarContent = (
    <aside className="w-64 bg-[#090b10]/60 backdrop-blur-3xl border-r border-white/10 flex flex-col h-full select-none shrink-0 pb-28 shadow-[inset_-1px_0_1px_rgba(255,255,255,0.06)]">
      {/* Brand Zone */}
      <div className="h-16 flex items-center justify-between px-6 border-b border-white/10 bg-white/[0.02]">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-gradient-to-tr from-amber-500 to-amber-400 flex items-center justify-center text-slate-950 shadow-md shadow-amber-500/20">
            <Headphones className="w-4 h-4 stroke-[2.5]" />
          </div>
          <div className="flex flex-col">
            <span className="text-base font-bold tracking-tight text-white font-mono">
              AURA SOUND
            </span>
            <span className="text-[10px] text-slate-400 font-mono tracking-wider -mt-0.5">
              HIGH-RES STUDIO
            </span>
          </div>
        </div>
        {onCloseMobile && (
          <button
            onClick={onCloseMobile}
            className="md:hidden p-1.5 text-slate-400 hover:text-white"
          >
            ✕
          </button>
        )}
      </div>

      {/* Navigation Sections */}
      <div className="flex-1 overflow-y-auto px-3 py-4 space-y-6">
        {/* Main Library */}
        <div>
          <span className="px-3 text-[11px] font-mono uppercase tracking-wider text-slate-400 font-semibold block mb-2">
            Library
          </span>
          <nav className="space-y-0.5">
            <button
              onClick={() => {
                onSelectTab('tracks');
                onCloseMobile?.();
              }}
              className={`w-full flex items-center justify-between px-3 py-2 rounded-xl text-xs font-medium transition-colors ${
                currentTab === 'tracks' && !activePlaylistId
                  ? 'bg-amber-500/10 text-amber-300 font-semibold'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-white/5'
              }`}
            >
              <div className="flex items-center gap-2.5">
                <Music2 className="w-4 h-4" />
                <span>All Tracks</span>
              </div>
              <span className="text-[11px] font-mono text-slate-400 tabular-nums">
                {totalTracksCount}
              </span>
            </button>

            <button
              onClick={() => {
                onSelectTab('favorites');
                onCloseMobile?.();
              }}
              className={`w-full flex items-center justify-between px-3 py-2 rounded-xl text-xs font-medium transition-colors ${
                currentTab === 'favorites' && !activePlaylistId
                  ? 'bg-amber-500/10 text-amber-300 font-semibold'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-white/5'
              }`}
            >
              <div className="flex items-center gap-2.5">
                <Heart className="w-4 h-4 text-rose-400" />
                <span>Liked Songs</span>
              </div>
              <span className="text-[11px] font-mono text-slate-400 tabular-nums">
                {favoritesCount}
              </span>
            </button>

            <button
              onClick={() => {
                onSelectTab('albums');
                onCloseMobile?.();
              }}
              className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-medium transition-colors ${
                currentTab === 'albums' && !activePlaylistId
                  ? 'bg-amber-500/10 text-amber-300 font-semibold'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-white/5'
              }`}
            >
              <Disc className="w-4 h-4" />
              <span>Albums</span>
            </button>

            <button
              onClick={() => {
                onSelectTab('artists');
                onCloseMobile?.();
              }}
              className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-medium transition-colors ${
                currentTab === 'artists' && !activePlaylistId
                  ? 'bg-amber-500/10 text-amber-300 font-semibold'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-white/5'
              }`}
            >
              <Mic className="w-4 h-4" />
              <span>Artists</span>
            </button>
          </nav>
        </div>

        {/* Playlists */}
        <div>
          <div className="flex items-center justify-between px-3 mb-2">
            <span className="text-[11px] font-mono uppercase tracking-wider text-slate-400 font-semibold">
              Playlists
            </span>
            <button
              onClick={onCreatePlaylist}
              className="p-1 rounded text-slate-400 hover:text-white hover:bg-white/5 transition-colors"
              title="Create new playlist"
            >
              <Plus className="w-3.5 h-3.5" />
            </button>
          </div>

          <div className="space-y-0.5">
            {playlists.map((pl) => (
              <button
                key={pl.id}
                onClick={() => {
                  onSelectPlaylist(pl.id);
                  onCloseMobile?.();
                }}
                className={`w-full flex items-center justify-between px-3 py-2 rounded-xl text-xs font-medium transition-colors text-left ${
                  activePlaylistId === pl.id
                    ? 'bg-amber-500/10 text-amber-300 font-semibold'
                    : 'text-slate-400 hover:text-slate-200 hover:bg-white/5'
                }`}
              >
                <div className="flex items-center gap-2.5 truncate">
                  <ListMusic className="w-4 h-4 shrink-0 text-slate-400" />
                  <span className="truncate">{pl.name}</span>
                </div>
                <span className="text-[10px] font-mono text-slate-400 tabular-nums shrink-0 ml-2">
                  {pl.trackIds.length}
                </span>
              </button>
            ))}
          </div>
        </div>

        {/* Local Audio Import */}
        <div className="pt-2">
          <input
            ref={fileInputRef}
            type="file"
            accept="audio/*,.mp3,.wav,.ogg,.flac,.m4a"
            multiple
            onChange={handleFileChange}
            className="hidden"
          />
          <button
            onClick={() => fileInputRef.current?.click()}
            className="w-full flex items-center justify-center gap-2 px-3 py-2.5 rounded-xl border border-dashed border-slate-700/80 bg-white/[0.02] text-xs font-mono text-slate-300 hover:bg-white/[0.05] hover:border-amber-500/50 hover:text-amber-300 transition-colors"
          >
            <Upload className="w-3.5 h-3.5" />
            <span>Import Audio Files</span>
          </button>
          <p className="text-[10px] text-slate-400 text-center mt-1.5 font-mono">
            Drag & drop MP3, WAV, FLAC
          </p>
        </div>
      </div>

      {/* Audio Engine Spec Stamp */}
      <div className="p-4 border-t border-white/10 bg-black/40 backdrop-blur-md text-[11px] font-mono text-slate-400 space-y-1">
        <div className="flex justify-between items-center">
          <span>AUDIO ENGINE</span>
          <span className="text-amber-400">WEB AUDIO 24b</span>
        </div>
        <div className="flex justify-between items-center text-[10px]">
          <span>CLOUD STORAGE</span>
          <span className={isCloudOnline ? 'text-emerald-400 flex items-center gap-1 font-semibold' : 'text-slate-500'}>
            {isCloudOnline && <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />}
            {isCloudOnline ? 'GOOGLE DRIVE' : 'LOCAL CACHE'}
          </span>
        </div>
      </div>
    </aside>
  );

  return (
    <>
      {/* Desktop Sidebar */}
      <div className="hidden md:block h-full">
        {sidebarContent}
      </div>

      {/* Mobile Drawer */}
      {isOpenMobile && (
        <div className="fixed inset-0 z-50 md:hidden bg-black/80 backdrop-blur-sm flex">
          {sidebarContent}
          <div className="flex-1" onClick={onCloseMobile} />
        </div>
      )}
    </>
  );
};
