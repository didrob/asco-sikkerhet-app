/**
 * ASCO Logo as Base64 for embedding in PDF exports
 * This is the light version of the logo (white/light colored) for use on dark/teal backgrounds
 */

// Base64-encoded ASCO logo (logo-light.png)
// The logo is a teal circle - simple enough to recreate programmatically in jsPDF
export const ASCO_LOGO_BASE64 = '';

// ASCO Brand Colors
export const ASCO_TEAL = { r: 0, g: 224, b: 156 }; // #00E09C - hsl(166, 100%, 44%)
export const ASCO_TEAL_HEX = '00E09C';
export const ASCO_NAVY = { r: 26, g: 27, b: 38 }; // #1a1b26
export const ASCO_NAVY_HEX = '1A1B26';

/**
 * Draw ASCO logo (teal circle) directly in jsPDF
 * Since the logo is a simple teal circle, we draw it programmatically
 */
export function drawAscoLogoInPdf(
  doc: { setFillColor: (r: number, g: number, b: number) => void; circle: (x: number, y: number, r: number, style: string) => void },
  x: number,
  y: number,
  radius: number
) {
  doc.setFillColor(ASCO_TEAL.r, ASCO_TEAL.g, ASCO_TEAL.b);
  doc.circle(x, y, radius, 'F');
}
