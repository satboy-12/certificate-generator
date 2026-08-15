import React from 'react';
import {
  CmykColor,
  CMYK_PRESETS,
  hexToCmyk,
  cmykToHex,
  formatCmykDisplay,
} from '../lib/cmykUtils';

interface CmykColorControllerProps {
  color: string;
  onChange: (newHex: string) => void;
  label?: string;
}

export const CmykColorController: React.FC<CmykColorControllerProps> = ({
  color,
  onChange,
  label = 'CMYK PRINT COLOR CONTROLLER',
}) => {
  const currentHex = color && color !== 'transparent' ? color : '#0e1838';
  const cmyk = hexToCmyk(currentHex);

  const handleChannelChange = (channel: keyof CmykColor, value: number) => {
    const clampedVal = Math.max(0, Math.min(100, Math.round(value)));
    const updatedCmyk: CmykColor = {
      ...cmyk,
      [channel]: clampedVal,
    };
    const nextHex = cmykToHex(updatedCmyk);
    onChange(nextHex);
  };

  return (
    <div className="bg-[#050b18] border border-[#142347] rounded-xl p-3 shadow-xl space-y-2.5 text-xs select-none">
      {/* Header with Title and Current CMYK readout */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-1.5">
          <span className="w-2.5 h-2.5 rounded-full bg-cyan-400 shadow-[0_0_8px_rgba(34,211,238,0.8)] animate-pulse inline-block"></span>
          <span className="text-[11px] font-black text-cyan-300 uppercase tracking-wider">
            {label}
          </span>
        </div>

        <div className="flex items-center space-x-2">
          <span
            className="w-4 h-4 rounded-md border border-cyan-500/40 shadow-xs inline-block shrink-0"
            style={{ backgroundColor: currentHex }}
            title={currentHex}
          />
          <span className="font-mono text-[10.5px] font-bold text-cyan-200 tracking-tight">
            {formatCmykDisplay(cmyk)}
          </span>
        </div>
      </div>

      {/* 4 CMYK Channel Sliders (Cyan, Magenta, Yellow, Key/Black) */}
      <div className="grid grid-cols-2 gap-2 text-[10.5px]">
        {/* Cyan (C) */}
        <div className="bg-[#091326] px-2.5 py-2 rounded-lg border border-cyan-500/25 space-y-1.5 hover:border-cyan-500/50 transition-colors">
          <div className="flex justify-between font-bold text-cyan-400">
            <span>Cyan (C)</span>
            <span className="font-mono">{cmyk.c}%</span>
          </div>
          <input
            type="range"
            min={0}
            max={100}
            value={cmyk.c}
            onChange={(e) => handleChannelChange('c', Number(e.target.value))}
            className="w-full accent-cyan-400 cursor-pointer h-1.5 bg-slate-800 rounded-lg"
          />
        </div>

        {/* Magenta (M) */}
        <div className="bg-[#091326] px-2.5 py-2 rounded-lg border border-pink-500/25 space-y-1.5 hover:border-pink-500/50 transition-colors">
          <div className="flex justify-between font-bold text-pink-400">
            <span>Magenta (M)</span>
            <span className="font-mono">{cmyk.m}%</span>
          </div>
          <input
            type="range"
            min={0}
            max={100}
            value={cmyk.m}
            onChange={(e) => handleChannelChange('m', Number(e.target.value))}
            className="w-full accent-pink-400 cursor-pointer h-1.5 bg-slate-800 rounded-lg"
          />
        </div>

        {/* Yellow (Y) */}
        <div className="bg-[#091326] px-2.5 py-2 rounded-lg border border-amber-500/25 space-y-1.5 hover:border-amber-500/50 transition-colors">
          <div className="flex justify-between font-bold text-amber-400">
            <span>Yellow (Y)</span>
            <span className="font-mono">{cmyk.y}%</span>
          </div>
          <input
            type="range"
            min={0}
            max={100}
            value={cmyk.y}
            onChange={(e) => handleChannelChange('y', Number(e.target.value))}
            className="w-full accent-amber-400 cursor-pointer h-1.5 bg-slate-800 rounded-lg"
          />
        </div>

        {/* Key/Black (K) */}
        <div className="bg-[#091326] px-2.5 py-2 rounded-lg border border-slate-500/25 space-y-1.5 hover:border-slate-400/50 transition-colors">
          <div className="flex justify-between font-bold text-slate-300">
            <span>Key/Black (K)</span>
            <span className="font-mono">{cmyk.k}%</span>
          </div>
          <input
            type="range"
            min={0}
            max={100}
            value={cmyk.k}
            onChange={(e) => handleChannelChange('k', Number(e.target.value))}
            className="w-full accent-slate-400 cursor-pointer h-1.5 bg-slate-800 rounded-lg"
          />
        </div>
      </div>

      {/* Certified Print CMYK Swatches */}
      <div className="space-y-1.5 pt-2 border-t border-[#142347]">
        <div className="text-[9.5px] font-black text-cyan-400/80 uppercase tracking-wider">
          CERTIFIED PRINT CMYK SWATCHES:
        </div>
        <div className="grid grid-cols-4 gap-1.5">
          {CMYK_PRESETS.map((preset) => {
            const isSelected = currentHex.toLowerCase() === preset.hex.toLowerCase();
            return (
              <button
                key={preset.name}
                type="button"
                onClick={() => onChange(preset.hex)}
                className={`px-1.5 py-1 rounded-lg text-left transition-all border flex items-center space-x-1.5 ${
                  isSelected
                    ? 'bg-blue-600/30 border-cyan-400 ring-1 ring-cyan-400 shadow-[0_0_8px_rgba(34,211,238,0.3)]'
                    : 'bg-[#091326] hover:bg-[#101e38] border-slate-800 hover:border-slate-700'
                }`}
                title={`${preset.name}: C:${preset.cmyk.c}% M:${preset.cmyk.m}% Y:${preset.cmyk.y}% K:${preset.cmyk.k}%\n${preset.desc}`}
              >
                <span
                  className="w-3.5 h-3.5 rounded-full shrink-0 border border-white/20 shadow-xs"
                  style={{ backgroundColor: preset.hex }}
                />
                <span className="text-[9.5px] font-bold text-slate-200 truncate">
                  {preset.name.split(' ')[0]}
                </span>
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
};
