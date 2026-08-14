import QRCode from 'qrcode';
import { jsPDF } from 'jspdf';
import JSZip from 'jszip';
import { saveAs } from 'file-saver';
import {
  CertificateTemplate,
  GeneratedCertificate,
  CanvasElement,
  BrandingSettings,
} from '../types';

// ==========================================
// HIGH-SPEED IN-MEMORY IMAGE & ASSET CACHES
// Eliminates repetitive image decoding delays
// ==========================================
const imageCache = new Map<string, HTMLImageElement>();
const imagePendingMap = new Map<string, Promise<HTMLImageElement | null>>();
const qrCache = new Map<string, string>();

export async function getLoadedImage(src: string): Promise<HTMLImageElement | null> {
  if (!src) return null;
  const cached = imageCache.get(src);
  if (cached && cached.complete && cached.naturalWidth > 0) {
    return cached;
  }
  if (imagePendingMap.has(src)) {
    return imagePendingMap.get(src)!;
  }

  const promise = new Promise<HTMLImageElement | null>((resolve) => {
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => {
      imageCache.set(src, img);
      imagePendingMap.delete(src);
      resolve(img);
    };
    img.onerror = () => {
      imagePendingMap.delete(src);
      resolve(null);
    };
    img.src = src;
  });

  imagePendingMap.set(src, promise);
  return promise;
}

// Generate QR Code as Data URL with caching
export async function generateQrDataUrl(text: string): Promise<string> {
  if (!text) return '';
  if (qrCache.has(text)) {
    return qrCache.get(text)!;
  }
  try {
    const dataUrl = await QRCode.toDataURL(text, {
      margin: 1,
      width: 250,
      color: {
        dark: '#0f172a',
        light: '#ffffff',
      },
    });
    qrCache.set(text, dataUrl);
    return dataUrl;
  } catch (err) {
    console.error('Failed to generate QR code data URL:', err);
    return '';
  }
}

// Replace dynamic expressions like {{NAME}} or {{EVENT_NAME}} with recipient data values
export function processTextTemplate(
  text: string,
  data: Record<string, string>,
  branding: BrandingSettings,
  certNumber: string
): string {
  if (!text) return '';

  let result = text;

  // Global variables replacement
  result = result.replace(/\{\{CERTIFICATE_ID\}\}/g, certNumber || data['CERTIFICATE_ID'] || 'BSR-2026-0001');
  
  const verifyUrl = `${branding.verificationBaseUrl}/verify/${certNumber || data['CERTIFICATE_ID'] || ''}`;
  result = result.replace(/\{\{VERIFY_URL\}\}/g, verifyUrl);

  // Replace each data field key e.g. {{NAME}} or {{Name}}
  Object.keys(data).forEach((key) => {
    const val = data[key] ?? '';
    const regex1 = new RegExp(`\\{\\{${key}\\}\\}`, 'gi');
    result = result.replace(regex1, val);
  });

  return result;
}

// Check if an element is completely static
function isElementStatic(el: CanvasElement): boolean {
  if (el.type === 'shape' || el.type === 'line' || el.type === 'image' || el.type === 'logo' || el.type === 'signature') {
    return true;
  }
  if (el.type === 'text') {
    const text = el.text || '';
    return !text.includes('{{');
  }
  return false;
}

