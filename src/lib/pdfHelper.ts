import * as pdfjsLib from 'pdfjs-dist';

// Configure PDF.js worker
pdfjsLib.GlobalWorkerOptions.workerSrc = `https://cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjsLib.version || '4.10.38'}/pdf.worker.min.mjs`;

export async function convertPdfToImageDataUrl(file: File): Promise<{
  dataUrl: string;
  width: number;
  height: number;
  orientation: 'landscape' | 'portrait';
  paperSizeName: string;
}> {
  const arrayBuffer = await file.arrayBuffer();
  const loadingTask = pdfjsLib.getDocument({ data: arrayBuffer });
  const pdf = await loadingTask.promise;
  const page = await pdf.getPage(1);

  // High resolution scale
  const viewport = page.getViewport({ scale: 2.5 });
  const canvas = document.createElement('canvas');
  const context = canvas.getContext('2d');
  canvas.width = viewport.width;
  canvas.height = viewport.height;

  if (context) {
    await page.render({ canvasContext: context, viewport, canvas }).promise;
  }

  const dataUrl = canvas.toDataURL('image/png');
  const isLandscape = viewport.width > viewport.height;

  return {
    dataUrl,
    width: Math.round(viewport.width),
    height: Math.round(viewport.height),
    orientation: isLandscape ? 'landscape' : 'portrait',
    paperSizeName: isLandscape ? 'A4 Landscape (PDF Master)' : 'A4 Portrait (PDF Master)',
  };
}
