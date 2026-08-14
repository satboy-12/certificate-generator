import React from 'react';
import {
  Undo2,
  Redo2,
  ZoomIn,
  ZoomOut,
  Eye,
  Save,
  Sparkles,
  Upload,
  Grid,
  FileCode2,
  Layers,
  Award,
} from 'lucide-react';
import { CertificateTemplate } from '../../types';

interface ToolbarProps {
  template: CertificateTemplate;
  templatesForProject: CertificateTemplate[];
  zoom: number;
  showGrid: boolean;
  isPreviewMode: boolean;
  onZoomChange: (z: number) => void;
  onToggleGrid: () => void;
  onTogglePreview: () => void;
  onSwitchTemplate: (templateId: string) => void;
  onUploadBackground: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onSave: () => void;
  onGenerateClick: () => void;
  canUndo: boolean;
  canRedo: boolean;
  onUndo: () => void;
  onRedo: () => void;
  onEnforceGlobalStyling?: () => void;
}

export const Toolbar: React.FC<ToolbarProps> = ({
  template,
  templatesForProject,
  zoom,
  showGrid,
  isPreviewMode,
  onZoomChange,
  onToggleGrid,
  onTogglePreview,
  onSwitchTemplate,
  onUploadBackground,
  onSave,
  onGenerateClick,
  canUndo,
  canRedo,
  onUndo,
  onRedo,
  onEnforceGlobalStyling,
}) => {
  return (
    <div className="bg-slate-900 border-b border-slate-800 text-white px-4 py-2 flex flex-wrap items-center justify-between gap-3 text-xs">
      
      {/* Left Group: Template Switcher & Size Indicator */}
      <div className="flex items-center space-x-3">
        <div className="flex items-center space-x-2 bg-slate-800 px-3 py-1.5 rounded-lg border border-slate-700">
          <FileCode2 className="w-4 h-4 text-blue-400" />
          <span className="font-semibold text-slate-200">{template.name}</span>
          <span className="text-[10px] bg-blue-900/60 text-blue-300 font-mono px-1.5 py-0.5 rounded border border-blue-700/50">
            {template.size.name} ({template.size.width}×{template.size.height}{template.size.unit})
          </span>
        </div>

        {/* Global Bebas Kai & Center Align Enforcer Tool */}
        {onEnforceGlobalStyling && (
          <button
            type="button"
            onClick={onEnforceGlobalStyling}
            className="inline-flex items-center space-x-1.5 bg-gradient-to-r from-cyan-950 to-blue-950 hover:from-cyan-900 hover:to-blue-900 text-cyan-200 border border-cyan-500/40 px-2.5 py-1.5 rounded-lg font-bold transition-all shadow-xs"
            title="Enforce 'Bebas Kai' font style on all text elements and center alignment on all dynamic fields"
          >
            <Sparkles className="w-3.5 h-3.5 text-cyan-400" />
            <span className="font-mono text-[11px]">Enforce Bebas Kai</span>
          </button>
        )}

        {/* Support switching between two sizes (e.g. A4 vs A5) */}
        {templatesForProject.length > 1 && (
          <div className="flex items-center space-x-1">
            <span className="text-slate-400 text-[11px]">Size Variant:</span>
            <select
              value={template.id}
              onChange={(e) => onSwitchTemplate(e.target.value)}
              className="bg-slate-800 text-slate-200 border border-slate-700 rounded-md px-2 py-1 text-xs focus:ring-1 focus:ring-blue-500"
            >
              {templatesForProject.map((t) => (
                <option key={t.id} value={t.id}>
                  {t.size.name}
                </option>
              ))}
            </select>
          </div>
        )}
      </div>

      {/* Center Group: Canvas Controls (Undo/Redo, Zoom, Grid, Preview) */}
      <div className="flex items-center space-x-2 bg-slate-800/80 p-1 rounded-xl border border-slate-700/80">
        <button
          onClick={onUndo}
          disabled={!canUndo}
          className="p-1.5 rounded hover:bg-slate-700 disabled:opacity-30 disabled:hover:bg-transparent transition-colors"
          title="Undo"
        >
          <Undo2 className="w-3.5 h-3.5 text-slate-300" />
        </button>

        <button
          onClick={onRedo}
          disabled={!canRedo}
          className="p-1.5 rounded hover:bg-slate-700 disabled:opacity-30 disabled:hover:bg-transparent transition-colors"
          title="Redo"
        >
          <Redo2 className="w-3.5 h-3.5 text-slate-300" />
        </button>

        <div className="h-4 w-px bg-slate-700" />

        <button
          onClick={() => onZoomChange(Math.max(0.3, zoom - 0.1))}
          className="p-1.5 rounded hover:bg-slate-700 transition-colors"
          title="Zoom Out"
        >
          <ZoomOut className="w-3.5 h-3.5 text-slate-300" />
        </button>

        <span className="font-mono text-[11px] font-bold text-blue-400 min-w-[3rem] text-center">
          {Math.round(zoom * 100)}%
        </span>

        <button
          onClick={() => onZoomChange(Math.min(2.0, zoom + 0.1))}
          className="p-1.5 rounded hover:bg-slate-700 transition-colors"
          title="Zoom In"
        >
          <ZoomIn className="w-3.5 h-3.5 text-slate-300" />
        </button>

        <div className="h-4 w-px bg-slate-700" />

        <button
          onClick={onToggleGrid}
          className={`p-1.5 rounded transition-colors ${
            showGrid ? 'bg-blue-600 text-white' : 'hover:bg-slate-700 text-slate-300'
          }`}
          title="Toggle Grid Lines"
        >
          <Grid className="w-3.5 h-3.5" />
        </button>

        <button
          onClick={onTogglePreview}
          className={`p-1.5 rounded transition-colors ${
            isPreviewMode ? 'bg-indigo-600 text-white' : 'hover:bg-slate-700 text-slate-300'
          }`}
          title="Toggle Preview Mode"
        >
          <Eye className="w-3.5 h-3.5" />
        </button>
      </div>

      {/* Right Group: Upload Background, Save & Auto-Generate */}
      <div className="flex items-center space-x-2">
        <label className="inline-flex items-center space-x-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 px-3 py-1.5 rounded-lg cursor-pointer transition-colors font-medium" title="Upload background image, PDF, or OTT template">
          <Upload className="w-3.5 h-3.5 text-slate-400" />
          <span>Upload Background</span>
          <input
            type="file"
            accept="image/png,image/jpeg,image/webp,application/pdf,.pdf,.ott,.odt,application/vnd.oasis.opendocument.text-template,application/vnd.oasis.opendocument.text"
            onChange={onUploadBackground}
            className="hidden"
          />
        </label>

        <button
          onClick={onSave}
          className="inline-flex items-center space-x-1.5 bg-slate-800 hover:bg-slate-700 text-slate-100 border border-slate-700 px-3 py-1.5 rounded-lg font-medium transition-colors"
        >
          <Save className="w-3.5 h-3.5 text-blue-400" />
          <span>Save</span>
        </button>

        <button
          onClick={onGenerateClick}
          className="inline-flex items-center space-x-1.5 bg-emerald-600 hover:bg-emerald-500 text-white font-bold px-3.5 py-1.5 rounded-lg shadow-sm transition-all"
        >
          <Award className="w-3.5 h-3.5" />
          <span>Generate Certificates</span>
        </button>
      </div>
    </div>
  );
};