// Pre-render static background and fixed elements to an offscreen canvas
export async function createStaticLayerCanvas(
  template: CertificateTemplate,
  branding: BrandingSettings,
  customElements?: CanvasElement[]
): Promise<HTMLCanvasElement> {
  const canvas = document.createElement('canvas');
  const width = template.size.pxWidth;
  const height = template.size.pxHeight;
  canvas.width = width;
  canvas.height = height;

  const ctx = canvas.getContext('2d');
  if (!ctx) return canvas;

  ctx.clearRect(0, 0, width, height);
  ctx.fillStyle = template.backgroundColor || '#ffffff';
  ctx.fillRect(0, 0, width, height);

  if (template.backgroundUrl) {
    const bgImg = await getLoadedImage(template.backgroundUrl);
    if (bgImg) {
      ctx.drawImage(bgImg, 0, 0, width, height);
    }
  }

  const elements = customElements || template.elements;
  const sortedElements = [...elements].sort((a, b) => a.zIndex - b.zIndex);

  for (const el of sortedElements) {
    if (!isElementStatic(el)) continue;

    ctx.save();
    ctx.globalAlpha = el.opacity ?? 1;

    if (el.rotation) {
      const centerX = el.x + el.width / 2;
      const centerY = el.y + el.height / 2;
      ctx.translate(centerX, centerY);
      ctx.rotate((el.rotation * Math.PI) / 180);
      ctx.translate(-centerX, -centerY);
    }

    if (el.type === 'shape') {
      ctx.fillStyle = el.fillColor || 'transparent';
      ctx.strokeStyle = el.strokeColor || '#000000';
      ctx.lineWidth = el.strokeWidth || 1;

      if (el.borderRadius && el.borderRadius > 0) {
        ctx.beginPath();
        ctx.roundRect(el.x, el.y, el.width, el.height, el.borderRadius);
        if (el.fillColor && el.fillColor !== 'transparent') ctx.fill();
        if (el.strokeWidth && el.strokeWidth > 0) ctx.stroke();
      } else {
        if (el.fillColor && el.fillColor !== 'transparent') {
          ctx.fillRect(el.x, el.y, el.width, el.height);
        }
        if (el.strokeWidth && el.strokeWidth > 0) {
          ctx.strokeRect(el.x, el.y, el.width, el.height);
        }
      }
    } else if (el.type === 'line') {
      ctx.strokeStyle = el.strokeColor || '#000000';
      ctx.lineWidth = el.strokeWidth || 1;
      ctx.beginPath();
      ctx.moveTo(el.x, el.y);
      ctx.lineTo(el.x + el.width, el.y);
      ctx.stroke();
    } else if (el.type === 'text') {
      const fontStyle = el.fontStyle || 'normal';
      const fontWeight = el.fontWeight || 'normal';
      const fontSize = el.fontSize || 16;
      const fontFamily = el.fontFamily || 'sans-serif';

      ctx.font = `${fontStyle} ${fontWeight} ${fontSize}px ${fontFamily}`;
      ctx.fillStyle = el.color || '#0f172a';
      ctx.textAlign = (el.align === 'center' || el.align === 'right' ? el.align : 'left') as CanvasTextAlign;
      ctx.textBaseline = 'top';

      let drawX = el.x;
      if (el.align === 'center') {
        drawX = el.x + el.width / 2;
      } else if (el.align === 'right') {
        drawX = el.x + el.width;
      }

      const lineHeight = fontSize * 1.35;
      const maxWidth = el.width;
      const paragraphs = (el.text || '').split('\n');

      let currentLineY = el.y;
      for (const paragraph of paragraphs) {
        if (!paragraph.trim()) {
          currentLineY += lineHeight;
          continue;
        }
        const words = paragraph.split(' ');
        let currentLine = '';

        for (const word of words) {
          const testLine = currentLine ? `${currentLine} ${word}` : word;
          const metrics = ctx.measureText(testLine);
          if (metrics.width > maxWidth && currentLine !== '') {
            ctx.fillText(currentLine, drawX, currentLineY);
            currentLineY += lineHeight;
            currentLine = word;
          } else {
            currentLine = testLine;
          }
        }
        if (currentLine) {
          ctx.fillText(currentLine, drawX, currentLineY);
          currentLineY += lineHeight;
        }
      }
    } else if (el.type === 'image' || el.type === 'logo' || el.type === 'signature') {
      let imageSrc = el.src;
      if (!imageSrc) {
        if (el.type === 'logo') {
          if (el.name.toLowerCase().includes('bsrocks')) imageSrc = branding.bsrocksLogo;
          else if (el.name.toLowerCase().includes('seventhsense')) imageSrc = branding.seventhSenseLogo;
          else imageSrc = branding.organizationLogo || branding.bsrocksLogo;
        } else if (el.type === 'signature') {
          imageSrc = branding.signatureImage;
        }
      }

      if (imageSrc) {
        const img = await getLoadedImage(imageSrc);
        if (img) {
          ctx.drawImage(img, el.x, el.y, el.width, el.height);
        }
      }
    }

    ctx.restore();
  }

  return canvas;
}

