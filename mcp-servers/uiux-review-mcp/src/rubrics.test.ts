/**
 * Unit tests for src/rubrics.ts — the NO-FAKES fix for uiux-review-mcp.
 *
 * These tests exist to prove two things:
 *  1. imageContentBlock() reads the REAL image bytes off disk and returns
 *     them as a proper MCP image content block (happy path + failure path
 *     for a missing file).
 *  2. Every rubric builder returns instructional/checklist text addressed
 *     to the calling model to evaluate the ATTACHED image — and contains
 *     NO hardcoded numeric "score" fields or fabricated findings about a
 *     specific (unseen) image, which is the defect this file fixes.
 *
 * rubrics.ts has no side effects on import (unlike index.ts, which starts
 * an MCP server via runServer() at module load time), so it can be
 * imported directly here.
 */

import * as fs from "fs/promises";
import * as os from "os";
import * as path from "path";
import {
  detectImageMimeType,
  imageContentBlock,
  buildDesignRubric,
  buildAccessibilityRubric,
  buildTypographyRubric,
  buildSpacingRubric,
  buildColorRubric,
  buildUsabilityRubric,
  buildComparisonRubric,
  buildImprovementsRubric,
  DEFAULT_DESIGN_CHECKPOINTS,
  DEFAULT_ACCESSIBILITY_CHECKS,
  DEFAULT_TYPOGRAPHY_ASPECTS,
  DEFAULT_COLOR_CHECKS,
  DEFAULT_USABILITY_HEURISTICS,
  DEFAULT_COMPARISON_METRICS,
  DEFAULT_IMPROVEMENT_AREAS,
} from "./rubrics.js";

// A minimal valid 1x1 transparent PNG, base64-encoded.
const ONE_PIXEL_PNG_BASE64 =
  "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNk+A8AAQUBAScY42YAAAAASUVORK5CYII=";

// A patterns list of hardcoded-fabrication smells that must NEVER appear in
// rubric output: numeric score assignments and telltale fabricated findings
// from the original defect.
const FABRICATION_SMELLS = [
  "overallScore",
  "Math.random",
  '"score":',
  "score: 8",
  "score: 9",
  "score: 7",
  "score: 6",
];

describe("detectImageMimeType", () => {
  it("detects PNG", () => {
    expect(detectImageMimeType("/tmp/shot.png")).toBe("image/png");
  });

  it("detects JPG and JPEG", () => {
    expect(detectImageMimeType("/tmp/shot.jpg")).toBe("image/jpeg");
    expect(detectImageMimeType("/tmp/shot.jpeg")).toBe("image/jpeg");
  });

  it("detects WebP", () => {
    expect(detectImageMimeType("/tmp/shot.webp")).toBe("image/webp");
  });

  it("detects GIF", () => {
    expect(detectImageMimeType("/tmp/shot.gif")).toBe("image/gif");
  });

  it("is case-insensitive on extension", () => {
    expect(detectImageMimeType("/tmp/SHOT.PNG")).toBe("image/png");
    expect(detectImageMimeType("/tmp/SHOT.JPG")).toBe("image/jpeg");
  });

  it("defaults to image/png for an unknown extension", () => {
    expect(detectImageMimeType("/tmp/shot.bmp")).toBe("image/png");
  });

  it("defaults to image/png for no extension", () => {
    expect(detectImageMimeType("/tmp/shot")).toBe("image/png");
  });
});

describe("imageContentBlock", () => {
  let tmpDir: string;

  beforeAll(async () => {
    tmpDir = await fs.mkdtemp(path.join(os.tmpdir(), "uiux-review-mcp-test-"));
  });

  afterAll(async () => {
    await fs.rm(tmpDir, { recursive: true, force: true });
  });

  it("reads the real image bytes and base64-encodes them exactly", async () => {
    const filePath = path.join(tmpDir, "pixel.png");
    const originalBuffer = Buffer.from(ONE_PIXEL_PNG_BASE64, "base64");
    await fs.writeFile(filePath, originalBuffer);

    const block = await imageContentBlock(filePath);

    expect(block.type).toBe("image");
    expect(block.mimeType).toBe("image/png");
    // Round-trip: decoding the returned base64 must reproduce the exact
    // original bytes -- this is the actual screenshot, not a placeholder.
    expect(Buffer.from(block.data, "base64").equals(originalBuffer)).toBe(true);
  });

  it("detects mimeType from a .jpg extension", async () => {
    const filePath = path.join(tmpDir, "pixel.jpg");
    await fs.writeFile(filePath, Buffer.from(ONE_PIXEL_PNG_BASE64, "base64"));

    const block = await imageContentBlock(filePath);
    expect(block.mimeType).toBe("image/jpeg");
  });

  it("rejects (throws/rejects) when the image file does not exist", async () => {
    const missingPath = path.join(tmpDir, "does-not-exist.png");
    await expect(imageContentBlock(missingPath)).rejects.toThrow();
  });
});

