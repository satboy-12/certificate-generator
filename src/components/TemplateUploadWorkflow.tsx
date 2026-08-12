import React, { useState, useRef, useEffect } from 'react';
import {
  Upload,
  FileSpreadsheet,
  CheckCircle2,
  AlertCircle,
  ArrowRight,
  ArrowLeft,
  Sparkles,
  Download,
  Printer,
  Eye,
  Edit2,
  Trash2,
  Plus,
  RefreshCw,
  Search,
  FileType,
  Layers,
  Check,
  Award,
  Move,
  Type,
  Palette,
  AlignLeft,
  AlignCenter,
  AlignRight,
} from 'lucide-react';
import {
  Project,
  CertificateTemplate,
  Dataset,
  DataRow,
  GeneratedCertificate,
  CanvasElement,
  BrandingSettings,
} from '../types';
import { parseExcelFile } from '../lib/excelParser';
import { convertPdfToImageDataUrl } from '../lib/pdfHelper';
import { SEVENTH_SENSE_MASTER_ORIGINAL_BACKGROUND_SVG } from '../constants/defaultTemplates';
import {
  renderCertificateToCanvas,
  downloadCertificatePdf,
  downloadCombinedPdf,
  downloadCertificatesZip,
  createPdfFromTemplate,
} from '../lib/certificateEngine';
import { saveAs } from 'file-saver';
import JSZip from 'jszip';

interface TemplateUploadWorkflowProps {
  currentProject: Project;
  branding: BrandingSettings;
  onSaveTemplate: (template: CertificateTemplate) => void;
  onSaveDataset: (dataset: Dataset) => void;
  onSaveCertificates: (certs: GeneratedCertificate[]) => void;
  onNavigateTab: (tab: any) => void;
}

export type WorkflowStep =
  | 'upload_template'
  | 'preview_template'
  | 'position_name'
  | 'upload_names'
  | 'view_names'
  | 'preview_first'
  | 'generating'
  | 'view_generated';

