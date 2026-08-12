import React, { useState, useEffect } from 'react';
import {
  Award,
  Sparkles,
  CheckCircle2,
  XCircle,
  AlertCircle,
  ArrowRight,
  RefreshCw,
  Layers,
} from 'lucide-react';
import {
  CertificateTemplate,
  Dataset,
  GeneratedCertificate,
  BrandingSettings,
  GenerationJobProgress,
} from '../types';

interface BulkGeneratorModalProps {
  template: CertificateTemplate;
  dataset: Dataset;
  mapping: Record<string, string>;
  branding: BrandingSettings;
  existingCertificates: GeneratedCertificate[];
  onComplete: (generatedCerts: GeneratedCertificate[]) => void;
  onClose: () => void;
}

export const BulkGeneratorModal: React.FC<BulkGeneratorModalProps> = ({
  template,
  dataset,
  mapping,
  branding,
  existingCertificates,
  onComplete,
  onClose,
}) => {
  const [progress, setProgress] = useState<GenerationJobProgress>({
    total: dataset.rows.length,
    current: 0,
    successful: 0,
    failed: 0,
    isGenerating: false,
    errors: [],
  });

  const [generatedList, setGeneratedList] = useState<GeneratedCertificate[]>([]);
  const [isFinished, setIsFinished] = useState(false);

  const [currentRecipient, setCurrentRecipient] = useState<string>('');

  const startGeneration = async () => {
    setProgress({
      total: dataset.rows.length,
      current: 0,
      successful: 0,
      failed: 0,
      isGenerating: true,
      errors: [],
    });
    setGeneratedList([]);
    setIsFinished(false);

    const now = new Date().toISOString();
    const newCerts: GeneratedCertificate[] = [];
    const errors: GenerationJobProgress['errors'] = [];

    // Calculate starting certificate ID number
    let startingNum = branding.idStartingNumber || 1;
    // Find highest existing ID if any
    existingCertificates.forEach((c) => {
      const match = c.certificateNumber.match(/(\d+)$/);
      if (match) {
        const num = parseInt(match[1], 10);
        if (num >= startingNum) startingNum = num + 1;
      }
    });

    for (let i = 0; i < dataset.rows.length; i++) {
      const row = dataset.rows[i];

      // Format Certificate ID e.g. BSR-2026-0001
      const idNumStr = String(startingNum + i).padStart(branding.idNumberLength || 4, '0');
      const certNumber = `${branding.idPrefix || 'BSR-2026-'}${idNumStr}`;

      // Build data map for template replacement
      const mappedData: Record<string, string> = {
        CERTIFICATE_ID: certNumber,
      };

      // Fill in mapped field values from dataset row
      Object.keys(mapping).forEach((fieldKey) => {
        const colName = mapping[fieldKey];
        if (colName && row[colName] !== undefined) {
          mappedData[fieldKey] = row[colName];
        }
      });

      // Also copy unmapped dataset columns into data dictionary
      Object.keys(row).forEach((key) => {
        if (!key.startsWith('_')) {
          mappedData[key] = row[key];
        }
      });

      const recipientName = mappedData['NAME'] || mappedData['Name'] || row['Name'] || row['NAME'] || Object.values(row).find(v => typeof v === 'string' && v.trim().length > 0 && !v.startsWith('row_')) || '';
      setCurrentRecipient(recipientName);

      if (!recipientName.trim()) {
        errors.push({
          row: i + 1,
          name: 'Empty Name',
          message: `Row #${i + 1} does not have a valid recipient name in column.`,
        });
        setProgress((prev) => ({
          ...prev,
          current: i + 1,
          failed: prev.failed + 1,
          errors: [...prev.errors, errors[errors.length - 1]],
        }));
      } else {
        const cert: GeneratedCertificate = {
          id: `cert_${Date.now()}_${i}`,
          projectId: template.projectId,
          templateId: template.id,
          certificateNumber: certNumber,
          recipientName,
          data: mappedData,
          status: 'generated',
          createdAt: now,
          updatedAt: now,
        };

        newCerts.push(cert);
        setProgress((prev) => ({
          ...prev,
          current: i + 1,
          successful: prev.successful + 1,
        }));
      }

      // Small delay to allow UI progress bar updates
      if (i % 5 === 0) {
        await new Promise((resolve) => setTimeout(resolve, 15));
      }
    }

    setGeneratedList(newCerts);
    setProgress((prev) => ({ ...prev, isGenerating: false }));
    setIsFinished(true);
  };

  const percentage = progress.total > 0 ? Math.round((progress.current / progress.total) * 100) : 0;

  return (
    <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl max-w-xl w-full p-6 shadow-2xl border border-slate-200 space-y-6">
        
        {/* Header */}
        <div className="flex items-center space-x-3 pb-4 border-b border-slate-100">
          <div className="p-2.5 bg-gradient-to-tr from-blue-600 to-indigo-600 rounded-xl text-white shadow-sm">
            <Award className="w-6 h-6" />
          </div>
          <div>
            <h3 className="text-base font-bold text-slate-900">Automatic Certificate Generation</h3>
            <p className="text-xs text-slate-500">
              Template: <span className="font-semibold text-slate-700">{template.name}</span> ({dataset.rows.length} rows)
            </p>
          </div>
        </div>

        {/* Status / Progress Indicator */}
        {!progress.isGenerating && !isFinished ? (
          <div className="space-y-4 text-center py-4">
            <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 text-left text-xs space-y-2">
              <div className="flex justify-between text-slate-700 font-semibold">
                <span>Total Recipients to Process:</span>
                <span className="font-bold text-slate-900">{dataset.rows.length} Certificates</span>
              </div>
              <div className="flex justify-between text-slate-700 font-semibold">
                <span>Selected Size:</span>
                <span className="font-mono text-blue-700">{template.size.name}</span>
              </div>
              <div className="flex justify-between text-slate-700 font-semibold">
                <span>ID Sequence Start:</span>
                <span className="font-mono text-indigo-700">{branding.idPrefix}0001</span>
              </div>
            </div>

            <button
              type="button"
              onClick={startGeneration}
              className="w-full py-3 bg-emerald-600 hover:bg-emerald-500 text-white text-sm font-bold rounded-xl shadow-md transition-all flex items-center justify-center space-x-2"
            >
              <Sparkles className="w-4 h-4" />
              <span>Start Automated Bulk Generation</span>
            </button>
          </div>
        ) : (
          <div className="space-y-5">
            {/* Progress Bar */}
            <div className="space-y-2">
              <div className="flex items-center justify-between text-xs font-bold text-slate-800">
                <span>
                  {progress.isGenerating ? 'Generating Certificates...' : 'Generation Complete!'}
                </span>
                <span className="font-mono text-blue-600">{percentage}%</span>
              </div>

              <div className="w-full bg-slate-100 rounded-full h-3 overflow-hidden border border-slate-200">
                <div
                  className="bg-gradient-to-r from-blue-600 to-indigo-600 h-full transition-all duration-150"
                  style={{ width: `${percentage}%` }}
                />
              </div>

              <div className="flex justify-between text-[11px] font-mono text-slate-500 pt-1">
                <span>
                  Progress: {progress.current} / {progress.total}
                </span>
                {progress.isGenerating && currentRecipient && (
                  <span className="text-blue-700 font-bold truncate max-w-[150px]">
                    Current: {currentRecipient}
                  </span>
                )}
                <span className="text-emerald-600 font-bold">✓ {progress.successful} Successful</span>
                {progress.failed > 0 && (
                  <span className="text-red-600 font-bold">✕ {progress.failed} Failed</span>
                )}
              </div>
            </div>

            {/* Error Log view if any failed */}
            {progress.errors.length > 0 && (
              <div className="p-3 bg-red-50 border border-red-200 rounded-xl text-xs space-y-1 max-h-32 overflow-y-auto">
                <span className="font-bold text-red-800">Errors Encountered:</span>
                {progress.errors.map((err, idx) => (
                  <p key={idx} className="text-red-700 text-[11px]">
                    Row #{err.row}: {err.message}
                  </p>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Completion Footer */}
        {isFinished && (
          <div className="pt-4 border-t border-slate-100 flex items-center justify-between">
            <button
              type="button"
              onClick={startGeneration}
              className="px-3.5 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-lg flex items-center space-x-1"
            >
              <RefreshCw className="w-3.5 h-3.5" />
              <span>Regenerate</span>
            </button>

            <button
              type="button"
              onClick={() => {
                onComplete(generatedList);
              }}
              className="px-5 py-2.5 bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold rounded-xl shadow-md flex items-center space-x-1.5"
            >
              <span>View All Generated Certificates</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        )}
      </div>
    </div>
  );
};
