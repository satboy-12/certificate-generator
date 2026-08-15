import React, { useState } from 'react';
import {
  Award,
  Search,
  Filter,
  Download,
  Printer,
  Edit3,
  Eye,
  Trash2,
  CheckSquare,
  Square,
  FileArchive,
  QrCode,
  CheckCircle2,
  AlertCircle,
  MoreHorizontal,
  Layers,
} from 'lucide-react';
import { GeneratedCertificate, CertificateTemplate, BrandingSettings } from '../types';
import { downloadCertificatePdf, downloadCombinedPdf, downloadCertificatesZip } from '../lib/certificateEngine';

interface CertificateListProps {
  certificates: GeneratedCertificate[];
  template: CertificateTemplate;
  branding: BrandingSettings;
  onEditCertificate: (cert: GeneratedCertificate) => void;
  onPreviewCertificate: (cert: GeneratedCertificate) => void;
  onDeleteCertificate: (id: string) => void;
  onStatusChange: (certId: string, status: GeneratedCertificate['status']) => void;
  onOpenBulkImport: () => void;
}

export const CertificateList: React.FC<CertificateListProps> = ({
  certificates,
  template,
  branding,
  onEditCertificate,
  onPreviewCertificate,
  onDeleteCertificate,
  onStatusChange,
  onOpenBulkImport,
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());

  const [isExporting, setIsExporting] = useState(false);
  const [exportProgress, setExportProgress] = useState({ current: 0, total: 0 });

  const filteredCerts = certificates.filter((c) => {
    const matchesSearch =
      c.recipientName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      c.certificateNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
      Object.values(c.data).some((val) => String(val).toLowerCase().includes(searchTerm.toLowerCase()));

    const matchesStatus = statusFilter === 'all' || c.status === statusFilter;

    return matchesSearch && matchesStatus;
  });

  const toggleSelectAll = () => {
    if (selectedIds.size === filteredCerts.length) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(filteredCerts.map((c) => c.id)));
    }
  };

  const toggleSelectOne = (id: string) => {
    const copy = new Set(selectedIds);
    if (copy.has(id)) copy.delete(id);
    else copy.add(id);
    setSelectedIds(copy);
  };

  const selectedCertsList = certificates.filter((c) => selectedIds.has(c.id));

  // Handle bulk status change for all selected certificates
  const handleBulkStatusChange = (newStatus: GeneratedCertificate['status']) => {
    if (!newStatus || selectedIds.size === 0) return;
    selectedIds.forEach((id) => {
      onStatusChange(id, newStatus);
    });
  };

  // Export combined PDF for selected or all
  const handleDownloadCombined = async (targetList: GeneratedCertificate[]) => {
    if (targetList.length === 0) return;
    setIsExporting(true);
    setExportProgress({ current: 0, total: targetList.length });

    try {
      await downloadCombinedPdf(template, targetList, branding, (cur, tot) => {
        setExportProgress({ current: cur, total: tot });
      });
    } catch (err: any) {
      console.error('Export failed:', err);
      alert('Failed to generate combined PDF: ' + (err?.message || 'Unknown error.'));
    } finally {
      setIsExporting(false);
    }
  };

  // Export ZIP archive for selected or all
  const handleDownloadZip = async (targetList: GeneratedCertificate[]) => {
    if (targetList.length === 0) return;
    setIsExporting(true);
    setExportProgress({ current: 0, total: targetList.length });

    try {
      await downloadCertificatesZip(template, targetList, branding, (cur, tot) => {
        setExportProgress({ current: cur, total: tot });
      });
    } catch (err: any) {
      console.error('ZIP export failed:', err);
      alert('Failed to generate ZIP: ' + (err?.message || 'Unknown error.'));
    } finally {
      setIsExporting(false);
    }
  };

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      
      {/* Header & Actions Bar */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white p-5 rounded-2xl border border-slate-200 shadow-sm">
        <div>
          <div className="flex items-center space-x-2">
            <Award className="w-5 h-5 text-blue-600" />
            <h2 className="text-lg font-bold text-slate-900">Generated Certificates</h2>
            <span className="px-2.5 py-0.5 rounded-full bg-blue-100 text-blue-800 text-xs font-bold">
              {certificates.length} Total
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-0.5">
            View, edit individual recipient records, download print-ready PDFs, or export bulk ZIP archives.
          </p>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-wrap items-center gap-2">
          {certificates.length === 0 && (
            <button
              onClick={onOpenBulkImport}
              className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-bold shadow-sm transition-colors"
            >
              Import Data & Generate
            </button>
          )}

          {certificates.length > 0 && (
            <>
              <button
                onClick={() => handleDownloadCombined(selectedIds.size > 0 ? selectedCertsList : certificates)}
                disabled={isExporting}
                className="px-3.5 py-2 bg-slate-800 hover:bg-slate-700 text-white rounded-xl text-xs font-semibold shadow-xs flex items-center space-x-1.5 transition-colors disabled:opacity-50"
              >
                <Download className="w-3.5 h-3.5" />
                <span>
                  {selectedIds.size > 0
                    ? `Combined PDF (${selectedIds.size})`
                    : `Combined PDF (All ${certificates.length})`}
                </span>
              </button>

              <button
                onClick={() => handleDownloadZip(selectedIds.size > 0 ? selectedCertsList : certificates)}
                disabled={isExporting}
                className="px-3.5 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-xl text-xs font-bold shadow-xs flex items-center space-x-1.5 transition-colors disabled:opacity-50"
              >
                <FileArchive className="w-3.5 h-3.5" />
                <span>
                  {selectedIds.size > 0
                    ? `Download ZIP (${selectedIds.size})`
                    : `Download ZIP (All ${certificates.length})`}
                </span>
              </button>
            </>
          )}
        </div>
      </div>

      {/* Progress Toast during export */}
      {isExporting && (
        <div className="p-3 bg-blue-600 text-white rounded-xl shadow-md text-xs font-semibold flex items-center justify-between animate-pulse">
          <span>
            Generating High-Res PDFs... ({exportProgress.current} / {exportProgress.total})
          </span>
          <span className="font-mono">{Math.round((exportProgress.current / exportProgress.total) * 100)}%</span>
        </div>
      )}

      {/* Bulk Selection Action Bar */}
      {selectedIds.size > 0 && (
        <div className="p-4 bg-slate-900 text-white rounded-2xl shadow-lg flex flex-wrap items-center justify-between gap-3 animate-in fade-in slide-in-from-top-2 border border-slate-800">
          <div className="flex items-center space-x-3">
            <span className="bg-blue-600 text-white px-3 py-1 rounded-full text-xs font-bold flex items-center space-x-1.5 shadow-xs">
              <CheckSquare className="w-3.5 h-3.5" />
              <span>{selectedIds.size} Selected</span>
            </span>
            <span className="text-xs text-slate-400 font-medium hidden sm:inline">
              Apply bulk actions to selected certificates
            </span>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            {/* Change Status Dropdown */}
            <div className="flex items-center space-x-1.5 bg-slate-800 px-3 py-1.5 rounded-xl border border-slate-700">
              <span className="text-xs text-slate-300 font-medium">Status:</span>
              <select
                defaultValue=""
                onChange={(e) => {
                  if (e.target.value) {
                    handleBulkStatusChange(e.target.value as GeneratedCertificate['status']);
                    e.target.value = '';
                  }
                }}
                className="bg-slate-900 text-white text-xs font-semibold rounded px-2 py-1 border border-slate-600 focus:outline-none focus:ring-1 focus:ring-blue-500 cursor-pointer"
              >
                <option value="" disabled>
                  Set Status...
                </option>
                <option value="issued">📜 Mark as Issued</option>
                <option value="printed">🖨 Mark as Printed</option>
                <option value="generated">✓ Mark as Ready</option>
                <option value="revoked">⚠ Mark as Revoked</option>
              </select>
            </div>

            {/* Quick Action Status Buttons */}
            <button
              onClick={() => handleBulkStatusChange('issued')}
              className="px-3 py-1.5 bg-blue-600 hover:bg-blue-500 text-white rounded-xl text-xs font-bold shadow-xs transition-colors hidden md:inline-flex items-center space-x-1"
            >
              <span>Mark Issued</span>
            </button>

            <button
              onClick={() => handleBulkStatusChange('printed')}
              className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-bold shadow-xs transition-colors hidden md:inline-flex items-center space-x-1"
            >
              <span>Mark Printed</span>
            </button>

            {/* Clear Selection */}
            <button
              onClick={() => setSelectedIds(new Set())}
              className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white rounded-xl text-xs font-medium transition-colors ml-1"
            >
              Deselect
            </button>
          </div>
        </div>
      )}

      {/* Search & Filter Controls */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-3">
        <div className="relative w-full sm:w-72">
          <Search className="w-4 h-4 absolute left-3 top-2.5 text-slate-400" />
          <input
            type="text"
            placeholder="Search by recipient name, ID..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-9 pr-4 py-2 border border-slate-300 rounded-xl text-xs focus:ring-2 focus:ring-blue-500 bg-white"
          />
        </div>

        <div className="flex items-center space-x-3 w-full sm:w-auto justify-between sm:justify-end">
          <div className="flex items-center space-x-1 text-xs text-slate-500">
            <Filter className="w-3.5 h-3.5" />
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="bg-white border border-slate-300 rounded-lg px-2.5 py-1.5 text-xs font-medium focus:ring-2 focus:ring-blue-500"
            >
              <option value="all">All Statuses</option>
              <option value="generated">Generated / Ready</option>
              <option value="printed">Printed</option>
              <option value="issued">Issued</option>
              <option value="revoked">Revoked</option>
            </select>
          </div>

          <button
            onClick={toggleSelectAll}
            className="text-xs font-semibold text-blue-600 hover:text-blue-700"
          >
            {selectedIds.size === filteredCerts.length && filteredCerts.length > 0
              ? 'Deselect All'
              : `Select All (${filteredCerts.length})`}
          </button>
        </div>
      </div>

      {/* Certificates Data Table */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 border-b border-slate-200 text-slate-600 font-bold uppercase tracking-wider">
              <tr>
                <th className="p-3 w-10 text-center">
                  <input
                    type="checkbox"
                    checked={selectedIds.size === filteredCerts.length && filteredCerts.length > 0}
                    onChange={toggleSelectAll}
                    className="rounded border-slate-300 text-blue-600 focus:ring-blue-500 cursor-pointer"
                  />
                </th>
                <th className="p-3">Certificate ID</th>
                <th className="p-3">Recipient Name</th>
                <th className="p-3">Event / Category</th>
                <th className="p-3">Status</th>
                <th className="p-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredCerts.map((cert) => {
                const isSelected = selectedIds.has(cert.id);
                const isRevoked = cert.status === 'revoked';

                return (
                  <tr
                    key={cert.id}
                    className={`hover:bg-slate-50 transition-colors ${
                      isSelected ? 'bg-blue-50/50' : ''
                    }`}
                  >
                    <td className="p-3 text-center">
                      <input
                        type="checkbox"
                        checked={isSelected}
                        onChange={() => toggleSelectOne(cert.id)}
                        className="rounded border-slate-300 text-blue-600 focus:ring-blue-500 cursor-pointer"
                      />
                    </td>

                    <td className="p-3 font-mono font-bold text-blue-700">{cert.certificateNumber}</td>

                    <td className="p-3">
                      <span className="font-bold text-slate-900 text-sm block">{cert.recipientName}</span>
                      {cert.customElementsOverridden && (
                        <span className="text-[10px] text-amber-600 font-medium">★ Individually Edited</span>
                      )}
                    </td>

                    <td className="p-3">
                      <p className="font-medium text-slate-800">{cert.data['EVENT_NAME'] || 'Event'}</p>
                      <p className="text-[11px] text-slate-500">{cert.data['CATEGORY'] || 'Participant'}</p>
                    </td>

                    <td className="p-3">
                      <select
                        value={cert.status}
                        onChange={(e) => onStatusChange(cert.id, e.target.value as any)}
                        className={`text-[11px] font-bold px-2 py-1 rounded-full border border-transparent focus:ring-1 focus:ring-blue-500 ${
                          cert.status === 'printed'
                            ? 'bg-emerald-100 text-emerald-800'
                            : cert.status === 'revoked'
                            ? 'bg-red-100 text-red-800'
                            : 'bg-blue-100 text-blue-800'
                        }`}
                      >
                        <option value="generated">✓ Ready</option>
                        <option value="printed">🖨 Printed</option>
                        <option value="issued">📜 Issued</option>
                        <option value="revoked">⚠ Revoked</option>
                      </select>
                    </td>

                    <td className="p-3 text-right">
                      <div className="flex items-center justify-end space-x-1">
                        <button
                          onClick={() => onPreviewCertificate(cert)}
                          className="p-1.5 text-slate-600 hover:text-blue-600 hover:bg-slate-100 rounded-lg"
                          title="High-Res Preview & Print"
                        >
                          <Eye className="w-4 h-4" />
                        </button>

                        <button
                          onClick={() => onEditCertificate(cert)}
                          className="p-1.5 text-slate-600 hover:text-indigo-600 hover:bg-slate-100 rounded-lg"
                          title="Edit Individual Recipient Certificate"
                        >
                          <Edit3 className="w-4 h-4" />
                        </button>

                        <button
                          onClick={() => downloadCertificatePdf(template, cert, branding)}
                          className="p-1.5 text-slate-600 hover:text-emerald-600 hover:bg-slate-100 rounded-lg"
                          title="Download PDF"
                        >
                          <Download className="w-4 h-4" />
                        </button>

                        <button
                          onClick={() => onDeleteCertificate(cert.id)}
                          className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg"
                          title="Delete Certificate"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
