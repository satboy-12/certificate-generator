import JSZip from 'jszip';
import { CanvasElement } from '../types';
import { createStyledDynamicField, GLOBAL_ENFORCED_FONT } from './editorStylingHelper';

export interface OttConversionResult {
  dataUrl: string;
  width: number;
  height: number;
  widthMm: number;
  heightMm: number;
  orientation: 'landscape' | 'portrait';
  paperSizeName: string;
  elements: CanvasElement[];
  extractedText: string[];
}

/**
 * Converts unit string (e.g. "29.7cm", "210mm", "8.5in", "842pt") to pixels at 96 DPI
 */
function parseDimensionToPx(dimStr: string | null | undefined, defaultValue: number): number {
  if (!dimStr) return defaultValue;
  const str = dimStr.trim().toLowerCase();
  const num = parseFloat(str);
  if (isNaN(num)) return defaultValue;

  if (str.endsWith('cm')) {
    return Math.round((num / 2.54) * 96);
  }
  if (str.endsWith('mm')) {
    return Math.round((num / 25.4) * 96);
  }
  if (str.endsWith('in')) {
    return Math.round(num * 96);
  }
  if (str.endsWith('pt')) {
    return Math.round((num / 72) * 96);
  }
  if (str.endsWith('px')) {
    return Math.round(num);
  }
  return Math.round(num);
}

/**
 * Helper to convert Blob to base64 Data URL
 */
function blobToDataUrl(blob: Blob): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = reject;
    reader.readAsDataURL(blob);
  });
}

/**
 * Loads an image from a Data URL or URL and returns HTMLImageElement
 */
function loadImage(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => resolve(img);
    img.onerror = reject;
    img.src = src;
  });
}

/**
 * Parses an OpenDocument Text Template (.ott) or OpenDocument Text (.odt) file
 * and converts it into a high-resolution canvas master image with extracted dynamic fields.
 */