// Render dynamic elements over an existing canvas context
async function renderDynamicElements(
  ctx: CanvasRenderingContext2D,
  template: CertificateTemplate,
  data: Record<string, string>,
  certNumber: string,
  branding: BrandingSettings,
  customElements?: CanvasElement[]
): Promise<void> {
  const elements = customElements || template.elements;
  const sortedElements = [...elements].sort((a, b) => a.zIndex - b.zIndex);

  for (const el of sortedElements) {
    if (isElementStatic(el)) continue;

    ctx.save();
    ctx.globalAlpha = el.opacity ?? 1;

    if (el.rotation) {
      const centerX = el.x + el.width / 2;
      const centerY = el.y + el.height / 2;
      ctx.translate(centerX, centerY);
      ctx.rotate((el.rotation * Math.PI) / 180);
      ctx.translate(-centerX, -centerY);
    }

    if (el.type === 'text' || el.type === 'dynamic_field') {
      const formattedText = processTextTemplate(el.text || '', data, branding, certNumber);

      const fontStyle = el.fontStyle || 'normal';
      const fontWeight = el.fontWeight || 'normal';
      const fontSize = el.fontSize || 16;
      const fontFamily = el.fontFamily || 'sans-serif';

      ctx.font = `${fontStyle} ${fontWeight} ${fontSize}px ${fontFamily}`;
      ctx.fillStyle = el.color || '#0f172a';
      ctx.textAlign = (el.align === 'center' || el.align === 'right' ? el.align : 'left') as CanvasTextAlign;
      ctx.textBaseline = 'top';

      let drawX = el.x;
      if (el.align === 'center') {
        drawX = el.x + el.width / 2;
      } else if (el.align === 'right') {
        drawX = el.x + el.width;
      }

      const lineHeight = fontSize * 1.35;
      const maxWidth = el.width;

      const paragraphs = formattedText.split('\n');
      let currentLineY = el.y;

      for (const paragraph of paragraphs) {
        if (!paragraph.trim()) {
          currentLineY += lineHeight;
          continue;
        }
        const words = paragraph.split(' ');
        let currentLine = '';

        for (const word of words) {
          const testLine = currentLine ? `${currentLine} ${word}` : word;
          const metrics = ctx.measureText(testLine);
          if (metrics.width > maxWidth && currentLine !== '') {
            ctx.fillText(currentLine, drawX, currentLineY);
            currentLineY += lineHeight;
            currentLine = word;
          } else {
            currentLine = testLine;
          }
        }
        if (currentLine) {
          ctx.fillText(currentLine, drawX, currentLineY);
          currentLineY += lineHeight;
        }
      }
    } else if (el.type === 'qr_code') {
      const verifyUrl = `${branding.verificationBaseUrl}/verify/${certNumber}`;
      const qrDataUrl = await generateQrDataUrl(verifyUrl);
      if (qrDataUrl) {
        const img = await getLoadedImage(qrDataUrl);
        if (img) {
          ctx.drawImage(img, el.x, el.y, el.width, el.height);
        }
      }
    }

    ctx.restore();
  }
}

// Render certificate to an HTML Canvas
export async function renderCertificateToCanvas(
  canvas: HTMLCanvasElement,
  template: CertificateTemplate,
  data: Record<string, string>,
  certNumber: string,
  branding: BrandingSettings,
  customElementsOverridden?: CanvasElement[],
  preloadedStaticCanvas?: HTMLCanvasElement
): Promise<void> {
  const ctx = canvas.getContext('2d');
  if (!ctx) return;

  const width = template.size.pxWidth;
  const height = template.size.pxHeight;

  if (canvas.width !== width || canvas.height !== height) {
    canvas.width = width;
    canvas.height = height;
  }

  // Fast path: use preloaded static background layer
  if (preloadedStaticCanvas) {
    ctx.clearRect(0, 0, width, height);
    ctx.drawImage(preloadedStaticCanvas, 0, 0, width, height);
  } else {
    // Generate static layer on the fly
    const staticCanvas = await createStaticLayerCanvas(template, branding, customElementsOverridden);
    ctx.clearRect(0, 0, width, height);
    ctx.drawImage(staticCanvas, 0, 0, width, height);
  }

  // Render dynamic elements (recipient names, certificate numbers, QR codes)
  await renderDynamicElements(
    ctx,
    template,
    data,
    certNumber,
    branding,
    customElementsOverridden
  );
}

// Convert Canvas to High Quality PDF Blob/Doc
export async function createPdfFromTemplate(
  template: CertificateTemplate,
  data: Record<string, string>,
  certNumber: string,
  branding: BrandingSettings,
  customElementsOverridden?: CanvasElement[],
  preloadedStaticCanvas?: HTMLCanvasElement
): Promise<{ doc: jsPDF; filename: string; dataUrl: string }> {
  const offscreenCanvas = document.createElement('canvas');
  await renderCertificateToCanvas(
    offscreenCanvas,
    template,
    data,
    certNumber,
    branding,
    customElementsOverridden,
    preloadedStaticCanvas
  );

  const orientation = template.size.orientation === 'landscape' ? 'l' : 'p';
  const unit = 'mm';
  const widthMm = template.size.width;
  const heightMm = template.size.height;

  const pdf = new jsPDF({
    orientation,
    unit,
    format: [widthMm, heightMm],
    compress: true,
  });

  const imgData = offscreenCanvas.toDataURL('image/jpeg', 0.95);
  pdf.addImage(imgData, 'JPEG', 0, 0, widthMm, heightMm);

  const safeRecipient = (data['NAME'] || data['Name'] || 'Certificate').replace(/[^a-zA-Z0-9_-]/g, '_');
  const filename = `${certNumber}_${safeRecipient}.pdf`;

  return {
    doc: pdf,
    filename,
    dataUrl: imgData,
  };
}

