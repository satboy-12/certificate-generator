import { CanvasElement } from '../types';

// ============================================================================
// GLOBAL EDITOR STYLING HELPER
// Enforces 'Bebas Kai' font style across all text elements, forces center
// alignment on all dynamic fields, and dynamically auto-resizes recipient names
// and variables to fit within the designated plain space width while centered.
// ============================================================================

export const GLOBAL_ENFORCED_FONT = 'Bebas Kai';
export const GLOBAL_ENFORCED_DYNAMIC_ALIGN: 'left' | 'center' | 'right' = 'center';

export interface AutoFitOptions {
  text: string;
  maxWidth: number;
  baseFontSize: number;
  fontFamily?: string;
  fontWeight?: string;
  fontStyle?: string;
  minFontSize?: number;
  safetyPadding?: number;
}

export interface AutoFitResult {
  fontSize: number;
  isScaled: boolean;
  originalFontSize: number;
  measuredWidth: number;
  availableWidth: number;
  scaleRatio: number;
}

// Reusable offscreen canvas context for fast, reliable font width measurements
let measurementCtx: CanvasRenderingContext2D | null = null;

function getMeasurementContext(): CanvasRenderingContext2D | null {
  if (typeof document === 'undefined') return null;
  if (!measurementCtx) {
    const canvas = document.createElement('canvas');
    canvas.width = 2000;
    canvas.height = 200;
    measurementCtx = canvas.getContext('2d');
  }
  return measurementCtx;
}

/**
 * Dynamic text-resizing helper:
 * Calculates the exact downscaled font size so that the recipient's name or
 * dynamic string never exceeds the defined width (plain space area), maintaining
 * perfect visual proportion and horizontal centering.
 */
export function calculateAutoFitFontSize(options: AutoFitOptions): AutoFitResult {
  const {
    text,
    maxWidth,
    baseFontSize,
    fontFamily = GLOBAL_ENFORCED_FONT,
    fontWeight = 'bold',
    fontStyle = 'normal',
    minFontSize = 14,
    safetyPadding = 12,
  } = options;

  const cleanText = (text || '').trim();
  const availableWidth = Math.max(20, maxWidth - safetyPadding * 2);

  if (!cleanText || maxWidth <= 0 || baseFontSize <= 0) {
    return {
      fontSize: baseFontSize,
      isScaled: false,
      originalFontSize: baseFontSize,
      measuredWidth: 0,
      availableWidth,
      scaleRatio: 1,
    };
  }

  const ctx = getMeasurementContext();

  // If Canvas 2D is unavailable (e.g. headless SSR), fallback to proportional character estimation
  if (!ctx) {
    // Bebas Kai is a condensed display font (~0.55 aspect ratio per char for uppercase)
    const approxCharWidthRatio = 0.52;
    const estimatedInitialWidth = cleanText.length * baseFontSize * approxCharWidthRatio;
    if (estimatedInitialWidth > availableWidth) {
      const ratio = availableWidth / estimatedInitialWidth;
      const computedSize = Math.max(minFontSize, Math.floor(baseFontSize * ratio));
      return {
        fontSize: computedSize,
        isScaled: computedSize < baseFontSize,
        originalFontSize: baseFontSize,
        measuredWidth: estimatedInitialWidth,
        availableWidth,
        scaleRatio: ratio,
      };
    }
    return {
      fontSize: baseFontSize,
      isScaled: false,
      originalFontSize: baseFontSize,
      measuredWidth: estimatedInitialWidth,
      availableWidth,
      scaleRatio: 1,
    };
  }

  // Set initial font with full fallback stack
  const fontStack = `"${fontFamily}", "${GLOBAL_ENFORCED_FONT}", "Bebas Neue", sans-serif`;
  ctx.font = `${fontStyle} ${fontWeight} ${baseFontSize}px ${fontStack}`;
  const initialMetrics = ctx.measureText(cleanText);
  const initialWidth = initialMetrics.width;

  if (initialWidth <= availableWidth) {
    return {
      fontSize: baseFontSize,
      isScaled: false,
      originalFontSize: baseFontSize,
      measuredWidth: Math.round(initialWidth),
      availableWidth,
      scaleRatio: 1,
    };
  }

  // Text exceeds width: calculate downscaled font size with safety buffer
  const ratio = availableWidth / initialWidth;
  let targetFontSize = Math.max(minFontSize, Math.floor(baseFontSize * ratio * 0.97));

  // Verify and fine-tune iteratively
  ctx.font = `${fontStyle} ${fontWeight} ${targetFontSize}px ${fontStack}`;
  let verifiedWidth = ctx.measureText(cleanText).width;

  while (verifiedWidth > availableWidth && targetFontSize > minFontSize) {
    targetFontSize -= 1;
    ctx.font = `${fontStyle} ${fontWeight} ${targetFontSize}px ${fontStack}`;
    verifiedWidth = ctx.measureText(cleanText).width;
  }

  return {
    fontSize: targetFontSize,
    isScaled: targetFontSize < baseFontSize,
    originalFontSize: baseFontSize,
    measuredWidth: Math.round(verifiedWidth),
    availableWidth,
    scaleRatio: verifiedWidth / initialWidth,
  };
}

/**
 * Checks if an element is a textual element (static text or dynamic variable field)
 */