describe("rubric builders — no fabricated scores or findings", () => {
  const allRubrics = (): string[] => [
    buildDesignRubric("mobile", undefined, true),
    buildAccessibilityRubric("AA", undefined),
    buildTypographyRubric(undefined),
    buildSpacingRubric(8, true),
    buildColorRubric(["#2C3E50"], undefined),
    buildUsabilityRubric("Complete checkout", undefined),
    buildComparisonRubric("ab_test", undefined),
    buildImprovementsRubric(undefined, "high"),
  ];

  it("contains none of the known fabrication smells from the original defect", () => {
    for (const rubric of allRubrics()) {
      for (const smell of FABRICATION_SMELLS) {
        expect(rubric).not.toContain(smell);
      }
    }
  });

  it("every rubric instructs the model to evaluate the ATTACHED image, not invent findings", () => {
    for (const rubric of allRubrics()) {
      expect(rubric.toUpperCase()).toContain("ATTACHED");
    }
  });
});

describe("buildDesignRubric", () => {
  it("includes all default checkpoint sections when none are specified", () => {
    const rubric = buildDesignRubric(undefined, undefined, false);
    for (const checkpoint of DEFAULT_DESIGN_CHECKPOINTS) {
      // Section headers are Title Case versions of the checkpoint key's first word.
      expect(rubric.toLowerCase()).toContain(checkpoint.replace(/_/g, " ").split(" ")[0]);
    }
  });

  it("includes only the requested checkpoint when checkpoints is a single-item array", () => {
    const rubric = buildDesignRubric("desktop", ["typography"], false);
    expect(rubric).toContain("## Typography");
    expect(rubric).not.toContain("## Spacing");
    expect(rubric).not.toContain("## Color");
  });

  it("covers the 'responsiveness' checkpoint (previously defined in the schema but never implemented)", () => {
    const rubric = buildDesignRubric("responsive", ["responsiveness"], false);
    expect(rubric).toContain("## Responsiveness");
    expect(rubric).toContain("viewport");
  });

  it("adds wireframe-suggestion instructions only when includeWireframe is true", () => {
    const withWireframe = buildDesignRubric("mobile", ["spacing"], true);
    const withoutWireframe = buildDesignRubric("mobile", ["spacing"], false);
    expect(withWireframe).toContain("generate_wireframe");
    expect(withoutWireframe).not.toContain("generate_wireframe");
  });

  it("mentions the designType when provided", () => {
    const rubric = buildDesignRubric("tablet", ["spacing"], false);
    expect(rubric).toContain("tablet");
  });
});

describe("buildAccessibilityRubric", () => {
  it("defaults to the four core WCAG checks, excluding alt_text_presence", () => {
    const rubric = buildAccessibilityRubric(undefined, undefined);
    expect(DEFAULT_ACCESSIBILITY_CHECKS).toEqual([
      "color_contrast",
      "text_size",
      "touch_targets",
      "focus_indicators",
    ]);
    expect(rubric).toContain("Color contrast");
    expect(rubric).toContain("Touch targets");
    expect(rubric).not.toContain("Alt text presence");
  });

  it("includes alt_text_presence rubric when explicitly requested", () => {
    const rubric = buildAccessibilityRubric("AAA", ["alt_text_presence"]);
    expect(rubric).toContain("Alt text presence");
    expect(rubric).toContain("cannot be verified from the image alone");
  });

  it("references real WCAG success-criterion numbers, not invented ones", () => {
    const rubric = buildAccessibilityRubric("AA", ["color_contrast", "focus_indicators"]);
    expect(rubric).toContain("1.4.3");
    expect(rubric).toContain("2.4.7");
  });

  it("defaults wcagLevel to AA when not provided", () => {
    const rubric = buildAccessibilityRubric(undefined, undefined);
    expect(rubric).toContain("WCAG AA");
  });
});

describe("buildTypographyRubric", () => {
  it("excludes letter_spacing by default", () => {
    const rubric = buildTypographyRubric(undefined);
    expect(DEFAULT_TYPOGRAPHY_ASPECTS).not.toContain("letter_spacing");
    expect(rubric).not.toContain("## Letter spacing");
  });

  it("includes letter_spacing when explicitly requested", () => {
    const rubric = buildTypographyRubric(["letter_spacing"]);
    expect(rubric).toContain("## Letter spacing");
  });
});

