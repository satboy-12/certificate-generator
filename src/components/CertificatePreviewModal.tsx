import React, { useState, useEffect, useRef } from 'react';
import {
  Award,
  ChevronLeft,
  ChevronRight,
  Download,
  Printer,
  FileArchive,
  ZoomIn,
  ZoomOut,
  X,
  CheckCircle2,
} from 'lucide-react';
import { GeneratedCertificate, CertificateTemplate, BrandingSettings } from '../types';
import { renderCertificateToCanvas, downloadCertificatePdf } from '../lib/certificateEngine';

interface CertificatePreviewModalProps {
  initialCert: GeneratedCertificate;
  certificates: GeneratedCertificate[];
  template: CertificateTemplate;
  branding: BrandingSettings;
  onClose: () => void;
  onPrintClick: (cert: GeneratedCertificate) => void;
}

export const CertificatePreviewModal: React.FC<CertificatePreviewModalProps> = ({
  initialCert,
  certificates,
  template,
  branding,
  onClose,
  onPrintClick,
}) => {
  const [currentIndex, setCurrentIndex] = useState<number>(
    certificates.findIndex((c) => c.id === initialCert.id) >= 0
      ? certificates.findIndex((c) => c.id === initialCert.id)
      : 0
  );

  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [zoom, setZoom] = useState(0.85);

  const activeCert = certificates[currentIndex] || initialCert;

  // Render active certificate to canvas
  useEffect(() => {
    if (canvasRef.current && activeCert) {
      renderCertificateToCanvas(
        canvasRef.current,
        template,
        activeCert.data,
        activeCert.certificateNumber,
        branding,
        activeCert.customElementsOverridden
      );
    }
  }, [currentIndex, activeCert, template, branding]);

  const handlePrev = () => {
    if (currentIndex > 0) setCurrentIndex(currentIndex - 1);
  };

  const handleNext = () => {
    if (currentIndex < certificates.length - 1) setCurrentIndex(currentIndex + 1);
  };

  return (
    <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm z-50 flex flex-col h-screen w-screen text-white">
      {/* Top Header */}
      <div className="p-4 bg-slate-900 border-b border-slate-800 flex items-center justify-between shrink-0">
        <div className="flex items-center space-x-3">
          <div className="p-2 bg-blue-600 rounded-lg">
            <Award className="w-5 h-5 text-white" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-slate-100">{activeCert.recipientName}</h3>
            <p className="text-xs text-slate-400 font-mono">
              ID: {activeCert.certificateNumber} • Paper: {template.size.name}
            </p>
          </div>
        </div>

        {/* Recipient Navigation */}
        <div className="flex items-center space-x-3 bg-slate-800 px-3 py-1.5 rounded-xl border border-slate-700">
          <button
            onClick={handlePrev}
            disabled={currentIndex === 0}
            className="p-1 rounded hover:bg-slate-700 disabled:opacity-30"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>
          <span className="text-xs font-mono font-bold text-blue-400">
            {currentIndex + 1} / {certificates.length}
          </span>
          <button
            onClick={handleNext}
            disabled={currentIndex === certificates.length - 1}
            className="p-1 rounded hover:bg-slate-700 disabled:opacity-30"
          >
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>

        {/* Right Actions */}
        <div className="flex items-center space-x-2">
          <button
            onClick={() => downloadCertificatePdf(template, activeCert, branding)}
            className="px-3.5 py-1.5 bg-slate-800 hover:bg-slate-700 border border-slate-700 rounded-lg text-xs font-semibold flex items-center space-x-1.5"
          >
            <Download className="w-3.5 h-3.5 text-blue-400" />
            <span>Download PDF</span>
          </button>

          <button
            onClick={() => onPrintClick(activeCert)}
            className="px-4 py-1.5 bg-blue-600 hover:bg-blue-500 text-white rounded-lg text-xs font-bold shadow-sm flex items-center space-x-1.5"
          >
            <Printer className="w-3.5 h-3.5" />
            <span>Print Certificate</span>
          </button>

          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg ml-2"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
      </div>

      {/* Main Preview Workspace */}
      <div className="flex-1 overflow-auto p-8 flex items-center justify-center bg-slate-950">
        <div
          className="shadow-2xl rounded overflow-hidden bg-white border border-slate-700 transition-transform"
          style={{ transform: `scale(${zoom})`, transformOrigin: 'center center' }}
        >
          <canvas ref={canvasRef} className="block" />
        </div>
      </div>
    </div>
  );
};
