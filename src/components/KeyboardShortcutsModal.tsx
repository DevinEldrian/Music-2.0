import React from 'react';
import { Command, X } from 'lucide-react';

interface KeyboardShortcutsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const KeyboardShortcutsModal: React.FC<KeyboardShortcutsModalProps> = ({
  isOpen,
  onClose,
}) => {
  if (!isOpen) return null;

  const shortcuts = [
    { key: 'Space', desc: 'Play / Pause audio' },
    { key: '← / →', desc: 'Seek backwards / forwards 5 seconds' },
    { key: '↑ / ↓', desc: 'Increase / Decrease volume by 5%' },
    { key: 'M', desc: 'Toggle Mute / Unmute' },
    { key: 'L', desc: 'Toggle Like / Favorite current track' },
    { key: 'S', desc: 'Toggle Shuffle mode' },
    { key: 'R', desc: 'Cycle Repeat mode (Off / All / One)' },
    { key: 'E', desc: 'Open Hardware Equalizer & DSP' },
    { key: 'F', desc: 'Toggle Fullscreen Ambient Focus Mode' },
    { key: 'Esc', desc: 'Close dialogs or exit Focus Mode' },
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md select-none">
      <div className="w-full max-w-md glass-modal rounded-3xl p-6 relative">
        <div className="flex items-center justify-between border-b border-white/10 pb-4 mb-4">
          <div className="flex items-center gap-2.5">
            <Command className="w-5 h-5 text-amber-400" />
            <h3 className="text-sm font-bold text-white font-mono uppercase tracking-tight">
              Hardware Keyboard Shortcuts
            </h3>
          </div>
          <button
            onClick={onClose}
            className="p-1 text-slate-400 hover:text-white rounded-lg hover:bg-white/10 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="space-y-2.5 my-4">
          {shortcuts.map((sc) => (
            <div
              key={sc.key}
              className="flex items-center justify-between text-xs py-1 border-b border-white/5"
            >
              <span className="text-slate-300">{sc.desc}</span>
              <kbd className="px-2 py-1 bg-white/[0.06] border border-white/10 rounded-md font-mono text-amber-300 text-[11px] shadow-sm">
                {sc.key}
              </kbd>
            </div>
          ))}
        </div>

        <div className="text-right pt-2">
          <button
            onClick={onClose}
            className="px-4 py-1.5 rounded-xl text-xs font-mono glass-pill text-slate-200 hover:text-white hover:bg-white/10 transition-colors"
          >
            Got it
          </button>
        </div>
      </div>
    </div>
  );
};
