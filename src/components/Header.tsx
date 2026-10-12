import React from 'react';
import { DeckViewMode } from '../types';
import { User } from 'firebase/auth';
import {
  CassetteTape,
  Disc3,
  HelpCircle,
  Menu,
  Radio,
  Search,
  Sliders,
  Sparkles,
  X,
} from 'lucide-react';
import { GoogleSignInButton } from './GoogleSignInButton';

interface HeaderProps {
  searchQuery: string;
  onSearchChange: (query: string) => void;
  selectedGenre: string;
  onSelectGenre: (genre: string) => void;
  genres: string[];
  deckMode: DeckViewMode;
  onSelectDeckMode: (mode: DeckViewMode) => void;
  onOpenEqualizer: () => void;
  onOpenShortcuts: () => void;
  title: string;
  subtitle?: string;
  onToggleMobileMenu?: () => void;
  user: User | null;
  isAuthLoading: boolean;
  isSyncing: boolean;
  lastSyncedAt: string | null;
  onSignIn: () => void;
  onSignOut: () => void;
  onOpenSyncModal: () => void;
  onManualSync: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  searchQuery,
  onSearchChange,
  selectedGenre,
  onSelectGenre,
  genres,
  deckMode,
  onSelectDeckMode,
  onOpenEqualizer,
  onOpenShortcuts,
  title,
  subtitle,
  onToggleMobileMenu,
  user,
  isAuthLoading,
  isSyncing,
  lastSyncedAt,
  onSignIn,
  onSignOut,
  onOpenSyncModal,
  onManualSync,
}) => {
  return (
    <header className="h-16 px-4 sm:px-6 border-b border-white/10 bg-[#090b10]/45 backdrop-blur-2xl flex items-center justify-between gap-4 sm:gap-6 shrink-0 z-30 select-none shadow-[inset_0_1px_1px_rgba(255,255,255,0.06)]">
      {/* Zone 1: Breadcrumb Title */}
      <div className="flex items-center gap-2.5 min-w-0">
        {onToggleMobileMenu && (
          <button
            onClick={onToggleMobileMenu}
            className="md:hidden p-1.5 rounded-lg text-slate-400 hover:text-white glass-pill shrink-0"
            title="Open Menu"
          >
            <Menu className="w-4 h-4" />
          </button>
        )}
        <h2 className="text-sm font-bold text-white tracking-tight truncate uppercase font-mono">
          {title}
        </h2>
        {subtitle && (
          <>
            <span className="text-slate-600 text-xs hidden sm:inline">/</span>
            <span className="text-xs text-slate-400 truncate hidden sm:inline">{subtitle}</span>
          </>
        )}
      </div>

      {/* Zone 2: Search Bar & Genre Filters */}
      <div className="flex items-center gap-3 max-w-lg flex-1">
        {/* Search Input */}
        <div className="relative flex-1">
          <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => onSearchChange(e.target.value)}
            placeholder="Search tracks, artists, albums..."
            className="w-full bg-white/[0.04] backdrop-blur-md border border-white/10 rounded-xl pl-8 pr-7 py-1.5 text-xs text-slate-200 placeholder:text-slate-500 focus:outline-none focus:border-amber-500/80 focus:bg-white/[0.07] transition-all shadow-inner"
          />
          {searchQuery && (
            <button
              onClick={() => onSearchChange('')}
              className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white"
            >
              <X className="w-3 h-3" />
            </button>
          )}
        </div>

        {/* Genre Filter Tabs */}
        <div className="hidden xl:flex items-center gap-1 bg-white/[0.03] backdrop-blur-md p-1 rounded-xl border border-white/10 shrink-0">
          <button
            onClick={() => onSelectGenre('all')}
            className={`px-2.5 py-1 text-[11px] font-medium rounded-lg transition-colors whitespace-nowrap ${
              selectedGenre === 'all'
                ? 'bg-amber-500/20 text-amber-300 font-semibold shadow-sm'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            All
          </button>
          {genres.slice(0, 4).map((g) => (
            <button
              key={g}
              onClick={() => onSelectGenre(g)}
              className={`px-2.5 py-1 text-[11px] font-medium rounded-lg transition-colors whitespace-nowrap ${
                selectedGenre === g
                  ? 'bg-amber-500/20 text-amber-300 font-semibold shadow-sm'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              {g}
            </button>
          ))}
        </div>
      </div>

      {/* Zone 3: Hardware Deck Switcher & Aux Tools */}
      <div className="flex items-center gap-2 shrink-0">
        {/* Deck View Selector */}
        <div className="flex items-center bg-white/[0.04] backdrop-blur-md p-1 rounded-xl border border-white/10">
          <button
            onClick={() => onSelectDeckMode('modern')}
            className={`px-2.5 py-1 text-xs rounded-lg flex items-center gap-1.5 transition-colors ${
              deckMode === 'modern'
                ? 'bg-amber-500 text-slate-950 font-bold shadow-sm'
                : 'text-slate-400 hover:text-white'
            }`}
            title="Modern Hi-Res Glass Deck"
          >
            <Radio className="w-3.5 h-3.5" />
            <span className="hidden sm:inline text-[11px]">Modern</span>
          </button>

          <button
            onClick={() => onSelectDeckMode('vinyl')}
            className={`px-2.5 py-1 text-xs rounded-lg flex items-center gap-1.5 transition-colors ${
              deckMode === 'vinyl'
                ? 'bg-amber-500 text-slate-950 font-bold shadow-sm'
                : 'text-slate-400 hover:text-white'
            }`}
            title="Realistic Vinyl Turntable"
          >
            <Disc3 className="w-3.5 h-3.5" />
            <span className="hidden sm:inline text-[11px]">Vinyl</span>
          </button>

          <button
            onClick={() => onSelectDeckMode('cassette')}
            className={`px-2.5 py-1 text-xs rounded-lg flex items-center gap-1.5 transition-colors ${
              deckMode === 'cassette'
                ? 'bg-amber-500 text-slate-950 font-bold shadow-sm'
                : 'text-slate-400 hover:text-white'
            }`}
            title="Retro Cassette Tape Deck"
          >
            <CassetteTape className="w-3.5 h-3.5" />
            <span className="hidden sm:inline text-[11px]">Tape</span>
          </button>
        </div>

        {/* Equalizer Quick Access */}
        <button
          onClick={onOpenEqualizer}
          className="p-2 rounded-xl glass-pill text-slate-300 hover:text-amber-400 hover:border-amber-500/40 transition-colors"
          title="Hardware EQ & DSP"
        >
          <Sliders className="w-4 h-4" />
        </button>

        {/* Shortcuts Guide */}
        <button
          onClick={onOpenShortcuts}
          className="p-2 rounded-xl glass-pill text-slate-300 hover:text-white hover:border-white/30 transition-colors"
          title="Keyboard Shortcuts (?)"
        >
          <HelpCircle className="w-4 h-4" />
        </button>

        {/* Google Drive Online Database Auth & Sync */}
        <GoogleSignInButton
          user={user}
          isLoading={isAuthLoading}
          isSyncing={isSyncing}
          lastSyncedAt={lastSyncedAt}
          onSignIn={onSignIn}
          onSignOut={onSignOut}
          onOpenSyncModal={onOpenSyncModal}
          onManualSync={onManualSync}
        />
      </div>
    </header>
  );
};
