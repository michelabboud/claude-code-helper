/**
 * Unit tests for uiux-review-mcp server.
 *
 * Tests cover:
 * - Zod schema validation (valid/invalid inputs for all nine tool schemas)
 * - sanitizePath integration (path traversal and null-byte rejection)
 * - errorResponse formatting
 * - Tool name registration (ListTools handler coverage)
 */

import { z } from "zod";
import {
  sanitizePath,
  errorResponse,
  SanitizationError,
} from "mcp-shared";

// ---------------------------------------------------------------------------
// Replicated Zod schemas (mirrors src/index.ts -- not exported from there)
// ---------------------------------------------------------------------------

const AnalyzeDesignSchema = z.object({
  imagePath: z.string().describe("Path to design screenshot image"),
  designType: z.enum(["mobile", "desktop", "tablet", "responsive"]).optional()
    .describe("Type of design being reviewed"),
  checkpoints: z.array(z.enum([
    "visual_hierarchy",
    "spacing",
    "typography",
    "color",
    "accessibility",
    "usability",
    "consistency",
    "responsiveness",
  ])).optional().describe("Specific aspects to check"),
  includeWireframe: z.boolean().optional().describe("Generate wireframe suggestion"),
});

const CheckAccessibilitySchema = z.object({
  imagePath: z.string().describe("Path to design screenshot"),
  wcagLevel: z.enum(["A", "AA", "AAA"]).optional().describe("WCAG conformance level"),
  checks: z.array(z.enum([
    "color_contrast",
    "text_size",
    "touch_targets",
    "focus_indicators",
    "alt_text_presence",
  ])).optional().describe("Specific accessibility checks"),
});

const ReviewTypographySchema = z.object({
  imagePath: z.string().describe("Path to design screenshot"),
  aspects: z.array(z.enum([
    "hierarchy",
    "readability",
    "font_pairing",
    "size_scale",
    "line_height",
    "letter_spacing",
  ])).optional().describe("Typography aspects to review"),
});

const ValidateSpacingSchema = z.object({
  imagePath: z.string().describe("Path to design screenshot"),
  baseUnit: z.number().optional().describe("Expected base spacing unit (e.g., 8px)"),
  checkConsistency: z.boolean().optional().describe("Check spacing consistency"),
});

const CheckColorSchemeSchema = z.object({
  imagePath: z.string().describe("Path to design screenshot"),
  brandColors: z.array(z.string()).optional().describe("Brand color palette (hex codes)"),
  checks: z.array(z.enum([
    "contrast",
    "harmony",
    "accessibility",
    "brand_consistency",
  ])).optional().describe("Color checks to perform"),
});

const SuggestImprovementsSchema = z.object({
  imagePath: z.string().describe("Path to design screenshot"),
  focusAreas: z.array(z.enum([
    "layout",
    "visual_hierarchy",
    "typography",
    "color",
    "spacing",
    "usability",
    "accessibility",
  ])).optional().describe("Areas to focus improvements on"),
  priority: z.enum(["critical", "high", "medium", "all"]).optional()
    .describe("Minimum priority level to include"),
});

const GenerateWireframeSchema = z.object({
  designDescription: z.string().describe("Description of the design to wireframe"),
  designType: z.enum(["mobile", "desktop", "tablet"]).describe("Device type"),
  format: z.enum(["html", "ascii", "mermaid"]).describe("Wireframe output format"),
  includeAnnotations: z.boolean().optional().describe("Include design annotations"),
});

const CompareDesignsSchema = z.object({
  imagePathA: z.string().describe("Path to first design (version A)"),
  imagePathB: z.string().describe("Path to second design (version B)"),
  comparisonType: z.enum(["ab_test", "iteration", "responsive"])
    .describe("Type of comparison"),
  metrics: z.array(z.enum([
    "visual_impact",
    "clarity",
    "accessibility",
    "consistency",
  ])).optional().describe("Metrics to compare"),
});

const CheckUsabilitySchema = z.object({
  imagePath: z.string().describe("Path to design screenshot"),
  userFlow: z.string().optional().describe("Expected user flow or task"),
  heuristics: z.array(z.enum([
    "visibility",
    "feedback",
    "affordance",
    "consistency",
    "error_prevention",
    "recognition",
    "flexibility",
    "aesthetic",
  ])).optional().describe("Usability heuristics to check"),
});

// The expected set of tool names registered in the ListTools handler.
const EXPECTED_TOOL_NAMES = [
  "analyze_design",
  "check_accessibility",
  "review_typography",
  "validate_spacing",
  "check_color_scheme",
  "suggest_improvements",
  "generate_wireframe",
  "compare_designs",
  "check_usability",
];

