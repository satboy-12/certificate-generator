import React, { useState } from 'react';
import { CertificateSize, CertificateOrientation, DimensionUnit } from '../types';
import { STANDARD_SIZES } from '../constants/defaultTemplates';
import { Maximize2, Layers, Check, Sparkles } from 'lucide-react';

interface SizeSelectorProps {
  currentSize: CertificateSize;
  onSizeSelect: (size: CertificateSize) => void;
}

export const SizeSelector: React.FC<SizeSelectorProps> = ({ currentSize, onSizeSelect }) => {
  const [activeTab, setActiveTab] = useState<'preset' | 'custom'>('preset');

  const [customWidth, setCustomWidth] = useState<number>(297);
  const [customHeight, setCustomHeight] = useState<number>(210);
  const [customUnit, setCustomUnit] = useState<DimensionUnit>('mm');
  const [customOrientation, setCustomOrientation] = useState<CertificateOrientation>('landscape');

  const handleApplyCustom = () => {
    let pxW = customWidth;
    let pxH = customHeight;

    if (customUnit === 'mm') {
      pxW = Math.round((customWidth / 25.4) * 96 * 3.125); // ~300 DPI canvas
      pxH = Math.round((customHeight / 25.4) * 96 * 3.125);
    } else if (customUnit === 'inch') {
      pxW = Math.round(customWidth * 300);
      pxH = Math.round(customHeight * 300);
    }

    const newSize: CertificateSize = {
      name: `Custom (${customWidth} × ${customHeight} ${customUnit})`,
      width: customWidth,
      height: customHeight,
      unit: customUnit,
      orientation: customOrientation,
      pxWidth: pxW,
      pxHeight: pxH,
    };

    onSizeSelect(newSize);
  };

  return (
    <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-sm space-y-4">
      <div className="flex items-center justify-between border-b border-slate-100 pb-3">
        <div>
          <h3 className="text-sm font-bold text-slate-900 flex items-center space-x-2">
            <Maximize2 className="w-4 h-4 text-blue-600" />
            <span>Select Certificate Paper Size</span>
          </h3>
          <p className="text-xs text-slate-500">
            Choose paper size or set custom dimensions for high-resolution 300 DPI printing.
          </p>
        </div>

        {/* Tab Toggle */}
        <div className="flex bg-slate-100 p-0.5 rounded-lg text-xs font-medium">
          <button
            onClick={() => setActiveTab('preset')}
            className={`px-3 py-1 rounded-md transition-all ${
              activeTab === 'preset' ? 'bg-white text-slate-900 shadow-xs font-bold' : 'text-slate-600'
            }`}
          >
            Standard Presets
          </button>
          <button
            onClick={() => setActiveTab('custom')}
            className={`px-3 py-1 rounded-md transition-all ${
              activeTab === 'custom' ? 'bg-white text-slate-900 shadow-xs font-bold' : 'text-slate-600'
            }`}
          >
            Custom Size
          </button>
        </div>
      </div>

      {activeTab === 'preset' ? (
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {Object.values(STANDARD_SIZES).map((size) => {
            const isSelected = currentSize.name === size.name;
            return (
              <button
                key={size.name}
                onClick={() => onSizeSelect(size)}
                className={`p-3.5 rounded-xl text-left border transition-all flex flex-col justify-between space-y-2 relative ${
                  isSelected
                    ? 'border-blue-600 bg-blue-50/60 ring-2 ring-blue-500/20'
                    : 'border-slate-200 bg-slate-50 hover:bg-slate-100/80 hover:border-slate-300'
                }`}
              >
                {isSelected && (
                  <div className="absolute top-2.5 right-2.5 w-5 h-5 bg-blue-600 rounded-full text-white flex items-center justify-center">
                    <Check className="w-3 h-3 stroke-[3]" />
                  </div>
                )}
                <div>
                  <h4 className="text-xs font-bold text-slate-900">{size.name}</h4>
                  <p className="text-[11px] text-slate-500 mt-0.5">
                    {size.width} × {size.height} {size.unit}
                  </p>
                </div>
                <div className="text-[10px] text-blue-700 font-mono bg-blue-100/60 px-2 py-0.5 rounded w-fit capitalize font-semibold">
                  {size.orientation}
                </div>
              </button>
            );
          })}
        </div>
      ) : (
        <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 space-y-3">
          <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Width</label>
              <input
                type="number"
                value={customWidth}
                onChange={(e) => setCustomWidth(Number(e.target.value))}
                className="w-full bg-white border border-slate-300 rounded-lg px-3 py-1.5 text-xs focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Height</label>
              <input
                type="number"
                value={customHeight}
                onChange={(e) => setCustomHeight(Number(e.target.value))}
                className="w-full bg-white border border-slate-300 rounded-lg px-3 py-1.5 text-xs focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Unit</label>
              <select
                value={customUnit}
                onChange={(e) => setCustomUnit(e.target.value as DimensionUnit)}
                className="w-full bg-white border border-slate-300 rounded-lg px-3 py-1.5 text-xs focus:ring-2 focus:ring-blue-500"
              >
                <option value="mm">Millimeters (mm)</option>
                <option value="inch">Inches (in)</option>
                <option value="px">Pixels (px)</option>
              </select>
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Orientation</label>
              <select
                value={customOrientation}
                onChange={(e) => setCustomOrientation(e.target.value as CertificateOrientation)}
                className="w-full bg-white border border-slate-300 rounded-lg px-3 py-1.5 text-xs focus:ring-2 focus:ring-blue-500"
              >
                <option value="landscape">Landscape</option>
                <option value="portrait">Portrait</option>
              </select>
            </div>
          </div>

          <button
            onClick={handleApplyCustom}
            className="px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-lg text-xs font-semibold shadow-xs"
          >
            Apply Custom Size
          </button>
        </div>
      )}
    </div>
  );
};
