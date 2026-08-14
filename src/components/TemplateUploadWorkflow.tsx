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
  Copy,
} from 'lucide-react';
import {
  Project,
  CertificateTemplate,
  Dataset,
  DataRow,
  GeneratedCertificate,
  CanvasElement,
  DynamicFieldDef,
  BrandingSettings,
} from '../types';
import { parseExcelFile, smartDetectNameColumn } from '../lib/excelParser';
import { convertPdfToImageDataUrl } from '../lib/pdfHelper';
import { convertOttToImageDataUrl } from '../lib/ottHelper';
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
import {
  CMYK_PRESETS,
  hexToCmyk,
  cmykToHex,
  formatCmykDisplay,
  enforceCmykGamut,
  CmykColor,
} from '../lib/cmykUtils';
import {
  createStyledDynamicField,
  createStyledTextElement,
  enforceGlobalStyling,
  ensureBebasKaiLoaded,
  calculateAutoFitFontSize,
  GLOBAL_ENFORCED_FONT,
  GLOBAL_ENFORCED_DYNAMIC_ALIGN,
} from '../lib/editorStylingHelper';

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

  // Elements state over master template
  const [templateElements, setTemplateElements] = useState<CanvasElement[]>([
    {
      id: 'el_name_slot',
      type: 'dynamic_field',
      name: 'Recipient Name',
      dynamicFieldKey: 'NAME',
      x: 59,
      y: 460,
      width: 675,
      height: 80,
      rotation: 0,
      opacity: 1,
      zIndex: 10,
      text: '{{NAME}}',
      fontFamily: 'Bebas Kai',
      fontSize: 52,
      fontWeight: 'bold',
      fontStyle: 'normal',
      color: '#0e1838',
      align: 'center',
    },
  ]);
  const [selectedElementId, setSelectedElementId] = useState<string>('el_name_slot');

  // Display height measurement for accurate overlay text scaling
  const [displayedImgHeight, setDisplayedImgHeight] = useState<number>(560);

  // Name List State
  const [nameListFile, setNameListFile] = useState<File | null>(null);
  const [columns, setColumns] = useState<string[]>([]);
  const [rows, setRows] = useState<DataRow[]>([]);
  const [selectedNameCol, setSelectedNameCol] = useState<string>('Name');
  const [searchTerm, setSearchTerm] = useState('');

  // Ensure Bebas Kai is loaded in browser
  useEffect(() => {
    ensureBebasKaiLoaded();
  }, []);

  // Helper functions to manage elements
  const selectedElement = templateElements.find((el) => el.id === selectedElementId) || templateElements[0];

  const updateSelectedElement = (updates: Partial<CanvasElement>) => {
    if (!selectedElementId) return;
    setTemplateElements((prev) =>
      prev.map((el) => (el.id === selectedElementId ? { ...el, ...updates } : el))
    );
  };

  // Enforces Bebas Kai font on all text and center alignment on dynamic fields
  const handleEnforceGlobalStyling = () => {
    setTemplateElements((prev) => enforceGlobalStyling(prev));
  };

  const handleAddNameElement = () => {
    const w = templateDetails?.width || 794;
    const h = templateDetails?.height || 1123;
    const newEl = createStyledDynamicField({
      fieldKey: 'NAME',
      fieldLabel: 'Recipient Name',
      templateWidth: w,
      templateHeight: h,
      zIndex: templateElements.length + 1,
      customY: Math.round(h * 0.42),
      customFontSize: Math.max(48, Math.round(w * 0.048)),
      color: '#0e1838',
    });
    setTemplateElements((prev) => [...prev, newEl]);
    setSelectedElementId(newEl.id);
  };

  const handleAddStaticText = (initialText = 'Enter custom certificate text here') => {
    const w = templateDetails?.width || 794;
    const h = templateDetails?.height || 1123;
    const newEl = createStyledTextElement({
      text: initialText,
      name: 'Custom Text Block',
      templateWidth: w,
      templateHeight: h,
      zIndex: templateElements.length + 1,
      customY: Math.round(h * 0.52),
      customFontSize: Math.max(28, Math.round(w * 0.028)),
      color: '#334155',
      align: 'center',
    });
    setTemplateElements((prev) => [...prev, newEl]);
    setSelectedElementId(newEl.id);
  };

  const handleAddDynamicField = (fieldKey: string, fieldLabel?: string) => {
    const w = templateDetails?.width || 794;
    const h = templateDetails?.height || 1123;
    const newEl = createStyledDynamicField({
      fieldKey,
      fieldLabel,
      templateWidth: w,
      templateHeight: h,
      zIndex: templateElements.length + 1,
      customY: Math.round(h * 0.58),
      customFontSize: Math.max(32, Math.round(w * 0.032)),
      color: '#0e1838',
    });
    setTemplateElements((prev) => [...prev, newEl]);
    setSelectedElementId(newEl.id);
  };

  const handleDeleteElement = (idToDelete: string) => {
    if (templateElements.length <= 1) {
      alert('Certificate must have at least one text or name field.');
      return;
    }
    const filtered = templateElements.filter((el) => el.id !== idToDelete);
    setTemplateElements(filtered);
    if (selectedElementId === idToDelete && filtered.length > 0) {
      setSelectedElementId(filtered[0].id);
    }
  };

  const handleDuplicateElement = (idToDup: string) => {
    const target = templateElements.find((el) => el.id === idToDup);
    if (!target) return;
    const dup: CanvasElement = {
      ...target,
      id: `el_${Date.now()}`,
      y: Math.min((templateDetails?.height || 1123) - 50, target.y + 35),
      zIndex: templateElements.length + 1,
    };
    setTemplateElements((prev) => [...prev, dup]);
    setSelectedElementId(dup.id);
  };

  const handleCenterHorizontally = () => {
    if (!selectedElement) return;
    const w = templateDetails?.width || 794;
    const newX = Math.round((w - selectedElement.width) / 2);
    updateSelectedElement({ x: newX, align: 'center' });
  };

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
  const [isExporting, setIsExporting] = useState(false);
  const [exportProgress, setExportProgress] = useState<{ current: number; total: number; label: string } | null>(null);

  // Preview & Editing modals
  const [previewCert, setPreviewCert] = useState<GeneratedCertificate | null>(null);
  const [editingCert, setEditingCert] = useState<GeneratedCertificate | null>(null);

  // Canvas refs for preview
  const firstPreviewCanvasRef = useRef<HTMLCanvasElement | null>(null);
  const singlePreviewCanvasRef = useRef<HTMLCanvasElement | null>(null);

  // Smart Name column detection
  const detectNameColumn = (cols: string[], sampleRows?: DataRow[]): string => {
    return smartDetectNameColumn(cols, sampleRows);
  };

  const [isProcessingTemplate, setIsProcessingTemplate] = useState(false);

  // 1. Handle Master Template File Upload
  const handleTemplateUpload = async (file: File) => {
    if (!file) return;

    const isPdf = file.type === 'application/pdf' || file.name.toLowerCase().endsWith('.pdf');
    const isOtt =
      file.name.toLowerCase().endsWith('.ott') ||
      file.name.toLowerCase().endsWith('.odt') ||
      file.type === 'application/vnd.oasis.opendocument.text-template' ||
      file.type === 'application/vnd.oasis.opendocument.text' ||
      file.type === 'application/x-vnd.oasis.opendocument.text-template';
    const fileSizeMB = (file.size / (1024 * 1024)).toFixed(2);

    setIsProcessingTemplate(true);
    setTemplateFile(file);

    try {
      if (isOtt) {
        const result = await convertOttToImageDataUrl(file);
        setTemplateDataUrl(result.dataUrl);
        setTemplateDetails({
          fileName: file.name,
          fileType: 'OpenDocument Template (.OTT)',
          fileSizeStr: `${fileSizeMB} MB`,
          width: result.width,
          height: result.height,
          orientation: result.orientation,
          paperSizeName: result.paperSizeName,
        });

        if (result.elements && result.elements.length > 0) {
          setTemplateElements(result.elements);
          setSelectedElementId(result.elements[0]?.id || 'el_name_slot');
        } else {
          const defaultNameEl = createStyledDynamicField({
            fieldKey: 'NAME',
            fieldLabel: 'Recipient Name',
            templateWidth: result.width,
            templateHeight: result.height,
            zIndex: 10,
            customY: Math.round(result.height * 0.44),
            customFontSize: Math.max(48, Math.round(result.width * 0.048)),
            color: '#0e1838',
          });
          setTemplateElements([defaultNameEl]);
          setSelectedElementId(defaultNameEl.id);
        }

        setStep('preview_template');
      } else if (isPdf) {
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

        const pdfW = result.width || 794;
        const pdfH = result.height || 1123;
        const pdfBoxWidth = Math.round(pdfW * 0.85);
        const defaultNameEl: CanvasElement = {
          id: 'el_name_slot',
          type: 'dynamic_field',
          name: 'Recipient Name',
          dynamicFieldKey: 'NAME',
          x: Math.round((pdfW - pdfBoxWidth) / 2),
          y: Math.round(pdfH * 0.42),
          width: pdfBoxWidth,
          height: Math.round(pdfH * 0.08),
          rotation: 0,
          opacity: 1,
          zIndex: 10,
          text: '{{NAME}}',
          fontFamily: 'Bebas Kai',
          fontSize: Math.max(48, Math.round(pdfW * 0.048)),
          fontWeight: 'bold',
          fontStyle: 'normal',
          color: '#0e1838',
          align: 'center',
        };
        setTemplateElements([defaultNameEl]);
        setSelectedElementId('el_name_slot');

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

            const imgBoxWidth = Math.round(w * 0.85);
            const defaultNameEl: CanvasElement = {
              id: 'el_name_slot',
              type: 'dynamic_field',
              name: 'Recipient Name',
              dynamicFieldKey: 'NAME',
              x: Math.round((w - imgBoxWidth) / 2),
              y: Math.round(h * 0.42),
              width: imgBoxWidth,
              height: Math.round(h * 0.08),
              rotation: 0,
              opacity: 1,
              zIndex: 10,
              text: '{{NAME}}',
              fontFamily: 'Bebas Kai',
              fontSize: Math.max(48, Math.round(w * 0.048)),
              fontWeight: 'bold',
              fontStyle: 'normal',
              color: '#0e1838',
              align: 'center',
            };
            setTemplateElements([defaultNameEl]);
            setSelectedElementId('el_name_slot');

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

      const detected = detectNameColumn(result.columns, result.rows);
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

    const dynamicFieldsMap = new Map<string, DynamicFieldDef>();
    templateElements.forEach((el) => {
      if (el.text) {
        const matches = el.text.match(/\{\{([^}]+)\}\}/g);
        if (matches) {
          matches.forEach((m) => {
            const key = m.replace(/[\{\}]/g, '').trim();
            if (key && !dynamicFieldsMap.has(key)) {
              dynamicFieldsMap.set(key, {
                key,
                label: key,
                defaultValue: key === 'NAME' ? 'Sathya Sai JS' : key,
              });
            }
          });
        }
      }
    });

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
      elements: templateElements,
      dynamicFields: Array.from(dynamicFieldsMap.values()),
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
      const sampleData = { ...firstRow, NAME: firstName };

      renderCertificateToCanvas(
        firstPreviewCanvasRef.current,
        activeTpl,
        sampleData,
        'SSWR/2026/0001',
        branding
      );
    }
  }, [step, templateElements, rows, selectedNameCol]);

  // 4. High-Speed Sequential Ordered Bulk Generation
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
    const BATCH_SIZE = 10;

    for (let i = 0; i < total; i += BATCH_SIZE) {
      const end = Math.min(i + BATCH_SIZE, total);
      for (let j = i; j < end; j++) {
        const row = rows[j];
        const recipientName = row[selectedNameCol] || `Recipient ${j + 1}`;
        const certSeqNum = String(j + 1).padStart(4, '0');
        const certNumber = `SSWR/2026/${certSeqNum}`;

        const rowData: Record<string, string> = { ...row, NAME: recipientName };

        const certObj: GeneratedCertificate = {
          id: `cert_${Date.now()}_${j + 1}`,
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
      }

      setGenProgress({
        current: end,
        total,
        currentName: rows[end - 1][selectedNameCol] || '',
        isFinished: end === total,
      });

      // Micro-yield to update progress bar without lagging
      await new Promise((r) => setTimeout(r, 4));
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

  // High-Speed Download ZIP with filenames preserving Excel order
  const handleDownloadZip = async () => {
    if (generatedCerts.length === 0 || isExporting) return;
    setIsExporting(true);
    setExportProgress({ current: 0, total: generatedCerts.length, label: 'Rendering PDF Certificates...' });

    try {
      const activeTpl = buildActiveTemplateObject();
      await downloadCertificatesZip(
        activeTpl,
        generatedCerts,
        branding,
        (curr, tot) => {
          setExportProgress({
            current: curr,
            total: tot,
            label: `Rendering Certificates (${curr}/${tot})...`,
          });
        }
      );
    } catch (err) {
      console.error('Failed to export ZIP:', err);
    } finally {
      setIsExporting(false);
      setExportProgress(null);
    }
  };

  // High-Speed Download Combined Multi-Page PDF
  const handleDownloadCombined = async () => {
    if (generatedCerts.length === 0 || isExporting) return;
    setIsExporting(true);
    setExportProgress({ current: 0, total: generatedCerts.length, label: 'Compiling Combined Multi-Page PDF...' });

    try {
      const activeTpl = buildActiveTemplateObject();
      await downloadCombinedPdf(
        activeTpl,
        generatedCerts,
        branding,
        (curr, tot) => {
          setExportProgress({
            current: curr,
            total: tot,
            label: `Compiling Certificate Pages (${curr}/${tot})...`,
          });
        }
      );
    } catch (err) {
      console.error('Failed to export combined PDF:', err);
    } finally {
      setIsExporting(false);
      setExportProgress(null);
    }
  };

  // Filtered rows for View Names step
  const filteredRows = rows.filter((r) => {
    const val = r[selectedNameCol] || '';
    return val.toLowerCase().includes(searchTerm.toLowerCase());
  });

  return (
    <div className="p-6 max-w-6xl mx-auto space-y-6">
      {/* Workflow Step Tracker Bar */}
      <div className="bg-slate-900 text-white p-4 rounded-2xl shadow-md border border-slate-800 flex items-center justify-between overflow-x-auto gap-4">
        <div className="flex items-center space-x-3 shrink-0">
          <div className="w-8 h-8 rounded-full bg-blue-600 flex items-center justify-center font-bold text-xs">
            SS
          </div>
          <div>
            <div className="flex items-center space-x-2">
              <span className="text-xs font-bold text-slate-100">Certificate Generation Workflow</span>
              <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-black bg-cyan-500/20 text-cyan-300 border border-cyan-500/40">
                🖨️ CMYK 300 DPI MODE ONLY
              </span>
            </div>
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

        {/* Interactive Step Indicators */}
        <div className="hidden md:flex items-center space-x-1.5 text-xs font-medium text-slate-400">
          <button
            onClick={() => setStep('upload_template')}
            className={`px-2.5 py-1 rounded-md transition-colors ${
              step === 'upload_template' ? 'bg-blue-600 text-white font-bold' : 'bg-slate-800 hover:bg-slate-700 text-slate-300'
            }`}
          >
            1. Upload Template
          </button>
          <span>→</span>
          <button
            disabled={!templateDataUrl}
            onClick={() => templateDataUrl && setStep('position_name')}
            className={`px-2.5 py-1 rounded-md transition-colors ${
              step === 'preview_template' || step === 'position_name'
                ? 'bg-blue-600 text-white font-bold'
                : templateDataUrl
                ? 'bg-slate-800 hover:bg-slate-700 text-slate-300'
                : 'bg-slate-800/50 text-slate-600 cursor-not-allowed'
            }`}
          >
            2. Preview & Position
          </button>
          <span>→</span>
          <button
            disabled={!templateDataUrl}
            onClick={() => templateDataUrl && setStep(rows.length > 0 ? 'view_names' : 'upload_names')}
            className={`px-2.5 py-1 rounded-md transition-colors ${
              step === 'upload_names' || step === 'view_names'
                ? 'bg-blue-600 text-white font-bold'
                : templateDataUrl
                ? 'bg-slate-800 hover:bg-slate-700 text-slate-300'
                : 'bg-slate-800/50 text-slate-600 cursor-not-allowed'
            }`}
          >
            3. Name List
          </button>
          <span>→</span>
          <button
            disabled={!templateDataUrl || rows.length === 0}
            onClick={() => templateDataUrl && rows.length > 0 && setStep('preview_first')}
            className={`px-2.5 py-1 rounded-md transition-colors ${
              step === 'preview_first' || step === 'generating'
                ? 'bg-blue-600 text-white font-bold'
                : templateDataUrl && rows.length > 0
                ? 'bg-slate-800 hover:bg-slate-700 text-slate-300'
                : 'bg-slate-800/50 text-slate-600 cursor-not-allowed'
            }`}
          >
            4. Preview & Generate
          </button>
          <span>→</span>
          <button
            disabled={generatedCerts.length === 0}
            onClick={() => generatedCerts.length > 0 && setStep('view_generated')}
            className={`px-2.5 py-1 rounded-md transition-colors ${
              step === 'view_generated'
                ? 'bg-blue-600 text-white font-bold'
                : generatedCerts.length > 0
                ? 'bg-slate-800 hover:bg-slate-700 text-slate-300'
                : 'bg-slate-800/50 text-slate-600 cursor-not-allowed'
            }`}
          >
            5. Download & Print
          </button>
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
              accept="image/png, image/jpeg, image/jpg, image/webp, application/pdf, .pdf, .ott, .odt, application/vnd.oasis.opendocument.text-template, application/vnd.oasis.opendocument.text, application/x-vnd.oasis.opendocument.text-template"
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
                <p className="text-xs text-slate-500">Converting OTT / PDF / Image to high-resolution vector canvas</p>
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
                    Supports <span className="font-semibold text-slate-700">OTT (LibreOffice / OpenOffice)</span>, PDF, PNG, JPG, JPEG, ODT
                  </p>
                  <div className="flex items-center justify-center gap-1.5 mt-2.5">
                    <span className="px-2 py-0.5 bg-blue-100 text-blue-800 text-[10px] font-bold rounded">.OTT</span>
                    <span className="px-2 py-0.5 bg-red-100 text-red-800 text-[10px] font-bold rounded">.PDF</span>
                    <span className="px-2 py-0.5 bg-emerald-100 text-emerald-800 text-[10px] font-bold rounded">.PNG</span>
                    <span className="px-2 py-0.5 bg-purple-100 text-purple-800 text-[10px] font-bold rounded">.JPG</span>
                    <span className="px-2 py-0.5 bg-slate-200 text-slate-700 text-[10px] font-bold rounded">.ODT</span>
                  </div>
                </div>
                <button className="px-5 py-2.5 bg-blue-600 text-white font-bold text-xs rounded-xl shadow-md hover:bg-blue-500 transition-colors pointer-events-none">
                  Browse Template (.ott, .pdf, images)
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

      {/* STEP 3: SET RECIPIENT NAME & ADD CONTENT POSITION */}
      {step === 'position_name' && (
        <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm space-y-6">
          <div className="flex flex-col lg:flex-row lg:items-center justify-between border-b border-slate-100 pb-4 gap-4">
            <div>
              <div className="flex items-center space-x-2">
                <h2 className="text-xl font-black text-slate-900 tracking-tight">Set Name & Certificate Content</h2>
                <span className="px-2.5 py-0.5 bg-blue-100 text-blue-800 font-extrabold text-[11px] rounded-full">
                  {templateElements.length} Content {templateElements.length === 1 ? 'Layer' : 'Layers'}
                </span>
              </div>
              <p className="text-xs text-slate-500 mt-1">
                Add recipient names (<span className="font-mono font-bold text-blue-600">{'{{NAME}}'}</span>) and custom content fields (Record Title, Date, Signatures, Static Text) over the master template.
              </p>
            </div>

            {/* Content Add Actions & Continue Button */}
            <div className="flex flex-wrap items-center gap-2">
              <button
                onClick={handleAddNameElement}
                className="px-3 py-2 bg-blue-50 hover:bg-blue-100 text-blue-700 font-bold text-xs rounded-xl border border-blue-200 transition-colors flex items-center space-x-1.5"
              >
                <Plus className="w-3.5 h-3.5 text-blue-600" />
                <span>+ Recipient Name</span>
              </button>

              <button
                onClick={() => handleAddStaticText('For successfully setting the Seventh Sense World Record')}
                className="px-3 py-2 bg-slate-100 hover:bg-slate-200 text-slate-800 font-bold text-xs rounded-xl border border-slate-300 transition-colors flex items-center space-x-1.5"
              >
                <Plus className="w-3.5 h-3.5 text-slate-600" />
                <span>+ Static Text</span>
              </button>

              {/* Dynamic Field Selector Dropdown */}
              <div className="relative inline-block">
                <select
                  onChange={(e) => {
                    if (e.target.value) {
                      handleAddDynamicField(e.target.value);
                      e.target.value = '';
                    }
                  }}
                  defaultValue=""
                  className="px-3 py-2 bg-amber-50 hover:bg-amber-100 text-amber-900 font-bold text-xs rounded-xl border border-amber-300 transition-colors cursor-pointer"
                >
                  <option value="" disabled>+ Dynamic Field...</option>
                  {columns.length > 0 ? (
                    columns.map((col) => (
                      <option key={col} value={col}>
                        Excel Column: {col}
                      </option>
                    ))
                  ) : (
                    <>
                      <option value="RECORD_TITLE">Record Title</option>
                      <option value="CATEGORY">Category</option>
                      <option value="DATE">Date</option>
                      <option value="CERTIFICATE_ID">Certificate No</option>
                      <option value="LOCATION">Location</option>
                      <option value="ORGANIZATION">Organization</option>
                      <option value="GURU_NAME">Mentor / Signatory</option>
                    </>
                  )}
                </select>
              </div>

              {/* Global Styling Helper Action */}
              <button
                type="button"
                onClick={handleEnforceGlobalStyling}
                className="px-3 py-2 bg-gradient-to-r from-cyan-900 to-blue-900 hover:from-cyan-800 hover:to-blue-800 text-cyan-200 font-bold text-xs rounded-xl border border-cyan-400/40 transition-all flex items-center space-x-1.5 shadow-xs"
                title="Enforce 'Bebas Kai' font on all text layers and force center alignment on dynamic fields"
              >
                <Sparkles className="w-3.5 h-3.5 text-cyan-400 animate-pulse" />
                <span>Enforce Bebas Kai (Centered)</span>
              </button>

              <div className="flex items-center space-x-2 shrink-0 ml-auto">
                <button
                  onClick={() => setStep('upload_template')}
                  className="px-3 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs rounded-xl border border-slate-300 transition-colors flex items-center space-x-1.5"
                >
                  <ArrowLeft className="w-3.5 h-3.5" />
                  <span>Back to Template</span>
                </button>
                <button
                  onClick={() => {
                    if (rows.length > 0) setStep('view_names');
                    else setStep('upload_names');
                  }}
                  className="px-5 py-2.5 bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs rounded-xl shadow-md transition-all flex items-center space-x-2"
                >
                  <span>Continue to Upload Name List</span>
                  <ArrowRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
            {/* Left Column: Layers List & Selected Element Properties Inspector */}
            <div className="lg:col-span-5 space-y-4">
              {/* Layers Selection Tabs */}
              <div className="bg-slate-50 border border-slate-200 rounded-2xl p-4 space-y-3">
                <div className="flex items-center justify-between">
                  <h3 className="text-xs font-black text-slate-700 uppercase tracking-wider flex items-center gap-1.5">
                    <Layers className="w-3.5 h-3.5 text-blue-600" />
                    <span>Certificate Layers ({templateElements.length})</span>
                  </h3>
                  <span className="text-[10px] text-slate-500">Click layer to select</span>
                </div>

                <div className="space-y-1.5 max-h-48 overflow-y-auto pr-1">
                  {templateElements.map((el, idx) => {
                    const isSel = el.id === selectedElementId;
                    return (
                      <div
                        key={el.id}
                        onClick={() => setSelectedElementId(el.id)}
                        className={`flex items-center justify-between p-2.5 rounded-xl border text-xs cursor-pointer transition-all ${
                          isSel
                            ? 'bg-blue-600 text-white border-blue-600 font-bold shadow-sm'
                            : 'bg-white hover:bg-slate-100 text-slate-800 border-slate-200'
                        }`}
                      >
                        <div className="flex items-center space-x-2 truncate pr-2">
                          <span className={`w-5 h-5 rounded-full flex items-center justify-center font-extrabold text-[10px] ${
                            isSel ? 'bg-white/20 text-white' : 'bg-slate-100 text-slate-600'
                          }`}>
                            {idx + 1}
                          </span>
                          <span className="truncate font-medium">
                            {el.text || el.name || 'Text Field'}
                          </span>
                        </div>

                        <div className="flex items-center space-x-1 shrink-0">
                          <button
                            title="Duplicate Layer"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleDuplicateElement(el.id);
                            }}
                            className={`p-1 rounded hover:bg-black/10 transition-colors ${
                              isSel ? 'text-white' : 'text-slate-400 hover:text-slate-700'
                            }`}
                          >
                            <Copy className="w-3.5 h-3.5" />
                          </button>
                          <button
                            title="Delete Layer"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleDeleteElement(el.id);
                            }}
                            className={`p-1 rounded hover:bg-red-500/20 transition-colors ${
                              isSel ? 'text-white' : 'text-red-500 hover:text-red-700'
                            }`}
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Selected Element Property Inspector */}
              {selectedElement && (
                <div className="bg-slate-900 text-white rounded-2xl p-5 space-y-4 shadow-md text-xs">
                  <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                    <div className="flex items-center space-x-2">
                      <Edit2 className="w-4 h-4 text-blue-400" />
                      <span className="font-extrabold text-slate-200">Layer Inspector</span>
                    </div>
                    <span className="px-2 py-0.5 bg-blue-500/20 text-blue-300 font-mono text-[10px] rounded uppercase">
                      {selectedElement.type === 'dynamic_field' ? 'Dynamic Slot' : 'Static Text'}
                    </span>
                  </div>

                  {/* Text / Dynamic Template Input */}
                  <div className="space-y-1.5">
                    <label className="text-[11px] font-bold text-slate-300 flex items-center justify-between">
                      <span>Text Content / Expression:</span>
                      <span className="text-[10px] text-slate-400 font-mono">Use {'{{NAME}}'} for variables</span>
                    </label>
                    <input
                      type="text"
                      value={selectedElement.text || ''}
                      onChange={(e) => updateSelectedElement({ text: e.target.value })}
                      placeholder="e.g. {{NAME}} or Record Holder"
                      className="w-full bg-slate-800 text-white rounded-xl px-3 py-2 text-xs border border-slate-700 focus:outline-none focus:border-blue-500 font-mono"
                    />
                  </div>

                  {/* Font Family & Size */}
                  <div className="space-y-3">
                    <div className="space-y-1.5">
                      <label className="text-[11px] font-bold text-slate-300">Font Family:</label>
                      <select
                        value={selectedElement.fontFamily || 'serif'}
                        onChange={(e) => updateSelectedElement({ fontFamily: e.target.value })}
                        className="w-full bg-slate-800 text-white rounded-xl px-2.5 py-2 text-xs border border-slate-700 focus:outline-none"
                      >
                        <option value="Bebas Kai">Bebas Kai (Bold Headline)</option>
                        <option value="Bebas Neue">Bebas Neue</option>
                        <option value="serif">Georgia / Serif</option>
                        <option value="sans-serif">Arial / Sans-Serif</option>
                        <option value="Playfair Display">Playfair Display</option>
                        <option value="Courier New">Courier / Monospace</option>
                        <option value="Cinzel">Cinzel Classic</option>
                        <option value="Great Vibes">Great Vibes / Cursive</option>
                        <option value="Inter">Inter Clean</option>
                        <option value="Montserrat">Montserrat</option>
                      </select>
                    </div>

                    <div className="space-y-1.5">
                      <div className="flex items-center justify-between">
                        <label className="text-[11px] font-bold text-slate-300">Font Size (px):</label>
                        <span className="text-[10px] text-blue-400 font-mono font-bold">{selectedElement.fontSize || 48} px</span>
                      </div>
                      <div className="flex items-center space-x-1.5">
                        <button
                          type="button"
                          onClick={() => updateSelectedElement({ fontSize: Math.max(12, (selectedElement.fontSize || 48) - 8) })}
                          className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-white font-bold text-sm rounded-lg border border-slate-700 transition-colors"
                          title="Decrease Font Size (-8px)"
                        >
                          -
                        </button>
                        <input
                          type="number"
                          value={selectedElement.fontSize || 48}
                          onChange={(e) => updateSelectedElement({ fontSize: Math.max(10, Number(e.target.value)) })}
                          className="w-full bg-slate-800 text-white rounded-xl px-2.5 py-1.5 text-xs border border-slate-700 text-center font-bold font-mono"
                        />
                        <button
                          type="button"
                          onClick={() => updateSelectedElement({ fontSize: (selectedElement.fontSize || 48) + 8 })}
                          className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-white font-bold text-sm rounded-lg border border-slate-700 transition-colors"
                          title="Increase Font Size (+8px)"
                        >
                          +
                        </button>
                      </div>
                      {/* Presets Row */}
                      <div className="flex flex-wrap gap-1 pt-1">
                        {[36, 48, 64, 80, 96, 120, 150].map((sz) => (
                          <button
                            key={sz}
                            type="button"
                            onClick={() => updateSelectedElement({ fontSize: sz })}
                            className={`px-2 py-1 text-[10px] font-bold rounded-md border transition-all ${
                              selectedElement.fontSize === sz
                                ? 'bg-blue-600 text-white border-blue-500 shadow-xs'
                                : 'bg-slate-800 hover:bg-slate-700 text-slate-300 border-slate-700'
                            }`}
                          >
                            {sz}px
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>

                  {/* Alignment & Style */}
                  <div className="grid grid-cols-2 gap-3 items-center pt-1">
                    <div className="space-y-1">
                      <label className="text-[10px] font-bold text-slate-400">Alignment:</label>
                      <div className="flex items-center space-x-1 bg-slate-800 p-1 rounded-lg border border-slate-700">
                        <button
                          type="button"
                          onClick={() => updateSelectedElement({ align: 'left' })}
                          className={`p-1 rounded flex-1 flex justify-center ${selectedElement.align === 'left' ? 'bg-blue-600 text-white' : 'text-slate-400 hover:text-white'}`}
                        >
                          <AlignLeft className="w-3.5 h-3.5" />
                        </button>
                        <button
                          type="button"
                          onClick={() => updateSelectedElement({ align: 'center' })}
                          className={`p-1 rounded flex-1 flex justify-center ${selectedElement.align === 'center' ? 'bg-blue-600 text-white' : 'text-slate-400 hover:text-white'}`}
                        >
                          <AlignCenter className="w-3.5 h-3.5" />
                        </button>
                        <button
                          type="button"
                          onClick={() => updateSelectedElement({ align: 'right' })}
                          className={`p-1 rounded flex-1 flex justify-center ${selectedElement.align === 'right' ? 'bg-blue-600 text-white' : 'text-slate-400 hover:text-white'}`}
                        >
                          <AlignRight className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>

                    <div className="space-y-1">
                      <label className="text-[10px] font-bold text-slate-400">Typography Style:</label>
                      <div className="flex items-center space-x-1">
                        <button
                          type="button"
                          onClick={() => updateSelectedElement({ fontWeight: selectedElement.fontWeight === 'bold' ? 'normal' : 'bold' })}
                          className={`px-3 py-1 rounded text-xs font-bold border flex-1 ${
                            selectedElement.fontWeight === 'bold' ? 'bg-blue-600 text-white border-blue-500' : 'bg-slate-800 text-slate-400 border-slate-700'
                          }`}
                        >
                          Bold
                        </button>
                        <button
                          type="button"
                          onClick={() => updateSelectedElement({ fontStyle: selectedElement.fontStyle === 'italic' ? 'normal' : 'italic' })}
                          className={`px-3 py-1 rounded text-xs italic border flex-1 ${
                            selectedElement.fontStyle === 'italic' ? 'bg-blue-600 text-white border-blue-500' : 'bg-slate-800 text-slate-400 border-slate-700'
                          }`}
                        >
                          Italic
                        </button>
                      </div>
                    </div>
                  </div>

                  {/* CMYK COLOR CONTROLLER (COMMERCIAL PRINT ONLY) */}
                  <div className="p-3 bg-slate-950/70 rounded-xl border border-cyan-500/30 space-y-2.5">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-1.5">
                        <span className="w-2 h-2 rounded-full bg-cyan-400 animate-pulse"></span>
                        <span className="text-[11px] font-black text-cyan-300 uppercase tracking-wide">
                          CMYK Print Color Controller
                        </span>
                      </div>
                      {(() => {
                        const currentCmyk = hexToCmyk(selectedElement.color || '#0e1838');
                        return (
                          <div className="flex items-center space-x-1.5">
                            <span
                              className="w-4 h-4 rounded-md border border-white/20 shadow-xs inline-block"
                              style={{ backgroundColor: selectedElement.color || '#0e1838' }}
                            />
                            <span className="font-mono text-[10px] font-bold text-cyan-200">
                              {formatCmykDisplay(currentCmyk)}
                            </span>
                          </div>
                        );
                      })()}
                    </div>

                    {/* CMYK 4-Channel Sliders */}
                    {(() => {
                      const cur = hexToCmyk(selectedElement.color || '#0e1838');
                      const handleCmykChange = (channel: keyof CmykColor, val: number) => {
                        const next: CmykColor = { ...cur, [channel]: val };
                        const nextHex = cmykToHex(next);
                        updateSelectedElement({ color: nextHex });
                      };

                      return (
                        <div className="grid grid-cols-2 gap-2 text-[10px]">
                          {/* Cyan */}
                          <div className="bg-slate-900/90 p-1.5 rounded-lg border border-cyan-500/20 space-y-1">
                            <div className="flex justify-between font-bold text-cyan-400">
                              <span>Cyan (C)</span>
                              <span>{cur.c}%</span>
                            </div>
                            <input
                              type="range"
                              min={0}
                              max={100}
                              value={cur.c}
                              onChange={(e) => handleCmykChange('c', Number(e.target.value))}
                              className="w-full accent-cyan-400 cursor-pointer h-1.5"
                            />
                          </div>

                          {/* Magenta */}
                          <div className="bg-slate-900/90 p-1.5 rounded-lg border border-pink-500/20 space-y-1">
                            <div className="flex justify-between font-bold text-pink-400">
                              <span>Magenta (M)</span>
                              <span>{cur.m}%</span>
                            </div>
                            <input
                              type="range"
                              min={0}
                              max={100}
                              value={cur.m}
                              onChange={(e) => handleCmykChange('m', Number(e.target.value))}
                              className="w-full accent-pink-400 cursor-pointer h-1.5"
                            />
                          </div>

                          {/* Yellow */}
                          <div className="bg-slate-900/90 p-1.5 rounded-lg border border-amber-500/20 space-y-1">
                            <div className="flex justify-between font-bold text-amber-400">
                              <span>Yellow (Y)</span>
                              <span>{cur.y}%</span>
                            </div>
                            <input
                              type="range"
                              min={0}
                              max={100}
                              value={cur.y}
                              onChange={(e) => handleCmykChange('y', Number(e.target.value))}
                              className="w-full accent-amber-400 cursor-pointer h-1.5"
                            />
                          </div>

                          {/* Key / Black */}
                          <div className="bg-slate-900/90 p-1.5 rounded-lg border border-slate-500/20 space-y-1">
                            <div className="flex justify-between font-bold text-slate-300">
                              <span>Key/Black (K)</span>
                              <span>{cur.k}%</span>
                            </div>
                            <input
                              type="range"
                              min={0}
                              max={100}
                              value={cur.k}
                              onChange={(e) => handleCmykChange('k', Number(e.target.value))}
                              className="w-full accent-slate-400 cursor-pointer h-1.5"
                            />
                          </div>
                        </div>
                      );
                    })()}

                    {/* Certified CMYK Swatch Presets */}
                    <div className="space-y-1 pt-1 border-t border-slate-800">
                      <div className="text-[9px] font-bold text-slate-400 uppercase tracking-wider">
                        Certified Print CMYK Swatches:
                      </div>
                      <div className="grid grid-cols-4 gap-1.5">
                        {CMYK_PRESETS.map((preset) => {
                          const isSelected = selectedElement.color?.toLowerCase() === preset.hex.toLowerCase();
                          return (
                            <button
                              key={preset.name}
                              type="button"
                              onClick={() => updateSelectedElement({ color: preset.hex })}
                              className={`p-1 rounded-lg text-left transition-all border ${
                                isSelected
                                  ? 'bg-blue-600/30 border-blue-400 ring-1 ring-blue-400'
                                  : 'bg-slate-900 hover:bg-slate-800 border-slate-800'
                              }`}
                              title={`${preset.name}: C:${preset.cmyk.c}% M:${preset.cmyk.m}% Y:${preset.cmyk.y}% K:${preset.cmyk.k}%`}
                            >
                              <div className="flex items-center space-x-1.5">
                                <span
                                  className="w-3 h-3 rounded-full shrink-0 border border-white/20"
                                  style={{ backgroundColor: preset.hex }}
                                />
                                <span className="text-[9px] font-bold text-slate-300 truncate">
                                  {preset.name.split(' ')[0]}
                                </span>
                              </div>
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  </div>

                  {/* Vertical Position Slider & Quick Actions */}
                  <div className="space-y-2 pt-2 border-t border-slate-800">
                    <div className="flex items-center justify-between text-[11px] font-bold text-slate-300">
                      <span>Vertical Y Position:</span>
                      <span className="font-mono text-blue-300">{selectedElement.y} px</span>
                    </div>
                    <input
                      type="range"
                      min={20}
                      max={templateDetails?.height || 1123}
                      value={selectedElement.y}
                      onChange={(e) => updateSelectedElement({ y: Number(e.target.value) })}
                      className="w-full accent-blue-500 cursor-pointer"
                    />

                    <div className="flex items-center justify-between pt-1">
                      <button
                        type="button"
                        onClick={handleCenterHorizontally}
                        className="px-3 py-1.5 bg-blue-600/30 hover:bg-blue-600 text-blue-200 hover:text-white font-bold text-[11px] rounded-lg transition-colors border border-blue-500/30"
                      >
                        Center Horizontally
                      </button>
                      <button
                        type="button"
                        onClick={() => handleDeleteElement(selectedElement.id)}
                        className="px-3 py-1.5 bg-red-500/20 hover:bg-red-600 text-red-300 hover:text-white font-bold text-[11px] rounded-lg transition-colors border border-red-500/30 flex items-center space-x-1"
                      >
                        <Trash2 className="w-3 h-3" />
                        <span>Delete Layer</span>
                      </button>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Right Column: Interactive Master Template Canvas Overlay */}
            <div className="lg:col-span-7 space-y-3">
              {/* Quick Floating Format Toolbar above canvas */}
              {selectedElement && (
                <div className="bg-slate-900 text-white p-3 rounded-2xl border border-slate-800 flex flex-wrap items-center justify-between gap-2 shadow-md">
                  <div className="flex items-center space-x-2">
                    <span className="text-[11px] font-extrabold text-amber-400 uppercase tracking-wider">
                      {selectedElement.name || 'Selected Layer'}:
                    </span>
                    <button
                      type="button"
                      onClick={() => updateSelectedElement({ fontSize: Math.max(12, (selectedElement.fontSize || 48) - 10) })}
                      className="px-2.5 py-1 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-lg font-bold text-xs border border-slate-700 active:scale-95 transition-all"
                    >
                      - Smaller
                    </button>
                    <span className="text-xs font-bold font-mono text-blue-300 px-1">
                      {selectedElement.fontSize || 48}px
                    </span>
                    <button
                      type="button"
                      onClick={() => updateSelectedElement({ fontSize: (selectedElement.fontSize || 48) + 10 })}
                      className="px-2.5 py-1 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-lg font-bold text-xs border border-slate-700 active:scale-95 transition-all"
                    >
                      + Larger
                    </button>
                  </div>

                  <div className="flex items-center space-x-1.5">
                    {[48, 72, 96, 120, 150].map((s) => (
                      <button
                        key={s}
                        type="button"
                        onClick={() => updateSelectedElement({ fontSize: s })}
                        className={`px-2 py-1 text-[10px] font-extrabold rounded-md transition-all ${
                          selectedElement.fontSize === s
                            ? 'bg-blue-600 text-white border border-blue-400 shadow-xs'
                            : 'bg-slate-800 text-slate-300 hover:bg-slate-700 border border-slate-700'
                        }`}
                      >
                        {s}px
                      </button>
                    ))}
                    <button
                      type="button"
                      onClick={handleCenterHorizontally}
                      className="px-3 py-1 bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs rounded-lg transition-colors ml-1 shadow-xs"
                    >
                      Center Name
                    </button>
                  </div>
                </div>
              )}

              <div className="bg-slate-100 border border-slate-300 rounded-2xl p-4 flex justify-center items-center overflow-auto max-h-[620px] shadow-inner relative">
                {templateDataUrl && (
                  <div className="relative inline-block border border-slate-400 rounded-xl shadow-xl overflow-hidden bg-white">
                    <img
                      src={templateDataUrl}
                      alt="Master Template"
                      onLoad={(e) => {
                        const target = e.currentTarget;
                        if (target && target.clientHeight > 0) {
                          setDisplayedImgHeight(target.clientHeight);
                        }
                      }}
                      className="max-h-[560px] w-auto block select-none pointer-events-none"
                    />

                    {/* Overlaid Content Elements */}
                    {templateElements.map((el, idx) => {
                      const isSelected = el.id === selectedElementId;
                      const h = templateDetails?.height || 1123;
                      const w = templateDetails?.width || 794;
                      const topPct = (el.y / h) * 100;
                      const leftPct = (el.x / w) * 100;
                      const widthPct = (el.width / w) * 100;

                      // Display sample text (e.g. Sathya Sai JS for NAME or raw text)
                      let displayText = el.text || el.name;
                      if (displayText.includes('{{NAME}}')) displayText = displayText.replace('{{NAME}}', 'Sathya Sai JS');
                      if (displayText.includes('{{Record Title}}')) displayText = displayText.replace('{{Record Title}}', 'Fastest Mental Calculation');
                      if (displayText.includes('{{DATE}}')) displayText = displayText.replace('{{DATE}}', '12 August 2026');

                      // Accurate font size scaling based on displayed height and dynamic text resizing
                      const scale = (displayedImgHeight || 560) / h;
                      const autoFitResult = calculateAutoFitFontSize({
                        text: displayText,
                        maxWidth: el.width,
                        baseFontSize: el.fontSize || 48,
                        fontFamily: el.fontFamily || GLOBAL_ENFORCED_FONT,
                        fontWeight: el.fontWeight || 'bold',
                        fontStyle: el.fontStyle || 'normal',
                        minFontSize: el.minFontSize || 14,
                        safetyPadding: 6,
                      });

                      const scaledFontSize = Math.max(10, Math.round(autoFitResult.fontSize * scale));

                      return (
                        <div
                          key={el.id}
                          onClick={() => setSelectedElementId(el.id)}
                          style={{
                            position: 'absolute',
                            top: `${topPct}%`,
                            left: `${leftPct}%`,
                            width: `${widthPct}%`,
                            textAlign: el.align || 'center',
                            fontFamily: el.fontFamily || GLOBAL_ENFORCED_FONT,
                            fontSize: `${scaledFontSize}px`,
                            fontWeight: el.fontWeight || 'bold',
                            fontStyle: el.fontStyle || 'normal',
                            color: el.color || '#0e1838',
                            padding: '2px 4px',
                            border: isSelected ? '2px dashed #2563eb' : '1px dotted rgba(100, 116, 139, 0.4)',
                            backgroundColor: isSelected ? 'rgba(219, 234, 254, 0.45)' : 'rgba(255, 255, 255, 0.2)',
                            cursor: 'pointer',
                            zIndex: isSelected ? 30 : idx + 1,
                          }}
                          className={`rounded select-none transition-all flex items-center justify-center ${
                            isSelected ? 'shadow-md scale-[1.01]' : 'hover:border-blue-400 hover:bg-white/40'
                          }`}
                        >
                        <span className="drop-shadow-xs truncate max-w-full">{displayText}</span>
                        {autoFitResult.isScaled && (
                          <span className="absolute -bottom-2.5 right-1 px-1 py-0.2 bg-amber-500 text-slate-950 font-mono text-[8px] font-bold rounded shadow-xs">
                            Auto: {autoFitResult.fontSize}px
                          </span>
                        )}
                        {isSelected && (
                          <span className="absolute -top-3 -right-2 px-1.5 py-0.2 bg-blue-600 text-white font-mono text-[9px] rounded font-bold shadow-xs">
                            #{idx + 1}
                          </span>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
      )}

      {/* STEP 4: UPLOAD RECIPIENT NAME LIST */}
      {step === 'upload_names' && (
        <div className="bg-white rounded-2xl border border-slate-200 p-8 shadow-sm space-y-6">
          <div className="flex items-center justify-between border-b border-slate-100 pb-4">
            <div>
              <h2 className="text-xl font-bold text-slate-900">Upload Recipient Name List</h2>
              <p className="text-xs text-slate-500 mt-1">
                Upload an Excel (.xlsx, .xls) or CSV file containing recipient names
              </p>
            </div>
            <button
              onClick={() => setStep('position_name')}
              className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs rounded-xl border border-slate-300 transition-colors flex items-center space-x-1.5"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              <span>Back to Position & Layout</span>
            </button>
          </div>

          <div className="text-center max-w-xl mx-auto space-y-2">
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

            <div className="flex flex-wrap items-center gap-2">
              <button
                onClick={() => setStep('position_name')}
                className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs rounded-xl border border-slate-300 transition-colors flex items-center space-x-1.5"
              >
                <ArrowLeft className="w-3.5 h-3.5" />
                <span>Back to Position & Layout</span>
              </button>
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
          <div className="bg-emerald-50/80 border border-emerald-200 rounded-2xl p-4 space-y-3">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 text-xs">
              <div className="flex items-center space-x-2">
                <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
                <div>
                  <span className="font-extrabold text-emerald-900 text-sm">Smart Detected Name Column: </span>
                  <span className="font-bold text-slate-700">Extracting names from</span>
                  <select
                    value={selectedNameCol}
                    onChange={(e) => setSelectedNameCol(e.target.value)}
                    className="ml-2 bg-white border border-emerald-400 font-extrabold text-emerald-900 rounded-lg px-3 py-1.5 text-xs shadow-xs focus:ring-2 focus:ring-emerald-500"
                  >
                    {columns.map((col) => (
                      <option key={col} value={col}>
                        Column: "{col}"
                      </option>
                    ))}
                  </select>
                </div>
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
                  className="px-3 py-1.5 bg-emerald-600 text-white font-bold text-xs rounded-lg hover:bg-emerald-500 transition-colors flex items-center space-x-1 shadow-xs"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Add Name</span>
                </button>
              </div>
            </div>

            <p className="text-[11px] text-emerald-800 leading-normal border-t border-emerald-200/60 pt-2 font-medium">
              ℹ️ <strong className="font-bold">Certificate Print Guarantee:</strong> Each recipient name below will print on an individual certificate. Every certificate maintains 100% identical background template, layout, static text, signatures, and styling.
            </p>
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
          <div className="flex flex-col sm:flex-row sm:items-center justify-between border-b border-slate-100 pb-4 gap-4">
            <div>
              <div className="flex items-center space-x-2">
                <h2 className="text-xl font-bold text-slate-900">Preview First Certificate</h2>
                <span className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-black bg-cyan-100 text-cyan-800 border border-cyan-300">
                  CMYK PRINT READY
                </span>
              </div>
              <p className="text-xs text-slate-500 mt-0.5">
                Verify recipient name placement on Excel Row 1 (<span className="font-bold text-blue-700">{rows[0]?.[selectedNameCol] || 'Sathya Sai JS'}</span>) before bulk generating
              </p>
            </div>
            <div className="flex flex-wrap items-center gap-2">
              <button
                onClick={() => setStep('position_name')}
                className="px-3.5 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs rounded-xl border border-slate-300 transition-colors flex items-center space-x-1.5"
              >
                <ArrowLeft className="w-3.5 h-3.5" />
                <span>Edit Layout</span>
              </button>
              <button
                onClick={() => setStep('view_names')}
                className="px-3.5 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs rounded-xl border border-slate-300 transition-colors flex items-center space-x-1.5"
              >
                <ArrowLeft className="w-3.5 h-3.5" />
                <span>Edit Recipient List</span>
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
                onClick={() => setStep('position_name')}
                className="px-3.5 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs rounded-xl border border-slate-300 transition-colors flex items-center space-x-1.5"
              >
                <ArrowLeft className="w-3.5 h-3.5" />
                <span>Back to Layout</span>
              </button>
              <button
                onClick={() => setStep('view_names')}
                className="px-3.5 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs rounded-xl border border-slate-300 transition-colors flex items-center space-x-1.5"
              >
                <ArrowLeft className="w-3.5 h-3.5" />
                <span>Back to Recipient List</span>
              </button>
              <button
                onClick={handleDownloadCombined}
                disabled={isExporting}
                className="px-4 py-2 bg-slate-900 hover:bg-slate-800 disabled:opacity-50 text-white font-bold text-xs rounded-xl shadow-sm transition-all flex items-center space-x-1.5"
              >
                <Download className="w-3.5 h-3.5" />
                <span>Download All (Combined PDF)</span>
              </button>
              <button
                onClick={handleDownloadZip}
                disabled={isExporting}
                className="px-4 py-2 bg-blue-600 hover:bg-blue-500 disabled:opacity-50 text-white font-bold text-xs rounded-xl shadow-sm transition-all flex items-center space-x-1.5"
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
      {/* Export Progress Modal Overlay */}
      {isExporting && exportProgress && (
        <div className="fixed inset-0 bg-slate-900/80 backdrop-blur-xs flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 space-y-4 shadow-2xl border border-slate-200 text-center">
            <div className="w-12 h-12 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center mx-auto">
              <RefreshCw className="w-6 h-6 animate-spin" />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-900">{exportProgress.label}</h3>
              <p className="text-xs text-slate-500 mt-1">High-speed hardware-accelerated rendering</p>
            </div>
            <div className="space-y-2">
              <div className="flex justify-between text-xs font-bold text-slate-700">
                <span>Completed:</span>
                <span>
                  {exportProgress.current} / {exportProgress.total} ({((exportProgress.current / (exportProgress.total || 1)) * 100).toFixed(0)}%)
                </span>
              </div>
              <div className="w-full bg-slate-100 h-3 rounded-full overflow-hidden p-0.5 border border-slate-200">
                <div
                  className="bg-blue-600 h-full rounded-full transition-all duration-100"
                  style={{ width: `${(exportProgress.current / (exportProgress.total || 1)) * 100}%` }}
                />
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
