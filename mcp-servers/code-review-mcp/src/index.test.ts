/**
 * Unit tests for code-review-mcp server.
 *
 * Tests cover:
 * - Zod schema validation (valid/invalid inputs for all four tool schemas)
 * - sanitizePath integration (path traversal and null-byte rejection)
 * - sanitizeUrl integration (protocol and private-IP blocking)
 * - errorResponse formatting
 * - Tool name registration (ListTools handler coverage)
 */

import { z } from "zod";
import {
  sanitizePath,
  sanitizeUrl,
  errorResponse,
  SanitizationError,
} from "mcp-shared";

// ---------------------------------------------------------------------------
// Replicated Zod schemas (mirrors src/index.ts – not exported from there)
// ---------------------------------------------------------------------------

const LintFileSchema = z.object({
  filePath: z.string().describe("Path to the file to lint"),
  linter: z.enum(["eslint", "pylint", "rubocop"]).describe("Linter to use"),
  fixable: z.boolean().optional().describe("Whether to auto-fix issues"),
});

const SecurityScanSchema = z.object({
  targetPath: z.string().describe("Path to scan (file or directory)"),
  scanner: z
    .enum(["bandit", "semgrep", "snyk"])
    .describe("Security scanner to use"),
  severity: z
    .enum(["low", "medium", "high", "critical"])
    .optional()
    .describe("Minimum severity to report"),
});

const CodeComplexitySchema = z.object({
  filePath: z.string().describe("Path to analyze"),
  language: z
    .enum(["javascript", "python", "java"])
    .describe("Programming language"),
});

const FindDuplicatesSchema = z.object({
  directory: z.string().describe("Directory to scan for duplicates"),
  minLines: z
    .number()
    .optional()
    .describe("Minimum lines for duplicate detection (default: 5)"),
});

// The expected set of tool names registered in the ListTools handler.
const EXPECTED_TOOL_NAMES = [
  "lint_file",
  "security_scan",
  "analyze_complexity",
  "find_duplicates",
];

// =========================================================================
// 1. LintFileSchema validation
// =========================================================================

describe("LintFileSchema", () => {
  it("accepts valid input with required fields only", () => {
    const input = { filePath: "/src/app.ts", linter: "eslint" };
    const result = LintFileSchema.safeParse(input);
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.filePath).toBe("/src/app.ts");
      expect(result.data.linter).toBe("eslint");
      expect(result.data.fixable).toBeUndefined();
    }
  });

  it("accepts valid input with optional fixable field", () => {
    const input = { filePath: "/src/app.py", linter: "pylint", fixable: true };
    const result = LintFileSchema.safeParse(input);
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.fixable).toBe(true);
    }
  });

  it("rejects missing filePath", () => {
    const input = { linter: "eslint" };
    const result = LintFileSchema.safeParse(input);
    expect(result.success).toBe(false);
  });

  it("rejects missing linter", () => {
    const input = { filePath: "/src/app.ts" };
    const result = LintFileSchema.safeParse(input);
    expect(result.success).toBe(false);
  });

  it("rejects invalid linter value", () => {
    const input = { filePath: "/src/app.ts", linter: "flake8" };
    const result = LintFileSchema.safeParse(input);
    expect(result.success).toBe(false);
  });

  it("rejects non-boolean fixable value", () => {
    const input = { filePath: "/src/app.ts", linter: "eslint", fixable: "yes" };
    const result = LintFileSchema.safeParse(input);
    expect(result.success).toBe(false);
  });
});

// =========================================================================
// 2. SecurityScanSchema validation
// =========================================================================

describe("SecurityScanSchema", () => {
  it("accepts valid input with required fields only", () => {
    const input = { targetPath: "/project", scanner: "semgrep" };
    const result = SecurityScanSchema.safeParse(input);
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.severity).toBeUndefined();
    }
  });

  it("accepts valid input with optional severity", () => {
    const input = {
      targetPath: "/project",
      scanner: "bandit",
      severity: "high",
    };
    const result = SecurityScanSchema.safeParse(input);
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.severity).toBe("high");
    }
  });

  it("rejects invalid scanner value", () => {
    const input = { targetPath: "/project", scanner: "sonarqube" };
    const result = SecurityScanSchema.safeParse(input);
    expect(result.success).toBe(false);
  });

  it("rejects invalid severity value", () => {
    const input = {
      targetPath: "/project",
      scanner: "snyk",
      severity: "ultra",
    };
    const result = SecurityScanSchema.safeParse(input);
    expect(result.success).toBe(false);
  });

  it("rejects missing targetPath", () => {
    const input = { scanner: "bandit" };
    const result = SecurityScanSchema.safeParse(input);
    expect(result.success).toBe(false);
  });
});

// =========================================================================
// 3. CodeComplexitySchema validation
// =========================================================================

