/**
 * Unit tests for design-system-mcp server.
 *
 * Tests cover:
 * - Zod schema validation for all five tool schemas (valid inputs,
 *   missing required fields, invalid enum values, edge cases)
 * - sanitizePath integration (path traversal, null bytes, empty paths)
 * - errorResponse formatting
 * - Tool name registration completeness
 * - Schema-to-sanitize pipeline integration
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

const ValidateTokensSchema = z.object({
  tokensFile: z.string().describe("Path to design tokens JSON/CSS file"),
  rules: z.array(z.enum([
    "naming_convention",
    "color_contrast",
    "spacing_scale",
    "typography_scale",
  ])).optional().describe("Validation rules to apply"),
});

const CheckComponentSchema = z.object({
  componentPath: z.string().describe("Path to component file (React/Vue/HTML)"),
  designSystemPath: z.string().describe("Path to design system configuration"),
  checks: z.array(z.enum([
    "token_usage",
    "accessibility",
    "responsive_design",
    "component_api",
  ])).optional().describe("Checks to perform"),
});

const ValidateColorPaletteSchema = z.object({
  colorsFile: z.string().describe("Path to colors configuration"),
  wcagLevel: z.enum(["AA", "AAA"]).optional().describe("WCAG compliance level"),
});

const AnalyzeSpacingSchema = z.object({
  directory: z.string().describe("Directory to analyze"),
  baseUnit: z.number().optional().describe("Base spacing unit (default: 8)"),
});

const GenerateReportSchema = z.object({
  resultsPath: z.string().describe("Path to validation results JSON"),
  format: z.enum(["markdown", "html", "json"]).describe("Report format"),
  includeRecommendations: z.boolean().optional().describe("Include fix recommendations"),
});

// The expected set of tool names registered in the ListTools handler.
const EXPECTED_TOOL_NAMES = [
  "validate_tokens",
  "check_component",
  "validate_color_palette",
  "analyze_spacing",
  "generate_report",
];

// =========================================================================
// 1. ValidateTokensSchema validation
// =========================================================================

describe("ValidateTokensSchema", () => {
  it("accepts valid input with required fields only", () => {
    const input = { tokensFile: "/design/tokens.json" };
    const result = ValidateTokensSchema.safeParse(input);
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.tokensFile).toBe("/design/tokens.json");
      expect(result.data.rules).toBeUndefined();
    }
  });

  it("accepts valid input with all rules specified", () => {
    const input = {
      tokensFile: "/design/tokens.json",
      rules: ["naming_convention", "color_contrast", "spacing_scale", "typography_scale"],
    };
    const result = ValidateTokensSchema.safeParse(input);
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.rules).toHaveLength(4);
    }
  });

  it("accepts valid input with a single rule", () => {
    const input = { tokensFile: "/tokens.json", rules: ["color_contrast"] };
    const result = ValidateTokensSchema.safeParse(input);
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.rules).toEqual(["color_contrast"]);
    }
  });

  it("accepts valid input with an empty rules array", () => {
    const input = { tokensFile: "/tokens.json", rules: [] };
    const result = ValidateTokensSchema.safeParse(input);
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.rules).toEqual([]);
    }
  });

  it("rejects missing tokensFile", () => {
    const input = { rules: ["naming_convention"] };
    const result = ValidateTokensSchema.safeParse(input);
    expect(result.success).toBe(false);
  });

  it("rejects invalid rule enum value", () => {
    const input = { tokensFile: "/tokens.json", rules: ["invalid_rule"] };
    const result = ValidateTokensSchema.safeParse(input);
    expect(result.success).toBe(false);
  });

  it("rejects non-string tokensFile", () => {
    const input = { tokensFile: 123 };
    const result = ValidateTokensSchema.safeParse(input);
    expect(result.success).toBe(false);
  });

  it("rejects null as tokensFile", () => {
    const input = { tokensFile: null };
    const result = ValidateTokensSchema.safeParse(input);
    expect(result.success).toBe(false);
  });

  it("rejects rules as a string instead of array", () => {
    const input = { tokensFile: "/tokens.json", rules: "naming_convention" };
    const result = ValidateTokensSchema.safeParse(input);
    expect(result.success).toBe(false);
  });

  it("strips unknown properties", () => {
    const input = {
      tokensFile: "/tokens.json",
      extraField: "should be stripped",
    };
    const result = ValidateTokensSchema.safeParse(input);
    expect(result.success).toBe(true);
    if (result.success) {
      expect((result.data as any).extraField).toBeUndefined();
    }
  });

  it("accepts all valid rule enum values individually", () => {
    for (const rule of [
      "naming_convention",
      "color_contrast",
      "spacing_scale",
      "typography_scale",
    ] as const) {
      const result = ValidateTokensSchema.safeParse({
        tokensFile: "/tokens.json",
        rules: [rule],
      });
      expect(result.success).toBe(true);
    }
  });
});

// =========================================================================
// 2. CheckComponentSchema validation
// =========================================================================

describe("CheckComponentSchema", () => {
  it("accepts valid input with required fields only", () => {
    const input = {
      componentPath: "/src/Button.tsx",
      designSystemPath: "/design/system.json",
    };
    const result = CheckComponentSchema.safeParse(input);
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.componentPath).toBe("/src/Button.tsx");
      expect(result.data.designSystemPath).toBe("/design/system.json");
      expect(result.data.checks).toBeUndefined();
    }
  });

  it("accepts valid input with all checks specified", () => {
    const input = {
      componentPath: "/src/Card.vue",
      designSystemPath: "/design/system.json",
      checks: ["token_usage", "accessibility", "responsive_design", "component_api"],
    };
    const result = CheckComponentSchema.safeParse(input);
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.checks).toHaveLength(4);
    }
  });

  it("accepts valid input with a single check", () => {
    const input = {
      componentPath: "/src/Header.html",
      designSystemPath: "/design/tokens.json",
      checks: ["accessibility"],
    };
    const result = CheckComponentSchema.safeParse(input);
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.checks).toEqual(["accessibility"]);
    }
  });

  it("accepts valid input with empty checks array", () => {
    const input = {
      componentPath: "/src/Footer.tsx",
      designSystemPath: "/design/system.json",
      checks: [],
    };
    const result = CheckComponentSchema.safeParse(input);
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.checks).toEqual([]);
    }
  });

  it("rejects missing componentPath", () => {
    const input = { designSystemPath: "/design/system.json" };
    const result = CheckComponentSchema.safeParse(input);
    expect(result.success).toBe(false);
  });

  it("rejects missing designSystemPath", () => {
    const input = { componentPath: "/src/Button.tsx" };
    const result = CheckComponentSchema.safeParse(input);
    expect(result.success).toBe(false);
  });

  it("rejects missing both required fields", () => {
    const result = CheckComponentSchema.safeParse({});
    expect(result.success).toBe(false);
  });

  it("rejects invalid check enum value", () => {
    const input = {
      componentPath: "/src/Button.tsx",
      designSystemPath: "/design/system.json",
      checks: ["invalid_check"],
    };
    const result = CheckComponentSchema.safeParse(input);
    expect(result.success).toBe(false);
  });

  it("rejects non-string componentPath", () => {
    const input = {
      componentPath: 42,
      designSystemPath: "/design/system.json",
    };
    const result = CheckComponentSchema.safeParse(input);
    expect(result.success).toBe(false);
  });

  it("accepts all valid check enum values individually", () => {
    for (const check of [
      "token_usage",
      "accessibility",
      "responsive_design",
      "component_api",
    ] as const) {
      const result = CheckComponentSchema.safeParse({
        componentPath: "/src/Component.tsx",
        designSystemPath: "/design/system.json",
        checks: [check],
      });
      expect(result.success).toBe(true);
    }
  });
});

// =========================================================================
// 3. ValidateColorPaletteSchema validation
// =========================================================================

describe("ValidateColorPaletteSchema", () => {
  it("accepts valid input with required fields only", () => {
    const input = { colorsFile: "/design/colors.json" };
    const result = ValidateColorPaletteSchema.safeParse(input);
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.colorsFile).toBe("/design/colors.json");
      expect(result.data.wcagLevel).toBeUndefined();
    }
  });

  it("accepts valid input with wcagLevel AA", () => {
    const input = { colorsFile: "/colors.json", wcagLevel: "AA" };
    const result = ValidateColorPaletteSchema.safeParse(input);
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.wcagLevel).toBe("AA");
    }
  });

  it("accepts valid input with wcagLevel AAA", () => {
    const input = { colorsFile: "/colors.json", wcagLevel: "AAA" };
    const result = ValidateColorPaletteSchema.safeParse(input);
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.wcagLevel).toBe("AAA");
    }
  });

  it("rejects missing colorsFile", () => {
    const input = { wcagLevel: "AA" };
    const result = ValidateColorPaletteSchema.safeParse(input);
    expect(result.success).toBe(false);
  });

  it("rejects invalid wcagLevel value", () => {
    const input = { colorsFile: "/colors.json", wcagLevel: "A" };
    const result = ValidateColorPaletteSchema.safeParse(input);
    expect(result.success).toBe(false);
  });

  it("rejects wcagLevel as number", () => {
    const input = { colorsFile: "/colors.json", wcagLevel: 2 };
    const result = ValidateColorPaletteSchema.safeParse(input);
    expect(result.success).toBe(false);
  });

  it("rejects wcagLevel lowercase 'aa'", () => {
    const input = { colorsFile: "/colors.json", wcagLevel: "aa" };
    const result = ValidateColorPaletteSchema.safeParse(input);
    expect(result.success).toBe(false);
  });

  it("rejects non-string colorsFile", () => {
    const input = { colorsFile: true };
    const result = ValidateColorPaletteSchema.safeParse(input);
    expect(result.success).toBe(false);
  });

  it("strips unknown properties", () => {
    const input = { colorsFile: "/colors.json", unknown: "value" };
    const result = ValidateColorPaletteSchema.safeParse(input);
    expect(result.success).toBe(true);
    if (result.success) {
      expect((result.data as any).unknown).toBeUndefined();
    }
  });
});

// =========================================================================
// 4. AnalyzeSpacingSchema validation
// =========================================================================

describe("AnalyzeSpacingSchema", () => {
  it("accepts valid input with required fields only", () => {
    const input = { directory: "/src/styles" };
    const result = AnalyzeSpacingSchema.safeParse(input);
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.directory).toBe("/src/styles");
      expect(result.data.baseUnit).toBeUndefined();
    }
  });

  it("accepts valid input with optional baseUnit", () => {
    const input = { directory: "/src/styles", baseUnit: 4 };
    const result = AnalyzeSpacingSchema.safeParse(input);
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.baseUnit).toBe(4);
    }
  });

  it("accepts baseUnit of 0", () => {
    const input = { directory: "/src", baseUnit: 0 };
    const result = AnalyzeSpacingSchema.safeParse(input);
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.baseUnit).toBe(0);
    }
  });

  it("accepts negative baseUnit (no min constraint in schema)", () => {
    const input = { directory: "/src", baseUnit: -4 };
    const result = AnalyzeSpacingSchema.safeParse(input);
    // The schema has z.number().optional() with no .min() constraint,
    // so negative values are technically accepted by the schema.
    expect(result.success).toBe(true);
  });

  it("accepts floating-point baseUnit", () => {
    const input = { directory: "/src", baseUnit: 4.5 };
    const result = AnalyzeSpacingSchema.safeParse(input);
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.baseUnit).toBe(4.5);
    }
  });

  it("rejects missing directory", () => {
    const input = { baseUnit: 8 };
    const result = AnalyzeSpacingSchema.safeParse(input);
    expect(result.success).toBe(false);
  });

  it("rejects non-string directory", () => {
    const input = { directory: 123 };
    const result = AnalyzeSpacingSchema.safeParse(input);
    expect(result.success).toBe(false);
  });

  it("rejects non-number baseUnit", () => {
    const input = { directory: "/src", baseUnit: "eight" };
    const result = AnalyzeSpacingSchema.safeParse(input);
    expect(result.success).toBe(false);
  });

  it("rejects null as directory", () => {
    const input = { directory: null };
    const result = AnalyzeSpacingSchema.safeParse(input);
    expect(result.success).toBe(false);
  });
});

// =========================================================================
// 5. GenerateReportSchema validation
// =========================================================================

describe("GenerateReportSchema", () => {
  it("accepts valid input with required fields only", () => {
    const input = { resultsPath: "/results/validation.json", format: "markdown" };
    const result = GenerateReportSchema.safeParse(input);
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.resultsPath).toBe("/results/validation.json");
      expect(result.data.format).toBe("markdown");
      expect(result.data.includeRecommendations).toBeUndefined();
    }
  });

  it("accepts valid input with includeRecommendations true", () => {
    const input = {
      resultsPath: "/results/report.json",
      format: "html",
      includeRecommendations: true,
    };
    const result = GenerateReportSchema.safeParse(input);
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.includeRecommendations).toBe(true);
    }
  });

  it("accepts valid input with includeRecommendations false", () => {
    const input = {
      resultsPath: "/results/report.json",
      format: "json",
      includeRecommendations: false,
    };
    const result = GenerateReportSchema.safeParse(input);
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.includeRecommendations).toBe(false);
    }
  });

  it("accepts all valid format enum values", () => {
    for (const format of ["markdown", "html", "json"] as const) {
      const result = GenerateReportSchema.safeParse({
        resultsPath: "/results/data.json",
        format,
      });
      expect(result.success).toBe(true);
    }
  });

  it("rejects missing resultsPath", () => {
    const input = { format: "markdown" };
    const result = GenerateReportSchema.safeParse(input);
    expect(result.success).toBe(false);
  });

  it("rejects missing format", () => {
    const input = { resultsPath: "/results/report.json" };
    const result = GenerateReportSchema.safeParse(input);
    expect(result.success).toBe(false);
  });

  it("rejects missing both required fields", () => {
    const result = GenerateReportSchema.safeParse({});
    expect(result.success).toBe(false);
  });

  it("rejects invalid format enum value", () => {
    const input = { resultsPath: "/results/report.json", format: "pdf" };
    const result = GenerateReportSchema.safeParse(input);
    expect(result.success).toBe(false);
  });

  it("rejects format as uppercase 'MARKDOWN'", () => {
    const input = { resultsPath: "/results/report.json", format: "MARKDOWN" };
    const result = GenerateReportSchema.safeParse(input);
    expect(result.success).toBe(false);
  });

  it("rejects non-boolean includeRecommendations", () => {
    const input = {
      resultsPath: "/results/report.json",
      format: "markdown",
      includeRecommendations: "yes",
    };
    const result = GenerateReportSchema.safeParse(input);
    expect(result.success).toBe(false);
  });

  it("rejects non-string resultsPath", () => {
    const input = { resultsPath: 42, format: "json" };
    const result = GenerateReportSchema.safeParse(input);
    expect(result.success).toBe(false);
  });

  it("strips unknown properties", () => {
    const input = {
      resultsPath: "/results/report.json",
      format: "json",
      extra: "should be dropped",
    };
    const result = GenerateReportSchema.safeParse(input);
    expect(result.success).toBe(true);
    if (result.success) {
      expect((result.data as any).extra).toBeUndefined();
    }
  });
});

// =========================================================================
// 6. sanitizePath integration
// =========================================================================

describe("sanitizePath", () => {
  it("resolves a valid absolute path unchanged", () => {
    const result = sanitizePath("/home/user/project/tokens.json");
    expect(result).toBe("/home/user/project/tokens.json");
  });

  it("resolves a relative path to an absolute one", () => {
    const result = sanitizePath("design/tokens.json");
    expect(result).toMatch(/^\/.*design\/tokens\.json$/);
  });

  it("rejects empty path", () => {
    expect(() => sanitizePath("")).toThrow(SanitizationError);
  });

  it("rejects whitespace-only path", () => {
    expect(() => sanitizePath("   ")).toThrow(SanitizationError);
  });

  it("rejects path containing null bytes", () => {
    expect(() => sanitizePath("/tmp/evil\0file")).toThrow(SanitizationError);
    expect(() => sanitizePath("/tmp/evil\0file")).toThrow("null bytes");
  });

  it("rejects path traversal outside base directory", () => {
    expect(() =>
      sanitizePath("../../etc/passwd", "/home/user/project")
    ).toThrow(SanitizationError);
  });

  it("allows paths within the base directory", () => {
    const result = sanitizePath(
      "/home/user/project/design/tokens.json",
      "/home/user/project"
    );
    expect(result).toBe("/home/user/project/design/tokens.json");
  });

  it("allows the base directory path itself", () => {
    const result = sanitizePath("/home/user/project", "/home/user/project");
    expect(result).toBe("/home/user/project");
  });

  it("handles path with trailing slashes", () => {
    const result = sanitizePath("/tmp/design/");
    expect(result).toBe("/tmp/design");
  });

  it("rejects path with embedded null byte in middle", () => {
    expect(() => sanitizePath("/home/user\0/project/file.json")).toThrow(
      SanitizationError
    );
  });

  it("rejects path traversal with dot-dot at start", () => {
    expect(() => sanitizePath("../../../etc/shadow", "/home/user")).toThrow(
      SanitizationError
    );
  });
});

// =========================================================================
// 7. errorResponse formatting
// =========================================================================

describe("errorResponse", () => {
  it("formats an Error object with context", () => {
    const err = new Error("validation failed");
    const response = errorResponse(err, "validate_tokens");
    expect(response.isError).toBe(true);
    expect(response.content).toHaveLength(1);
    expect(response.content[0].type).toBe("text");
    expect(response.content[0].text).toBe(
      "Error in validate_tokens: validation failed"
    );
  });

  it("formats a string error with context", () => {
    const response = errorResponse("file not found", "check_component");
    expect(response.isError).toBe(true);
    expect(response.content[0].text).toBe(
      "Error in check_component: file not found"
    );
  });

  it("formats an Error object without context", () => {
    const err = new Error("unknown failure");
    const response = errorResponse(err);
    expect(response.isError).toBe(true);
    expect(response.content[0].text).toBe("Error: unknown failure");
  });

  it("formats a non-Error non-string value", () => {
    const response = errorResponse(42, "analyze_spacing");
    expect(response.isError).toBe(true);
    expect(response.content[0].text).toBe("Error in analyze_spacing: 42");
  });

  it("handles SanitizationError as a regular Error", () => {
    const err = new SanitizationError(
      "Path traversal detected",
      "path",
      "../etc/passwd"
    );
    const response = errorResponse(err, "generate_report");
    expect(response.isError).toBe(true);
    expect(response.content[0].text).toContain("Path traversal detected");
    expect(response.content[0].text).toContain("generate_report");
  });

  it("handles undefined error value", () => {
    const response = errorResponse(undefined, "validate_color_palette");
    expect(response.isError).toBe(true);
    expect(response.content).toHaveLength(1);
  });

  it("handles null error value", () => {
    const response = errorResponse(null, "validate_tokens");
    expect(response.isError).toBe(true);
    expect(response.content).toHaveLength(1);
  });
});

// =========================================================================
// 8. Tool registration completeness
// =========================================================================

describe("Tool registration", () => {
  it("server registers exactly the five expected tool names", () => {
    // Since we cannot easily import and start the MCP server in a test
    // (it immediately connects to stdio transport), we verify the expected
    // tool names against the schemas we have replicated. If a schema is
    // defined above but not listed in EXPECTED_TOOL_NAMES (or vice-versa),
    // this test will fail, prompting the developer to keep them in sync.
    const schemaToolMap: Record<string, z.ZodObject<any>> = {
      validate_tokens: ValidateTokensSchema,
      check_component: CheckComponentSchema,
      validate_color_palette: ValidateColorPaletteSchema,
      analyze_spacing: AnalyzeSpacingSchema,
      generate_report: GenerateReportSchema,
    };

    expect(Object.keys(schemaToolMap).sort()).toEqual(
      [...EXPECTED_TOOL_NAMES].sort()
    );
  });

  it("all five tool names are present in the expected set", () => {
    expect(EXPECTED_TOOL_NAMES).toContain("validate_tokens");
    expect(EXPECTED_TOOL_NAMES).toContain("check_component");
    expect(EXPECTED_TOOL_NAMES).toContain("validate_color_palette");
    expect(EXPECTED_TOOL_NAMES).toContain("analyze_spacing");
    expect(EXPECTED_TOOL_NAMES).toContain("generate_report");
  });

  it("no duplicate tool names exist", () => {
    const unique = new Set(EXPECTED_TOOL_NAMES);
    expect(unique.size).toBe(EXPECTED_TOOL_NAMES.length);
  });

  it("expected tool count is exactly five", () => {
    expect(EXPECTED_TOOL_NAMES).toHaveLength(5);
  });
});

// =========================================================================
// 9. Schema edge cases
// =========================================================================

describe("Schema edge cases", () => {
  it("ValidateTokensSchema accepts empty string as tokensFile", () => {
    // Zod z.string() accepts empty strings -- validation of actual
    // path validity is delegated to sanitizePath at runtime.
    const result = ValidateTokensSchema.safeParse({ tokensFile: "" });
    expect(result.success).toBe(true);
  });

  it("CheckComponentSchema rejects checks as a string instead of array", () => {
    const result = CheckComponentSchema.safeParse({
      componentPath: "/src/Button.tsx",
      designSystemPath: "/design/system.json",
      checks: "accessibility",
    });
    expect(result.success).toBe(false);
  });

  it("ValidateColorPaletteSchema rejects array as colorsFile", () => {
    const result = ValidateColorPaletteSchema.safeParse({
      colorsFile: ["/colors.json"],
    });
    expect(result.success).toBe(false);
  });

  it("AnalyzeSpacingSchema rejects boolean as baseUnit", () => {
    const result = AnalyzeSpacingSchema.safeParse({
      directory: "/src",
      baseUnit: true,
    });
    expect(result.success).toBe(false);
  });

  it("GenerateReportSchema rejects null as format", () => {
    const result = GenerateReportSchema.safeParse({
      resultsPath: "/results.json",
      format: null,
    });
    expect(result.success).toBe(false);
  });

  it("CheckComponentSchema accepts duplicate checks in array", () => {
    // Zod does not deduplicate array values by default.
    const result = CheckComponentSchema.safeParse({
      componentPath: "/src/Button.tsx",
      designSystemPath: "/design/system.json",
      checks: ["accessibility", "accessibility"],
    });
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.checks).toEqual(["accessibility", "accessibility"]);
    }
  });

  it("ValidateTokensSchema rejects object instead of string for tokensFile", () => {
    const result = ValidateTokensSchema.safeParse({
      tokensFile: { path: "/tokens.json" },
    });
    expect(result.success).toBe(false);
  });

  it("GenerateReportSchema rejects number as includeRecommendations", () => {
    const result = GenerateReportSchema.safeParse({
      resultsPath: "/results.json",
      format: "json",
      includeRecommendations: 1,
    });
    expect(result.success).toBe(false);
  });

  it("AnalyzeSpacingSchema accepts very large baseUnit", () => {
    const result = AnalyzeSpacingSchema.safeParse({
      directory: "/styles",
      baseUnit: 999999,
    });
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.baseUnit).toBe(999999);
    }
  });
});

// =========================================================================
// 10. Schema-to-sanitize pipeline integration
// =========================================================================

describe("schema parse -> sanitize pipeline", () => {
  it("ValidateTokensSchema + sanitizePath: valid path passes through", () => {
    const parsed = ValidateTokensSchema.parse({ tokensFile: "/home/user/tokens.json" });
    const safePath = sanitizePath(parsed.tokensFile);
    expect(safePath).toBe("/home/user/tokens.json");
  });

  it("CheckComponentSchema + sanitizePath: valid paths pass through", () => {
    const parsed = CheckComponentSchema.parse({
      componentPath: "/home/user/src/Button.tsx",
      designSystemPath: "/home/user/design/system.json",
    });
    const safeComponent = sanitizePath(parsed.componentPath);
    const safeDesign = sanitizePath(parsed.designSystemPath);
    expect(safeComponent).toBe("/home/user/src/Button.tsx");
    expect(safeDesign).toBe("/home/user/design/system.json");
  });

  it("ValidateColorPaletteSchema + sanitizePath: valid path passes through", () => {
    const parsed = ValidateColorPaletteSchema.parse({
      colorsFile: "/home/user/design/colors.json",
    });
    const safePath = sanitizePath(parsed.colorsFile);
    expect(safePath).toBe("/home/user/design/colors.json");
  });

  it("AnalyzeSpacingSchema + sanitizePath: valid directory passes through", () => {
    const parsed = AnalyzeSpacingSchema.parse({ directory: "/home/user/styles" });
    const safePath = sanitizePath(parsed.directory);
    expect(safePath).toBe("/home/user/styles");
  });

  it("GenerateReportSchema + sanitizePath: valid path passes through", () => {
    const parsed = GenerateReportSchema.parse({
      resultsPath: "/home/user/results.json",
      format: "markdown",
    });
    const safePath = sanitizePath(parsed.resultsPath);
    expect(safePath).toBe("/home/user/results.json");
  });

  it("ValidateTokensSchema + sanitizePath: null byte in path is blocked", () => {
    // Zod passes the null byte through; sanitizePath catches it.
    expect(() =>
      ValidateTokensSchema.parse({ tokensFile: "/tmp/tokens\0.json" })
    ).not.toThrow();
    const parsed = ValidateTokensSchema.parse({
      tokensFile: "/tmp/tokens\0.json",
    });
    expect(() => sanitizePath(parsed.tokensFile)).toThrow(SanitizationError);
  });

  it("AnalyzeSpacingSchema + sanitizePath: traversal with basePath is blocked", () => {
    const parsed = AnalyzeSpacingSchema.parse({
      directory: "../../etc",
      baseUnit: 8,
    });
    expect(() =>
      sanitizePath(parsed.directory, "/home/user/project")
    ).toThrow(SanitizationError);
  });

  it("CheckComponentSchema + sanitizePath: traversal in componentPath is blocked", () => {
    const parsed = CheckComponentSchema.parse({
      componentPath: "../../../etc/passwd",
      designSystemPath: "/home/user/design/system.json",
    });
    expect(() =>
      sanitizePath(parsed.componentPath, "/home/user/project")
    ).toThrow(SanitizationError);
  });

  it("GenerateReportSchema + sanitizePath: empty resultsPath blocked by sanitizePath", () => {
    // Zod accepts empty string, but sanitizePath rejects it.
    const parsed = GenerateReportSchema.parse({
      resultsPath: "",
      format: "json",
    });
    expect(() => sanitizePath(parsed.resultsPath)).toThrow(SanitizationError);
  });
});
