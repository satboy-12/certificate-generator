import React, { useState, useRef, useEffect } from 'react';
import {
  CertificateTemplate,
  CertificateSize,
  CanvasElement,
  DynamicFieldDef,
  BrandingSettings,
} from '../../types';
import { Toolbar } from './Toolbar';
import { ElementsSidebar } from './ElementsSidebar';
import { PropertiesPanel } from './PropertiesPanel';
import { processTextTemplate, generateQrDataUrl } from '../../lib/certificateEngine';
import { convertPdfToImageDataUrl } from '../../lib/pdfHelper';
import { convertOttToImageDataUrl } from '../../lib/ottHelper';
import {
  createStyledDynamicField,
  createStyledTextElement,
  enforceGlobalStyling,
  ensureBebasKaiLoaded,
  calculateAutoFitFontSize,
  GLOBAL_ENFORCED_FONT,
} from '../../lib/editorStylingHelper';
import { Move, Layers, AlertCircle, Sparkles } from 'lucide-react';

interface CertificateEditorProps {
  template: CertificateTemplate;
  templatesForProject: CertificateTemplate[];
  branding: BrandingSettings;
  onSaveTemplate: (template: CertificateTemplate) => void;
  onSwitchTemplate: (templateId: string) => void;
  onGenerateClick: () => void;
}

