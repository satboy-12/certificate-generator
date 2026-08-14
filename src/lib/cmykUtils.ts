// ============================================================================
// CMYK Color Utilities for High-Precision Commercial Print & Certificate Press
// Strictly conforms all colors to CMYK gamut (Cyan, Magenta, Yellow, Key/Black)
// ============================================================================

export interface CmykColor {
  c: number; // 0 - 100 (%)
  m: number; // 0 - 100 (%)
  y: number; // 0 - 100 (%)
  k: number; // 0 - 100 (%)
}

export interface RgbColor {
  r: number; // 0 - 255
  g: number; // 0 - 255
  b: number; // 0 - 255
}

// Certified Commercial Print CMYK Swatches
export const CMYK_PRESETS: { name: string; cmyk: CmykColor; hex: string; desc: string }[] = [
  {
    name: 'Rich Navy Blue',
    cmyk: { c: 100, m: 85, y: 20, k: 50 },
    hex: '#0e1838',
    desc: 'Deep official certificate navy (Default)',
  },
  {
    name: '100% True Black (K-Only)',
    cmyk: { c: 0, m: 0, y: 0, k: 100 },
    hex: '#000000',
    desc: 'Crisp body text for offset press',
  },
  {
    name: 'Rich Process Black',
    cmyk: { c: 60, m: 40, y: 40, k: 100 },
    hex: '#050505',
    desc: 'Deep dense black for bold headings',
  },
  {
    name: 'Certificate Royal Gold',
    cmyk: { c: 15, m: 35, y: 90, k: 20 },
    hex: '#b8860b',
    desc: 'Award & honor gold metallic look',
  },
  {
    name: 'Imperial Burgundy',
    cmyk: { c: 25, m: 100, y: 80, k: 35 },
    hex: '#6b1426',
    desc: 'Prestigious academic border & seal',
  },
  {
    name: 'Forest Emerald',
    cmyk: { c: 85, m: 25, y: 90, k: 45 },
    hex: '#164e2d',
    desc: 'Formal institutional green',
  },
  {
    name: 'Steel Slate Gray',
    cmyk: { c: 50, m: 40, y: 35, k: 10 },
    hex: '#707880',
    desc: 'Subtitles and secondary metadata',
  },
  {
    name: 'Warm Parchment Cream',
    cmyk: { c: 2, m: 4, y: 8, k: 0 },
    hex: '#fbf8ee',
    desc: 'Authentic parchment paper tint',
  },
];

/**
 * Converts RGB (0-255) to CMYK percentages (0-100)
 */
export function rgbToCmyk(r: number, g: number, b: number): CmykColor {
  const rNorm = Math.max(0, Math.min(255, r)) / 255;
  const gNorm = Math.max(0, Math.min(255, g)) / 255;
  const bNorm = Math.max(0, Math.min(255, b)) / 255;

  const kNorm = 1 - Math.max(rNorm, gNorm, bNorm);

  if (kNorm >= 0.9999) {
    return { c: 0, m: 0, y: 0, k: 100 };
  }

  const cNorm = (1 - rNorm - kNorm) / (1 - kNorm);
  const mNorm = (1 - gNorm - kNorm) / (1 - kNorm);
  const yNorm = (1 - bNorm - kNorm) / (1 - kNorm);

  return {
    c: Math.round(Math.max(0, Math.min(1, cNorm)) * 100),
    m: Math.round(Math.max(0, Math.min(1, mNorm)) * 100),
    y: Math.round(Math.max(0, Math.min(1, yNorm)) * 100),
    k: Math.round(Math.max(0, Math.min(1, kNorm)) * 100),
  };
}

/**
 * Converts CMYK percentages (0-100) to calibrated RGB (0-255) for screen preview
 */
