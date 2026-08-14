import React, { useState } from 'react';
import {
  GeneratedCertificate,
  CertificateTemplate,
  CanvasElement,
  BrandingSettings,
} from '../types';
import { processTextTemplate } from '../lib/certificateEngine';
import { Edit3, Check, Save, RotateCcw, AlertTriangle, Layers } from 'lucide-react';

interface IndividualCertificateEditorModalProps {
  cert: GeneratedCertificate;
  template: CertificateTemplate;
  branding: BrandingSettings;
  onSaveCertificate: (updatedCert: GeneratedCertificate) => void;
  onSaveAsMaster?: (updatedTemplate: CertificateTemplate) => void;
  onClose: () => void;
}

export const IndividualCertificateEditorModal: React.FC<IndividualCertificateEditorModalProps> = ({
  cert,
  template,
  branding,
  onSaveCertificate,
  onSaveAsMaster,
  onClose,
}) => {
  const [recipientName, setRecipientName] = useState(cert.recipientName);
  const [dataFields, setDataFields] = useState<Record<string, string>>({ ...cert.data });

  // Custom visual elements override for this specific certificate
  const [customElements, setCustomElements] = useState<CanvasElement[]>(
    cert.customElementsOverridden || template.elements
  );

  const [selectedElId, setSelectedElId] = useState<string | null>(null);

  const handleFieldChange = (key: string, value: string) => {
    const updated = { ...dataFields, [key]: value };
    setDataFields(updated);
    if (key === 'NAME' || key === 'Name') {
      setRecipientName(value);
    }
  };

  const handleSaveIndividualOnly = () => {
    const updatedCert: GeneratedCertificate = {
      ...cert,
      recipientName,
      data: dataFields,
      customElementsOverridden: customElements,
      updatedAt: new Date().toISOString(),
    };
    onSaveCertificate(updatedCert);
    onClose();
  };

  const selectedEl = customElements.find((el) => el.id === selectedElId) || null;

  return (
    <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl max-w-4xl w-full max-h-[90vh] flex flex-col shadow-2xl border border-slate-200 overflow-hidden">
        
        {/* Header */}
        <div className="p-4 border-b border-slate-200 bg-slate-50 flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <Edit3 className="w-5 h-5 text-indigo-600" />
            <div>
              <h3 className="text-sm font-bold text-slate-900">
                Edit Certificate: <span className="text-indigo-600 font-mono">{cert.certificateNumber}</span>
              </h3>
              <p className="text-xs text-slate-500">
                Editing only <span className="font-semibold text-slate-700">{recipientName}</span>'s certificate. Does not affect master template unless chosen.
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="text-slate-400 hover:text-slate-600 text-lg font-bold px-2"
          >
            ✕
          </button>
        </div>

        {/* Content Body */}
        <div className="p-6 overflow-y-auto flex-1 grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Left: Editable Recipient Fields */}
          <div className="space-y-4">
            <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wider text-slate-400 border-b border-slate-100 pb-2">
              Personalized Field Values
            </h4>

            <div className="space-y-3">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Recipient Name
                </label>
                <input
                  type="text"
                  value={recipientName}
                  onChange={(e) => {
                    setRecipientName(e.target.value);
                    handleFieldChange('NAME', e.target.value);
                  }}
                  className="w-full border border-slate-300 rounded-lg px-3 py-1.5 text-xs font-bold text-slate-900 focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              {Object.keys(dataFields)
                .filter((key) => key !== 'NAME' && key !== 'CERTIFICATE_ID')
                .map((key) => (
                  <div key={key}>
                    <label className="block text-xs font-semibold text-slate-600 mb-1 capitalize">
                      {key.replace(/_/g, ' ')}
                    </label>
                    <input
                      type="text"
                      value={dataFields[key] || ''}
                      onChange={(e) => handleFieldChange(key, e.target.value)}
                      className="w-full border border-slate-300 rounded-lg px-3 py-1.5 text-xs focus:ring-2 focus:ring-indigo-500"
                    />
                  </div>
                ))}
            </div>
          </div>

          {/* Right: Live Preview & Canvas Adjustments */}
          <div className="bg-slate-900 p-4 rounded-xl flex flex-col items-center justify-center text-white relative">
            <div className="text-[10px] font-mono font-bold text-indigo-400 bg-indigo-950 px-2 py-0.5 rounded border border-indigo-800 mb-3">
              LIVE RECIPIENT PREVIEW
            </div>

            {/* Scaled Preview Sheet */}
            <div
              className="bg-white text-slate-900 rounded shadow-lg overflow-hidden relative"
              style={{
                width: '100%',
                aspectRatio: `${template.size.pxWidth} / ${template.size.pxHeight}`,
                maxHeight: '260px',
              }}
            >
              {customElements.map((el) => {
                if (el.type === 'text' || el.type === 'dynamic_field') {
                  const renderedText = processTextTemplate(
                    el.text || '',
                    dataFields,
                    branding,
                    cert.certificateNumber
                  );

                  return (
                    <div
                      key={el.id}
                      className="absolute text-center truncate"
                      style={{
                        left: `${(el.x / template.size.pxWidth) * 100}%`,
                        top: `${(el.y / template.size.pxHeight) * 100}%`,
                        width: `${(el.width / template.size.pxWidth) * 100}%`,
                        height: `${(el.height / template.size.pxHeight) * 100}%`,
                        fontSize: `${(el.fontSize || 16) * 0.35}px`,
                        fontWeight: el.fontWeight || 'normal',
                        fontFamily: el.fontFamily || 'Bebas Kai',
                        color: el.color || '#000000',
                      }}
                    >
                      {renderedText}
                    </div>
                  );
                }
                return null;
              })}
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-slate-200 bg-slate-50 flex items-center justify-between">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-200 rounded-lg"
          >
            Cancel
          </button>

          <button
            type="button"
            onClick={handleSaveIndividualOnly}
            className="px-5 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold rounded-xl shadow-md flex items-center space-x-1.5"
          >
            <Check className="w-4 h-4" />
            <span>Save Individual Changes</span>
          </button>
        </div>
      </div>
    </div>
  );
};