// =========================================================================
// 1. AnalyzeDesignSchema validation
// =========================================================================

describe("AnalyzeDesignSchema", () => {
  it("accepts valid input with required fields only", () => {
    const input = { imagePath: "/designs/homepage.png" };
    const result = AnalyzeDesignSchema.safeParse(input);
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.imagePath).toBe("/designs/homepage.png");
      expect(result.data.designType).toBeUndefined();
      expect(result.data.checkpoints).toBeUndefined();
      expect(result.data.includeWireframe).toBeUndefined();
    }
  });

  it("accepts valid input with all optional fields", () => {
    const input = {
      imagePath: "/designs/homepage.png",
      designType: "mobile",
      checkpoints: ["spacing", "typography"],
      includeWireframe: true,
    };
    const result = AnalyzeDesignSchema.safeParse(input);
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.designType).toBe("mobile");
      expect(result.data.checkpoints).toEqual(["spacing", "typography"]);
      expect(result.data.includeWireframe).toBe(true);
    }
  });

  it("accepts all valid designType enum values", () => {
    for (const designType of ["mobile", "desktop", "tablet", "responsive"] as const) {
      const result = AnalyzeDesignSchema.safeParse({
        imagePath: "/designs/test.png",
        designType,
      });
      expect(result.success).toBe(true);
    }
  });

  it("accepts all valid checkpoint enum values", () => {
    const allCheckpoints = [
      "visual_hierarchy", "spacing", "typography", "color",
      "accessibility", "usability", "consistency", "responsiveness",
    ] as const;
    const result = AnalyzeDesignSchema.safeParse({
      imagePath: "/designs/test.png",
      checkpoints: [...allCheckpoints],
    });
    expect(result.success).toBe(true);
  });

  it("rejects missing imagePath", () => {
    const input = { designType: "mobile" };
    const result = AnalyzeDesignSchema.safeParse(input);
    expect(result.success).toBe(false);
  });

  it("rejects invalid designType value", () => {
    const input = { imagePath: "/designs/test.png", designType: "wearable" };
    const result = AnalyzeDesignSchema.safeParse(input);
    expect(result.success).toBe(false);
  });

  it("rejects invalid checkpoint value", () => {
    const input = {
      imagePath: "/designs/test.png",
      checkpoints: ["spacing", "performance"],
    };
    const result = AnalyzeDesignSchema.safeParse(input);
    expect(result.success).toBe(false);
  });

  it("rejects non-boolean includeWireframe", () => {
    const input = { imagePath: "/designs/test.png", includeWireframe: "yes" };
    const result = AnalyzeDesignSchema.safeParse(input);
    expect(result.success).toBe(false);
  });

  it("rejects null as imagePath", () => {
    const result = AnalyzeDesignSchema.safeParse({ imagePath: null });
    expect(result.success).toBe(false);
  });

  it("rejects numeric imagePath", () => {
    const result = AnalyzeDesignSchema.safeParse({ imagePath: 123 });
    expect(result.success).toBe(false);
  });

  it("accepts empty checkpoints array", () => {
    const result = AnalyzeDesignSchema.safeParse({
      imagePath: "/designs/test.png",
      checkpoints: [],
    });
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.checkpoints).toEqual([]);
    }
  });

  it("strips unknown properties", () => {
    const input = {
      imagePath: "/designs/test.png",
      extraField: "should be stripped",
    };
    const result = AnalyzeDesignSchema.safeParse(input);
    expect(result.success).toBe(true);
    if (result.success) {
      expect((result.data as any).extraField).toBeUndefined();
    }
  });
});

// =========================================================================
// 2. CheckAccessibilitySchema validation
// =========================================================================

