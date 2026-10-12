import React from 'react';
import { Cloud, Download, Folder, HardDrive, RefreshCw, Trash2, UploadCloud, X, CheckCircle2 } from 'lucide-react';
import { AuraCloudDatabase } from '../services/driveDatabase';

interface CloudSyncModalProps {
  isOpen: boolean;
  onClose: () => void;
  userEmail?: string;
  isSyncing: boolean;
  lastSyncedAt: string | null;
  cloudDb: AuraCloudDatabase | null;
  onPushSync: () => void;
  onPullRestore: () => void;
  onRequestDeleteCloudData: () => void;
}

export const CloudSyncModal: React.FC<CloudSyncModalProps> = ({
  isOpen,
  onClose,
  userEmail,
  isSyncing,
  lastSyncedAt,
  cloudDb,
  onPushSync,
  onPullRestore,
  onRequestDeleteCloudData,
}) => {
  if (!isOpen) return null;

  const handleDownloadBackup = () => {
    if (!cloudDb) return;
    const blob = new Blob([JSON.stringify(cloudDb, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `aura-sound-backup-${new Date().toISOString().slice(0, 10)}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md select-none">
      <div className="w-full max-w-lg glass-modal rounded-3xl p-6 relative">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-white/10 pb-4 mb-5">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-emerald-500/15 text-emerald-400">
              <Cloud className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-white font-mono uppercase tracking-tight">
                Google Drive Cloud Database
              </h3>
              <p className="text-[11px] text-slate-400 font-mono">
                Real-time online synchronization
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1 text-slate-400 hover:text-white rounded-lg hover:bg-white/10 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Cloud Connection Details */}
        <div className="bg-white/[0.03] backdrop-blur-md p-4 rounded-2xl border border-white/10 mb-5 space-y-3">
          <div className="flex items-center justify-between text-xs">
            <span className="text-slate-400">Connected Account:</span>
            <span className="font-mono text-emerald-300 font-semibold truncate max-w-[220px]">
              {userEmail || 'Active Google Account'}
            </span>
          </div>

          <div className="flex items-center justify-between text-xs">
            <span className="text-slate-400">Storage Location:</span>
            <span className="font-mono text-slate-300 flex items-center gap-1">
              <Folder className="w-3.5 h-3.5 text-amber-400" />
              <span>Drive / Aura Sound Database</span>
            </span>
          </div>

          <div className="flex items-center justify-between text-xs">
            <span className="text-slate-400">Sync Status:</span>
            <span className="font-mono text-xs flex items-center gap-1.5 text-emerald-400">
              <CheckCircle2 className="w-3.5 h-3.5" />
              <span>Active & Online</span>
            </span>
          </div>

          <div className="flex items-center justify-between text-xs">
            <span className="text-slate-400">Last Synchronized:</span>
            <span className="font-mono text-amber-300">
              {lastSyncedAt ? new Date(lastSyncedAt).toLocaleString() : 'Not yet synced'}
            </span>
          </div>
        </div>

        {/* Database Stats Overview */}
        {cloudDb && (
          <div className="grid grid-cols-3 gap-2.5 mb-5 text-center">
            <div className="p-2.5 rounded-xl bg-white/[0.02] border border-white/5">
              <span className="text-base font-bold font-mono text-white block">
                {cloudDb.playlists.length}
              </span>
              <span className="text-[10px] text-slate-400 font-mono uppercase">
                Playlists
              </span>
            </div>

            <div className="p-2.5 rounded-xl bg-white/[0.02] border border-white/5">
              <span className="text-base font-bold font-mono text-white block">
                {cloudDb.likedTrackIds.length}
              </span>
              <span className="text-[10px] text-slate-400 font-mono uppercase">
                Liked Songs
              </span>
            </div>

            <div className="p-2.5 rounded-xl bg-white/[0.02] border border-white/5">
              <span className="text-base font-bold font-mono text-white block">
                {cloudDb.customTracks.length}
              </span>
              <span className="text-[10px] text-slate-400 font-mono uppercase">
                Custom Tracks
              </span>
            </div>
          </div>
        )}

        {/* Sync Operations */}
        <div className="space-y-2 mb-6">
          <div className="flex gap-2">
            <button
              onClick={onPushSync}
              disabled={isSyncing}
              className="flex-1 flex items-center justify-center gap-2 px-3 py-2.5 rounded-xl bg-amber-500 text-slate-950 font-bold text-xs font-mono hover:bg-amber-400 transition-colors shadow-md disabled:opacity-50"
            >
              <UploadCloud className="w-4 h-4" />
              <span>{isSyncing ? 'Saving to Drive...' : 'Save Database to Drive'}</span>
            </button>

            <button
              onClick={onPullRestore}
              disabled={isSyncing}
              className="flex-1 flex items-center justify-center gap-2 px-3 py-2.5 rounded-xl glass-pill text-slate-200 text-xs font-mono hover:text-white hover:bg-white/10 transition-colors disabled:opacity-50"
            >
              <RefreshCw className={`w-4 h-4 ${isSyncing ? 'animate-spin' : ''}`} />
              <span>Restore from Drive</span>
            </button>
          </div>

          <button
            onClick={handleDownloadBackup}
            disabled={!cloudDb}
            className="w-full flex items-center justify-center gap-2 px-3 py-2 rounded-xl bg-white/[0.03] border border-white/10 text-slate-300 text-xs font-mono hover:text-white hover:bg-white/[0.07] transition-colors"
          >
            <Download className="w-3.5 h-3.5 text-cyan-400" />
            <span>Download Offline JSON Backup</span>
          </button>
        </div>

        {/* Destructive Cleanup Action */}
        <div className="pt-3 border-t border-white/10 flex items-center justify-between">
          <span className="text-[10px] font-mono text-slate-500">
            Clear Drive Database Record
          </span>
          <button
            onClick={onRequestDeleteCloudData}
            className="flex items-center gap-1 px-2.5 py-1 rounded-lg text-rose-400 hover:bg-rose-500/15 text-xs font-mono transition-colors"
          >
            <Trash2 className="w-3.5 h-3.5" />
            <span>Delete Cloud File</span>
          </button>
        </div>
      </div>
    </div>
  );
};