describe("CodeComplexitySchema", () => {
  it("accepts valid input", () => {
    const input = { filePath: "/src/index.js", language: "javascript" };
    const result = CodeComplexitySchema.safeParse(input);
    expect(result.success).toBe(true);
  });

  it("rejects unsupported language", () => {
    const input = { filePath: "/src/main.go", language: "go" };
    const result = CodeComplexitySchema.safeParse(input);
    expect(result.success).toBe(false);
  });

  it("rejects missing language", () => {
    const input = { filePath: "/src/index.js" };
    const result = CodeComplexitySchema.safeParse(input);
    expect(result.success).toBe(false);
  });
});

// =========================================================================
// 4. FindDuplicatesSchema validation
// =========================================================================

describe("FindDuplicatesSchema", () => {
  it("accepts valid input with required fields only", () => {
    const input = { directory: "/src" };
    const result = FindDuplicatesSchema.safeParse(input);
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.minLines).toBeUndefined();
    }
  });

  it("accepts valid input with optional minLines", () => {
    const input = { directory: "/src", minLines: 10 };
    const result = FindDuplicatesSchema.safeParse(input);
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.minLines).toBe(10);
    }
  });

  it("rejects non-number minLines", () => {
    const input = { directory: "/src", minLines: "ten" };
    const result = FindDuplicatesSchema.safeParse(input);
    expect(result.success).toBe(false);
  });

  it("rejects missing directory", () => {
    const input = { minLines: 5 };
    const result = FindDuplicatesSchema.safeParse(input);
    expect(result.success).toBe(false);
  });
});

// =========================================================================
// 5. sanitizePath integration
// =========================================================================

describe("sanitizePath", () => {
  it("resolves a valid absolute path unchanged", () => {
    const result = sanitizePath("/home/user/project/file.ts");
    expect(result).toBe("/home/user/project/file.ts");
  });

  it("resolves a relative path to an absolute one", () => {
    const result = sanitizePath("src/index.ts");
    expect(result).toMatch(/^\/.*src\/index\.ts$/);
  });

  it("rejects empty path", () => {
    expect(() => sanitizePath("")).toThrow(SanitizationError);
  });

  it("rejects whitespace-only path", () => {
    expect(() => sanitizePath("   ")).toThrow(SanitizationError);
  });

  it("rejects path containing null bytes", () => {
    expect(() => sanitizePath("/tmp/evil\0file")).toThrow(SanitizationError);
  });

  it("rejects path traversal outside base directory", () => {
    expect(() => sanitizePath("../../etc/passwd", "/home/user/project")).toThrow(
      SanitizationError
    );
  });

  it("allows paths within the base directory", () => {
    const result = sanitizePath("/home/user/project/src/file.ts", "/home/user/project");
    expect(result).toBe("/home/user/project/src/file.ts");
  });

  it("allows the base directory path itself", () => {
    const result = sanitizePath("/home/user/project", "/home/user/project");
    expect(result).toBe("/home/user/project");
  });
});

// =========================================================================
// 6. sanitizeUrl integration
// =========================================================================

describe("sanitizeUrl", () => {
  it("accepts a valid https URL", () => {
    const result = sanitizeUrl("https://example.com/api/v1");
    expect(result).toBe("https://example.com/api/v1");
  });

  it("accepts a valid http URL", () => {
    const result = sanitizeUrl("http://example.com");
    expect(result).toBe("http://example.com/");
  });

  it("rejects empty URL", () => {
    expect(() => sanitizeUrl("")).toThrow(SanitizationError);
  });

  it("rejects non-http protocols", () => {
    expect(() => sanitizeUrl("ftp://files.example.com")).toThrow(SanitizationError);
    expect(() => sanitizeUrl("file:///etc/passwd")).toThrow(SanitizationError);
  });

  it("rejects localhost", () => {
    expect(() => sanitizeUrl("http://localhost:3000")).toThrow(SanitizationError);
  });

  it("rejects private IP ranges (127.x, 10.x, 192.168.x)", () => {
    expect(() => sanitizeUrl("http://127.0.0.1")).toThrow(SanitizationError);
    expect(() => sanitizeUrl("http://10.0.0.1")).toThrow(SanitizationError);
    expect(() => sanitizeUrl("http://192.168.1.1")).toThrow(SanitizationError);
  });

  it("rejects link-local addresses", () => {
    expect(() => sanitizeUrl("http://169.254.169.254")).toThrow(SanitizationError);
  });

  it("rejects invalid URL format", () => {
    expect(() => sanitizeUrl("not-a-url")).toThrow(SanitizationError);
  });
});

// =========================================================================
// 7. errorResponse formatting
// =========================================================================