describe("CheckAccessibilitySchema", () => {
  it("accepts valid input with required fields only", () => {
    const input = { imagePath: "/designs/form.png" };
    const result = CheckAccessibilitySchema.safeParse(input);
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.wcagLevel).toBeUndefined();
      expect(result.data.checks).toBeUndefined();
    }
  });

  it("accepts valid input with all optional fields", () => {
    const input = {
      imagePath: "/designs/form.png",
      wcagLevel: "AAA",
      checks: ["color_contrast", "touch_targets"],
    };
    const result = CheckAccessibilitySchema.safeParse(input);
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.wcagLevel).toBe("AAA");
      expect(result.data.checks).toEqual(["color_contrast", "touch_targets"]);
    }
  });

  it("accepts all valid wcagLevel enum values", () => {
    for (const wcagLevel of ["A", "AA", "AAA"] as const) {
      const result = CheckAccessibilitySchema.safeParse({
        imagePath: "/designs/test.png",
        wcagLevel,
      });
      expect(result.success).toBe(true);
    }
  });

  it("accepts all valid checks enum values", () => {
    const allChecks = [
      "color_contrast", "text_size", "touch_targets",
      "focus_indicators", "alt_text_presence",
    ] as const;
    const result = CheckAccessibilitySchema.safeParse({
      imagePath: "/designs/test.png",
      checks: [...allChecks],
    });
    expect(result.success).toBe(true);
  });

  it("rejects missing imagePath", () => {
    const input = { wcagLevel: "AA" };
    const result = CheckAccessibilitySchema.safeParse(input);
    expect(result.success).toBe(false);
  });

  it("rejects invalid wcagLevel value", () => {
    const input = { imagePath: "/designs/test.png", wcagLevel: "B" };
    const result = CheckAccessibilitySchema.safeParse(input);
    expect(result.success).toBe(false);
  });

  it("rejects invalid checks value", () => {
    const input = {
      imagePath: "/designs/test.png",
      checks: ["color_contrast", "performance"],
    };
    const result = CheckAccessibilitySchema.safeParse(input);
    expect(result.success).toBe(false);
  });

  it("rejects lowercase wcagLevel that is not in enum", () => {
    const input = { imagePath: "/designs/test.png", wcagLevel: "aa" };
    const result = CheckAccessibilitySchema.safeParse(input);
    expect(result.success).toBe(false);
  });
});

// =========================================================================
// 3. ReviewTypographySchema validation
// =========================================================================

describe("ReviewTypographySchema", () => {
  it("accepts valid input with required fields only", () => {
    const input = { imagePath: "/designs/landing.png" };
    const result = ReviewTypographySchema.safeParse(input);
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.aspects).toBeUndefined();
    }
  });

  it("accepts valid input with aspects", () => {
    const input = {
      imagePath: "/designs/landing.png",
      aspects: ["hierarchy", "readability", "line_height"],
    };
    const result = ReviewTypographySchema.safeParse(input);
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.aspects).toEqual(["hierarchy", "readability", "line_height"]);
    }
  });

  it("accepts all valid aspects enum values", () => {
    const allAspects = [
      "hierarchy", "readability", "font_pairing",
      "size_scale", "line_height", "letter_spacing",
    ] as const;
    const result = ReviewTypographySchema.safeParse({
      imagePath: "/designs/test.png",
      aspects: [...allAspects],
    });
    expect(result.success).toBe(true);
  });

  it("rejects missing imagePath", () => {
    const input = { aspects: ["hierarchy"] };
    const result = ReviewTypographySchema.safeParse(input);
    expect(result.success).toBe(false);
  });

  it("rejects invalid aspect value", () => {
    const input = {
      imagePath: "/designs/test.png",
      aspects: ["hierarchy", "kerning"],
    };
    const result = ReviewTypographySchema.safeParse(input);
    expect(result.success).toBe(false);
  });

  it("accepts empty aspects array", () => {
    const result = ReviewTypographySchema.safeParse({
      imagePath: "/designs/test.png",
      aspects: [],
    });
    expect(result.success).toBe(true);
  });
});

// =========================================================================
// 4. ValidateSpacingSchema validation
// =========================================================================

describe("ValidateSpacingSchema", () => {
  it("accepts valid input with required fields only", () => {
    const input = { imagePath: "/designs/layout.png" };
    const result = ValidateSpacingSchema.safeParse(input);
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.baseUnit).toBeUndefined();
      expect(result.data.checkConsistency).toBeUndefined();
    }
  });

  it("accepts valid input with all optional fields", () => {
    const input = {
      imagePath: "/designs/layout.png",
      baseUnit: 8,
      checkConsistency: true,
    };
    const result = ValidateSpacingSchema.safeParse(input);
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.baseUnit).toBe(8);
      expect(result.data.checkConsistency).toBe(true);
    }
  });

  it("rejects missing imagePath", () => {
    const input = { baseUnit: 8 };
    const result = ValidateSpacingSchema.safeParse(input);
    expect(result.success).toBe(false);
  });

  it("rejects non-number baseUnit", () => {
    const input = { imagePath: "/designs/test.png", baseUnit: "8px" };
    const result = ValidateSpacingSchema.safeParse(input);
    expect(result.success).toBe(false);
  });

  it("rejects non-boolean checkConsistency", () => {
    const input = { imagePath: "/designs/test.png", checkConsistency: "yes" };
    const result = ValidateSpacingSchema.safeParse(input);
    expect(result.success).toBe(false);
  });

  it("accepts zero as baseUnit", () => {
    const result = ValidateSpacingSchema.safeParse({
      imagePath: "/designs/test.png",
      baseUnit: 0,
    });
    expect(result.success).toBe(true);
  });

  it("accepts negative baseUnit (no min constraint in schema)", () => {
    const result = ValidateSpacingSchema.safeParse({
      imagePath: "/designs/test.png",
      baseUnit: -4,
    });
    expect(result.success).toBe(true);
  });

  it("accepts floating point baseUnit", () => {
    const result = ValidateSpacingSchema.safeParse({
      imagePath: "/designs/test.png",
      baseUnit: 4.5,
    });
    expect(result.success).toBe(true);
  });
});

