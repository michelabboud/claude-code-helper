/**
 * Unit tests for the WCAG color math in color.ts.
 *
 * Reference ratios are the well-known WCAG values:
 *   - black on white  = 21:1 (the maximum)
 *   - identical colors = 1:1
 *   - #767676 on white ≈ 4.54:1 (the classic AA boundary for gray text)
 */

import { calculateContrastRatio, parseHexColor, relativeLuminance } from "./color.js";

describe("parseHexColor", () => {
  it("parses 6-digit hex with a leading #", () => {
    expect(parseHexColor("#ffffff")).toEqual([255, 255, 255]);
    expect(parseHexColor("#000000")).toEqual([0, 0, 0]);
    expect(parseHexColor("#1a2b3c")).toEqual([26, 43, 60]);
  });

  it("parses 6-digit hex without a leading #", () => {
    expect(parseHexColor("ff8800")).toEqual([255, 136, 0]);
  });

  it("expands 3-digit shorthand hex", () => {
    expect(parseHexColor("#fff")).toEqual([255, 255, 255]);
    expect(parseHexColor("#abc")).toEqual([170, 187, 204]);
  });

  it("is case-insensitive", () => {
    expect(parseHexColor("#AABBCC")).toEqual([170, 187, 204]);
  });

  it("returns null for non-hex values", () => {
    expect(parseHexColor("rgb(0,0,0)")).toBeNull();
    expect(parseHexColor("var(--primary)")).toBeNull();
    expect(parseHexColor("red")).toBeNull();
    expect(parseHexColor("")).toBeNull();
    expect(parseHexColor("#12")).toBeNull();
    expect(parseHexColor("#12345")).toBeNull();
    expect(parseHexColor("#gggggg")).toBeNull();
  });
});

describe("relativeLuminance", () => {
  it("is 0 for black and 1 for white", () => {
    expect(relativeLuminance([0, 0, 0])).toBeCloseTo(0, 5);
    expect(relativeLuminance([255, 255, 255])).toBeCloseTo(1, 5);
  });

  it("weights green most heavily (0.7152)", () => {
    // Pure primaries: green should be the brightest of the three.
    const rL = relativeLuminance([255, 0, 0]);
    const gL = relativeLuminance([0, 255, 0]);
    const bL = relativeLuminance([0, 0, 255]);
    expect(gL).toBeGreaterThan(rL);
    expect(rL).toBeGreaterThan(bL);
  });
});

describe("calculateContrastRatio", () => {
  it("returns exactly 21:1 for black on white", () => {
    expect(calculateContrastRatio("#000000", "#ffffff")).toBeCloseTo(21, 5);
    // Order-independent
    expect(calculateContrastRatio("#ffffff", "#000000")).toBeCloseTo(21, 5);
  });

  it("returns 1:1 for identical colors", () => {
    expect(calculateContrastRatio("#3366cc", "#3366cc")).toBeCloseTo(1, 5);
  });

  it("matches the known ~4.54:1 boundary for #767676 on white", () => {
    const ratio = calculateContrastRatio("#767676", "#ffffff");
    expect(ratio).not.toBeNull();
    expect(ratio as number).toBeCloseTo(4.54, 1);
  });

  it("does not return the astronomically wrong values of the old int-parse bug", () => {
    // The previous implementation parsed the whole hex as one integer, yielding
    // ratios in the hundreds of millions. A real ratio is always within [1, 21].
    const ratio = calculateContrastRatio("#ffffff", "#000000") as number;
    expect(ratio).toBeLessThanOrEqual(21);
    expect(ratio).toBeGreaterThanOrEqual(1);
  });

  it("handles 3-digit shorthand", () => {
    expect(calculateContrastRatio("#fff", "#000")).toBeCloseTo(21, 5);
  });

  it("returns null when either color is not parseable hex", () => {
    expect(calculateContrastRatio("rgb(0,0,0)", "#ffffff")).toBeNull();
    expect(calculateContrastRatio("#ffffff", "var(--bg)")).toBeNull();
    expect(calculateContrastRatio("", "")).toBeNull();
  });
});
