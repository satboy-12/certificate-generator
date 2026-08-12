import React, { useState } from 'react';
import {
  Type,
  Variable,
  Image as ImageIcon,
  ShieldAlert,
  QrCode,
  Square,
  Minus,
  Plus,
  Stamp,
  Sparkles,
  HelpCircle,
} from 'lucide-react';
import { CanvasElement, DynamicFieldDef, ElementType } from '../../types';

interface ElementsSidebarProps {
  dynamicFields: DynamicFieldDef[];
  onAddText: () => void;
  onAddDynamicField: (field: DynamicFieldDef) => void;
  onAddCustomField: (key: string, label: string) => void;
  onAddImage: (type: 'image' | 'logo' | 'signature', src?: string) => void;
  onAddQrCode: () => void;
  onAddShape: (type: 'shape' | 'line') => void;
}

export const ElementsSidebar: React.FC<ElementsSidebarProps> = ({
  dynamicFields,
  onAddText,
  onAddDynamicField,
  onAddCustomField,
  onAddImage,
  onAddQrCode,
  onAddShape,
}) => {
  const [activeCategory, setActiveCategory] = useState<'text' | 'fields' | 'branding' | 'shapes'>('fields');

  // Custom field modal state
  const [showCustomModal, setShowCustomModal] = useState(false);
  const [customKey, setCustomKey] = useState('');
  const [customLabel, setCustomLabel] = useState('');

  const handleCreateCustomField = (e: React.FormEvent) => {
    e.preventDefault();
    if (!customKey.trim()) return;

    const formattedKey = customKey.toUpperCase().replace(/[^A-Z0-9_]/g, '_');
    const label = customLabel.trim() || formattedKey;

    onAddCustomField(formattedKey, label);
    setCustomKey('');
    setCustomLabel('');
    setShowCustomModal(false);
  };

  return (
    <aside className="w-72 bg-white border-r border-slate-200 flex flex-col h-full shrink-0">
      {/* Category Tabs */}
      <div className="flex border-b border-slate-200 bg-slate-50 text-xs font-semibold">
        <button
          onClick={() => setActiveCategory('fields')}
          className={`flex-1 py-3 text-center border-b-2 transition-all flex flex-col items-center space-y-1 ${
            activeCategory === 'fields'
              ? 'border-blue-600 text-blue-600 bg-white'
              : 'border-transparent text-slate-500 hover:text-slate-900'
          }`}
        >
          <Variable className="w-4 h-4" />
          <span>Dynamic Fields</span>
        </button>

        <button
          onClick={() => setActiveCategory('text')}
          className={`flex-1 py-3 text-center border-b-2 transition-all flex flex-col items-center space-y-1 ${
            activeCategory === 'text'
              ? 'border-blue-600 text-blue-600 bg-white'
              : 'border-transparent text-slate-500 hover:text-slate-900'
          }`}
        >
          <Type className="w-4 h-4" />
          <span>Static Text</span>
        </button>

        <button
          onClick={() => setActiveCategory('branding')}
          className={`flex-1 py-3 text-center border-b-2 transition-all flex flex-col items-center space-y-1 ${
            activeCategory === 'branding'
              ? 'border-blue-600 text-blue-600 bg-white'
              : 'border-transparent text-slate-500 hover:text-slate-900'
          }`}
        >
          <Stamp className="w-4 h-4" />
          <span>Logos / QR</span>
        </button>

        <button
          onClick={() => setActiveCategory('shapes')}
          className={`flex-1 py-3 text-center border-b-2 transition-all flex flex-col items-center space-y-1 ${
            activeCategory === 'shapes'
              ? 'border-blue-600 text-blue-600 bg-white'
              : 'border-transparent text-slate-500 hover:text-slate-900'
          }`}
        >
          <Square className="w-4 h-4" />
          <span>Frames</span>
        </button>
      </div>

      {/* Content Area */}
      <div className="p-4 overflow-y-auto flex-1 space-y-4">
        {/* DYNAMIC FIELDS TAB */}
        {activeCategory === 'fields' && (
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <div>
                <h4 className="text-xs font-bold text-slate-800">Dynamic Merge Fields</h4>
                <p className="text-[11px] text-slate-500">Auto-filled from Excel row data</p>
              </div>
              <button
                onClick={() => setShowCustomModal(true)}
                className="inline-flex items-center space-x-1 text-[11px] bg-blue-50 text-blue-700 hover:bg-blue-100 px-2 py-1 rounded-md font-semibold"
              >
                <Plus className="w-3 h-3" />
                <span>Custom</span>
              </button>
            </div>

            <div className="grid grid-cols-1 gap-2">
              {dynamicFields.map((field) => (
                <button
                  key={field.key}
                  onClick={() => onAddDynamicField(field)}
                  className="w-full text-left p-2.5 rounded-lg border border-slate-200 bg-slate-50 hover:bg-blue-50/60 hover:border-blue-300 transition-all group flex items-center justify-between"
                >
                  <div>
                    <span className="font-mono text-xs font-bold text-blue-700 bg-blue-100/60 px-1.5 py-0.5 rounded mr-1.5">
                      {`{{${field.key}}}`}
                    </span>
                    <span className="text-xs text-slate-700 font-medium">{field.label}</span>
                  </div>
                  <Plus className="w-3.5 h-3.5 text-slate-400 group-hover:text-blue-600" />
                </button>
              ))}
            </div>

            {/* Custom Field Modal */}
            {showCustomModal && (
              <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-xs z-50 flex items-center justify-center p-4">
                <form
                  onSubmit={handleCreateCustomField}
                  className="bg-white rounded-xl max-w-sm w-full p-5 shadow-xl border border-slate-200 space-y-4"
                >
                  <h3 className="text-sm font-bold text-slate-900">Add Custom Dynamic Variable</h3>
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                      Variable Key (e.g. TEAM_NAME)
                    </label>
                    <input
                      type="text"
                      placeholder="e.g. MENTOR_NAME"
                      value={customKey}
                      onChange={(e) => setCustomKey(e.target.value)}
                      className="w-full border border-slate-300 rounded-lg px-3 py-1.5 text-xs font-mono uppercase focus:ring-2 focus:ring-blue-500"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                      Display Label
                    </label>
                    <input
                      type="text"
                      placeholder="e.g. Mentor Name"
                      value={customLabel}
                      onChange={(e) => setCustomLabel(e.target.value)}
                      className="w-full border border-slate-300 rounded-lg px-3 py-1.5 text-xs focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                  <div className="flex justify-end space-x-2 pt-2">
                    <button
                      type="button"
                      onClick={() => setShowCustomModal(false)}
                      className="px-3 py-1.5 text-xs text-slate-600 hover:bg-slate-100 rounded-lg font-medium"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      className="px-3 py-1.5 text-xs bg-blue-600 hover:bg-blue-500 text-white rounded-lg font-semibold shadow-xs"
                    >
                      Add Variable
                    </button>
                  </div>
                </form>
              </div>
            )}
          </div>
        )}

        {/* STATIC TEXT TAB */}
        {activeCategory === 'text' && (
          <div className="space-y-3">
            <h4 className="text-xs font-bold text-slate-800">Add Static Text</h4>
            <p className="text-[11px] text-slate-500">Insert permanent headers, titles, or dates</p>

            <button
              onClick={onAddText}
              className="w-full text-left p-3 rounded-xl border border-slate-200 bg-slate-50 hover:bg-blue-50/60 hover:border-blue-300 transition-all flex items-center space-x-3 group"
            >
              <div className="p-2 bg-blue-100 text-blue-700 rounded-lg">
                <Type className="w-5 h-5" />
              </div>
              <div>
                <h5 className="text-xs font-bold text-slate-800">New Text Block</h5>
                <p className="text-[11px] text-slate-500">Editable static label or description</p>
              </div>
            </button>
          </div>
        )}

        {/* BRANDING LOGOS & QR TAB */}
        {activeCategory === 'branding' && (
          <div className="space-y-3">
            <h4 className="text-xs font-bold text-slate-800">Logos, Signatures & QR</h4>
            <p className="text-[11px] text-slate-500">Place branding assets onto canvas</p>

            <button
              onClick={() => onAddImage('logo')}
              className="w-full text-left p-3 rounded-xl border border-slate-200 bg-slate-50 hover:bg-blue-50 hover:border-blue-300 transition-all flex items-center space-x-3"
            >
              <div className="p-2 bg-indigo-100 text-indigo-700 rounded-lg">
                <Stamp className="w-5 h-5" />
              </div>
              <div>
                <h5 className="text-xs font-bold text-slate-800">BSROCKS / SeventhSense Logo</h5>
                <p className="text-[11px] text-slate-500">Company brand logo image</p>
              </div>
            </button>

            <button
              onClick={() => onAddImage('signature')}
              className="w-full text-left p-3 rounded-xl border border-slate-200 bg-slate-50 hover:bg-blue-50 hover:border-blue-300 transition-all flex items-center space-x-3"
            >
              <div className="p-2 bg-emerald-100 text-emerald-700 rounded-lg">
                <ImageIcon className="w-5 h-5" />
              </div>
              <div>
                <h5 className="text-xs font-bold text-slate-800">Signature Line</h5>
                <p className="text-[11px] text-slate-500">Authorized signature image</p>
              </div>
            </button>

            <button
              onClick={onAddQrCode}
              className="w-full text-left p-3 rounded-xl border border-slate-200 bg-slate-50 hover:bg-blue-50 hover:border-blue-300 transition-all flex items-center space-x-3"
            >
              <div className="p-2 bg-purple-100 text-purple-700 rounded-lg">
                <QrCode className="w-5 h-5" />
              </div>
              <div>
                <h5 className="text-xs font-bold text-slate-800">Verification QR Code</h5>
                <p className="text-[11px] text-slate-500">Scannable authenticity QR link</p>
              </div>
            </button>

            {/* Custom File Upload for Logo/Image */}
            <div className="pt-2 border-t border-slate-200">
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Upload Custom Image File
              </label>
              <input
                type="file"
                accept="image/*"
                onChange={(e) => {
                  const file = e.target.files?.[0];
                  if (file) {
                    const reader = new FileReader();
                    reader.onload = (evt) => {
                      if (evt.target?.result) {
                        onAddImage('image', evt.target.result as string);
                      }
                    };
                    reader.readAsDataURL(file);
                  }
                }}
                className="w-full text-xs text-slate-500 file:mr-2 file:py-1.5 file:px-3 file:rounded-md file:border-0 file:text-xs file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
              />
            </div>
          </div>
        )}

        {/* SHAPES & FRAMES TAB */}
        {activeCategory === 'shapes' && (
          <div className="space-y-3">
            <h4 className="text-xs font-bold text-slate-800">Borders & Lines</h4>
            <p className="text-[11px] text-slate-500">Decorative frames, dividers and shapes</p>

            <button
              onClick={() => onAddShape('shape')}
              className="w-full text-left p-3 rounded-xl border border-slate-200 bg-slate-50 hover:bg-blue-50 hover:border-blue-300 transition-all flex items-center space-x-3"
            >
              <div className="p-2 bg-amber-100 text-amber-700 rounded-lg">
                <Square className="w-5 h-5" />
              </div>
              <div>
                <h5 className="text-xs font-bold text-slate-800">Border Frame Box</h5>
                <p className="text-[11px] text-slate-500">Decorative rectangle border</p>
              </div>
            </button>

            <button
              onClick={() => onAddShape('line')}
              className="w-full text-left p-3 rounded-xl border border-slate-200 bg-slate-50 hover:bg-blue-50 hover:border-blue-300 transition-all flex items-center space-x-3"
            >
              <div className="p-2 bg-slate-200 text-slate-700 rounded-lg">
                <Minus className="w-5 h-5" />
              </div>
              <div>
                <h5 className="text-xs font-bold text-slate-800">Divider Line</h5>
                <p className="text-[11px] text-slate-500">Horizontal separator stroke</p>
              </div>
            </button>
          </div>
        )}
      </div>
    </aside>
  );
};