export const TemplateUploadWorkflow: React.FC<TemplateUploadWorkflowProps> = ({
  currentProject,
  branding,
  onSaveTemplate,
  onSaveDataset,
  onSaveCertificates,
  onNavigateTab,
}) => {
  const [step, setStep] = useState<WorkflowStep>('upload_template');

  // Master Template State
  const [templateFile, setTemplateFile] = useState<File | null>(null);
  const [templateDataUrl, setTemplateDataUrl] = useState<string | null>(null);
  const [templateDetails, setTemplateDetails] = useState<{
    fileName: string;
    fileType: string;
    fileSizeStr: string;
    width: number;
    height: number;
    orientation: 'landscape' | 'portrait';
    paperSizeName: string;
  } | null>(null);

  // Name position state over master template
  const [namePosition, setNamePosition] = useState<{
    x: number; // percentage or px
    y: number;
    width: number;
    height: number;
    fontFamily: string;
    fontSize: number;
    fontWeight: 'normal' | 'bold' | '800' | '900';
    fontStyle: 'normal' | 'italic';
    color: string;
    align: 'center' | 'left' | 'right';
  }>({
    x: 197,
    y: 340,
    width: 400,
    height: 50,
    fontFamily: 'serif',
    fontSize: 28,
    fontWeight: 'bold',
    fontStyle: 'normal',
    color: '#0e1838',
    align: 'center',
  });

  // Name List State
  const [nameListFile, setNameListFile] = useState<File | null>(null);
  const [columns, setColumns] = useState<string[]>([]);
  const [rows, setRows] = useState<DataRow[]>([]);
  const [selectedNameCol, setSelectedNameCol] = useState<string>('Name');
  const [searchTerm, setSearchTerm] = useState('');

  // Generation state
  const [genProgress, setGenProgress] = useState<{
    current: number;
    total: number;
    currentName: string;
    isFinished: boolean;
  }>({
    current: 0,
    total: 0,
    currentName: '',
    isFinished: false,
  });

  const [generatedCerts, setGeneratedCerts] = useState<GeneratedCertificate[]>([]);

  // Preview & Editing modals
  const [previewCert, setPreviewCert] = useState<GeneratedCertificate | null>(null);
  const [editingCert, setEditingCert] = useState<GeneratedCertificate | null>(null);

  // Canvas refs for preview
  const firstPreviewCanvasRef = useRef<HTMLCanvasElement | null>(null);
  const singlePreviewCanvasRef = useRef<HTMLCanvasElement | null>(null);

  // Common Name column candidates
  const detectNameColumn = (cols: string[]): string => {
    const candidates = [
      'name',
      'recipient name',
      'participant name',
      'student name',
      'full name',
      'recipient',
      'participant',
      'full_name',
    ];
    for (const cand of candidates) {
      const found = cols.find((c) => c.toLowerCase().trim() === cand);
      if (found) return found;
    }
    const partial = cols.find((c) => c.toLowerCase().includes('name'));
    if (partial) return partial;
    return cols[0] || 'Name';
  };

  const [isProcessingTemplate, setIsProcessingTemplate] = useState(false);

  // 1. Handle Master Template File Upload
  const handleTemplateUpload = async (file: File) => {
    if (!file) return;

    const isPdf = file.type === 'application/pdf' || file.name.toLowerCase().endsWith('.pdf');
    const fileSizeMB = (file.size / (1024 * 1024)).toFixed(2);

    setIsProcessingTemplate(true);
    setTemplateFile(file);

    try {
      if (isPdf) {
        const result = await convertPdfToImageDataUrl(file);
        setTemplateDataUrl(result.dataUrl);
        setTemplateDetails({
          fileName: file.name,
          fileType: 'PDF Document',
          fileSizeStr: `${fileSizeMB} MB`,
          width: result.width,
          height: result.height,
          orientation: result.orientation,
          paperSizeName: result.paperSizeName,
        });

        setNamePosition((prev) => ({
          ...prev,
          x: Math.round(result.width / 2 - 200),
          y: Math.round(result.height * 0.35),
          width: 400,
          height: 60,
        }));

        setStep('preview_template');
      } else {
        const reader = new FileReader();
        reader.onload = (e) => {
          const resultUrl = e.target?.result as string;
          setTemplateDataUrl(resultUrl);

          const img = new Image();
          img.onload = () => {
            const w = img.width || 794;
            const h = img.height || 1123;
            const isLandscape = w > h;
            const orientation = isLandscape ? 'landscape' : 'portrait';

            setTemplateDetails({
              fileName: file.name,
              fileType: file.type ? file.type.split('/')[1]?.toUpperCase() || 'IMAGE' : 'IMAGE',
              fileSizeStr: `${fileSizeMB} MB`,
              width: w,
              height: h,
              orientation,
              paperSizeName: isLandscape ? 'A4 Landscape (297 × 210 mm)' : 'A4 Portrait (210 × 297 mm)',
            });

            setNamePosition((prev) => ({
              ...prev,
              x: Math.round(w / 2 - 200),
              y: Math.round(h * 0.35),
              width: 400,
              height: 60,
            }));

            setStep('preview_template');
          };

          img.onerror = () => {
            setTemplateDataUrl(SEVENTH_SENSE_MASTER_ORIGINAL_BACKGROUND_SVG);
            setTemplateDetails({
              fileName: file.name,
              fileType: 'IMAGE',
              fileSizeStr: `${fileSizeMB} MB`,
              width: 794,
              height: 1123,
              orientation: 'portrait',
              paperSizeName: 'A4 Portrait (210 × 297 mm)',
            });
            setStep('preview_template');
          };

          img.src = resultUrl;
        };
        reader.readAsDataURL(file);
      }
    } catch (err) {
      console.error('Failed to convert template file:', err);
      setTemplateDataUrl(SEVENTH_SENSE_MASTER_ORIGINAL_BACKGROUND_SVG);
      setTemplateDetails({
        fileName: file.name,
        fileType: 'PDF Document',
        fileSizeStr: `${fileSizeMB} MB`,
        width: 794,
        height: 1123,
        orientation: 'portrait',
        paperSizeName: 'A4 Portrait Master',
      });
      setStep('preview_template');
    } finally {
      setIsProcessingTemplate(false);
    }
  };

  // 2. Handle Name List Excel / CSV Upload
  const handleNameListUpload = async (file: File) => {
    if (!file) return;
    try {
      const result = await parseExcelFile(file);
      setNameListFile(file);
      setColumns(result.columns);
      setRows(result.rows); // Order strictly preserved

      const detected = detectNameColumn(result.columns);
      setSelectedNameCol(detected);

      setStep('view_names');
    } catch (err: any) {
      alert(err.message || 'Failed to read name list spreadsheet file.');
    }
  };

  // Helper to build active CertificateTemplate object from uploaded master
  const buildActiveTemplateObject = (): CertificateTemplate => {
    const w = templateDetails?.width || 794;
    const h = templateDetails?.height || 1123;
    const orientation = templateDetails?.orientation || 'portrait';
    const activeBgUrl = templateDataUrl || SEVENTH_SENSE_MASTER_ORIGINAL_BACKGROUND_SVG;

    const nameElement: CanvasElement = {
      id: 'el_name_slot',
      type: 'dynamic_field',
      name: 'Recipient Name',
      dynamicFieldKey: 'NAME',
      x: namePosition.x,
      y: namePosition.y,
      width: namePosition.width,
      height: namePosition.height,
      rotation: 0,
      opacity: 1,
      zIndex: 10,
      text: '{{NAME}}',
      fontFamily: namePosition.fontFamily,
      fontSize: namePosition.fontSize,
      fontWeight: namePosition.fontWeight,
      fontStyle: namePosition.fontStyle,
      color: namePosition.color,
      align: namePosition.align,
    };

    return {
      id: `tpl_master_${currentProject.id}`,
      projectId: currentProject.id,
      name: templateDetails?.fileName || 'Master Certificate Template',
      size: {
        name: templateDetails?.paperSizeName || 'A4 Master',
        width: orientation === 'landscape' ? 297 : 210,
        height: orientation === 'landscape' ? 210 : 297,
        unit: 'mm',
        pxWidth: w,
        pxHeight: h,
        orientation,
      },
      backgroundColor: '#ffffff',
      backgroundUrl: activeBgUrl,
      elements: [nameElement],
      dynamicFields: [{ key: 'NAME', label: 'Recipient Name', defaultValue: 'Sathya Sai JS' }],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
  };

  // 3. Render First Certificate Preview when step is 'preview_first'
  useEffect(() => {
    if (step === 'preview_first' && firstPreviewCanvasRef.current && rows.length > 0) {
      const activeTpl = buildActiveTemplateObject();
      const firstRow = rows[0];
      const firstName = firstRow[selectedNameCol] || 'Sathya Sai JS';
      const sampleData = { NAME: firstName };

      renderCertificateToCanvas(
        firstPreviewCanvasRef.current,
        activeTpl,
        sampleData,
        'SSWR/2026/0001',
        branding
      );
    }
  }, [step, namePosition, rows, selectedNameCol]);

  // 4. Start Sequential Ordered Bulk Generation
  const handleStartGeneration = async () => {
    if (rows.length === 0) return;

    setStep('generating');
    const total = rows.length;
    setGenProgress({ current: 0, total, currentName: rows[0][selectedNameCol] || '', isFinished: false });

    const activeTpl = buildActiveTemplateObject();
    onSaveTemplate(activeTpl);

    // Save Dataset
    const newDataset: Dataset = {
      id: `ds_${Date.now()}`,
      projectId: currentProject.id,
      fileName: nameListFile?.name || 'recipients.xlsx',
      columns,
      rowCount: total,
      rows,
      createdAt: new Date().toISOString(),
    };
    onSaveDataset(newDataset);

    const generatedList: GeneratedCertificate[] = [];

    for (let i = 0; i < total; i++) {
      const row = rows[i];
      const recipientName = row[selectedNameCol] || `Recipient ${i + 1}`;
      const certSeqNum = String(i + 1).padStart(4, '0');
      const certNumber = `SSWR/2026/${certSeqNum}`;

      const rowData: Record<string, string> = { ...row, NAME: recipientName };

      const certObj: GeneratedCertificate = {
        id: `cert_${Date.now()}_${i + 1}`,
        projectId: currentProject.id,
        templateId: activeTpl.id,
        certificateNumber: certNumber,
        recipientName,
        data: rowData,
        status: 'generated',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };

      generatedList.push(certObj);

      setGenProgress({
        current: i + 1,
        total,
        currentName: recipientName,
        isFinished: i + 1 === total,
      });

      // Brief delay so progress bar updates smoothly
      await new Promise((r) => setTimeout(r, 40));
    }

    setGeneratedCerts(generatedList);
    onSaveCertificates(generatedList);
    setStep('view_generated');
  };

  // Add new name to list
  const handleAddNameRow = () => {
    const newRow: DataRow = {
      _rowId: `row_${Date.now()}`,
      [selectedNameCol]: 'New Recipient',
    };
    setRows([...rows, newRow]);
  };

  // Edit cell name
  const handleEditNameCell = (rowId: string, val: string) => {
    setRows(
      rows.map((r) => (r._rowId === rowId ? { ...r, [selectedNameCol]: val } : r))
    );
  };

  // Delete row
  const handleDeleteRow = (rowId: string) => {
    setRows(rows.filter((r) => r._rowId !== rowId));
  };

  // Download ZIP with filenames preserving Excel order
  const handleDownloadZip = async () => {
    if (generatedCerts.length === 0) return;

    const activeTpl = buildActiveTemplateObject();
    const zip = new JSZip();
    const folder = zip.folder('Certificates');

    for (let i = 0; i < generatedCerts.length; i++) {
      const cert = generatedCerts[i];
      const rowNumStr = String(i + 1).padStart(3, '0');
      const safeName = cert.recipientName.replace(/[^a-zA-Z0-9]/g, '-');
      const filename = `${rowNumStr}-${safeName}.pdf`;

      const { doc } = await createPdfFromTemplate(
        activeTpl,
        cert.data,
        cert.certificateNumber,
        branding,
        cert.customElementsOverridden
      );

      const arrayBuffer = doc.output('arraybuffer');
      folder?.file(filename, arrayBuffer);
    }

    const content = await zip.generateAsync({ type: 'blob' });
    saveAs(content, `${currentProject.name}_Certificates_${Date.now()}.zip`);
  };

  // Filtered rows for View Names step
  const filteredRows = rows.filter((r) => {
    const val = r[selectedNameCol] || '';
    return val.toLowerCase().includes(searchTerm.toLowerCase());
  });

  return (
    <div className="p-6 max-w-6xl mx-auto space-y-6">
      {/* Workflow Step Tracker Bar */}
      <div className="bg-slate-900 text-white p-4 rounded-2xl shadow-md border border-slate-800 flex items-center justify-between overflow-x-auto">
        <div className="flex items-center space-x-2 shrink-0">
          <div className="w-8 h-8 rounded-full bg-blue-600 flex items-center justify-center font-bold text-xs">
            SS
          </div>
          <div>
            <div className="text-xs font-bold text-slate-100">Certificate Generation Workflow</div>
            <div className="text-[10px] text-slate-400">
              {step === 'upload_template' && 'Step 1: Upload Master Certificate Template'}
              {step === 'preview_template' && 'Step 2: Preview Master Template'}
              {step === 'position_name' && 'Step 3: Set Recipient Name Position'}
              {step === 'upload_names' && 'Step 4: Upload Recipient Name List'}
              {step === 'view_names' && 'Step 5: View Recipient Name List (Excel Order Preserved)'}
              {step === 'preview_first' && 'Step 6: Preview First Certificate'}
              {step === 'generating' && 'Step 7: Generating Certificates'}
              {step === 'view_generated' && 'Step 8 & 9: View & Download Certificates'}
            </div>
          </div>
        </div>

        {/* Step Indicators */}
        <div className="hidden md:flex items-center space-x-1.5 text-xs font-medium text-slate-400">
          <span className={`px-2.5 py-1 rounded-md ${step === 'upload_template' ? 'bg-blue-600 text-white font-bold' : 'bg-slate-800'}`}>1. Upload Template</span>
          <span>→</span>
          <span className={`px-2.5 py-1 rounded-md ${step === 'preview_template' || step === 'position_name' ? 'bg-blue-600 text-white font-bold' : 'bg-slate-800'}`}>2. Preview & Position</span>
          <span>→</span>
          <span className={`px-2.5 py-1 rounded-md ${step === 'upload_names' || step === 'view_names' ? 'bg-blue-600 text-white font-bold' : 'bg-slate-800'}`}>3. Name List</span>
          <span>→</span>
          <span className={`px-2.5 py-1 rounded-md ${step === 'preview_first' || step === 'generating' ? 'bg-blue-600 text-white font-bold' : 'bg-slate-800'}`}>4. Preview & Generate</span>
          <span>→</span>
          <span className={`px-2.5 py-1 rounded-md ${step === 'view_generated' ? 'bg-blue-600 text-white font-bold' : 'bg-slate-800'}`}>5. Download & Print</span>
        </div>
      </div>

      {/* STEP 1: UPLOAD CERTIFICATE TEMPLATE */}
      {step === 'upload_template' && (
        <div className="bg-white rounded-2xl border border-slate-200 p-8 shadow-sm space-y-6">
          <div className="text-center max-w-xl mx-auto space-y-2">
            <h2 className="text-2xl font-black text-slate-900 tracking-tight">
              Upload Certificate Template
            </h2>
            <p className="text-xs text-slate-600 leading-relaxed">
              Upload the original certificate template you want to use. The uploaded file will be used as the master template without redesigning it.
            </p>
          </div>

          <div className="border-2 border-dashed border-slate-300 hover:border-blue-500 rounded-2xl p-10 text-center bg-slate-50 hover:bg-blue-50/40 transition-all cursor-pointer relative group">
            <input
              type="file"
              accept="image/png, image/jpeg, image/jpg, application/pdf"
              disabled={isProcessingTemplate}
              onChange={(e) => {
                const file = e.target.files?.[0];
                if (file) handleTemplateUpload(file);
              }}
              className="absolute inset-0 opacity-0 cursor-pointer w-full h-full z-10"
            />
            {isProcessingTemplate ? (
              <div className="flex flex-col items-center justify-center space-y-3 py-4">
                <RefreshCw className="w-10 h-10 text-blue-600 animate-spin" />
                <p className="text-sm font-extrabold text-slate-800">Processing Master Template File...</p>
                <p className="text-xs text-slate-500">Converting PDF/Image to high-resolution vector canvas</p>
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center space-y-4">
                <div className="w-16 h-16 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center group-hover:scale-110 transition-transform">
                  <Upload className="w-8 h-8" />
                </div>
                <div>
                  <p className="text-base font-extrabold text-slate-800">
                    Drag & Drop Certificate Template
                  </p>
                  <p className="text-xs text-slate-500 mt-1">
                    Supports PNG, JPG, JPEG, PDF files
                  </p>
                </div>
                <button className="px-5 py-2.5 bg-blue-600 text-white font-bold text-xs rounded-xl shadow-md hover:bg-blue-500 transition-colors pointer-events-none">
                  Browse Template
                </button>
              </div>
            )}
          </div>

          <div className="bg-blue-50/60 border border-blue-200 rounded-xl p-4 flex items-start space-x-3 text-xs text-blue-900">
            <CheckCircle2 className="w-5 h-5 text-blue-600 shrink-0 mt-0.5" />
            <div>
              <p className="font-bold">Original Master File Integrity Guaranteed</p>
              <p className="text-slate-600 mt-0.5">
                The uploaded certificate is kept as a read-only master file. It will not be redesigned, recreated in HTML/CSS, or modified. Recipient names are added as an exact personalization layer.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* STEP 2: TEMPLATE PREVIEW (`Selected Template`) */}
      {step === 'preview_template' && templateDetails && (
        <div className="bg-white rounded-2xl border border-slate-200 p-8 shadow-sm space-y-6">
          <div className="flex items-center justify-between border-b border-slate-100 pb-4">
            <div>
              <h2 className="text-xl font-bold text-slate-900">Selected Template</h2>
              <p className="text-xs text-slate-500">
                Confirm your uploaded master certificate template details
              </p>
            </div>
            <span className="px-3 py-1 bg-green-50 text-green-700 border border-green-200 text-xs font-bold rounded-full flex items-center gap-1">
              <Check className="w-3.5 h-3.5" /> Ready as Master
            </span>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
            {/* Template Canvas Display */}
            <div className="lg:col-span-7 bg-slate-100 border border-slate-300 rounded-2xl p-4 flex items-center justify-center min-h-[380px] shadow-inner relative group">
              {templateDataUrl && (
                <img
                  src={templateDataUrl}
                  alt={templateDetails.fileName}
                  className="max-h-[360px] max-w-full object-contain rounded drop-shadow-md"
                />
              )}
            </div>

            {/* Template Metadata Box */}
            <div className="lg:col-span-5 space-y-6">
              <div className="bg-slate-50 rounded-xl p-5 border border-slate-200 space-y-3">
                <h3 className="text-xs font-bold text-slate-700 uppercase tracking-wider">
                  Template Information
                </h3>
                <div className="space-y-2 text-xs">
                  <div className="flex justify-between py-1 border-b border-slate-200">
                    <span className="text-slate-500">File Name:</span>
                    <span className="font-bold text-slate-900 truncate max-w-[180px]">{templateDetails.fileName}</span>
                  </div>
                  <div className="flex justify-between py-1 border-b border-slate-200">
                    <span className="text-slate-500">File Type:</span>
                    <span className="font-semibold text-slate-800">{templateDetails.fileType} ({templateDetails.fileSizeStr})</span>
                  </div>
                  <div className="flex justify-between py-1 border-b border-slate-200">
                    <span className="text-slate-500">Dimensions:</span>
                    <span className="font-mono text-slate-800">{templateDetails.width} × {templateDetails.height} px</span>
                  </div>
                  <div className="flex justify-between py-1 border-b border-slate-200">
                    <span className="text-slate-500">Orientation:</span>
                    <span className="font-semibold capitalize text-slate-800">{templateDetails.orientation}</span>
                  </div>
                  <div className="flex justify-between py-1">
                    <span className="text-slate-500">Paper Size:</span>
                    <span className="font-bold text-blue-700">{templateDetails.paperSizeName}</span>
                  </div>
                </div>
              </div>

              {/* Step Action Buttons */}
              <div className="flex flex-col sm:flex-row gap-3 pt-2">
                <button
                  onClick={() => setStep('upload_template')}
                  className="flex-1 py-3 px-4 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs rounded-xl transition-colors border border-slate-300"
                >
                  Replace Template
                </button>
                <button
                  onClick={() => setStep('position_name')}
                  className="flex-1 py-3 px-4 bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs rounded-xl shadow-md transition-all flex items-center justify-center space-x-2"
                >
                  <span>Use This Template</span>
                  <ArrowRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* STEP 3: SET RECIPIENT NAME POSITION */}
      {step === 'position_name' && (
        <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm space-y-6">
          <div className="flex flex-col md:flex-row md:items-center justify-between border-b border-slate-100 pb-4 gap-4">
            <div>
              <h2 className="text-xl font-bold text-slate-900">Set Name Position</h2>
              <p className="text-xs text-slate-500">
                Position and format the <span className="font-mono font-bold text-blue-600">{'{{NAME}}'}</span> personalization slot over the recipient name line
              </p>
            </div>
            <button
              onClick={() => {
                if (rows.length > 0) setStep('view_names');
                else setStep('upload_names');
              }}
              className="px-5 py-2.5 bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs rounded-xl shadow-md transition-all flex items-center space-x-2 shrink-0"
            >
              <span>Continue to Upload Name List</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>

          {/* Positioning Tools Bar */}
          <div className="bg-slate-900 text-white p-4 rounded-xl flex flex-wrap items-center gap-4 text-xs">
            <div className="flex items-center space-x-2">
              <Type className="w-4 h-4 text-blue-400" />
              <span className="font-semibold text-slate-300">Font Family:</span>
              <select
                value={namePosition.fontFamily}
                onChange={(e) => setNamePosition({ ...namePosition, fontFamily: e.target.value })}
                className="bg-slate-800 text-white rounded px-2 py-1 text-xs border border-slate-700"
              >
                <option value="serif">Georgia / Serif</option>
                <option value="sans-serif">Arial / Sans-Serif</option>
                <option value="Playfair Display">Playfair Display</option>
                <option value="Courier New">Courier / Monospace</option>
              </select>
            </div>

            <div className="flex items-center space-x-2">
              <span className="font-semibold text-slate-300">Size:</span>
              <input
                type="number"
                value={namePosition.fontSize}
                onChange={(e) => setNamePosition({ ...namePosition, fontSize: Number(e.target.value) })}
                className="bg-slate-800 text-white rounded px-2 py-1 text-xs w-16 border border-slate-700 text-center"
              />
              <span>px</span>
            </div>

            <div className="flex items-center space-x-2">
              <Palette className="w-4 h-4 text-amber-400" />
              <span className="font-semibold text-slate-300">Color:</span>
              <input
                type="color"
                value={namePosition.color}
                onChange={(e) => setNamePosition({ ...namePosition, color: e.target.value })}
                className="w-7 h-7 rounded border-none cursor-pointer bg-transparent"
              />
            </div>

            <div className="flex items-center space-x-1 border-l border-slate-700 pl-3">
              <button
                onClick={() => setNamePosition({ ...namePosition, align: 'left' })}
                className={`p-1.5 rounded ${namePosition.align === 'left' ? 'bg-blue-600 text-white' : 'text-slate-400 hover:text-white'}`}
              >
                <AlignLeft className="w-4 h-4" />
              </button>
              <button
                onClick={() => setNamePosition({ ...namePosition, align: 'center' })}
                className={`p-1.5 rounded ${namePosition.align === 'center' ? 'bg-blue-600 text-white' : 'text-slate-400 hover:text-white'}`}
              >
                <AlignCenter className="w-4 h-4" />
              </button>
              <button
                onClick={() => setNamePosition({ ...namePosition, align: 'right' })}
                className={`p-1.5 rounded ${namePosition.align === 'right' ? 'bg-blue-600 text-white' : 'text-slate-400 hover:text-white'}`}
              >
                <AlignRight className="w-4 h-4" />
              </button>
            </div>

            <div className="flex items-center space-x-2 border-l border-slate-700 pl-3">
              <span className="font-semibold text-slate-300">Vertical Offset (Y):</span>
              <input
                type="range"
                min={50}
                max={templateDetails?.height || 1000}
                value={namePosition.y}
                onChange={(e) => setNamePosition({ ...namePosition, y: Number(e.target.value) })}
                className="w-32 accent-blue-500"
              />
              <span className="font-mono text-[11px] text-blue-300">{namePosition.y}px</span>
            </div>
          </div>

          {/* Interactive Canvas Overlay */}
          <div className="relative bg-slate-100 border border-slate-300 rounded-2xl p-4 flex justify-center items-center overflow-auto max-h-[520px]">
            {templateDataUrl && (
              <div className="relative inline-block border border-slate-400 rounded shadow-lg overflow-hidden">
                <img
                  src={templateDataUrl}
                  alt="Template"
                  className="max-h-[480px] w-auto block select-none pointer-events-none"
                />
                {/* Visual Position Box Overlay */}
                <div
                  style={{
                    position: 'absolute',
                    top: `${(namePosition.y / (templateDetails?.height || 1123)) * 100}%`,
                    left: '10%',
                    right: '10%',
                    textAlign: namePosition.align,
                    fontFamily: namePosition.fontFamily,
                    fontSize: `${Math.max(14, namePosition.fontSize * 0.45)}px`,
                    fontWeight: namePosition.fontWeight,
                    color: namePosition.color,
                    padding: '4px 8px',
                    border: '2px dashed #2563eb',
                    backgroundColor: 'rgba(219, 234, 254, 0.4)',
                    cursor: 'move',
                  }}
                  className="rounded flex items-center justify-center font-bold shadow-xs select-none"
                >
                  <span className="drop-shadow-xs">Sathya Sai JS</span>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* STEP 4: UPLOAD RECIPIENT NAME LIST */}
      {step === 'upload_names' && (
        <div className="bg-white rounded-2xl border border-slate-200 p-8 shadow-sm space-y-6">
          <div className="text-center max-w-xl mx-auto space-y-2">
            <h2 className="text-2xl font-black text-slate-900 tracking-tight">
              Upload Recipient Name List
            </h2>
            <p className="text-xs text-slate-600 leading-relaxed">
              Upload an Excel (.xlsx, .xls) or CSV file containing recipient names. The exact row order from your file will be strictly preserved during certificate generation.
            </p>
          </div>

          <div className="border-2 border-dashed border-slate-300 hover:border-blue-500 rounded-2xl p-10 text-center bg-slate-50 hover:bg-blue-50/40 transition-all cursor-pointer relative group">
            <input
              type="file"
              accept=".xlsx, .xls, .csv"
              onChange={(e) => {
                const file = e.target.files?.[0];
                if (file) handleNameListUpload(file);
              }}
              className="absolute inset-0 opacity-0 cursor-pointer w-full h-full z-10"
            />
            <div className="flex flex-col items-center justify-center space-y-4">
              <div className="w-16 h-16 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center group-hover:scale-110 transition-transform">
                <FileSpreadsheet className="w-8 h-8" />
              </div>
              <div>
                <p className="text-base font-extrabold text-slate-800">
                  Upload Excel / CSV
                </p>
                <p className="text-xs text-slate-500 mt-1">
                  Drag & Drop your Name List file here (.xlsx, .csv)
                </p>
              </div>
              <button className="px-5 py-2.5 bg-emerald-600 text-white font-bold text-xs rounded-xl shadow-md hover:bg-emerald-500 transition-colors pointer-events-none">
                Browse Name List
              </button>
            </div>
          </div>
        </div>
      )}

      {/* STEP 5: VIEW NAME LIST (EXCEL ORDER PRESERVED) */}
      {step === 'view_names' && (
        <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm space-y-6">
          <div className="flex flex-col md:flex-row md:items-center justify-between border-b border-slate-100 pb-4 gap-4">
            <div>
              <div className="flex items-center space-x-3">
                <h2 className="text-xl font-bold text-slate-900">Recipient List</h2>
                <span className="px-3 py-1 bg-blue-100 text-blue-800 font-bold text-xs rounded-full">
                  {rows.length} Recipients Found
                </span>
              </div>
              <p className="text-xs text-slate-500 mt-1">
                Order strictly matches uploaded Excel spreadsheet file (Row 1 to Row {rows.length})
              </p>
            </div>

            <div className="flex items-center space-x-3">
              <button
                onClick={() => setStep('upload_names')}
                className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs rounded-xl border border-slate-300 transition-colors"
              >
                Change Excel File
              </button>
              <button
                onClick={() => setStep('preview_first')}
                className="px-5 py-2 bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs rounded-xl shadow-md transition-all flex items-center space-x-2"
              >
                <span>Preview First Certificate</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Name Column Auto Detection Notification Bar */}
          <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 flex flex-col md:flex-row md:items-center justify-between gap-3 text-xs">
            <div className="flex items-center space-x-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
              <span className="font-semibold text-slate-700">Auto-Detected Name Column:</span>
              <select
                value={selectedNameCol}
                onChange={(e) => setSelectedNameCol(e.target.value)}
                className="bg-white border border-slate-300 font-bold text-slate-900 rounded px-3 py-1 text-xs shadow-2xs"
              >
                {columns.map((col) => (
                  <option key={col} value={col}>
                    {col}
                  </option>
                ))}
              </select>
            </div>

            {/* Table Search & Add Name */}
            <div className="flex items-center space-x-3">
              <div className="relative">
                <Search className="w-3.5 h-3.5 absolute left-3 top-2.5 text-slate-400" />
                <input
                  type="text"
                  placeholder="Search recipient name..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-8 pr-3 py-1.5 bg-white border border-slate-300 rounded-lg text-xs w-48 focus:outline-none focus:border-blue-500"
                />
              </div>
              <button
                onClick={handleAddNameRow}
                className="px-3 py-1.5 bg-emerald-600 text-white font-bold text-xs rounded-lg hover:bg-emerald-500 transition-colors flex items-center space-x-1"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Add Name</span>
              </button>
            </div>
          </div>

          {/* Recipient Table displaying exact Excel Row Order */}
          <div className="border border-slate-200 rounded-xl overflow-hidden">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-100 border-b border-slate-200 text-slate-700 font-bold uppercase tracking-wider">
                <tr>
                  <th className="py-3 px-4 w-16 text-center">#</th>
                  <th className="py-3 px-4">Recipient Name</th>
                  <th className="py-3 px-4 w-32 text-center">Status</th>
                  <th className="py-3 px-4 w-24 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-medium">
                {filteredRows.map((row, idx) => {
                  const nameVal = row[selectedNameCol] || '';
                  return (
                    <tr key={row._rowId} className="hover:bg-slate-50/80 transition-colors">
                      <td className="py-2.5 px-4 text-center font-bold text-slate-500 font-mono">
                        {idx + 1}
                      </td>
                      <td className="py-2.5 px-4">
                        <input
                          type="text"
                          value={nameVal}
                          onChange={(e) => handleEditNameCell(row._rowId, e.target.value)}
                          className="w-full bg-transparent border-b border-transparent hover:border-slate-300 focus:border-blue-500 focus:bg-white px-2 py-1 rounded font-bold text-slate-900 focus:outline-none"
                        />
                      </td>
                      <td className="py-2.5 px-4 text-center">
                        <span className="px-2.5 py-0.5 bg-emerald-50 text-emerald-700 border border-emerald-200 rounded-full font-bold text-[10px]">
                          Ready
                        </span>
                      </td>
                      <td className="py-2.5 px-4 text-right">
                        <button
                          onClick={() => handleDeleteRow(row._rowId)}
                          className="text-slate-400 hover:text-red-600 transition-colors p-1"
                          title="Delete recipient"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* STEP 6: PREVIEW FIRST CERTIFICATE */}
      {step === 'preview_first' && (
        <div className="bg-white rounded-2xl border border-slate-200 p-8 shadow-sm space-y-6">
          <div className="flex items-center justify-between border-b border-slate-100 pb-4">
            <div>
              <h2 className="text-xl font-bold text-slate-900">Preview First Certificate</h2>
              <p className="text-xs text-slate-500">
                Verify recipient name placement on Excel Row 1 (<span className="font-bold text-blue-700">{rows[0]?.[selectedNameCol] || 'Sathya Sai JS'}</span>) before bulk generating
              </p>
            </div>
            <div className="flex items-center space-x-3">
              <button
                onClick={() => setStep('view_names')}
                className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs rounded-xl border border-slate-300 transition-colors"
              >
                Back
              </button>
              <button
                onClick={handleStartGeneration}
                className="px-6 py-2.5 bg-blue-600 hover:bg-blue-500 text-white font-extrabold text-xs rounded-xl shadow-lg transition-all flex items-center space-x-2"
              >
                <Sparkles className="w-4 h-4 text-amber-300" />
                <span>Generate {rows.length} Certificates</span>
              </button>
            </div>
          </div>

          <div className="bg-slate-100 border border-slate-300 rounded-2xl p-6 flex items-center justify-center min-h-[420px] shadow-inner">
            <canvas
              ref={firstPreviewCanvasRef}
              className="max-h-[420px] max-w-full rounded shadow-md bg-white"
            />
          </div>
        </div>
      )}

      {/* STEP 7: GENERATING CERTIFICATES PROGRESS */}
      {step === 'generating' && (
        <div className="bg-white rounded-2xl border border-slate-200 p-10 shadow-sm space-y-8 text-center max-w-2xl mx-auto">
          <div className="space-y-2">
            <div className="w-16 h-16 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center mx-auto animate-pulse">
              <RefreshCw className="w-8 h-8 animate-spin" />
            </div>
            <h2 className="text-2xl font-black text-slate-900">Generating Certificates...</h2>
            <p className="text-xs text-slate-500">
              Processing recipient <span className="font-bold text-blue-700">{genProgress.currentName}</span> in strict Excel order
            </p>
          </div>

          {/* Progress Stats Box */}
          <div className="space-y-3">
            <div className="flex justify-between text-xs font-bold text-slate-700">
              <span>Progress: {genProgress.current} / {genProgress.total}</span>
              <span>{((genProgress.current / (genProgress.total || 1)) * 100).toFixed(1)}%</span>
            </div>
            <div className="w-full bg-slate-100 h-4 rounded-full overflow-hidden p-0.5 border border-slate-200">
              <div
                className="bg-gradient-to-r from-blue-600 to-indigo-600 h-full rounded-full transition-all duration-150"
                style={{ width: `${(genProgress.current / (genProgress.total || 1)) * 100}%` }}
              />
            </div>
            <div className="grid grid-cols-2 gap-4 text-xs font-semibold pt-2">
              <div className="bg-emerald-50 border border-emerald-200 p-3 rounded-xl text-emerald-800">
                Generated: <span className="font-extrabold">{genProgress.current}</span>
              </div>
              <div className="bg-amber-50 border border-amber-200 p-3 rounded-xl text-amber-800">
                Remaining: <span className="font-extrabold">{genProgress.total - genProgress.current}</span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* STEP 8 & 9: FINAL CERTIFICATES LIST & DOWNLOAD/PRINT OPTIONS */}
      {step === 'view_generated' && (
        <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm space-y-6">
          <div className="flex flex-col md:flex-row md:items-center justify-between border-b border-slate-100 pb-4 gap-4">
            <div>
              <div className="flex items-center space-x-3">
                <h2 className="text-xl font-bold text-slate-900">Certificates Generated Successfully</h2>
                <span className="px-3 py-1 bg-emerald-100 text-emerald-800 font-bold text-xs rounded-full">
                  {generatedCerts.length} / {generatedCerts.length} Completed
                </span>
              </div>
              <p className="text-xs text-slate-500 mt-1">
                Generated in exact original Excel list order
              </p>
            </div>

            {/* Bulk Download & Print Action Buttons */}
            <div className="flex flex-wrap items-center gap-2">
              <button
                onClick={() => {
                  const activeTpl = buildActiveTemplateObject();
                  downloadCombinedPdf(activeTpl, generatedCerts, branding);
                }}
                className="px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs rounded-xl shadow-sm transition-all flex items-center space-x-1.5"
              >
                <Download className="w-3.5 h-3.5" />
                <span>Download All (Combined PDF)</span>
              </button>
              <button
                onClick={handleDownloadZip}
                className="px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs rounded-xl shadow-sm transition-all flex items-center space-x-1.5"
              >
                <Download className="w-3.5 h-3.5" />
                <span>Download ZIP</span>
              </button>
            </div>
          </div>

          {/* Generated Certificates Table */}
          <div className="border border-slate-200 rounded-xl overflow-hidden">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-100 border-b border-slate-200 text-slate-700 font-bold uppercase tracking-wider">
                <tr>
                  <th className="py-3 px-4 w-16 text-center">#</th>
                  <th className="py-3 px-4">Recipient Name</th>
                  <th className="py-3 px-4">Certificate ID</th>
                  <th className="py-3 px-4 text-center">Status</th>
                  <th className="py-3 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-medium">
                {generatedCerts.map((cert, idx) => (
                  <tr key={cert.id} className="hover:bg-slate-50/80 transition-colors">
                    <td className="py-3 px-4 text-center font-bold text-slate-500 font-mono">
                      {idx + 1}
                    </td>
                    <td className="py-3 px-4 font-bold text-slate-900">
                      {cert.recipientName}
                    </td>
                    <td className="py-3 px-4 font-mono font-semibold text-blue-700">
                      {cert.certificateNumber}
                    </td>
                    <td className="py-3 px-4 text-center">
                      <span className="px-2.5 py-0.5 bg-emerald-50 text-emerald-700 border border-emerald-200 rounded-full font-bold text-[10px]">
                        Ready
                      </span>
                    </td>
                    <td className="py-3 px-4 text-right space-x-2">
                      <button
                        onClick={() => {
                          setPreviewCert(cert);
                        }}
                        className="px-2.5 py-1 bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold text-[11px] rounded border border-slate-300"
                      >
                        Preview
                      </button>
                      <button
                        onClick={() => {
                          const activeTpl = buildActiveTemplateObject();
                          downloadCertificatePdf(activeTpl, cert, branding);
                        }}
                        className="px-2.5 py-1 bg-blue-50 hover:bg-blue-100 text-blue-700 font-semibold text-[11px] rounded border border-blue-200"
                      >
                        Download
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Individual Certificate Preview Modal */}
      {previewCert && (
        <div className="fixed inset-0 bg-slate-900/80 backdrop-blur-xs flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl max-w-3xl w-full p-6 space-y-4 shadow-2xl border border-slate-200">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div>
                <h3 className="text-base font-bold text-slate-900">
                  {previewCert.recipientName} — {previewCert.certificateNumber}
                </h3>
                <p className="text-xs text-slate-500">Individual Certificate Preview</p>
              </div>
              <button
                onClick={() => setPreviewCert(null)}
                className="text-slate-400 hover:text-slate-700 font-bold text-sm"
              >
                ✕
              </button>
            </div>

            <div className="bg-slate-100 p-4 rounded-xl flex items-center justify-center max-h-[480px] overflow-auto">
              <canvas
                ref={(node) => {
                  if (node) {
                    const activeTpl = buildActiveTemplateObject();
                    renderCertificateToCanvas(
                      node,
                      activeTpl,
                      previewCert.data,
                      previewCert.certificateNumber,
                      branding,
                      previewCert.customElementsOverridden
                    );
                  }
                }}
                className="max-h-[420px] max-w-full rounded shadow"
              />
            </div>

            <div className="flex justify-end space-x-3 pt-2">
              <button
                onClick={() => setPreviewCert(null)}
                className="px-4 py-2 bg-slate-100 text-slate-700 font-bold text-xs rounded-xl"
              >
                Close
              </button>
              <button
                onClick={() => {
                  const activeTpl = buildActiveTemplateObject();
                  downloadCertificatePdf(activeTpl, previewCert, branding);
                }}
                className="px-5 py-2 bg-blue-600 text-white font-bold text-xs rounded-xl shadow"
              >
                Download PDF
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