export const CertificateEditor: React.FC<CertificateEditorProps> = ({
  template,
  templatesForProject,
  branding,
  onSaveTemplate,
  onSwitchTemplate,
  onGenerateClick,
}) => {
  const [templateSize, setTemplateSize] = useState<CertificateSize>(template.size);
  const [elements, setElements] = useState<CanvasElement[]>(template.elements || []);
  const [dynamicFields, setDynamicFields] = useState<DynamicFieldDef[]>(template.dynamicFields || []);
  const [backgroundColor, setBackgroundColor] = useState<string>(template.backgroundColor || '#ffffff');
  const [backgroundUrl, setBackgroundUrl] = useState<string | undefined>(template.backgroundUrl);

  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [zoom, setZoom] = useState<number>(0.75);
  const [showGrid, setShowGrid] = useState<boolean>(true);
  const [isPreviewMode, setIsPreviewMode] = useState<boolean>(false);

  // Sync state when active template prop changes
  useEffect(() => {
    setTemplateSize(template.size);
    setElements(template.elements || []);
    setDynamicFields(template.dynamicFields || []);
    setBackgroundColor(template.backgroundColor || '#ffffff');
    setBackgroundUrl(template.backgroundUrl);
  }, [template]);

  // Undo / Redo history
  const [history, setHistory] = useState<CanvasElement[][]>([template.elements || []]);
  const [historyIdx, setHistoryIdx] = useState<number>(0);

  const canvasContainerRef = useRef<HTMLDivElement>(null);

  // Sample preview row data
  const sampleData: Record<string, string> = {
    NAME: 'Sathya Sai',
    EVENT_NAME: 'Cyber Security Workshop 2026',
    DATE: '11 August 2026',
    CATEGORY: 'Participant',
    POSITION: '1st Place Winner',
    CERTIFICATE_ID: 'BSR-2026-0001',
    ORGANIZATION: 'BSROCKS × SeventhSense',
    DEPARTMENT: 'Computer Science',
    COLLEGE: 'Institute of Technology',
    YEAR: '2026',
  };

  // Sync props when template changes
  useEffect(() => {
    setElements(template.elements || []);
    setDynamicFields(template.dynamicFields || []);
    setBackgroundColor(template.backgroundColor || '#ffffff');
    setBackgroundUrl(template.backgroundUrl);
    setHistory([template.elements || []]);
    setHistoryIdx(0);
    setSelectedId(null);
  }, [template.id]);

  const pushHistory = (newElements: CanvasElement[]) => {
    const nextHistory = history.slice(0, historyIdx + 1);
    nextHistory.push(newElements);
    setHistory(nextHistory);
    setHistoryIdx(nextHistory.length - 1);
  };

  const handleUndo = () => {
    if (historyIdx > 0) {
      const prevIdx = historyIdx - 1;
      setHistoryIdx(prevIdx);
      setElements(history[prevIdx]);
    }
  };

  const handleRedo = () => {
    if (historyIdx < history.length - 1) {
      const nextIdx = historyIdx + 1;
      setHistoryIdx(nextIdx);
      setElements(history[nextIdx]);
    }
  };

  // Ensure Bebas Kai font is loaded in browser
  useEffect(() => {
    ensureBebasKaiLoaded();
  }, []);

  // Save current template state
  const handleSave = () => {
    const updatedTemplate: CertificateTemplate = {
      ...template,
      size: templateSize,
      elements,
      dynamicFields,
      backgroundColor,
      backgroundUrl,
      updatedAt: new Date().toISOString(),
    };
    onSaveTemplate(updatedTemplate);
  };

  // Enforce global styling helper across all elements
  const handleEnforceGlobalStyling = () => {
    const enforced = enforceGlobalStyling(elements);
    setElements(enforced);
    pushHistory(enforced);
  };

  // Add new element to canvas
  const handleAddElement = (newEl: CanvasElement) => {
    const updated = [...elements, newEl];
    setElements(updated);
    pushHistory(updated);
    setSelectedId(newEl.id);
  };

  const handleAddText = () => {
    const newEl = createStyledTextElement({
      text: 'Click to edit text',
      name: 'Static Text',
      templateWidth: template.size.pxWidth,
      templateHeight: template.size.pxHeight,
      zIndex: elements.length + 1,
      customY: template.size.pxHeight / 2 - 20,
      customFontSize: 24,
      color: '#0e1838',
      align: 'center',
    });
    handleAddElement(newEl);
  };

  const handleAddDynamicField = (field: DynamicFieldDef) => {
    const w = template.size.pxWidth;
    const newEl = createStyledDynamicField({
      fieldKey: field.key,
      fieldLabel: field.label,
      templateWidth: w,
      templateHeight: template.size.pxHeight,
      zIndex: elements.length + 1,
      customY: template.size.pxHeight / 2 - 30,
      customFontSize: Math.max(48, Math.round(w * 0.048)),
      color: '#0e1838',
    });
    handleAddElement(newEl);
  };

  const handleAddCustomField = (key: string, label: string) => {
    const newField: DynamicFieldDef = { key, label, isCustom: true };
    const updatedFields = [...dynamicFields, newField];
    setDynamicFields(updatedFields);
    handleAddDynamicField(newField);
  };

  const handleAddImage = (type: 'image' | 'logo' | 'signature', src?: string) => {
    const newEl: CanvasElement = {
      id: `${type}_${Date.now()}`,
      type,
      name: type === 'logo' ? 'Company Logo' : type === 'signature' ? 'Signature Line' : 'Image Asset',
      x: template.size.pxWidth / 2 - 75,
      y: template.size.pxHeight / 2 - 40,
      width: 150,
      height: type === 'signature' ? 60 : 80,
      rotation: 0,
      opacity: 1,
      zIndex: elements.length + 1,
      src,
    };
    handleAddElement(newEl);
  };

  const handleAddQrCode = () => {
    const newEl: CanvasElement = {
      id: `qr_${Date.now()}`,
      type: 'qr_code',
      name: 'Verification QR Code',
      x: template.size.pxWidth / 2 - 40,
      y: template.size.pxHeight / 2 - 40,
      width: 80,
      height: 80,
      rotation: 0,
      opacity: 1,
      zIndex: elements.length + 1,
    };
    handleAddElement(newEl);
  };

  const handleAddShape = (type: 'shape' | 'line') => {
    const newEl: CanvasElement = {
      id: `${type}_${Date.now()}`,
      type,
      name: type === 'shape' ? 'Frame Border' : 'Divider Line',
      x: 40,
      y: 40,
      width: type === 'shape' ? template.size.pxWidth - 80 : 200,
      height: type === 'shape' ? template.size.pxHeight - 80 : 2,
      rotation: 0,
      opacity: 1,
      zIndex: elements.length + 1,
      fillColor: type === 'shape' ? 'transparent' : '#000000',
      strokeColor: '#1e293b',
      strokeWidth: 2,
      borderRadius: type === 'shape' ? 8 : 0,
    };
    handleAddElement(newEl);
  };

  const handleUploadBackground = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const isPdf = file.type === 'application/pdf' || file.name.toLowerCase().endsWith('.pdf');
    const isOtt =
      file.name.toLowerCase().endsWith('.ott') ||
      file.name.toLowerCase().endsWith('.odt') ||
      file.type === 'application/vnd.oasis.opendocument.text-template' ||
      file.type === 'application/vnd.oasis.opendocument.text';

    try {
      if (isOtt) {
        const result = await convertOttToImageDataUrl(file);
        setBackgroundUrl(result.dataUrl);
        setTemplateSize({
          name: result.paperSizeName,
          width: result.widthMm,
          height: result.heightMm,
          unit: 'mm',
          pxWidth: result.width,
          pxHeight: result.height,
          orientation: result.orientation,
        });
      } else if (isPdf) {
        const result = await convertPdfToImageDataUrl(file);
        setBackgroundUrl(result.dataUrl);
        setTemplateSize({
          name: result.paperSizeName,
          width: result.widthMm,
          height: result.heightMm,
          unit: 'mm',
          pxWidth: result.width,
          pxHeight: result.height,
          orientation: result.orientation,
        });
      } else {
        const reader = new FileReader();
        reader.onload = (evt) => {
          if (evt.target?.result) {
            const dataUrl = evt.target.result as string;
            setBackgroundUrl(dataUrl);

            const img = new Image();
            img.onload = () => {
              const w = img.naturalWidth || img.width;
              const h = img.naturalHeight || img.height;
              const isLandscape = w >= h;
              const widthMm = Number(((w * 25.4) / 96).toFixed(2));
              const heightMm = Number(((h * 25.4) / 96).toFixed(2));

              setTemplateSize({
                name: `${w} × ${h} px (${widthMm} × ${heightMm} mm Exact Size)`,
                width: widthMm,
                height: heightMm,
                unit: 'mm',
                pxWidth: w,
                pxHeight: h,
                orientation: isLandscape ? 'landscape' : 'portrait',
              });
            };
            img.src = dataUrl;
          }
        };
        reader.readAsDataURL(file);
      }
    } catch (err) {
      console.error('Failed to load background template:', err);
    }
  };

  const handleUpdateElement = (updated: Partial<CanvasElement>) => {
    if (!selectedId) return;
    const updatedList = elements.map((el) => (el.id === selectedId ? { ...el, ...updated } : el));
    setElements(updatedList);
    pushHistory(updatedList);
  };

  const handleDeleteElement = (id: string) => {
    const updatedList = elements.filter((el) => el.id !== id);
    setElements(updatedList);
    pushHistory(updatedList);
    setSelectedId(null);
  };

  const handleDuplicateElement = (id: string) => {
    const found = elements.find((el) => el.id === id);
    if (found) {
      const copy: CanvasElement = {
        ...found,
        id: `${found.type}_${Date.now()}`,
        x: found.x + 20,
        y: found.y + 20,
        zIndex: elements.length + 1,
      };
      const updatedList = [...elements, copy];
      setElements(updatedList);
      pushHistory(updatedList);
      setSelectedId(copy.id);
    }
  };

  const handleMoveLayer = (id: string, direction: 'up' | 'down' | 'front' | 'back') => {
    const targetIdx = elements.findIndex((el) => el.id === id);
    if (targetIdx < 0) return;

    const copy = [...elements];
    const item = copy[targetIdx];

    if (direction === 'up' && targetIdx < copy.length - 1) {
      copy[targetIdx] = copy[targetIdx + 1];
      copy[targetIdx + 1] = item;
    } else if (direction === 'down' && targetIdx > 0) {
      copy[targetIdx] = copy[targetIdx - 1];
      copy[targetIdx - 1] = item;
    }

    // Reassign zIndex values sequentially
    copy.forEach((el, idx) => {
      el.zIndex = idx + 1;
    });

    setElements(copy);
    pushHistory(copy);
  };

  // Dragging / Resizing state on Canvas
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  const [elementStartPos, setElementStartPos] = useState({ x: 0, y: 0 });

  const selectedElement = elements.find((e) => e.id === selectedId) || null;

  const handleMouseDownOnElement = (e: React.MouseEvent, el: CanvasElement) => {
    if (el.locked || isPreviewMode) return;
    e.stopPropagation();
    setSelectedId(el.id);
    setIsDragging(true);
    setDragStart({ x: e.clientX, y: e.clientY });
    setElementStartPos({ x: el.x, y: el.y });
  };

  const handleMouseMoveCanvas = (e: React.MouseEvent) => {
    if (!isDragging || !selectedElement || selectedElement.locked) return;
    const dx = (e.clientX - dragStart.x) / zoom;
    const dy = (e.clientY - dragStart.y) / zoom;

    const newX = Math.round(elementStartPos.x + dx);
    const newY = Math.round(elementStartPos.y + dy);

    const updatedList = elements.map((el) => (el.id === selectedId ? { ...el, x: newX, y: newY } : el));
    setElements(updatedList);
  };

  const handleMouseUpCanvas = () => {
    if (isDragging) {
      setIsDragging(false);
      pushHistory(elements);
    }
  };

  const canvasPxW = templateSize.pxWidth;
  const canvasPxH = templateSize.pxHeight;

  return (
    <div className="flex flex-col h-[calc(100vh-4rem)] bg-slate-950 overflow-hidden">
      {/* Top Toolbar */}
      <Toolbar
        template={{ ...template, size: templateSize }}
        templatesForProject={templatesForProject}
        zoom={zoom}
        showGrid={showGrid}
        isPreviewMode={isPreviewMode}
        onZoomChange={setZoom}
        onToggleGrid={() => setShowGrid(!showGrid)}
        onTogglePreview={() => setIsPreviewMode(!isPreviewMode)}
        onSwitchTemplate={onSwitchTemplate}
        onUploadBackground={handleUploadBackground}
        onSave={handleSave}
        onGenerateClick={onGenerateClick}
        canUndo={historyIdx > 0}
        canRedo={historyIdx < history.length - 1}
        onUndo={handleUndo}
        onRedo={handleRedo}
        onEnforceGlobalStyling={handleEnforceGlobalStyling}
      />

      <div className="flex flex-1 overflow-hidden">
        {/* Left Elements Palette */}
        <ElementsSidebar
          dynamicFields={dynamicFields}
          onAddText={handleAddText}
          onAddDynamicField={handleAddDynamicField}
          onAddCustomField={handleAddCustomField}
          onAddImage={handleAddImage}
          onAddQrCode={handleAddQrCode}
          onAddShape={handleAddShape}
        />

        {/* Center Workspace Canvas */}
        <div
          ref={canvasContainerRef}
          onMouseMove={handleMouseMoveCanvas}
          onMouseUp={handleMouseUpCanvas}
          onClick={() => setSelectedId(null)}
          className="flex-1 bg-slate-950 p-8 overflow-auto flex items-center justify-center relative select-none"
          style={{
            backgroundImage: showGrid
              ? 'radial-gradient(circle, rgba(255,255,255,0.12) 1px, transparent 1px)'
              : 'none',
            backgroundSize: '24px 24px',
          }}
        >
          {/* Certificate Canvas Sheet */}
          <div
            className="relative shadow-2xl transition-all border border-slate-700/80 rounded-sm bg-white overflow-hidden shrink-0"
            style={{
              width: `${canvasPxW}px`,
              height: `${canvasPxH}px`,
              transform: `scale(${zoom})`,
              transformOrigin: 'center center',
              backgroundColor: backgroundColor || '#ffffff',
            }}
          >
            {/* Background Image if uploaded */}
            {backgroundUrl && (
              <img
                src={backgroundUrl}
                alt="Certificate Background"
                className="absolute inset-0 w-full h-full object-cover pointer-events-none"
              />
            )}

            {/* Elements Layer Stacking */}
            {[...elements]
              .sort((a, b) => a.zIndex - b.zIndex)
              .map((el) => {
                const isSelected = el.id === selectedId;

                // Render element content
                let content: React.ReactNode = null;

                if (el.type === 'shape') {
                  content = (
                    <div
                      className="w-full h-full"
                      style={{
                        backgroundColor: el.fillColor || 'transparent',
                        borderColor: el.strokeColor || '#000000',
                        borderWidth: `${el.strokeWidth || 1}px`,
                        borderStyle: el.strokeWidth ? 'solid' : 'none',
                        borderRadius: `${el.borderRadius || 0}px`,
                      }}
                    />
                  );
                } else if (el.type === 'line') {
                  content = (
                    <div
                      className="w-full"
                      style={{
                        height: `${el.strokeWidth || 1}px`,
                        backgroundColor: el.strokeColor || '#000000',
                      }}
                    />
                  );
                } else if (el.type === 'text' || el.type === 'dynamic_field') {
                  const displayedText = isPreviewMode
                    ? processTextTemplate(el.text || '', sampleData, branding, 'BSR-2026-0001')
                    : el.text || '';

                  // Dynamic text-resizing helper: automatically scale font size down if string exceeds plain space width
                  const autoFitResult = calculateAutoFitFontSize({
                    text: displayedText,
                    maxWidth: el.width,
                    baseFontSize: el.fontSize || 16,
                    fontFamily: el.fontFamily || GLOBAL_ENFORCED_FONT,
                    fontWeight: el.fontWeight || 'bold',
                    fontStyle: el.fontStyle || 'normal',
                    minFontSize: el.minFontSize || 14,
                    safetyPadding: 8,
                  });

                  const activeFontSize = autoFitResult.fontSize;
                  const isAutoScaled = autoFitResult.isScaled;
                  const isCentered = el.align === 'center' || el.type === 'dynamic_field';

                  content = (
                    <div
                      className="w-full h-full flex items-center relative overflow-hidden"
                      style={{
                        justifyContent: isCentered
                          ? 'center'
                          : el.align === 'right'
                          ? 'flex-end'
                          : 'flex-start',
                        fontFamily: el.fontFamily || GLOBAL_ENFORCED_FONT,
                        fontSize: `${activeFontSize}px`,
                        fontWeight: el.fontWeight || 'bold',
                        fontStyle: el.fontStyle || 'normal',
                        textDecoration: el.textDecoration || 'none',
                        color: el.color || '#0e1838',
                        textAlign: isCentered ? 'center' : (el.align || 'left'),
                        whiteSpace: 'nowrap',
                      }}
                    >
                      <span className="max-w-full truncate">{displayedText}</span>

                      {/* Dynamic auto-fit resize indicator badge */}
                      {isAutoScaled && (
                        <span
                          className="absolute -bottom-3 right-0 bg-amber-500 text-slate-950 font-mono text-[8px] font-extrabold px-1 py-0.2 rounded shadow-xs uppercase tracking-tight pointer-events-none"
                          title={`Auto-resized from ${el.fontSize}px to ${activeFontSize}px to fit width`}
                        >
                          Auto: {activeFontSize}px
                        </span>
                      )}
                    </div>
                  );
                } else if (el.type === 'qr_code') {
                  content = (
                    <div className="w-full h-full bg-slate-100 border border-slate-300 p-1 rounded flex flex-col items-center justify-center text-center">
                      <div className="w-full h-full bg-slate-900 text-white font-mono text-[9px] flex items-center justify-center rounded">
                        QR VERIFY
                      </div>
                    </div>
                  );
                } else if (el.type === 'image' || el.type === 'logo' || el.type === 'signature') {
                  let imgSrc = el.src;
                  if (!imgSrc) {
                    if (el.type === 'logo') imgSrc = branding.bsrocksLogo || branding.organizationLogo;
                    else if (el.type === 'signature') imgSrc = branding.signatureImage;
                  }

                  content = imgSrc ? (
                    <img src={imgSrc} alt={el.name} className="w-full h-full object-contain pointer-events-none" />
                  ) : (
                    <div className="w-full h-full border border-dashed border-slate-400 bg-slate-100/80 flex items-center justify-center text-[11px] text-slate-500 font-medium p-1 text-center">
                      {el.name}
                    </div>
                  );
                }

                return (
                  <div
                    key={el.id}
                    onMouseDown={(e) => handleMouseDownOnElement(e, el)}
                    className={`absolute transition-shadow ${
                      isSelected && !isPreviewMode
                        ? 'ring-2 ring-blue-600 ring-offset-1 z-50 cursor-move'
                        : 'hover:ring-1 hover:ring-blue-400/80'
                    }`}
                    style={{
                      left: `${el.x}px`,
                      top: `${el.y}px`,
                      width: `${el.width}px`,
                      height: `${el.height}px`,
                      transform: `rotate(${el.rotation || 0}deg)`,
                      opacity: el.opacity ?? 1,
                      zIndex: el.zIndex,
                    }}
                  >
                    {content}

                    {/* Visually mark dynamic merge fields */}
                    {el.type === 'dynamic_field' && !isPreviewMode && (
                      <span className="absolute -top-3.5 left-0 bg-blue-600 text-white font-mono text-[9px] px-1 py-0.2 rounded font-bold shadow-xs">
                        {`{{${el.dynamicFieldKey}}}`}
                      </span>
                    )}
                  </div>
                );
              })}
          </div>
        </div>

        {/* Right Properties Panel */}
        <PropertiesPanel
          selectedElement={selectedElement}
          onUpdateElement={handleUpdateElement}
          onDeleteElement={handleDeleteElement}
          onDuplicateElement={handleDuplicateElement}
          onMoveLayer={handleMoveLayer}
        />
      </div>
    </div>
  );
};