export async function convertOttToImageDataUrl(file: File): Promise<OttConversionResult> {
  const arrayBuffer = await file.arrayBuffer();
  const zip = await JSZip.loadAsync(arrayBuffer);

  let thumbnailDataUrl: string | null = null;
  let largestPictureDataUrl: string | null = null;
  let largestPictureSize = 0;
  const embeddedPictures: { name: string; dataUrl: string; size: number }[] = [];

  // 1. Check for Thumbnail (LibreOffice/OpenOffice default embedded render)
  const thumbnailEntry = zip.file('Thumbnails/thumbnail.png') || zip.file('thumbnails/thumbnail.png');
  if (thumbnailEntry) {
    const thumbBlob = await thumbnailEntry.async('blob');
    thumbnailDataUrl = await blobToDataUrl(thumbBlob);
  }

  // 2. Check for embedded images in Pictures/
  const pictureFiles = Object.keys(zip.files).filter(
    (path) =>
      path.startsWith('Pictures/') ||
      path.startsWith('pictures/') ||
      path.endsWith('.png') ||
      path.endsWith('.jpg') ||
      path.endsWith('.jpeg') ||
      path.endsWith('.svg')
  );

  for (const picPath of pictureFiles) {
    if (picPath.toLowerCase().includes('thumbnail')) continue;
    const fileEntry = zip.file(picPath);
    if (fileEntry) {
      try {
        const picBlob = await fileEntry.async('blob');
        if (picBlob.size > 2000) { // filter out tiny icons
          const picDataUrl = await blobToDataUrl(picBlob);
          embeddedPictures.push({ name: picPath, dataUrl: picDataUrl, size: picBlob.size });
          if (picBlob.size > largestPictureSize) {
            largestPictureSize = picBlob.size;
            largestPictureDataUrl = picDataUrl;
          }
        }
      } catch (err) {
        console.warn(`Failed reading picture ${picPath}:`, err);
      }
    }
  }

  // 3. Parse styles.xml for page dimensions & orientation
  let docWidth = 1123; // default A4 landscape width (standard for certificates)
  let docHeight = 794;  // default A4 landscape height
  let orientation: 'landscape' | 'portrait' = 'landscape';
  let paperSizeName = 'A4 Landscape (OTT Master)';

  const stylesEntry = zip.file('styles.xml');
  if (stylesEntry) {
    try {
      const stylesXml = await stylesEntry.async('text');
      const parser = new DOMParser();
      const doc = parser.parseFromString(stylesXml, 'application/xml');

      const pageLayoutProps = doc.getElementsByTagName('style:page-layout-properties')[0];
      if (pageLayoutProps) {
        const widthAttr =
          pageLayoutProps.getAttribute('fo:page-width') ||
          pageLayoutProps.getAttribute('page-width');
        const heightAttr =
          pageLayoutProps.getAttribute('fo:page-height') ||
          pageLayoutProps.getAttribute('page-height');
        const orientationAttr =
          pageLayoutProps.getAttribute('style:print-orientation') ||
          pageLayoutProps.getAttribute('print-orientation');

        if (widthAttr && heightAttr) {
          const parsedW = parseDimensionToPx(widthAttr, 1123);
          const parsedH = parseDimensionToPx(heightAttr, 794);
          if (parsedW > 100 && parsedH > 100) {
            docWidth = parsedW;
            docHeight = parsedH;
          }
        }

        if (orientationAttr) {
          orientation = orientationAttr.toLowerCase() === 'portrait' ? 'portrait' : 'landscape';
        } else {
          orientation = docWidth >= docHeight ? 'landscape' : 'portrait';
        }
      }
    } catch (e) {
      console.warn('Failed to parse styles.xml:', e);
    }
  }

  const widthMm = Number(((docWidth * 25.4) / 96).toFixed(2));
  const heightMm = Number(((docHeight * 25.4) / 96).toFixed(2));
  paperSizeName = `${widthMm} × ${heightMm} mm (Exact OTT Template)`;

  // 4. Parse content.xml for text, headings, and dynamic fields
  const extractedTextLines: string[] = [];
  const detectedVariables: string[] = [];

  const contentEntry = zip.file('content.xml');
  if (contentEntry) {
    try {
      const contentXml = await contentEntry.async('text');
      const parser = new DOMParser();
      const doc = parser.parseFromString(contentXml, 'application/xml');

      // Extract paragraphs & text spans
      const paragraphs = doc.getElementsByTagName('text:p');
      for (let i = 0; i < paragraphs.length; i++) {
        const textContent = (paragraphs[i].textContent || '').trim();
        if (textContent) {
          extractedTextLines.push(textContent);

          // Check for placeholders like {{NAME}}, {{Recipient}}, <Name>, [Name]
          const placeholderMatches = textContent.match(/\{\{([^}]+)\}\}|<([^>]+)>|\[([^\]]+)\]/g);
          if (placeholderMatches) {
            placeholderMatches.forEach((m) => {
              const cleanKey = m.replace(/[{<>[\]}]/g, '').trim();
              if (cleanKey && !detectedVariables.includes(cleanKey)) {
                detectedVariables.push(cleanKey);
              }
            });
          }
        }
      }
    } catch (e) {
      console.warn('Failed to parse content.xml:', e);
    }
  }

  // 5. Render high-resolution master template canvas
  // High-DPI canvas scale for print clarity
  const renderScale = 2.0;
  const canvasWidth = Math.round(docWidth * renderScale);
  const canvasHeight = Math.round(docHeight * renderScale);

  const canvas = document.createElement('canvas');
  canvas.width = canvasWidth;
  canvas.height = canvasHeight;
  const ctx = canvas.getContext('2d');

  if (ctx) {
    ctx.imageSmoothingEnabled = true;
    ctx.imageSmoothingQuality = 'high';

    // Base background
    ctx.fillStyle = '#FFFFFF';
    ctx.fillRect(0, 0, canvasWidth, canvasHeight);

    let backgroundRendered = false;

    // Prefer high-res embedded picture if large (e.g. background certificate graphic)
    if (largestPictureDataUrl && largestPictureSize > 50000) {
      try {
        const picImg = await loadImage(largestPictureDataUrl);
        ctx.drawImage(picImg, 0, 0, canvasWidth, canvasHeight);
        backgroundRendered = true;
      } catch (err) {
        console.warn('Could not draw largest picture:', err);
      }
    }

    // If no large picture, or as composite base, use the document thumbnail
    if (!backgroundRendered && thumbnailDataUrl) {
      try {
        const thumbImg = await loadImage(thumbnailDataUrl);
        ctx.drawImage(thumbImg, 0, 0, canvasWidth, canvasHeight);
        backgroundRendered = true;
      } catch (err) {
        console.warn('Could not draw thumbnail image:', err);
      }
    }

    // If still no graphic background found (e.g. text-only document), render elegant certificate framing
    if (!backgroundRendered) {
      // Soft cream background
      ctx.fillStyle = '#FCFDFE';
      ctx.fillRect(0, 0, canvasWidth, canvasHeight);

      // Gold & Navy ornamental border
      const pad = Math.round(40 * renderScale);
      ctx.strokeStyle = '#C5A059'; // Gold
      ctx.lineWidth = 4 * renderScale;
      ctx.strokeRect(pad, pad, canvasWidth - pad * 2, canvasHeight - pad * 2);

      const innerPad = Math.round(52 * renderScale);
      ctx.strokeStyle = '#0E1838'; // Dark Navy
      ctx.lineWidth = 1.5 * renderScale;
      ctx.strokeRect(innerPad, innerPad, canvasWidth - innerPad * 2, canvasHeight - innerPad * 2);

      // Render extracted heading text
      ctx.textAlign = 'center';
      ctx.fillStyle = '#0E1838';
      ctx.font = `bold ${Math.round(36 * renderScale)}px "${GLOBAL_ENFORCED_FONT}", serif`;

      let curY = Math.round(120 * renderScale);
      if (extractedTextLines.length > 0) {
        const titleLine = extractedTextLines[0] || 'CERTIFICATE OF APPRECIATION';
        ctx.fillText(titleLine.toUpperCase(), canvasWidth / 2, curY);
        curY += Math.round(45 * renderScale);

        if (extractedTextLines.length > 1) {
          ctx.font = `normal ${Math.round(18 * renderScale)}px sans-serif`;
          ctx.fillStyle = '#475569';
          ctx.fillText(extractedTextLines[1], canvasWidth / 2, curY);
        }
      } else {
        ctx.fillText('CERTIFICATE OF RECOGNITION', canvasWidth / 2, curY);
      }
    }
  }

  const finalDataUrl = canvas.toDataURL('image/png', 0.95);

  // 6. Generate Default Elements
  const boxWidth = Math.round(docWidth * 0.85);
  const calculatedFontSize = Math.max(48, Math.round(docWidth * 0.048));

  // If detected variable like NAME or Recipient, use that
  const primaryKey = detectedVariables.find((v) =>
    ['name', 'recipient', 'fullname', 'candidate', 'student'].some((k) => v.toLowerCase().includes(k))
  ) || 'NAME';

  const defaultNameElement = createStyledDynamicField({
    fieldKey: primaryKey,
    fieldLabel: 'Recipient Name',
    templateWidth: docWidth,
    templateHeight: docHeight,
    zIndex: 10,
    customY: Math.round(docHeight * 0.44),
    customFontSize: calculatedFontSize,
    color: '#0e1838',
  });

  return {
    dataUrl: finalDataUrl,
    width: docWidth,
    height: docHeight,
    widthMm,
    heightMm,
    orientation,
    paperSizeName,
    elements: [defaultNameElement],
    extractedText: extractedTextLines,
  };
}
