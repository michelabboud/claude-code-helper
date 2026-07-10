/**
 * color.ts — pure color math for the design-system MCP server.
 *
 * These functions have no side effects (no server, no I/O), so they can be
 * unit-tested directly. `index.ts` runs `runServer()` at import time, so the
 * contrast logic lives here to keep it importable from tests.
 */

/**
 * Parse a 3- or 6-digit hex color (with or without a leading '#') into its
 * red/green/blue channels (each 0-255). Returns null for any value that is not
 * a valid hex color (e.g. `rgb(...)`, `var(--x)`, or a named color), so callers
 * can skip pairs they cannot assess rather than fabricating a ratio.
 */
export function parseHexColor(hex: string): [number, number, number] | null {
  let h = hex.trim().replace(/^#/, "");
  if (/^[0-9a-fA-F]{3}$/.test(h)) {
    h = h.split("").map((c) => c + c).join(""); // #abc -> aabbcc
  }
  if (!/^[0-9a-fA-F]{6}$/.test(h)) {
    return null;
  }
  return [
    parseInt(h.slice(0, 2), 16),
    parseInt(h.slice(2, 4), 16),
    parseInt(h.slice(4, 6), 16),
  ];
}

/**
 * Relative luminance of an sRGB color per the WCAG 2.x definition:
 * linearize each channel, then weight by the standard coefficients.
 * https://www.w3.org/TR/WCAG21/#dfn-relative-luminance
 */
export function relativeLuminance([r, g, b]: [number, number, number]): number {
  const linearize = (channel: number): number => {
    const s = channel / 255;
    return s <= 0.03928 ? s / 12.92 : Math.pow((s + 0.055) / 1.055, 2.4);
  };
  return 0.2126 * linearize(r) + 0.7152 * linearize(g) + 0.0722 * linearize(b);
}

/**
 * WCAG contrast ratio between two hex colors, in the range [1, 21]
 * (1:1 identical, 21:1 for black-on-white). Returns null when either input is
 * not a parseable hex color. https://www.w3.org/TR/WCAG21/#dfn-contrast-ratio
 */
export function calculateContrastRatio(color1: string, color2: string): number | null {
  const rgb1 = parseHexColor(color1);
  const rgb2 = parseHexColor(color2);
  if (!rgb1 || !rgb2) {
    return null;
  }
  const l1 = relativeLuminance(rgb1);
  const l2 = relativeLuminance(rgb2);
  const lighter = Math.max(l1, l2);
  const darker = Math.min(l1, l2);
  return (lighter + 0.05) / (darker + 0.05);
}