// Export single certificate as PDF download
export async function downloadCertificatePdf(
  template: CertificateTemplate,
  cert: GeneratedCertificate,
  branding: BrandingSettings
): Promise<void> {
  const { doc, filename } = await createPdfFromTemplate(
    template,
    cert.data,
    cert.certificateNumber,
    branding,
    cert.customElementsOverridden
  );

  doc.save(filename);
}

// Export multiple selected or all certificates into a single multi-page PDF document (High Speed)
export async function downloadCombinedPdf(
  template: CertificateTemplate,
  certificates: GeneratedCertificate[],
  branding: BrandingSettings,
  onProgress?: (current: number, total: number) => void
): Promise<void> {
  if (certificates.length === 0) return;

  const orientation = template.size.orientation === 'landscape' ? 'l' : 'p';
  const widthMm = template.size.width;
  const heightMm = template.size.height;

  const combinedPdf = new jsPDF({
    orientation,
    unit: 'mm',
    format: [widthMm, heightMm],
    compress: true,
  });

  // Pre-render static background canvas once
  const staticCanvas = await createStaticLayerCanvas(template, branding);
  const offscreenCanvas = document.createElement('canvas');

  for (let i = 0; i < certificates.length; i++) {
    const cert = certificates[i];
    if (i > 0) {
      combinedPdf.addPage([widthMm, heightMm], orientation);
    }

    await renderCertificateToCanvas(
      offscreenCanvas,
      template,
      cert.data,
      cert.certificateNumber,
      branding,
      cert.customElementsOverridden,
      staticCanvas
    );

    const imgData = offscreenCanvas.toDataURL('image/jpeg', 0.92);
    combinedPdf.addImage(imgData, 'JPEG', 0, 0, widthMm, heightMm);

    if (onProgress && (i % 2 === 0 || i === certificates.length - 1)) {
      onProgress(i + 1, certificates.length);
    }
  }

  combinedPdf.save(`BSROCKS_SeventhSense_Certificates_Combined_${Date.now()}.pdf`);
}

// Export all certificates as individual PDFs bundled inside a single ZIP file (High Speed Concurrency)
export async function downloadCertificatesZip(
  template: CertificateTemplate,
  certificates: GeneratedCertificate[],
  branding: BrandingSettings,
  onProgress?: (current: number, total: number) => void
): Promise<void> {
  if (certificates.length === 0) return;

  const zip = new JSZip();
  const folder = zip.folder('Certificates');

  // Pre-render static background canvas once
  const staticCanvas = await createStaticLayerCanvas(template, branding);

  // Parallel batches of 4-6 certificates for maximum throughput
  const CONCURRENCY = 6;
  let completedCount = 0;

  for (let i = 0; i < certificates.length; i += CONCURRENCY) {
    const batch = certificates.slice(i, i + CONCURRENCY);
    await Promise.all(
      batch.map(async (cert, bIdx) => {
        const globalIdx = i + bIdx;
        const rowNumStr = String(globalIdx + 1).padStart(3, '0');
        const safeName = cert.recipientName.replace(/[^a-zA-Z0-9]/g, '-');
        const filename = `${rowNumStr}-${safeName}.pdf`;

        const { doc } = await createPdfFromTemplate(
          template,
          cert.data,
          cert.certificateNumber,
          branding,
          cert.customElementsOverridden,
          staticCanvas
        );

        const pdfArrayBuffer = doc.output('arraybuffer');
        folder?.file(filename, pdfArrayBuffer);

        completedCount++;
        if (onProgress) {
          onProgress(completedCount, certificates.length);
        }
      })
    );
  }

  const content = await zip.generateAsync({
    type: 'blob',
    compression: 'DEFLATE',
    compressionOptions: { level: 4 },
  });
  saveAs(content, `BSROCKS_SeventhSense_Certificates_${Date.now()}.zip`);
}

