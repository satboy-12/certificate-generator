import React, { useState } from 'react';
import {
  FileSpreadsheet,
  Upload,
  Download,
  Check,
  AlertCircle,
  Plus,
  Trash2,
  Search,
  ArrowRight,
  Sparkles,
  CheckCircle2,
  User,
} from 'lucide-react';
import { Dataset, DataRow, DynamicFieldDef } from '../types';
import { parseExcelFile, downloadSampleExcelTemplate, autoDetectColumnMapping, smartDetectNameColumn } from '../lib/excelParser';

interface ImportDataModalProps {
  projectId: string;
  dynamicFields: DynamicFieldDef[];
  existingDataset?: Dataset;
  onSaveDataset: (dataset: Dataset, mappedFields: Record<string, string>) => void;
  onClose: () => void;
}

export const ImportDataModal: React.FC<ImportDataModalProps> = ({
  projectId,
  dynamicFields,
  existingDataset,
  onSaveDataset,
  onClose,
}) => {
  const [step, setStep] = useState<'upload' | 'view'>('upload');
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const [fileName, setFileName] = useState<string>(existingDataset?.fileName || '');
  const [columns, setColumns] = useState<string[]>(existingDataset?.columns || []);
  const [rows, setRows] = useState<DataRow[]>(existingDataset?.rows || []);

  const [selectedNameColumn, setSelectedNameColumn] = useState<string>('Name');
  const [mapping, setMapping] = useState<Record<string, string>>({});
  const [searchTerm, setSearchTerm] = useState('');

  // Helper to identify the best name column
  const detectNameColumn = (cols: string[]): string => {
    const nameCandidates = [
      'name',
      'recipient name',
      'participant name',
      'student name',
      'full name',
      'recipient',
      'participant',
      'full_name',
      'person_name',
    ];

    for (const candidate of nameCandidates) {
      const found = cols.find((c) => c.toLowerCase().trim() === candidate);
      if (found) return found;
    }

    // Partial match
    const partialFound = cols.find((c) => c.toLowerCase().includes('name'));
    if (partialFound) return partialFound;

    // Fallback to first column
    return cols[0] || 'Name';
  };

  // Handle spreadsheet file upload
  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setLoading(true);
    setErrorMsg(null);

    try {
      const result = await parseExcelFile(file);
      setFileName(result.fileName);
      setColumns(result.columns);
      setRows(result.rows);

      // Auto detect Name column using smart detection
      const detectedNameCol = smartDetectNameColumn(result.columns, result.rows);
      setSelectedNameColumn(detectedNameCol);

      // Auto map remaining fields without forcing user interaction
      const detectedMap = autoDetectColumnMapping(dynamicFields, result.columns);
      detectedMap['NAME'] = detectedNameCol;
      setMapping(detectedMap);

      setStep('view');
    } catch (err: any) {
      setErrorMsg(err.message || 'Failed to read spreadsheet file. Please upload a valid .xlsx or .csv file.');
    } finally {
      setLoading(false);
    }
  };

  // Update name column selection
  const handleNameColumnChange = (newCol: string) => {
    setSelectedNameColumn(newCol);
    setMapping((prev) => ({ ...prev, NAME: newCol }));
  };

  // Add a new empty row
  const handleAddRow = () => {
    const newRow: DataRow = { _rowId: `row_${Date.now()}` };
    columns.forEach((col) => {
      newRow[col] = '';
    });
    // Set default name placeholder if column exists
    if (selectedNameColumn) {
      newRow[selectedNameColumn] = 'New Recipient';
    }
    setRows([...rows, newRow]);
  };

  // Delete row
  const handleDeleteRow = (rowId: string) => {
    setRows(rows.filter((r) => r._rowId !== rowId));
  };

  // Cell edit
  const handleCellEdit = (rowId: string, col: string, value: string) => {
    setRows(
      rows.map((r) => {
        if (r._rowId === rowId) {
          return { ...r, [col]: value };
        }
        return r;
      })
    );
  };

  const handleGenerateClick = () => {
    if (rows.length === 0) {
      setErrorMsg('Recipient list cannot be empty.');
      return;
    }

    const dataset: Dataset = {
      id: existingDataset?.id || `ds_${Date.now()}`,
      projectId,
      fileName: fileName || 'participants.xlsx',
      columns: columns.length > 0 ? columns : ['Name'],
      rowCount: rows.length,
      rows,
      createdAt: existingDataset?.createdAt || new Date().toISOString(),
    };

    const finalMapping = { ...mapping, NAME: selectedNameColumn };
    onSaveDataset(dataset, finalMapping);
  };

  const filteredRows = rows.filter((r) =>
    columns.some((col) => (r[col] || '').toLowerCase().includes(searchTerm.toLowerCase()))
  );

  return (
    <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl max-w-4xl w-full max-h-[90vh] flex flex-col shadow-2xl border border-slate-200 overflow-hidden">
        
        {/* Top Header */}
        <div className="p-5 border-b border-slate-200 bg-slate-50/90 flex items-center justify-between shrink-0">
          <div>
            <div className="flex items-center gap-2">
              <FileSpreadsheet className="w-5 h-5 text-blue-600" />
              <h3 className="text-base font-bold text-slate-900">Upload Recipient Name List</h3>
            </div>
            <p className="text-xs text-slate-500 mt-0.5">
              Upload an Excel or CSV file to automatically generate personalized certificates.
            </p>
          </div>

          {/* Workflow Steps Indicator */}
          <div className="flex items-center gap-2 text-xs font-semibold">
            <span
              className={`px-3 py-1 rounded-full ${
                step === 'upload' ? 'bg-blue-600 text-white shadow-xs' : 'bg-slate-200 text-slate-700'
              }`}
            >
              1. Upload
            </span>
            <span className="text-slate-300">→</span>
            <span
              className={`px-3 py-1 rounded-full ${
                step === 'view' ? 'bg-blue-600 text-white shadow-xs' : 'bg-slate-200 text-slate-700'
              }`}
            >
              2. View & Review
            </span>
            <span className="text-slate-300">→</span>
            <span className="px-3 py-1 rounded-full bg-slate-100 text-slate-400">
              3. Generate
            </span>
          </div>
        </div>

        {/* Content Body */}
        <div className="p-6 overflow-y-auto flex-1 space-y-5">
          {errorMsg && (
            <div className="p-3 bg-red-50 border border-red-200 text-red-700 rounded-xl text-xs flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{errorMsg}</span>
            </div>
          )}

          {/* STEP 1: UPLOAD */}
          {step === 'upload' && (
            <div className="space-y-6">
              <div className="border-2 border-dashed border-slate-300 hover:border-blue-500 bg-slate-50 hover:bg-blue-50/50 rounded-2xl p-12 text-center transition-all cursor-pointer relative group">
                <input
                  type="file"
                  accept=".xlsx, .xls, .csv"
                  onChange={handleFileUpload}
                  className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                />
                <div className="space-y-3 pointer-events-none">
                  <div className="w-14 h-14 rounded-2xl bg-blue-100 text-blue-600 flex items-center justify-center mx-auto group-hover:scale-105 transition-transform shadow-xs">
                    <Upload className="w-7 h-7" />
                  </div>
                  <div>
                    <p className="text-base font-bold text-slate-800">
                      Drag & Drop Excel / CSV
                    </p>
                    <p className="text-xs text-slate-500 mt-1">or click to browse your file</p>
                  </div>
                  <div className="inline-block px-3 py-1 bg-white border border-slate-200 rounded-full text-[11px] font-mono text-slate-500 font-medium shadow-2xs">
                    XLSX • XLS • CSV
                  </div>
                </div>
              </div>

              {/* Sample Excel Helper */}
              <div className="p-4 bg-blue-50/80 border border-blue-200/80 rounded-xl flex items-center justify-between gap-4">
                <div className="space-y-0.5">
                  <h4 className="text-xs font-bold text-blue-900">Need an example recipient list?</h4>
                  <p className="text-[11px] text-blue-700">
                    Download our sample Excel template pre-formatted with recipient names and event details.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => downloadSampleExcelTemplate()}
                  className="inline-flex items-center gap-1.5 bg-blue-600 hover:bg-blue-700 text-white font-semibold text-xs px-3.5 py-2 rounded-lg shadow-xs transition-colors shrink-0"
                >
                  <Download className="w-3.5 h-3.5" />
                  <span>Download Sample</span>
                </button>
              </div>
            </div>
          )}

          {/* STEP 2: VIEW RECIPIENT NAMES */}
          {step === 'view' && (
            <div className="space-y-4">
              {/* File Info & Auto-Detected Column Badge */}
              <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl flex flex-wrap items-center justify-between gap-3">
                <div className="flex items-center gap-4">
                  <div>
                    <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">File</span>
                    <p className="text-xs font-bold text-slate-800 font-mono">{fileName}</p>
                  </div>

                  <div className="h-6 w-px bg-slate-200" />

                  <div>
                    <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">Recipients Found</span>
                    <p className="text-xs font-bold text-emerald-600 font-mono">{rows.length} Recipients</p>
                  </div>
                </div>

                {/* Detected Name Column Selector */}
                <div className="flex items-center gap-2 bg-white px-3 py-1.5 rounded-lg border border-slate-200 shadow-2xs">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                  <span className="text-xs text-slate-600 font-medium">Recipient Name Column:</span>
                  <select
                    value={selectedNameColumn}
                    onChange={(e) => handleNameColumnChange(e.target.value)}
                    className="bg-slate-100 text-xs font-bold text-slate-800 rounded px-2 py-1 border border-slate-300 focus:outline-none focus:ring-1 focus:ring-blue-500"
                  >
                    {columns.map((col) => (
                      <option key={col} value={col}>
                        {col}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Table Controls */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-1">
                <div className="flex items-center gap-2">
                  <div className="relative">
                    <Search className="w-3.5 h-3.5 absolute left-2.5 top-2.5 text-slate-400" />
                    <input
                      type="text"
                      placeholder="Search recipient names..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="pl-8 pr-3 py-1.5 border border-slate-300 rounded-lg text-xs w-56 focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                </div>

                <button
                  type="button"
                  onClick={handleAddRow}
                  className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-xs font-semibold flex items-center gap-1 transition-colors"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Add Name</span>
                </button>
              </div>

              {/* Recipients Table */}
              <div className="border border-slate-200 rounded-xl overflow-x-auto max-h-80 shadow-2xs">
                <table className="w-full text-left text-xs border-collapse">
                  <thead className="bg-slate-100 text-slate-700 sticky top-0 font-bold border-b border-slate-200">
                    <tr>
                      <th className="p-2.5 border-r border-slate-200 w-12 text-center">#</th>
                      <th className="p-2.5 border-r border-slate-200 min-w-[200px] bg-blue-50/80 text-blue-900">
                        Recipient Name ({selectedNameColumn})
                      </th>
                      {columns
                        .filter((col) => col !== selectedNameColumn)
                        .map((col) => (
                          <th key={col} className="p-2.5 border-r border-slate-200 min-w-[130px]">
                            {col}
                          </th>
                        ))}
                      <th className="p-2.5 w-12 text-center">Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-200">
                    {filteredRows.length === 0 ? (
                      <tr>
                        <td colSpan={columns.length + 2} className="p-8 text-center text-slate-400">
                          No recipient names found matching search.
                        </td>
                      </tr>
                    ) : (
                      filteredRows.map((row, idx) => (
                        <tr key={row._rowId} className="hover:bg-slate-50 transition-colors">
                          <td className="p-2 border-r border-slate-200 text-center text-slate-400 font-mono text-[11px]">
                            {idx + 1}
                          </td>
                          <td className="p-1 border-r border-slate-200 bg-blue-50/30">
                            <input
                              type="text"
                              value={row[selectedNameColumn] || ''}
                              onChange={(e) => handleCellEdit(row._rowId, selectedNameColumn, e.target.value)}
                              className="w-full bg-transparent px-2 py-1 text-xs font-bold text-slate-900 focus:bg-white focus:ring-1 focus:ring-blue-500 rounded"
                            />
                          </td>
                          {columns
                            .filter((col) => col !== selectedNameColumn)
                            .map((col) => (
                              <td key={col} className="p-1 border-r border-slate-200">
                                <input
                                  type="text"
                                  value={row[col] || ''}
                                  onChange={(e) => handleCellEdit(row._rowId, col, e.target.value)}
                                  className="w-full bg-transparent px-1.5 py-1 text-xs focus:bg-white focus:ring-1 focus:ring-blue-500 rounded"
                                />
                              </td>
                            ))}
                          <td className="p-1 text-center">
                            <button
                              onClick={() => handleDeleteRow(row._rowId)}
                              className="p-1 text-slate-400 hover:text-red-600 rounded"
                              title="Delete name"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>

        {/* Footer Actions */}
        <div className="p-4 border-t border-slate-200 bg-slate-50 flex items-center justify-between shrink-0">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-200 rounded-lg transition-colors"
          >
            Cancel
          </button>

          <div className="flex items-center gap-2">
            {step === 'view' && (
              <button
                type="button"
                onClick={() => setStep('upload')}
                className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-200 rounded-lg transition-colors"
              >
                Re-upload File
              </button>
            )}

            {step === 'view' && (
              <button
                type="button"
                onClick={handleGenerateClick}
                className="px-6 py-2.5 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold rounded-xl shadow-md transition-all flex items-center gap-2"
              >
                <Sparkles className="w-4 h-4" />
                <span>Generate {rows.length} Certificates</span>
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