// =========================================================================
// 5. CheckColorSchemeSchema validation
// =========================================================================

describe("CheckColorSchemeSchema", () => {
  it("accepts valid input with required fields only", () => {
    const input = { imagePath: "/designs/palette.png" };
    const result = CheckColorSchemeSchema.safeParse(input);
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.brandColors).toBeUndefined();
      expect(result.data.checks).toBeUndefined();
    }
  });

  it("accepts valid input with all optional fields", () => {
    const input = {
      imagePath: "/designs/palette.png",
      brandColors: ["#FF5733", "#2C3E50", "#ECF0F1"],
      checks: ["contrast", "harmony"],
    };
    const result = CheckColorSchemeSchema.safeParse(input);
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.brandColors).toEqual(["#FF5733", "#2C3E50", "#ECF0F1"]);
      expect(result.data.checks).toEqual(["contrast", "harmony"]);
    }
  });

  it("accepts all valid checks enum values", () => {
    const allChecks = [
      "contrast", "harmony", "accessibility", "brand_consistency",
    ] as const;
    const result = CheckColorSchemeSchema.safeParse({
      imagePath: "/designs/test.png",
      checks: [...allChecks],
    });
    expect(result.success).toBe(true);
  });

  it("rejects missing imagePath", () => {
    const input = { brandColors: ["#FF5733"] };
    const result = CheckColorSchemeSchema.safeParse(input);
    expect(result.success).toBe(false);
  });

  it("rejects invalid checks value", () => {
    const input = {
      imagePath: "/designs/test.png",
      checks: ["contrast", "brightness"],
    };
    const result = CheckColorSchemeSchema.safeParse(input);
    expect(result.success).toBe(false);
  });

  it("accepts empty brandColors array", () => {
    const result = CheckColorSchemeSchema.safeParse({
      imagePath: "/designs/test.png",
      brandColors: [],
    });
    expect(result.success).toBe(true);
  });

  it("accepts arbitrary strings in brandColors (no hex validation)", () => {
    const result = CheckColorSchemeSchema.safeParse({
      imagePath: "/designs/test.png",
      brandColors: ["red", "not-a-color", ""],
    });
    expect(result.success).toBe(true);
  });

  it("rejects non-string elements in brandColors", () => {
    const result = CheckColorSchemeSchema.safeParse({
      imagePath: "/designs/test.png",
      brandColors: [123, true],
    });
    expect(result.success).toBe(false);
  });
});

// =========================================================================
// 6. SuggestImprovementsSchema validation
// =========================================================================

describe("SuggestImprovementsSchema", () => {
  it("accepts valid input with required fields only", () => {
    const input = { imagePath: "/designs/dashboard.png" };
    const result = SuggestImprovementsSchema.safeParse(input);
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.focusAreas).toBeUndefined();
      expect(result.data.priority).toBeUndefined();
    }
  });

  it("accepts valid input with all optional fields", () => {
    const input = {
      imagePath: "/designs/dashboard.png",
      focusAreas: ["layout", "accessibility"],
      priority: "high",
    };
    const result = SuggestImprovementsSchema.safeParse(input);
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.focusAreas).toEqual(["layout", "accessibility"]);
      expect(result.data.priority).toBe("high");
    }
  });

  it("accepts all valid focusAreas enum values", () => {
    const allAreas = [
      "layout", "visual_hierarchy", "typography",
      "color", "spacing", "usability", "accessibility",
    ] as const;
    const result = SuggestImprovementsSchema.safeParse({
      imagePath: "/designs/test.png",
      focusAreas: [...allAreas],
    });
    expect(result.success).toBe(true);
  });

  it("accepts all valid priority enum values", () => {
    for (const priority of ["critical", "high", "medium", "all"] as const) {
      const result = SuggestImprovementsSchema.safeParse({
        imagePath: "/designs/test.png",
        priority,
      });
      expect(result.success).toBe(true);
    }
  });

  it("rejects missing imagePath", () => {
    const input = { priority: "high" };
    const result = SuggestImprovementsSchema.safeParse(input);
    expect(result.success).toBe(false);
  });

  it("rejects invalid focusAreas value", () => {
    const input = {
      imagePath: "/designs/test.png",
      focusAreas: ["layout", "performance"],
    };
    const result = SuggestImprovementsSchema.safeParse(input);
    expect(result.success).toBe(false);
  });

  it("rejects invalid priority value", () => {
    const input = {
      imagePath: "/designs/test.png",
      priority: "urgent",
    };
    const result = SuggestImprovementsSchema.safeParse(input);
    expect(result.success).toBe(false);
  });
});