export function isTextualElement(el: CanvasElement): boolean {
  return el.type === 'text' || el.type === 'dynamic_field';
}

/**
 * Enforces 'Bebas Kai' on any textual element, and enforces 'center' alignment on dynamic fields
 */
export function enforceElementStyling(el: CanvasElement, isNew = false): CanvasElement {
  if (!isTextualElement(el)) {
    return el;
  }

  const updated: CanvasElement = {
    ...el,
    // Strictly enforce Bebas Kai on all text elements
    fontFamily: GLOBAL_ENFORCED_FONT,
    autoFit: true,
    minFontSize: el.minFontSize || 14,
  };

  // Strictly enforce center alignment for dynamic fields
  if (el.type === 'dynamic_field' || isNew) {
    updated.align = GLOBAL_ENFORCED_DYNAMIC_ALIGN;
  }

  return updated;
}

/**
 * Batch enforces 'Bebas Kai' on all text elements and center alignment on all dynamic fields
 */
export function enforceGlobalStyling(elements: CanvasElement[]): CanvasElement[] {
  return elements.map((el) => {
    if (el.type === 'text') {
      return {
        ...el,
        fontFamily: GLOBAL_ENFORCED_FONT,
        autoFit: true,
      };
    }
    if (el.type === 'dynamic_field') {
      return {
        ...el,
        fontFamily: GLOBAL_ENFORCED_FONT,
        align: GLOBAL_ENFORCED_DYNAMIC_ALIGN,
        autoFit: true,
        minFontSize: el.minFontSize || 14,
      };
    }
    return el;
  });
}

/**
 * Helper to construct a new Dynamic Field with enforced 'Bebas Kai' and forced 'center' alignment
 */
export function createStyledDynamicField(params: {
  fieldKey: string;
  fieldLabel?: string;
  templateWidth: number;
  templateHeight: number;
  zIndex: number;
  customY?: number;
  customFontSize?: number;
  minFontSize?: number;
  color?: string;
}): CanvasElement {
  const {
    fieldKey,
    fieldLabel,
    templateWidth,
    templateHeight,
    zIndex,
    customY,
    customFontSize,
    minFontSize = 14,
    color = '#0e1838',
  } = params;

  const keyName = fieldKey.trim();
  const boxWidth = Math.round(templateWidth * 0.85);
  const calculatedFontSize = customFontSize || Math.max(36, Math.round(templateWidth * 0.045));
  const posX = Math.round((templateWidth - boxWidth) / 2);
  const posY = customY ?? Math.round(templateHeight * 0.45);

  return {
    id: `el_field_${keyName.toLowerCase()}_${Date.now()}`,
    type: 'dynamic_field',
    name: fieldLabel || keyName,
    dynamicFieldKey: keyName,
    x: posX,
    y: posY,
    width: boxWidth,
    height: Math.max(60, Math.round(calculatedFontSize * 1.3)),
    rotation: 0,
    opacity: 1,
    zIndex,
    text: `{{${keyName}}}`,
    // STRICT ENFORCEMENT:
    fontFamily: GLOBAL_ENFORCED_FONT,
    align: GLOBAL_ENFORCED_DYNAMIC_ALIGN,
    fontSize: calculatedFontSize,
    minFontSize,
    autoFit: true,
    fontWeight: 'bold',
    fontStyle: 'normal',
    color,
  };
}

/**
 * Helper to construct a new Static Text element with enforced 'Bebas Kai'
 */
export function createStyledTextElement(params: {
  text?: string;
  name?: string;
  templateWidth: number;
  templateHeight: number;
  zIndex: number;
  customY?: number;
  customFontSize?: number;
  minFontSize?: number;
  color?: string;
  align?: 'left' | 'center' | 'right';
}): CanvasElement {
  const {
    text = 'Enter certificate text',
    name = 'Custom Text',
    templateWidth,
    templateHeight,
    zIndex,
    customY,
    customFontSize,
    minFontSize = 12,
    color = '#0e1838',
    align = 'center',
  } = params;

  const boxWidth = Math.round(templateWidth * 0.8);
  const calculatedFontSize = customFontSize || Math.max(26, Math.round(templateWidth * 0.028));
  const posX = Math.round((templateWidth - boxWidth) / 2);
  const posY = customY ?? Math.round(templateHeight * 0.52);

  return {
    id: `el_text_${Date.now()}`,
    type: 'text',
    name,
    x: posX,
    y: posY,
    width: boxWidth,
    height: Math.max(45, Math.round(calculatedFontSize * 1.3)),
    rotation: 0,
    opacity: 1,
    zIndex,
    text,
    // STRICT ENFORCEMENT:
    fontFamily: GLOBAL_ENFORCED_FONT,
    align,
    fontSize: calculatedFontSize,
    minFontSize,
    autoFit: true,
    fontWeight: 'bold',
    fontStyle: 'normal',
    color,
  };
}

/**
 * Ensures 'Bebas Kai' font is actively loaded in the document font face set
 */
export async function ensureBebasKaiLoaded(): Promise<void> {
  if (typeof document !== 'undefined' && 'fonts' in document) {
    try {
      await document.fonts.load(`bold 48px "${GLOBAL_ENFORCED_FONT}"`);
      await document.fonts.load(`normal 48px "${GLOBAL_ENFORCED_FONT}"`);
    } catch {
      // Ignore if browser does not support fonts.load
    }
  }
}