describe("buildSpacingRubric", () => {
  it("uses 8px as the default base unit", () => {
    const rubric = buildSpacingRubric(undefined, undefined);
    expect(rubric).toContain("8px");
  });

  it("uses a custom base unit when provided", () => {
    const rubric = buildSpacingRubric(4, undefined);
    expect(rubric).toContain("4px");
    expect(rubric).not.toContain("8px");
  });

  it("adds the cross-element consistency instruction unless checkConsistency is false", () => {
    const withConsistency = buildSpacingRubric(8, true);
    const withoutConsistency = buildSpacingRubric(8, false);
    expect(withConsistency).toContain("Compare spacing across similar");
    expect(withoutConsistency).not.toContain("Compare spacing across similar");
  });
});

describe("buildColorRubric", () => {
  it("defaults to contrast, harmony, accessibility (not brand_consistency)", () => {
    expect(DEFAULT_COLOR_CHECKS).toEqual(["contrast", "harmony", "accessibility"]);
    const rubric = buildColorRubric(undefined, undefined);
    expect(rubric).not.toContain("Brand consistency");
  });

  it("includes the actual brand color hex values when provided and requested", () => {
    const rubric = buildColorRubric(["#2C3E50", "#3498DB"], ["brand_consistency"]);
    expect(rubric).toContain("#2C3E50");
    expect(rubric).toContain("#3498DB");
  });

  it("notes qualitative-only brand check when brand_consistency requested without brandColors", () => {
    const rubric = buildColorRubric(undefined, ["brand_consistency"]);
    expect(rubric).toContain("No brand palette was provided");
  });

  it("does NOT contain a mock/hardcoded color palette (the original defect)", () => {
    const rubric = buildColorRubric(undefined, undefined);
    // The original defect hardcoded this exact fabricated palette.
    expect(rubric).not.toContain("#ECF0F1");
    expect(rubric).not.toContain("primary CTA");
  });
});

describe("buildUsabilityRubric", () => {
  it("defaults to 5 of Nielsen's heuristics, excluding recognition/flexibility/aesthetic", () => {
    expect(DEFAULT_USABILITY_HEURISTICS).toEqual([
      "visibility",
      "feedback",
      "affordance",
      "consistency",
      "error_prevention",
    ]);
    const rubric = buildUsabilityRubric(undefined, undefined);
    expect(rubric).not.toContain("Recognition rather than recall");
  });

  it("includes the userFlow context when provided", () => {
    const rubric = buildUsabilityRubric("Complete checkout in under 3 steps", undefined);
    expect(rubric).toContain("Complete checkout in under 3 steps");
  });

  it("references Nielsen's heuristics by name", () => {
    const rubric = buildUsabilityRubric(undefined, ["visibility", "error_prevention"]);
    expect(rubric).toContain("Nielsen");
  });
});

describe("buildComparisonRubric", () => {
  it("labels the two attachments as Version A and Version B", () => {
    const rubric = buildComparisonRubric("ab_test", undefined);
    expect(rubric).toContain("VERSION A");
    expect(rubric).toContain("VERSION B");
  });

  it("explicitly forbids inventing an unjustified numeric score (removes the Math.random defect)", () => {
    const rubric = buildComparisonRubric("iteration", DEFAULT_COMPARISON_METRICS);
    expect(rubric.toLowerCase()).toContain("do not assign a numeric score unless you can justify it");
    expect(rubric.toLowerCase()).toContain("never a coin flip or random pick");
  });

  it("includes the comparisonType in the rubric heading and recommendation", () => {
    const rubric = buildComparisonRubric("responsive", undefined);
    expect(rubric).toContain("responsive");
  });
});

describe("buildImprovementsRubric", () => {
  it("defaults to all seven improvement areas", () => {
    expect(DEFAULT_IMPROVEMENT_AREAS).toHaveLength(7);
    const rubric = buildImprovementsRubric(undefined, undefined);
    for (const area of DEFAULT_IMPROVEMENT_AREAS) {
      expect(rubric).toContain(
        `## ${area.replace(/_/g, " ").replace(/^./, (c) => c.toUpperCase())}`,
      );
    }
  });

  it("filters to only the requested focus areas", () => {
    const rubric = buildImprovementsRubric(["accessibility"], undefined);
    expect(rubric).toContain("## Accessibility");
    expect(rubric).not.toContain("## Layout");
  });

  it("embeds the requested minimum priority in the reporting instructions", () => {
    const rubric = buildImprovementsRubric(undefined, "critical");
    expect(rubric).toContain('priority: "critical"');
  });

  it("does not contain the original hardcoded 7-item fabricated improvement list", () => {
    const rubric = buildImprovementsRubric(undefined, undefined);
    // These exact fabricated strings from the original defect must be gone.
    expect(rubric).not.toContain("3.2:1");
    expect(rubric).not.toContain("Strengthen primary CTA");
  });
});