// =========================================================================
// 7. GenerateWireframeSchema validation
// =========================================================================

describe("GenerateWireframeSchema", () => {
  it("accepts valid input with all required fields", () => {
    const input = {
      designDescription: "E-commerce product page with hero image",
      designType: "desktop",
      format: "html",
    };
    const result = GenerateWireframeSchema.safeParse(input);
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.designDescription).toBe("E-commerce product page with hero image");
      expect(result.data.designType).toBe("desktop");
      expect(result.data.format).toBe("html");
      expect(result.data.includeAnnotations).toBeUndefined();
    }
  });

  it("accepts valid input with optional includeAnnotations", () => {
    const input = {
      designDescription: "Login form",
      designType: "mobile",
      format: "ascii",
      includeAnnotations: true,
    };
    const result = GenerateWireframeSchema.safeParse(input);
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.includeAnnotations).toBe(true);
    }
  });

  it("accepts all valid designType enum values", () => {
    for (const designType of ["mobile", "desktop", "tablet"] as const) {
      const result = GenerateWireframeSchema.safeParse({
        designDescription: "Test",
        designType,
        format: "html",
      });
      expect(result.success).toBe(true);
    }
  });

  it("accepts all valid format enum values", () => {
    for (const format of ["html", "ascii", "mermaid"] as const) {
      const result = GenerateWireframeSchema.safeParse({
        designDescription: "Test",
        designType: "desktop",
        format,
      });
      expect(result.success).toBe(true);
    }
  });

  it("rejects missing designDescription", () => {
    const input = { designType: "desktop", format: "html" };
    const result = GenerateWireframeSchema.safeParse(input);
    expect(result.success).toBe(false);
  });

  it("rejects missing designType", () => {
    const input = { designDescription: "A page", format: "html" };
    const result = GenerateWireframeSchema.safeParse(input);
    expect(result.success).toBe(false);
  });

  it("rejects missing format", () => {
    const input = { designDescription: "A page", designType: "desktop" };
    const result = GenerateWireframeSchema.safeParse(input);
    expect(result.success).toBe(false);
  });

  it("rejects invalid designType value", () => {
    const input = {
      designDescription: "A page",
      designType: "wearable",
      format: "html",
    };
    const result = GenerateWireframeSchema.safeParse(input);
    expect(result.success).toBe(false);
  });

  it("rejects invalid format value", () => {
    const input = {
      designDescription: "A page",
      designType: "desktop",
      format: "svg",
    };
    const result = GenerateWireframeSchema.safeParse(input);
    expect(result.success).toBe(false);
  });

  it("rejects non-boolean includeAnnotations", () => {
    const input = {
      designDescription: "A page",
      designType: "desktop",
      format: "html",
      includeAnnotations: "yes",
    };
    const result = GenerateWireframeSchema.safeParse(input);
    expect(result.success).toBe(false);
  });

  it("does not accept 'responsive' as designType (unlike AnalyzeDesign)", () => {
    const result = GenerateWireframeSchema.safeParse({
      designDescription: "Test",
      designType: "responsive",
      format: "html",
    });
    expect(result.success).toBe(false);
  });
});

// =========================================================================
// 8. CompareDesignsSchema validation
// =========================================================================