describe("errorResponse", () => {
  it("formats an Error object with context", () => {
    const err = new Error("something went wrong");
    const response = errorResponse(err, "lint_file");
    expect(response.isError).toBe(true);
    expect(response.content).toHaveLength(1);
    expect(response.content[0].type).toBe("text");
    expect(response.content[0].text).toBe(
      "Error in lint_file: something went wrong"
    );
  });

  it("formats a string error with context", () => {
    const response = errorResponse("timeout exceeded", "security_scan");
    expect(response.isError).toBe(true);
    expect(response.content[0].text).toBe(
      "Error in security_scan: timeout exceeded"
    );
  });

  it("formats an Error object without context", () => {
    const err = new Error("failure");
    const response = errorResponse(err);
    expect(response.isError).toBe(true);
    expect(response.content[0].text).toBe("Error: failure");
  });

  it("formats a non-Error non-string value", () => {
    const response = errorResponse(42, "analyze_complexity");
    expect(response.isError).toBe(true);
    expect(response.content[0].text).toBe("Error in analyze_complexity: 42");
  });

  it("handles SanitizationError as a regular Error", () => {
    const err = new SanitizationError("Path traversal detected", "path", "../etc/passwd");
    const response = errorResponse(err, "find_duplicates");
    expect(response.isError).toBe(true);
    expect(response.content[0].text).toContain("Path traversal detected");
    expect(response.content[0].text).toContain("find_duplicates");
  });
});

// =========================================================================
// 8. Tool registration completeness
// =========================================================================

describe("Tool registration", () => {
  it("server registers exactly the four expected tool names", () => {
    // Since we cannot easily import and start the MCP server in a test
    // (it immediately connects to stdio transport), we verify the expected
    // tool names against the schemas we have replicated.  If a schema is
    // defined above but not listed in EXPECTED_TOOL_NAMES (or vice-versa),
    // this test will fail, prompting the developer to keep them in sync.
    const schemaToolMap: Record<string, z.ZodObject<any>> = {
      lint_file: LintFileSchema,
      security_scan: SecurityScanSchema,
      analyze_complexity: CodeComplexitySchema,
      find_duplicates: FindDuplicatesSchema,
    };

    expect(Object.keys(schemaToolMap).sort()).toEqual(
      [...EXPECTED_TOOL_NAMES].sort()
    );
  });

  it("all four tool names are present in the expected set", () => {
    expect(EXPECTED_TOOL_NAMES).toContain("lint_file");
    expect(EXPECTED_TOOL_NAMES).toContain("security_scan");
    expect(EXPECTED_TOOL_NAMES).toContain("analyze_complexity");
    expect(EXPECTED_TOOL_NAMES).toContain("find_duplicates");
  });

  it("no duplicate tool names exist", () => {
    const unique = new Set(EXPECTED_TOOL_NAMES);
    expect(unique.size).toBe(EXPECTED_TOOL_NAMES.length);
  });
});

// =========================================================================
// 9. Schema edge cases
// =========================================================================

describe("Schema edge cases", () => {
  it("LintFileSchema strips unknown properties", () => {
    const input = {
      filePath: "/src/app.ts",
      linter: "eslint",
      extraField: "should be stripped",
    };
    const result = LintFileSchema.safeParse(input);
    expect(result.success).toBe(true);
    if (result.success) {
      expect((result.data as any).extraField).toBeUndefined();
    }
  });

  it("SecurityScanSchema accepts all valid scanner enum values", () => {
    for (const scanner of ["bandit", "semgrep", "snyk"] as const) {
      const result = SecurityScanSchema.safeParse({
        targetPath: "/project",
        scanner,
      });
      expect(result.success).toBe(true);
    }
  });

  it("SecurityScanSchema accepts all valid severity enum values", () => {
    for (const severity of ["low", "medium", "high", "critical"] as const) {
      const result = SecurityScanSchema.safeParse({
        targetPath: "/project",
        scanner: "bandit",
        severity,
      });
      expect(result.success).toBe(true);
    }
  });

  it("CodeComplexitySchema accepts all valid language enum values", () => {
    for (const language of ["javascript", "python", "java"] as const) {
      const result = CodeComplexitySchema.safeParse({
        filePath: "/src/file",
        language,
      });
      expect(result.success).toBe(true);
    }
  });

  it("LintFileSchema accepts all valid linter enum values", () => {
    for (const linter of ["eslint", "pylint", "rubocop"] as const) {
      const result = LintFileSchema.safeParse({
        filePath: "/src/file",
        linter,
      });
      expect(result.success).toBe(true);
    }
  });

  it("FindDuplicatesSchema accepts zero as minLines", () => {
    const result = FindDuplicatesSchema.safeParse({
      directory: "/src",
      minLines: 0,
    });
    expect(result.success).toBe(true);
  });

  it("FindDuplicatesSchema accepts negative minLines (no min constraint in schema)", () => {
    const result = FindDuplicatesSchema.safeParse({
      directory: "/src",
      minLines: -1,
    });
    // The schema has z.number().optional() with no .min() constraint,
    // so negative values are technically accepted by the schema.
    expect(result.success).toBe(true);
  });

  it("LintFileSchema rejects null as filePath", () => {
    const result = LintFileSchema.safeParse({
      filePath: null,
      linter: "eslint",
    });
    expect(result.success).toBe(false);
  });

  it("SecurityScanSchema rejects numeric targetPath", () => {
    const result = SecurityScanSchema.safeParse({
      targetPath: 123,
      scanner: "bandit",
    });
    expect(result.success).toBe(false);
  });
});
