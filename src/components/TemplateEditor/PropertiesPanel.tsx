import React from 'react';
import {
  Trash2,
  Lock,
  Unlock,
  ArrowUp,
  ArrowDown,
  AlignLeft,
  AlignCenter,
  AlignRight,
  Bold,
  Italic,
  Underline,
  Copy,
  Layers,
  Palette,
  Move,
  RotateCw,
} from 'lucide-react';
import { CanvasElement } from '../../types';

interface PropertiesPanelProps {
  selectedElement: CanvasElement | null;
  onUpdateElement: (updated: Partial<CanvasElement>) => void;
  onDeleteElement: (id: string) => void;
  onDuplicateElement: (id: string) => void;
  onMoveLayer: (id: string, direction: 'up' | 'down' | 'front' | 'back') => void;
}

export const PropertiesPanel: React.FC<PropertiesPanelProps> = ({
  selectedElement,
  onUpdateElement,
  onDeleteElement,
  onDuplicateElement,
  onMoveLayer,
}) => {
  if (!selectedElement) {
    return (
      <aside className="w-72 bg-white border-l border-slate-200 p-5 flex flex-col items-center justify-center text-center text-slate-400 h-full shrink-0">
        <Move className="w-8 h-8 text-slate-300 mb-2" />
        <h4 className="text-xs font-bold text-slate-700">No Element Selected</h4>
        <p className="text-[11px] text-slate-400 mt-1 max-w-[12rem]">
          Click any text, dynamic field, logo, or shape on the canvas to customize its properties.
        </p>
      </aside>
    );
  }

  const isText = selectedElement.type === 'text' || selectedElement.type === 'dynamic_field';
  const isShape = selectedElement.type === 'shape' || selectedElement.type === 'line';

  return (
    <aside className="w-72 bg-white border-l border-slate-200 flex flex-col h-full shrink-0 overflow-y-auto text-xs">
      {/* Header */}
      <div className="p-3.5 border-b border-slate-200 bg-slate-50 flex items-center justify-between">
        <div className="space-y-0.5">
          <span className="text-[10px] uppercase font-mono font-bold text-blue-600">
            {selectedElement.type}
          </span>
          <h4 className="font-bold text-slate-900 truncate max-w-[140px]">{selectedElement.name}</h4>
        </div>

        <div className="flex items-center space-x-1">
          <button
            onClick={() => onUpdateElement({ locked: !selectedElement.locked })}
            className={`p-1.5 rounded hover:bg-slate-200 transition-colors ${
              selectedElement.locked ? 'text-amber-600 bg-amber-50' : 'text-slate-500'
            }`}
            title={selectedElement.locked ? 'Unlock Element' : 'Lock Element'}
          >
            {selectedElement.locked ? <Lock className="w-3.5 h-3.5" /> : <Unlock className="w-3.5 h-3.5" />}
          </button>

          <button
            onClick={() => onDuplicateElement(selectedElement.id)}
            className="p-1.5 rounded text-slate-500 hover:bg-slate-200 transition-colors"
            title="Duplicate"
          >
            <Copy className="w-3.5 h-3.5" />
          </button>

          <button
            onClick={() => onDeleteElement(selectedElement.id)}
            className="p-1.5 rounded text-red-500 hover:bg-red-50 transition-colors"
            title="Delete"
          >
            <Trash2 className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      <div className="p-4 space-y-4">
        {/* TEXT & DYNAMIC FIELD CONTROLS */}
        {isText && (
          <div className="space-y-3 pb-3 border-b border-slate-200">
            <h5 className="font-bold text-slate-800 text-[11px] uppercase tracking-wider text-slate-400">
              Typography & Style
            </h5>

            {/* Text Input (if static text) */}
            {selectedElement.type === 'text' && (
              <div>
                <label className="block text-[11px] font-semibold text-slate-600 mb-1">Text Content</label>
                <textarea
                  value={selectedElement.text || ''}
                  onChange={(e) => onUpdateElement({ text: e.target.value })}
                  rows={2}
                  className="w-full border border-slate-300 rounded-lg p-2 text-xs focus:ring-2 focus:ring-blue-500"
                />
              </div>
            )}

            {/* Font Family */}
            <div>
              <label className="block text-[11px] font-semibold text-slate-600 mb-1">Font Family</label>
              <select
                value={selectedElement.fontFamily || 'serif'}
                onChange={(e) => onUpdateElement({ fontFamily: e.target.value })}
                className="w-full border border-slate-300 rounded-lg px-2.5 py-1.5 text-xs focus:ring-2 focus:ring-blue-500"
              >
                <option value="Bebas Kai">Bebas Kai (Bold Display)</option>
                <option value="Bebas Neue">Bebas Neue</option>
                <option value="serif">Classic Serif (Georgia, Times)</option>
                <option value="sans-serif">Modern Sans-Serif (Arial, Helvetica)</option>
                <option value="Playfair Display">Playfair Display</option>
                <option value="Cinzel">Cinzel Classic</option>
                <option value="Great Vibes">Great Vibes Calligraphy</option>
                <option value="Inter">Inter Clean</option>
                <option value="monospace">Monospace / Code</option>
              </select>
            </div>

            {/* Font Size & Weight */}
            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="block text-[11px] font-semibold text-slate-600 mb-1">Font Size (px)</label>
                <input
                  type="number"
                  min={8}
                  max={120}
                  value={selectedElement.fontSize || 16}
                  onChange={(e) => onUpdateElement({ fontSize: Number(e.target.value) })}
                  className="w-full border border-slate-300 rounded-lg px-2.5 py-1.5 text-xs focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-slate-600 mb-1">Weight</label>
                <select
                  value={selectedElement.fontWeight || 'normal'}
                  onChange={(e) => onUpdateElement({ fontWeight: e.target.value as any })}
                  className="w-full border border-slate-300 rounded-lg px-2.5 py-1.5 text-xs focus:ring-2 focus:ring-blue-500"
                >
                  <option value="normal">Normal (400)</option>
                  <option value="500">Medium (500)</option>
                  <option value="600">Semi Bold (600)</option>
                  <option value="bold">Bold (700)</option>
                  <option value="800">Extra Bold (800)</option>
                </select>
              </div>
            </div>

            {/* Style Toggles & Color */}
            <div className="flex items-center justify-between gap-2 pt-1">
              <div className="flex bg-slate-100 p-0.5 rounded-lg border border-slate-200">
                <button
                  onClick={() =>
                    onUpdateElement({
                      fontStyle: selectedElement.fontStyle === 'italic' ? 'normal' : 'italic',
                    })
                  }
                  className={`p-1.5 rounded transition-all ${
                    selectedElement.fontStyle === 'italic' ? 'bg-white shadow-xs font-bold text-blue-600' : 'text-slate-600'
                  }`}
                  title="Italic"
                >
                  <Italic className="w-3.5 h-3.5" />
                </button>

                <button
                  onClick={() =>
                    onUpdateElement({
                      textDecoration: selectedElement.textDecoration === 'underline' ? 'none' : 'underline',
                    })
                  }
                  className={`p-1.5 rounded transition-all ${
                    selectedElement.textDecoration === 'underline' ? 'bg-white shadow-xs font-bold text-blue-600' : 'text-slate-600'
                  }`}
                  title="Underline"
                >
                  <Underline className="w-3.5 h-3.5" />
                </button>
              </div>

              {/* Text Align */}
              <div className="flex bg-slate-100 p-0.5 rounded-lg border border-slate-200">
                <button
                  onClick={() => onUpdateElement({ align: 'left' })}
                  className={`p-1.5 rounded transition-all ${
                    selectedElement.align === 'left' ? 'bg-white shadow-xs text-blue-600' : 'text-slate-600'
                  }`}
                >
                  <AlignLeft className="w-3.5 h-3.5" />
                </button>

                <button
                  onClick={() => onUpdateElement({ align: 'center' })}
                  className={`p-1.5 rounded transition-all ${
                    selectedElement.align === 'center' ? 'bg-white shadow-xs text-blue-600' : 'text-slate-600'
                  }`}
                >
                  <AlignCenter className="w-3.5 h-3.5" />
                </button>

                <button
                  onClick={() => onUpdateElement({ align: 'right' })}
                  className={`p-1.5 rounded transition-all ${
                    selectedElement.align === 'right' ? 'bg-white shadow-xs text-blue-600' : 'text-slate-600'
                  }`}
                >
                  <AlignRight className="w-3.5 h-3.5" />
                </button>
              </div>

              {/* Text Color Picker */}
              <div className="flex items-center space-x-1">
                <input
                  type="color"
                  value={selectedElement.color || '#000000'}
                  onChange={(e) => onUpdateElement({ color: e.target.value })}
                  className="w-7 h-7 rounded border border-slate-300 cursor-pointer p-0.5"
                  title="Text Color"
                />
              </div>
            </div>

            {/* Dynamic Text-Resizing Helper Controls */}
            <div className="p-2.5 bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200/80 rounded-xl space-y-2">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-1.5">
                  <span className="text-[11px] font-bold text-blue-950 flex items-center">
                    Auto-Fit Text Resizing
                  </span>
                  <span className="text-[9px] bg-blue-600 text-white px-1.5 py-0.2 rounded font-bold uppercase">
                    Active
                  </span>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    checked={selectedElement.autoFit !== false}
                    onChange={(e) => onUpdateElement({ autoFit: e.target.checked })}
                    className="sr-only peer"
                  />
                  <div className="w-8 h-4 bg-slate-300 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-3 after:w-3 after:transition-all peer-checked:bg-blue-600"></div>
                </label>
              </div>

              <div className="flex items-center justify-between text-[10px] text-blue-800">
                <span>Min Font Floor:</span>
                <div className="flex items-center space-x-1">
                  <input
                    type="number"
                    min={8}
                    max={selectedElement.fontSize || 48}
                    value={selectedElement.minFontSize || 14}
                    onChange={(e) => onUpdateElement({ minFontSize: Number(e.target.value) })}
                    className="w-12 bg-white border border-blue-200 rounded px-1.5 py-0.5 text-[11px] font-bold text-blue-900 text-center"
                  />
                  <span className="text-[10px] text-blue-600">px</span>
                </div>
              </div>
              <p className="text-[9.5px] text-blue-700 leading-tight">
                Automatically reduces font size if recipient's name exceeds the defined width ({selectedElement.width}px), keeping it centered.
              </p>
            </div>
          </div>
        )}

        {/* SHAPE & LINE CONTROLS */}
        {isShape && (
          <div className="space-y-3 pb-3 border-b border-slate-200">
            <h5 className="font-bold text-slate-800 text-[11px] uppercase tracking-wider text-slate-400">
              Stroke & Fill Colors
            </h5>

            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="block text-[11px] font-semibold text-slate-600 mb-1">Fill Color</label>
                <div className="flex items-center space-x-2">
                  <input
                    type="color"
                    value={selectedElement.fillColor === 'transparent' ? '#ffffff' : selectedElement.fillColor || '#ffffff'}
                    onChange={(e) => onUpdateElement({ fillColor: e.target.value })}
                    className="w-7 h-7 rounded border border-slate-300 cursor-pointer p-0.5"
                  />
                  <button
                    onClick={() => onUpdateElement({ fillColor: 'transparent' })}
                    className="text-[10px] text-slate-500 underline"
                  >
                    Clear Fill
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-slate-600 mb-1">Stroke Color</label>
                <input
                  type="color"
                  value={selectedElement.strokeColor || '#000000'}
                  onChange={(e) => onUpdateElement({ strokeColor: e.target.value })}
                  className="w-7 h-7 rounded border border-slate-300 cursor-pointer p-0.5"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="block text-[11px] font-semibold text-slate-600 mb-1">Stroke Width</label>
                <input
                  type="number"
                  min={0}
                  max={20}
                  value={selectedElement.strokeWidth || 1}
                  onChange={(e) => onUpdateElement({ strokeWidth: Number(e.target.value) })}
                  className="w-full border border-slate-300 rounded-lg px-2 py-1 text-xs"
                />
              </div>

              {selectedElement.type === 'shape' && (
                <div>
                  <label className="block text-[11px] font-semibold text-slate-600 mb-1">Radius (px)</label>
                  <input
                    type="number"
                    min={0}
                    max={50}
                    value={selectedElement.borderRadius || 0}
                    onChange={(e) => onUpdateElement({ borderRadius: Number(e.target.value) })}
                    className="w-full border border-slate-300 rounded-lg px-2 py-1 text-xs"
                  />
                </div>
              )}
            </div>
          </div>
        )}

        {/* POSITION & DIMENSIONS */}
        <div className="space-y-3 pb-3 border-b border-slate-200">
          <h5 className="font-bold text-slate-800 text-[11px] uppercase tracking-wider text-slate-400">
            Position & Geometry
          </h5>

          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className="block text-[11px] font-semibold text-slate-600 mb-0.5">X Position</label>
              <input
                type="number"
                value={Math.round(selectedElement.x)}
                onChange={(e) => onUpdateElement({ x: Number(e.target.value) })}
                className="w-full border border-slate-300 rounded-lg px-2 py-1 text-xs"
              />
            </div>

            <div>
              <label className="block text-[11px] font-semibold text-slate-600 mb-0.5">Y Position</label>
              <input
                type="number"
                value={Math.round(selectedElement.y)}
                onChange={(e) => onUpdateElement({ y: Number(e.target.value) })}
                className="w-full border border-slate-300 rounded-lg px-2 py-1 text-xs"
              />
            </div>

            <div>
              <label className="block text-[11px] font-semibold text-slate-600 mb-0.5">Width</label>
              <input
                type="number"
                value={Math.round(selectedElement.width)}
                onChange={(e) => onUpdateElement({ width: Number(e.target.value) })}
                className="w-full border border-slate-300 rounded-lg px-2 py-1 text-xs"
              />
            </div>

            <div>
              <label className="block text-[11px] font-semibold text-slate-600 mb-0.5">Height</label>
              <input
                type="number"
                value={Math.round(selectedElement.height)}
                onChange={(e) => onUpdateElement({ height: Number(e.target.value) })}
                className="w-full border border-slate-300 rounded-lg px-2 py-1 text-xs"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className="block text-[11px] font-semibold text-slate-600 mb-0.5">Rotation (°)</label>
              <input
                type="number"
                min={-180}
                max={180}
                value={selectedElement.rotation || 0}
                onChange={(e) => onUpdateElement({ rotation: Number(e.target.value) })}
                className="w-full border border-slate-300 rounded-lg px-2 py-1 text-xs"
              />
            </div>

            <div>
              <label className="block text-[11px] font-semibold text-slate-600 mb-0.5">Opacity</label>
              <input
                type="range"
                min={0.1}
                max={1.0}
                step={0.05}
                value={selectedElement.opacity ?? 1}
                onChange={(e) => onUpdateElement({ opacity: Number(e.target.value) })}
                className="w-full accent-blue-600"
              />
            </div>
          </div>
        </div>

        {/* LAYER ARRANGEMENT */}
        <div className="space-y-2">
          <h5 className="font-bold text-slate-800 text-[11px] uppercase tracking-wider text-slate-400">
            Layer Stacking
          </h5>

          <div className="grid grid-cols-2 gap-2">
            <button
              onClick={() => onMoveLayer(selectedElement.id, 'up')}
              className="px-2.5 py-1.5 border border-slate-200 bg-slate-50 hover:bg-slate-100 rounded-lg flex items-center justify-center space-x-1 text-slate-700 font-medium"
            >
              <ArrowUp className="w-3.5 h-3.5" />
              <span>Bring Forward</span>
            </button>

            <button
              onClick={() => onMoveLayer(selectedElement.id, 'down')}
              className="px-2.5 py-1.5 border border-slate-200 bg-slate-50 hover:bg-slate-100 rounded-lg flex items-center justify-center space-x-1 text-slate-700 font-medium"
            >
              <ArrowDown className="w-3.5 h-3.5" />
              <span>Send Backward</span>
            </button>
          </div>
        </div>
      </div>
    </aside>
  );
};