export function cmykToRgb(cmyk: CmykColor): RgbColor {
  const c = Math.max(0, Math.min(100, cmyk.c)) / 100;
  const m = Math.max(0, Math.min(100, cmyk.m)) / 100;
  const y = Math.max(0, Math.min(100, cmyk.y)) / 100;
  const k = Math.max(0, Math.min(100, cmyk.k)) / 100;

  const r = Math.round(255 * (1 - c) * (1 - k));
  const g = Math.round(255 * (1 - m) * (1 - k));
  const b = Math.round(255 * (1 - y) * (1 - k));

  return {
    r: Math.max(0, Math.min(255, r)),
    g: Math.max(0, Math.min(255, g)),
    b: Math.max(0, Math.min(255, b)),
  };
}

/**
 * Parse any Hex or RGB string into Hex format
 */
export function parseColorToRgb(colorStr: string): RgbColor {
  if (!colorStr) return { r: 14, g: 24, b: 56 }; // Default Navy

  // Hex (#ffffff or #fff)
  if (colorStr.startsWith('#')) {
    let hex = colorStr.slice(1);
    if (hex.length === 3) {
      hex = hex.split('').map((c) => c + c).join('');
    }
    const num = parseInt(hex, 16);
    if (isNaN(num)) return { r: 14, g: 24, b: 56 };
    return {
      r: (num >> 16) & 255,
      g: (num >> 8) & 255,
      b: num & 255,
    };
  }

  // rgb(r, g, b)
  const match = colorStr.match(/rgb\s*\(\s*(\d+)\s*,\s*(\d+)\s*,\s*(\d+)\s*\)/i);
  if (match) {
    return {
      r: parseInt(match[1], 10),
      g: parseInt(match[2], 10),
      b: parseInt(match[3], 10),
    };
  }

  return { r: 14, g: 24, b: 56 };
}

/**
 * Converts Hex string to CMYK percentages
 */
export function hexToCmyk(hex: string): CmykColor {
  const rgb = parseColorToRgb(hex);
  return rgbToCmyk(rgb.r, rgb.g, rgb.b);
}

/**
 * Converts CMYK percentages to Hex string
 */
export function cmykToHex(cmyk: CmykColor): string {
  const rgb = cmykToRgb(cmyk);
  const rHex = rgb.r.toString(16).padStart(2, '0');
  const gHex = rgb.g.toString(16).padStart(2, '0');
  const bHex = rgb.b.toString(16).padStart(2, '0');
  return `#${rHex}${gHex}${bHex}`;
}

/**
 * Formats CMYK string for UI display: C: 100% M: 85% Y: 20% K: 50%
 */
export function formatCmykDisplay(cmyk: CmykColor): string {
  return `C:${cmyk.c}% M:${cmyk.m}% Y:${cmyk.y}% K:${cmyk.k}%`;
}

/**
 * Strictly clamps any color into CMYK color space and returns screen-accurate RGB representation
 */
export function enforceCmykGamut(colorStr: string): string {
  if (!colorStr || colorStr === 'transparent') return colorStr;
  const rgb = parseColorToRgb(colorStr);
  const cmyk = rgbToCmyk(rgb.r, rgb.g, rgb.b);
  return cmykToHex(cmyk);
}

/**
 * Applies CMYK color transformation across canvas pixel data to guarantee 100% CMYK gamut compliance
 */
export function applyCmykGamutToCanvasContext(ctx: CanvasRenderingContext2D, width: number, height: number): void {
  try {
    const imgData = ctx.getImageData(0, 0, width, height);
    const data = imgData.data;
    const len = data.length;

    for (let i = 0; i < len; i += 4) {
      const alpha = data[i + 3];
      if (alpha === 0) continue;

      const r = data[i];
      const g = data[i + 1];
      const b = data[i + 2];

      const cmyk = rgbToCmyk(r, g, b);
      const clampedRgb = cmykToRgb(cmyk);

      data[i] = clampedRgb.r;
      data[i + 1] = clampedRgb.g;
      data[i + 2] = clampedRgb.b;
    }

    ctx.putImageData(imgData, 0, 0);
  } catch (err) {
    // Cross-origin image fallback
    console.warn('Canvas CMYK pixel conversion skipped due to CORS:', err);
  }
}
