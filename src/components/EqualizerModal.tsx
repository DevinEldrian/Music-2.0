import React from 'react';
import { EqualizerPreset } from '../types';
import { RotateCcw, Sliders, Volume2, X } from 'lucide-react';

interface EqualizerModalProps {
  isOpen: boolean;
  onClose: () => void;
  gains: [number, number, number, number, number];
  onChangeGain: (bandIdx: number, val: number) => void;
  onApplyPreset: (preset: EqualizerPreset) => void;
  activePresetName: string;
  preAmp: number;
  onChangePreAmp: (val: number) => void;
  stereoPan: number;
  onChangeStereoPan: (val: number) => void;
  onReset: () => void;
}

export const PRESETS: EqualizerPreset[] = [
  { name: 'Flat', gains: [0, 0, 0, 0, 0] },
  { name: 'Bass Boost', gains: [7, 4, 0, 0, 0] },
  { name: 'Electronic', gains: [5, 3, -1, 2, 4] },
  { name: 'Acoustic', gains: [2, 1, 0, 2, 3] },
  { name: 'Rock', gains: [5, 3, -2, 3, 5] },
  { name: 'Vocal', gains: [-2, 1, 4, 3, 0] },
  { name: 'Jazz', gains: [3, 1, 0, 1, 3] },
  { name: 'Chill', gains: [3, 2, 0, 1, 2] },
];

export const EqualizerModal: React.FC<EqualizerModalProps> = ({
  isOpen,
  onClose,
  gains,
  onChangeGain,
  onApplyPreset,
  activePresetName,
  preAmp,
  onChangePreAmp,
  stereoPan,
  onChangeStereoPan,
  onReset,
}) => {
  if (!isOpen) return null;

  const freqLabels = ['60 Hz', '230 Hz', '910 Hz', '3.6 kHz', '14 kHz'];
  const bandDescriptions = ['Sub', 'Bass', 'Mid', 'Presence', 'Air'];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md select-none">
      <div className="w-full max-w-xl glass-modal rounded-3xl p-6 relative">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-white/10 pb-4 mb-6">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-amber-400">
              <Sliders className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-base font-bold text-white tracking-tight font-mono">
                5-BAND EQUALIZER & DSP
              </h3>
              <p className="text-xs text-slate-400 font-mono">
                Audiophile Biquad Filter Processing
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={onReset}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-mono glass-pill text-slate-300 hover:text-white hover:bg-white/10 transition-colors"
              title="Reset all EQ bands to 0 dB"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>Reset</span>
            </button>
            <button
              onClick={onClose}
              className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-white/10 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Presets Row */}
        <div className="mb-6">
          <span className="text-[11px] font-mono text-slate-400 uppercase tracking-wider block mb-2">
            Equalizer Presets
          </span>
          <div className="flex flex-wrap gap-2">
            {PRESETS.map((p) => {
              const isActive = activePresetName === p.name;
              return (
                <button
                  key={p.name}
                  onClick={() => onApplyPreset(p)}
                  className={`px-3 py-1 text-xs rounded-xl font-mono transition-colors border ${
                    isActive
                      ? 'bg-amber-500 text-slate-950 font-bold border-amber-400 shadow-sm'
                      : 'bg-white/[0.04] backdrop-blur-sm text-slate-300 border-white/10 hover:border-white/25 hover:bg-white/[0.08]'
                  }`}
                >
                  {p.name}
                </button>
              );
            })}
          </div>
        </div>

        {/* 5-Band Slider Rack */}
        <div className="bg-black/40 backdrop-blur-md rounded-2xl p-6 border border-white/10 mb-6 shadow-[inset_0_1px_1px_rgba(255,255,255,0.08)]">
          <div className="flex items-center justify-between text-[10px] font-mono text-slate-500 mb-4 px-2">
            <span>+12 dB</span>
            <span className="text-slate-400">0 dB (FLAT)</span>
            <span>-12 dB</span>
          </div>

          <div className="grid grid-cols-5 gap-3 h-48 items-center justify-items-center">
            {gains.map((gain, idx) => (
              <div key={idx} className="flex flex-col items-center h-full justify-between w-full">
                {/* dB Readout */}
                <span className="text-xs font-mono tabular-nums text-amber-400 font-bold">
                  {gain > 0 ? `+${gain}` : gain} dB
                </span>

                {/* Vertical Range Slider */}
                <div className="relative flex-1 flex items-center justify-center my-2">
                  <input
                    type="range"
                    min={-12}
                    max={12}
                    step={1}
                    value={gain}
                    onChange={(e) => onChangeGain(idx, parseInt(e.target.value))}
                    className="h-28 w-2 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-amber-500 [writing-mode:vertical-lr] [direction:rtl]"
                  />
                </div>

                {/* Frequency Label */}
                <div className="text-center">
                  <span className="text-[11px] font-mono text-slate-200 block font-semibold">
                    {freqLabels[idx]}
                  </span>
                  <span className="text-[9px] font-mono text-slate-400">
                    {bandDescriptions[idx]}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* DSP Controls: Pre-Amp & Stereo Balance */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {/* Pre-Amp Gain */}
          <div className="bg-white/[0.04] backdrop-blur-md p-3.5 rounded-2xl border border-white/10">
            <div className="flex items-center justify-between text-xs font-mono text-slate-300 mb-2">
              <span>PRE-AMP GAIN</span>
              <span className="text-amber-400 tabular-nums">
                {preAmp > 0 ? `+${preAmp}` : preAmp} dB
              </span>
            </div>
            <input
              type="range"
              min={-6}
              max={6}
              step={0.5}
              value={preAmp}
              onChange={(e) => onChangePreAmp(parseFloat(e.target.value))}
              className="w-full h-1.5 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-amber-500"
            />
          </div>

          {/* Stereo Balance (Pan) */}
          <div className="bg-white/[0.04] backdrop-blur-md p-3.5 rounded-2xl border border-white/10">
            <div className="flex items-center justify-between text-xs font-mono text-slate-300 mb-2">
              <span>STEREO BALANCE</span>
              <span className="text-amber-400 tabular-nums">
                {stereoPan === 0 ? 'CENTER' : stereoPan < 0 ? `${Math.abs(Math.round(stereoPan * 100))}% L` : `${Math.round(stereoPan * 100)}% R`}
              </span>
            </div>
            <input
              type="range"
              min={-1}
              max={1}
              step={0.05}
              value={stereoPan}
              onChange={(e) => onChangeStereoPan(parseFloat(e.target.value))}
              className="w-full h-1.5 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-amber-500"
            />
          </div>
        </div>
      </div>
    </div>
  );
};