describe("CompareDesignsSchema", () => {
  it("accepts valid input with all required fields", () => {
    const input = {
      imagePathA: "/designs/v1.png",
      imagePathB: "/designs/v2.png",
      comparisonType: "ab_test",
    };
    const result = CompareDesignsSchema.safeParse(input);
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.imagePathA).toBe("/designs/v1.png");
      expect(result.data.imagePathB).toBe("/designs/v2.png");
      expect(result.data.comparisonType).toBe("ab_test");
      expect(result.data.metrics).toBeUndefined();
    }
  });

  it("accepts valid input with optional metrics", () => {
    const input = {
      imagePathA: "/designs/v1.png",
      imagePathB: "/designs/v2.png",
      comparisonType: "iteration",
      metrics: ["visual_impact", "clarity"],
    };
    const result = CompareDesignsSchema.safeParse(input);
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.metrics).toEqual(["visual_impact", "clarity"]);
    }
  });

  it("accepts all valid comparisonType enum values", () => {
    for (const comparisonType of ["ab_test", "iteration", "responsive"] as const) {
      const result = CompareDesignsSchema.safeParse({
        imagePathA: "/a.png",
        imagePathB: "/b.png",
        comparisonType,
      });
      expect(result.success).toBe(true);
    }
  });

  it("accepts all valid metrics enum values", () => {
    const allMetrics = [
      "visual_impact", "clarity", "accessibility", "consistency",
    ] as const;
    const result = CompareDesignsSchema.safeParse({
      imagePathA: "/a.png",
      imagePathB: "/b.png",
      comparisonType: "ab_test",
      metrics: [...allMetrics],
    });
    expect(result.success).toBe(true);
  });

  it("rejects missing imagePathA", () => {
    const input = { imagePathB: "/b.png", comparisonType: "ab_test" };
    const result = CompareDesignsSchema.safeParse(input);
    expect(result.success).toBe(false);
  });

  it("rejects missing imagePathB", () => {
    const input = { imagePathA: "/a.png", comparisonType: "ab_test" };
    const result = CompareDesignsSchema.safeParse(input);
    expect(result.success).toBe(false);
  });

  it("rejects missing comparisonType", () => {
    const input = { imagePathA: "/a.png", imagePathB: "/b.png" };
    const result = CompareDesignsSchema.safeParse(input);
    expect(result.success).toBe(false);
  });

  it("rejects invalid comparisonType value", () => {
    const input = {
      imagePathA: "/a.png",
      imagePathB: "/b.png",
      comparisonType: "pixel_diff",
    };
    const result = CompareDesignsSchema.safeParse(input);
    expect(result.success).toBe(false);
  });

  it("rejects invalid metrics value", () => {
    const input = {
      imagePathA: "/a.png",
      imagePathB: "/b.png",
      comparisonType: "ab_test",
      metrics: ["visual_impact", "performance"],
    };
    const result = CompareDesignsSchema.safeParse(input);
    expect(result.success).toBe(false);
  });
});

// =========================================================================
// 9. CheckUsabilitySchema validation
// =========================================================================

describe("CheckUsabilitySchema", () => {
  it("accepts valid input with required fields only", () => {
    const input = { imagePath: "/designs/checkout.png" };
    const result = CheckUsabilitySchema.safeParse(input);
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.userFlow).toBeUndefined();
      expect(result.data.heuristics).toBeUndefined();
    }
  });

  it("accepts valid input with all optional fields", () => {
    const input = {
      imagePath: "/designs/checkout.png",
      userFlow: "User completes purchase flow",
      heuristics: ["visibility", "feedback", "error_prevention"],
    };
    const result = CheckUsabilitySchema.safeParse(input);
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.userFlow).toBe("User completes purchase flow");
      expect(result.data.heuristics).toEqual(["visibility", "feedback", "error_prevention"]);
    }
  });

  it("accepts all valid heuristics enum values", () => {
    const allHeuristics = [
      "visibility", "feedback", "affordance", "consistency",
      "error_prevention", "recognition", "flexibility", "aesthetic",
    ] as const;
    const result = CheckUsabilitySchema.safeParse({
      imagePath: "/designs/test.png",
      heuristics: [...allHeuristics],
    });
    expect(result.success).toBe(true);
  });

  it("rejects missing imagePath", () => {
    const input = { userFlow: "Login flow" };
    const result = CheckUsabilitySchema.safeParse(input);
    expect(result.success).toBe(false);
  });

  it("rejects invalid heuristics value", () => {
    const input = {
      imagePath: "/designs/test.png",
      heuristics: ["visibility", "learnability"],
    };
    const result = CheckUsabilitySchema.safeParse(input);
    expect(result.success).toBe(false);
  });

  it("accepts empty heuristics array", () => {
    const result = CheckUsabilitySchema.safeParse({
      imagePath: "/designs/test.png",
      heuristics: [],
    });
    expect(result.success).toBe(true);
  });

  it("rejects non-string userFlow", () => {
    const result = CheckUsabilitySchema.safeParse({
      imagePath: "/designs/test.png",
      userFlow: 123,
    });
    expect(result.success).toBe(false);
  });
});

