import * as pdfjsLib from 'pdfjs-dist';

// Configure PDF.js worker
pdfjsLib.GlobalWorkerOptions.workerSrc = `https://cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjsLib.version || '4.10.38'}/pdf.worker.min.mjs`;

export async function convertPdfToImageDataUrl(file: File): Promise<{
  dataUrl: string;
  width: number;
  height: number;
  widthMm: number;
  heightMm: number;
  orientation: 'landscape' | 'portrait';
  paperSizeName: string;
}> {
  const arrayBuffer = await file.arrayBuffer();
  const loadingTask = pdfjsLib.getDocument({ data: arrayBuffer });
  const pdf = await loadingTask.promise;
  const page = await pdf.getPage(1);

  // Exact PDF page dimensions in points (1 pt = 1/72 inch)
  const baseViewport = page.getViewport({ scale: 1.0 });
  const pdfWidthPt = baseViewport.width;
  const pdfHeightPt = baseViewport.height;

  // Exact physical size in mm from PDF points: 1 pt = 25.4 / 72 mm
  const widthMm = Number(((pdfWidthPt * 25.4) / 72).toFixed(2));
  const heightMm = Number(((pdfHeightPt * 25.4) / 72).toFixed(2));
  const isLandscape = pdfWidthPt >= pdfHeightPt;

  // High-resolution rendering scale for crisp canvas
  const renderScale = 2.5;
  const viewport = page.getViewport({ scale: renderScale });
  const canvas = document.createElement('canvas');
  const context = canvas.getContext('2d');
  canvas.width = Math.round(viewport.width);
  canvas.height = Math.round(viewport.height);

  if (context) {
    await page.render({ canvasContext: context, viewport, canvas }).promise;
  }

  const dataUrl = canvas.toDataURL('image/png');

  return {
    dataUrl,
    width: Math.round(viewport.width),
    height: Math.round(viewport.height),
    widthMm,
    heightMm,
    orientation: isLandscape ? 'landscape' : 'portrait',
    paperSizeName: `${widthMm} × ${heightMm} mm (Exact PDF Size)`,
  };
}
