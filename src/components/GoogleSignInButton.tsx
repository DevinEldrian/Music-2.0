import React, { useState } from 'react';
import { User } from 'firebase/auth';
import { Cloud, CloudCheck, LogOut, RefreshCw, Settings2, User as UserIcon } from 'lucide-react';

interface GoogleSignInButtonProps {
  user: User | null;
  isLoading: boolean;
  isSyncing: boolean;
  lastSyncedAt: string | null;
  onSignIn: () => void;
  onSignOut: () => void;
  onOpenSyncModal: () => void;
  onManualSync: () => void;
}

export const GoogleSignInButton: React.FC<GoogleSignInButtonProps> = ({
  user,
  isLoading,
  isSyncing,
  lastSyncedAt,
  onSignIn,
  onSignOut,
  onOpenSyncModal,
  onManualSync,
}) => {
  const [showDropdown, setShowDropdown] = useState(false);

  if (!user) {
    return (
      <button
        onClick={onSignIn}
        disabled={isLoading}
        className="flex items-center gap-2.5 px-3 py-1.5 rounded-xl bg-white text-slate-900 text-xs font-semibold hover:bg-slate-100 transition-all shadow-md active:scale-95 disabled:opacity-50 select-none shrink-0"
        title="Sign in with Google to enable Drive database storage"
      >
        {/* Official Google 'G' Mark */}
        <svg className="w-4 h-4 shrink-0" viewBox="0 0 48 48">
          <path fill="#EA4335" d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z" />
          <path fill="#4285F4" d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z" />
          <path fill="#FBBC05" d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z" />
          <path fill="#34A853" d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.15 1.45-4.92 2.3-8.16 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z" />
          <path fill="none" d="M0 0h48v48H0z" />
        </svg>
        <span className="truncate">
          {isLoading ? 'Connecting...' : 'Sign in with Google'}
        </span>
      </button>
    );
  }

  return (
    <div className="relative select-none">
      <button
        onClick={() => setShowDropdown(!showDropdown)}
        className="flex items-center gap-2 px-2.5 py-1 rounded-xl glass-pill hover:bg-white/10 transition-colors text-xs"
        title="Google Drive Cloud Database account"
      >
        {/* User avatar or placeholder */}
        {user.photoURL ? (
          <img
            src={user.photoURL}
            alt={user.displayName || 'User'}
            referrerPolicy="no-referrer"
            className="w-5 h-5 rounded-full object-cover border border-white/20"
          />
        ) : (
          <div className="w-5 h-5 rounded-full bg-amber-500/20 text-amber-300 flex items-center justify-center text-[10px] font-bold">
            {user.displayName?.[0] || user.email?.[0] || 'U'}
          </div>
        )}

        <div className="hidden sm:flex flex-col text-left leading-none">
          <span className="text-[11px] font-semibold text-white truncate max-w-[100px]">
            {user.displayName || 'Google User'}
          </span>
          <span className="text-[9px] font-mono text-emerald-400 flex items-center gap-1">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
            Drive Online
          </span>
        </div>

        {isSyncing && (
          <RefreshCw className="w-3 h-3 text-amber-400 animate-spin ml-1" />
        )}
      </button>

      {/* Cloud Account Menu Dropdown */}
      {showDropdown && (
        <div
          onClick={() => setShowDropdown(false)}
          className="absolute right-0 top-10 w-60 glass-modal rounded-2xl p-2 shadow-2xl z-50 flex flex-col gap-1 text-xs"
        >
          {/* User profile info header */}
          <div className="p-2 border-b border-white/10">
            <p className="font-semibold text-white truncate text-xs">
              {user.displayName || 'Google User'}
            </p>
            <p className="text-[10px] text-slate-400 truncate font-mono">
              {user.email}
            </p>
            <div className="flex items-center gap-1.5 mt-2 text-[10px] font-mono text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded-md">
              <Cloud className="w-3 h-3 shrink-0" />
              <span>Storage: Google Drive</span>
            </div>
            {lastSyncedAt && (
              <p className="text-[9px] font-mono text-slate-500 mt-1">
                Last synced: {new Date(lastSyncedAt).toLocaleTimeString()}
              </p>
            )}
          </div>

          {/* Actions */}
          <button
            onClick={onManualSync}
            disabled={isSyncing}
            className="flex items-center gap-2 px-2.5 py-1.5 rounded-xl text-slate-200 hover:text-white hover:bg-white/10 transition-colors text-left"
          >
            <RefreshCw className={`w-3.5 h-3.5 text-amber-400 ${isSyncing ? 'animate-spin' : ''}`} />
            <span>{isSyncing ? 'Syncing Now...' : 'Sync Database to Drive'}</span>
          </button>

          <button
            onClick={onOpenSyncModal}
            className="flex items-center gap-2 px-2.5 py-1.5 rounded-xl text-slate-200 hover:text-white hover:bg-white/10 transition-colors text-left"
          >
            <Settings2 className="w-3.5 h-3.5 text-cyan-400" />
            <span>Manage Cloud Storage</span>
          </button>

          <button
            onClick={onSignOut}
            className="flex items-center gap-2 px-2.5 py-1.5 rounded-xl text-rose-400 hover:bg-rose-500/15 transition-colors text-left border-t border-white/10 mt-1"
          >
            <LogOut className="w-3.5 h-3.5" />
            <span>Sign Out</span>
          </button>
        </div>
      )}
    </div>
  );
};