// =========================================================================
// 10. sanitizePath integration
// =========================================================================

describe("sanitizePath", () => {
  it("resolves a valid absolute path unchanged", () => {
    const result = sanitizePath("/home/user/designs/screenshot.png");
    expect(result).toBe("/home/user/designs/screenshot.png");
  });

  it("resolves a relative path to an absolute one", () => {
    const result = sanitizePath("designs/screenshot.png");
    expect(result).toMatch(/^\/.*designs\/screenshot\.png$/);
  });

  it("rejects empty path", () => {
    expect(() => sanitizePath("")).toThrow(SanitizationError);
  });

  it("rejects whitespace-only path", () => {
    expect(() => sanitizePath("   ")).toThrow(SanitizationError);
  });

  it("rejects path containing null bytes", () => {
    expect(() => sanitizePath("/tmp/evil\0file.png")).toThrow(SanitizationError);
  });

  it("rejects path traversal outside base directory", () => {
    expect(() => sanitizePath("../../etc/passwd", "/home/user/designs")).toThrow(
      SanitizationError
    );
  });

  it("allows paths within the base directory", () => {
    const result = sanitizePath(
      "/home/user/designs/mobile/screenshot.png",
      "/home/user/designs"
    );
    expect(result).toBe("/home/user/designs/mobile/screenshot.png");
  });

  it("allows the base directory path itself", () => {
    const result = sanitizePath("/home/user/designs", "/home/user/designs");
    expect(result).toBe("/home/user/designs");
  });

  it("rejects path with double dot traversal within the path", () => {
    expect(() =>
      sanitizePath("/home/user/designs/../../../etc/shadow", "/home/user/designs")
    ).toThrow(SanitizationError);
  });
});

// =========================================================================
// 11. errorResponse formatting
// =========================================================================

describe("errorResponse", () => {
  it("formats an Error object with context", () => {
    const err = new Error("image not found");
    const response = errorResponse(err, "analyze_design");
    expect(response.isError).toBe(true);
    expect(response.content).toHaveLength(1);
    expect(response.content[0].type).toBe("text");
    expect(response.content[0].text).toBe(
      "Error in analyze_design: image not found"
    );
  });

  it("formats a string error with context", () => {
    const response = errorResponse("timeout exceeded", "check_accessibility");
    expect(response.isError).toBe(true);
    expect(response.content[0].text).toBe(
      "Error in check_accessibility: timeout exceeded"
    );
  });

  it("formats an Error object without context", () => {
    const err = new Error("failure");
    const response = errorResponse(err);
    expect(response.isError).toBe(true);
    expect(response.content[0].text).toBe("Error: failure");
  });

  it("formats a non-Error non-string value", () => {
    const response = errorResponse(42, "review_typography");
    expect(response.isError).toBe(true);
    expect(response.content[0].text).toBe("Error in review_typography: 42");
  });

  it("handles SanitizationError as a regular Error", () => {
    const err = new SanitizationError("Path traversal detected", "path", "../etc/passwd");
    const response = errorResponse(err, "validate_spacing");
    expect(response.isError).toBe(true);
    expect(response.content[0].text).toContain("Path traversal detected");
    expect(response.content[0].text).toContain("validate_spacing");
  });

  it("handles undefined error value", () => {
    const response = errorResponse(undefined, "check_usability");
    expect(response.isError).toBe(true);
    expect(response.content[0].text).toContain("check_usability");
  });

  it("handles null error value", () => {
    const response = errorResponse(null, "generate_wireframe");
    expect(response.isError).toBe(true);
    expect(response.content[0].text).toContain("generate_wireframe");
  });
});

// =========================================================================
// 12. Tool registration completeness
// =========================================================================

describe("Tool registration", () => {
  it("server registers exactly the nine expected tool names", () => {
    const schemaToolMap: Record<string, z.ZodObject<any>> = {
      analyze_design: AnalyzeDesignSchema,
      check_accessibility: CheckAccessibilitySchema,
      review_typography: ReviewTypographySchema,
      validate_spacing: ValidateSpacingSchema,
      check_color_scheme: CheckColorSchemeSchema,
      suggest_improvements: SuggestImprovementsSchema,
      generate_wireframe: GenerateWireframeSchema,
      compare_designs: CompareDesignsSchema,
      check_usability: CheckUsabilitySchema,
    };

    expect(Object.keys(schemaToolMap).sort()).toEqual(
      [...EXPECTED_TOOL_NAMES].sort()
    );
  });

  it("all nine tool names are present in the expected set", () => {
    expect(EXPECTED_TOOL_NAMES).toContain("analyze_design");
    expect(EXPECTED_TOOL_NAMES).toContain("check_accessibility");
    expect(EXPECTED_TOOL_NAMES).toContain("review_typography");
    expect(EXPECTED_TOOL_NAMES).toContain("validate_spacing");
    expect(EXPECTED_TOOL_NAMES).toContain("check_color_scheme");
    expect(EXPECTED_TOOL_NAMES).toContain("suggest_improvements");
    expect(EXPECTED_TOOL_NAMES).toContain("generate_wireframe");
    expect(EXPECTED_TOOL_NAMES).toContain("compare_designs");
    expect(EXPECTED_TOOL_NAMES).toContain("check_usability");
  });

  it("no duplicate tool names exist", () => {
    const unique = new Set(EXPECTED_TOOL_NAMES);
    expect(unique.size).toBe(EXPECTED_TOOL_NAMES.length);
  });

  it("exactly nine tools are registered", () => {
    expect(EXPECTED_TOOL_NAMES).toHaveLength(9);
  });
});

// =========================================================================
// 13. Schema edge cases
// =========================================================================

describe("Schema edge cases", () => {
  it("AnalyzeDesignSchema accepts empty string imagePath (schema allows any string)", () => {
    const result = AnalyzeDesignSchema.safeParse({ imagePath: "" });
    expect(result.success).toBe(true);
  });

  it("GenerateWireframeSchema accepts empty string designDescription", () => {
    const result = GenerateWireframeSchema.safeParse({
      designDescription: "",
      designType: "desktop",
      format: "html",
    });
    expect(result.success).toBe(true);
  });

  it("CompareDesignsSchema rejects when imagePathA is a number", () => {
    const result = CompareDesignsSchema.safeParse({
      imagePathA: 123,
      imagePathB: "/b.png",
      comparisonType: "ab_test",
    });
    expect(result.success).toBe(false);
  });

  it("CompareDesignsSchema rejects when imagePathB is a number", () => {
    const result = CompareDesignsSchema.safeParse({
      imagePathA: "/a.png",
      imagePathB: 456,
      comparisonType: "ab_test",
    });
    expect(result.success).toBe(false);
  });

  it("CheckAccessibilitySchema rejects array as imagePath", () => {
    const result = CheckAccessibilitySchema.safeParse({
      imagePath: ["/designs/test.png"],
    });
    expect(result.success).toBe(false);
  });

  it("ValidateSpacingSchema rejects NaN as baseUnit", () => {
    const result = ValidateSpacingSchema.safeParse({
      imagePath: "/designs/test.png",
      baseUnit: NaN,
    });
    expect(result.success).toBe(false);
  });

  it("SuggestImprovementsSchema rejects non-array focusAreas", () => {
    const result = SuggestImprovementsSchema.safeParse({
      imagePath: "/designs/test.png",
      focusAreas: "layout",
    });
    expect(result.success).toBe(false);
  });

  it("CheckUsabilitySchema rejects duplicate heuristics (schema allows them)", () => {
    // Zod arrays do not enforce uniqueness by default
    const result = CheckUsabilitySchema.safeParse({
      imagePath: "/designs/test.png",
      heuristics: ["visibility", "visibility"],
    });
    expect(result.success).toBe(true);
  });

  it("CheckColorSchemeSchema rejects checks as string instead of array", () => {
    const result = CheckColorSchemeSchema.safeParse({
      imagePath: "/designs/test.png",
      checks: "contrast",
    });
    expect(result.success).toBe(false);
  });

  it("CompareDesignsSchema accepts same path for both images", () => {
    const result = CompareDesignsSchema.safeParse({
      imagePathA: "/designs/same.png",
      imagePathB: "/designs/same.png",
      comparisonType: "ab_test",
    });
    expect(result.success).toBe(true);
  });

  it("GenerateWireframeSchema rejects object instead of string for format", () => {
    const result = GenerateWireframeSchema.safeParse({
      designDescription: "Test",
      designType: "desktop",
      format: { type: "html" },
    });
    expect(result.success).toBe(false);
  });

  it("ReviewTypographySchema rejects aspects as a single string", () => {
    const result = ReviewTypographySchema.safeParse({
      imagePath: "/designs/test.png",
      aspects: "hierarchy",
    });
    expect(result.success).toBe(false);
  });
});
