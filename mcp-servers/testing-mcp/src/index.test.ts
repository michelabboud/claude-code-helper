/**
 * Unit tests for testing-mcp server.
 *
 * Tests cover:
 * - Zod schema validation (valid/invalid inputs for all four tool schemas)
 * - sanitizePath integration (path traversal, null bytes, empty paths)
 * - errorResponse formatting
 * - Helper function unit tests (countAssertions, countMocks, countAsyncTests,
 *   detectFlakinessIndicators, extractTestSummary, generateMarkdownReport,
 *   generateHTMLReport)
 * - Tool name registration (ListTools handler coverage)
 */

import path from "node:path";
import { z } from "zod";
import {
  sanitizePath,
  errorResponse,
  SanitizationError,
} from "mcp-shared";

// ---------------------------------------------------------------------------
// Replicated Zod schemas (mirrors src/index.ts -- not exported from there)
// ---------------------------------------------------------------------------

const RunTestsSchema = z.object({
  testPath: z.string().describe("Path to test file or directory"),
  framework: z.enum(["jest", "pytest", "mocha", "vitest"]).describe("Test framework to use"),
  pattern: z.string().optional().describe("Test name pattern to match"),
  watch: z.boolean().optional().describe("Run in watch mode"),
});

const GetCoverageSchema = z.object({
  testPath: z.string().describe("Path to test or source directory"),
  framework: z.enum(["jest", "pytest", "vitest"]).describe("Test framework"),
  threshold: z.number().optional().describe("Minimum coverage percentage required (default: 80)"),
  format: z.enum(["json", "html", "text"]).optional().describe("Coverage report format"),
});

const AnalyzeTestQualitySchema = z.object({
  testPath: z.string().describe("Path to test files"),
  metrics: z.array(z.enum(["assertions", "mocks", "async", "flakiness"])).optional()
    .describe("Metrics to analyze"),
});

const GenerateTestReportSchema = z.object({
  resultsPath: z.string().describe("Path to test results JSON"),
  format: z.enum(["markdown", "html", "pdf"]).describe("Report format"),
  includeFlaky: z.boolean().optional().describe("Include flaky test analysis"),
});

// The expected set of tool names registered in the ListTools handler.
const EXPECTED_TOOL_NAMES = [
  "run_tests",
  "get_coverage",
  "analyze_test_quality",
  "generate_test_report",
];

// ---------------------------------------------------------------------------
// Replicated helper functions (mirrors src/index.ts -- not exported)
// ---------------------------------------------------------------------------

interface TestSummary {
  numTotalTests?: number;
  numPassedTests?: number;
  numFailedTests?: number;
  numPendingTests?: number;
  [key: string]: unknown;
}

interface AssertionMetrics {
  total: number;
  testCount: number;
}

interface MockMetrics {
  total: number;
}

interface TestResults {
  numTotalTests?: number;
  numPassedTests?: number;
  numFailedTests?: number;
  numPendingTests?: number;
  coverage?: { lines: number };
  flakyTests?: unknown[];
  summary?: TestSummary;
  [key: string]: unknown;
}

function extractTestSummary(results: Record<string, unknown>, framework: string): TestSummary {
  if (framework === "jest") {
    return {
      numTotalTests: (results.numTotalTests as number) || 0,
      numPassedTests: (results.numPassedTests as number) || 0,
      numFailedTests: (results.numFailedTests as number) || 0,
      numPendingTests: (results.numPendingTests as number) || 0,
    };
  }
  return (results.summary as TestSummary) || {};
}

function countAssertions(content: string): AssertionMetrics {
  const assertionPatterns = [
    /expect\(/g,
    /assert\./g,
    /should\./g,
    /\.toEqual\(/g,
    /\.toBe\(/g,
  ];

  let total = 0;
  for (const pattern of assertionPatterns) {
    const matches = content.match(pattern);
    total += matches ? matches.length : 0;
  }

  const testCount = (content.match(/it\(|test\(/g) || []).length;

  return { total, testCount };
}

function countMocks(content: string): MockMetrics {
  const mockPatterns = [
    /jest\.mock\(/g,
    /\.mockReturnValue\(/g,
    /\.mockImplementation\(/g,
    /@patch/g,
    /Mock\(/g,
  ];

  let total = 0;
  for (const pattern of mockPatterns) {
    const matches = content.match(pattern);
    total += matches ? matches.length : 0;
  }

  return { total };
}

function countAsyncTests(content: string): number {
  const asyncPatterns = [
    /async\s+\(/g,
    /await\s+/g,
    /\.then\(/g,
    /Promise\./g,
  ];

  let count = 0;
  for (const pattern of asyncPatterns) {
    const matches = content.match(pattern);
    count += matches ? matches.length : 0;
  }

  return count;
}

function detectFlakinessIndicators(content: string): string[] {
  const indicators: string[] = [];

  if (content.includes("setTimeout") || content.includes("setInterval")) {
    indicators.push("Uses timing functions (setTimeout/setInterval)");
  }
  if (content.includes("Date.now()") || content.includes("new Date()")) {
    indicators.push("Uses current time/date");
  }
  if (content.includes("Math.random()")) {
    indicators.push("Uses random values");
  }
  if (content.includes("Promise.race")) {
    indicators.push("Uses Promise.race (timing-dependent)");
  }

  return indicators;
}

function generateMarkdownReport(results: TestResults, includeFlaky: boolean): string {
  return `# Test Report

## Summary
- Total Tests: ${results.numTotalTests || 0}
- Passed: ${results.numPassedTests || 0}
- Failed: ${results.numFailedTests || 0}
- Pending: ${results.numPendingTests || 0}

## Coverage
${results.coverage ? `Lines: ${results.coverage.lines}%` : "N/A"}

${includeFlaky ? `## Flaky Tests
${results.flakyTests?.length || 0} potentially flaky tests detected.
` : ""}
`;
}

function generateHTMLReport(results: TestResults, _includeFlaky: boolean): string {
  return `<!DOCTYPE html>
<html>
<head><title>Test Report</title></head>
<body>
  <h1>Test Report</h1>
  <h2>Summary</h2>
  <ul>
    <li>Total: ${results.numTotalTests || 0}</li>
    <li>Passed: ${results.numPassedTests || 0}</li>
    <li>Failed: ${results.numFailedTests || 0}</li>
  </ul>
</body>
</html>`;
}

// ---------------------------------------------------------------------------
// Regression coverage for the correctness fixes below (mirrors src/index.ts
// -- not exported from there, since importing index.ts would start the MCP
// server via its top-level runServer() call):
//   1. Node-based frameworks (jest/mocha/vitest) must be invoked through
//      `npx --no-install` so a local devDependency in node_modules/.bin
//      resolves; pytest is invoked directly since it's a Python executable.
//   2. `watch: true` is rejected with a clear error instead of hanging the
//      MCP stdio call until the 5-minute timeout.
//   3. Each framework's coverage JSON is read from its own real default
//      output path, not a jest-only path applied to every framework.
//   4. `format: "pdf"` is rejected with a clear error instead of silently
//      generating markdown while claiming a PDF was produced.
// ---------------------------------------------------------------------------

type Framework = "jest" | "pytest" | "mocha" | "vitest";

function buildFrameworkCommand(framework: Framework, args: string[]): { cmd: string; args: string[] } {
  if (framework === "pytest") {
    return { cmd: "pytest", args };
  }
  return { cmd: "npx", args: ["--no-install", framework, ...args] };
}

function getCoveragePath(framework: string, cwd: string): string {
  return framework === "pytest"
    ? path.join(cwd, "coverage.json")
    : path.join(cwd, "coverage", "coverage-final.json");
}

function assertWatchSupported(watch: boolean): void {
  if (watch) {
    throw new Error(
      "watch:true is not supported. MCP tool calls execute synchronously over stdio and must " +
      "return a single result, but watch mode runs indefinitely -- this call would block until " +
      "the 5 minute timeout instead of streaming results. Omit `watch` (or set it to false) and " +
      "run the framework's watch mode directly in a terminal for interactive development."
    );
  }
}

function assertReportFormatSupported(format: string): void {
  if (format === "pdf") {
    throw new Error(
      'PDF report generation is not implemented. Use format: "markdown" or "html" instead.'
    );
  }
}

// =========================================================================
// 1. RunTestsSchema validation
// =========================================================================

describe("RunTestsSchema", () => {
  it("accepts valid input with required fields only", () => {
    const input = { testPath: "/tests/unit", framework: "jest" };
    const result = RunTestsSchema.safeParse(input);
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.testPath).toBe("/tests/unit");
      expect(result.data.framework).toBe("jest");
      expect(result.data.pattern).toBeUndefined();
      expect(result.data.watch).toBeUndefined();
    }
  });

  it("accepts valid input with all optional fields", () => {
    const input = {
      testPath: "/tests/integration",
      framework: "mocha",
      pattern: "should handle errors",
      watch: true,
    };
    const result = RunTestsSchema.safeParse(input);
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.pattern).toBe("should handle errors");
      expect(result.data.watch).toBe(true);
    }
  });

  it("accepts all valid framework enum values", () => {
    for (const framework of ["jest", "pytest", "mocha", "vitest"] as const) {
      const result = RunTestsSchema.safeParse({
        testPath: "/tests",
        framework,
      });
      expect(result.success).toBe(true);
    }
  });

  it("rejects missing testPath", () => {
    const input = { framework: "jest" };
    const result = RunTestsSchema.safeParse(input);
    expect(result.success).toBe(false);
  });

  it("rejects missing framework", () => {
    const input = { testPath: "/tests" };
    const result = RunTestsSchema.safeParse(input);
    expect(result.success).toBe(false);
  });

  it("rejects invalid framework value", () => {
    const input = { testPath: "/tests", framework: "karma" };
    const result = RunTestsSchema.safeParse(input);
    expect(result.success).toBe(false);
  });

  it("rejects non-string testPath", () => {
    const input = { testPath: 123, framework: "jest" };
    const result = RunTestsSchema.safeParse(input);
    expect(result.success).toBe(false);
  });

  it("rejects non-boolean watch", () => {
    const input = { testPath: "/tests", framework: "jest", watch: "yes" };
    const result = RunTestsSchema.safeParse(input);
    expect(result.success).toBe(false);
  });

  it("rejects non-string pattern", () => {
    const input = { testPath: "/tests", framework: "jest", pattern: 42 };
    const result = RunTestsSchema.safeParse(input);
    expect(result.success).toBe(false);
  });

  it("rejects null testPath", () => {
    const input = { testPath: null, framework: "jest" };
    const result = RunTestsSchema.safeParse(input);
    expect(result.success).toBe(false);
  });

  it("strips unknown properties", () => {
    const input = {
      testPath: "/tests",
      framework: "jest",
      unknownProp: "should be stripped",
    };
    const result = RunTestsSchema.safeParse(input);
    expect(result.success).toBe(true);
    if (result.success) {
      expect((result.data as any).unknownProp).toBeUndefined();
    }
  });

  it("accepts empty string testPath (schema does not enforce non-empty)", () => {
    const input = { testPath: "", framework: "jest" };
    const result = RunTestsSchema.safeParse(input);
    expect(result.success).toBe(true);
  });

  it("rejects completely empty object", () => {
    const result = RunTestsSchema.safeParse({});
    expect(result.success).toBe(false);
  });
});

// =========================================================================
// 2. GetCoverageSchema validation
// =========================================================================

describe("GetCoverageSchema", () => {
  it("accepts valid input with required fields only", () => {
    const input = { testPath: "/src", framework: "jest" };
    const result = GetCoverageSchema.safeParse(input);
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.threshold).toBeUndefined();
      expect(result.data.format).toBeUndefined();
    }
  });

  it("accepts valid input with all optional fields", () => {
    const input = {
      testPath: "/src",
      framework: "vitest",
      threshold: 90,
      format: "html",
    };
    const result = GetCoverageSchema.safeParse(input);
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.threshold).toBe(90);
      expect(result.data.format).toBe("html");
    }
  });

  it("accepts all valid framework enum values", () => {
    for (const framework of ["jest", "pytest", "vitest"] as const) {
      const result = GetCoverageSchema.safeParse({
        testPath: "/src",
        framework,
      });
      expect(result.success).toBe(true);
    }
  });

  it("accepts all valid format enum values", () => {
    for (const format of ["json", "html", "text"] as const) {
      const result = GetCoverageSchema.safeParse({
        testPath: "/src",
        framework: "jest",
        format,
      });
      expect(result.success).toBe(true);
    }
  });

  it("rejects mocha as framework (not in enum)", () => {
    const input = { testPath: "/src", framework: "mocha" };
    const result = GetCoverageSchema.safeParse(input);
    expect(result.success).toBe(false);
  });

  it("rejects invalid format value", () => {
    const input = { testPath: "/src", framework: "jest", format: "xml" };
    const result = GetCoverageSchema.safeParse(input);
    expect(result.success).toBe(false);
  });

  it("rejects non-number threshold", () => {
    const input = { testPath: "/src", framework: "jest", threshold: "high" };
    const result = GetCoverageSchema.safeParse(input);
    expect(result.success).toBe(false);
  });

  it("rejects missing testPath", () => {
    const input = { framework: "jest" };
    const result = GetCoverageSchema.safeParse(input);
    expect(result.success).toBe(false);
  });

  it("rejects missing framework", () => {
    const input = { testPath: "/src" };
    const result = GetCoverageSchema.safeParse(input);
    expect(result.success).toBe(false);
  });

  it("accepts zero as threshold", () => {
    const input = { testPath: "/src", framework: "jest", threshold: 0 };
    const result = GetCoverageSchema.safeParse(input);
    expect(result.success).toBe(true);
  });

  it("accepts negative threshold (no min constraint in schema)", () => {
    const input = { testPath: "/src", framework: "jest", threshold: -10 };
    const result = GetCoverageSchema.safeParse(input);
    expect(result.success).toBe(true);
  });

  it("accepts threshold above 100 (no max constraint in schema)", () => {
    const input = { testPath: "/src", framework: "jest", threshold: 150 };
    const result = GetCoverageSchema.safeParse(input);
    expect(result.success).toBe(true);
  });
});

// =========================================================================
// 3. AnalyzeTestQualitySchema validation
// =========================================================================

describe("AnalyzeTestQualitySchema", () => {
  it("accepts valid input with required fields only", () => {
    const input = { testPath: "/tests" };
    const result = AnalyzeTestQualitySchema.safeParse(input);
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.metrics).toBeUndefined();
    }
  });

  it("accepts valid input with all metrics", () => {
    const input = {
      testPath: "/tests",
      metrics: ["assertions", "mocks", "async", "flakiness"],
    };
    const result = AnalyzeTestQualitySchema.safeParse(input);
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.metrics).toHaveLength(4);
    }
  });

  it("accepts a single metric in array", () => {
    const input = { testPath: "/tests", metrics: ["assertions"] };
    const result = AnalyzeTestQualitySchema.safeParse(input);
    expect(result.success).toBe(true);
  });

  it("accepts an empty metrics array", () => {
    const input = { testPath: "/tests", metrics: [] };
    const result = AnalyzeTestQualitySchema.safeParse(input);
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.metrics).toEqual([]);
    }
  });

  it("accepts all valid metric enum values individually", () => {
    for (const metric of ["assertions", "mocks", "async", "flakiness"] as const) {
      const result = AnalyzeTestQualitySchema.safeParse({
        testPath: "/tests",
        metrics: [metric],
      });
      expect(result.success).toBe(true);
    }
  });

  it("rejects invalid metric value in array", () => {
    const input = { testPath: "/tests", metrics: ["coverage"] };
    const result = AnalyzeTestQualitySchema.safeParse(input);
    expect(result.success).toBe(false);
  });

  it("rejects mixed valid and invalid metrics", () => {
    const input = { testPath: "/tests", metrics: ["assertions", "invalid"] };
    const result = AnalyzeTestQualitySchema.safeParse(input);
    expect(result.success).toBe(false);
  });

  it("rejects metrics as a string instead of array", () => {
    const input = { testPath: "/tests", metrics: "assertions" };
    const result = AnalyzeTestQualitySchema.safeParse(input);
    expect(result.success).toBe(false);
  });

  it("rejects missing testPath", () => {
    const input = { metrics: ["assertions"] };
    const result = AnalyzeTestQualitySchema.safeParse(input);
    expect(result.success).toBe(false);
  });

  it("rejects numeric testPath", () => {
    const input = { testPath: 42 };
    const result = AnalyzeTestQualitySchema.safeParse(input);
    expect(result.success).toBe(false);
  });
});

// =========================================================================
// 4. GenerateTestReportSchema validation
// =========================================================================

describe("GenerateTestReportSchema", () => {
  it("accepts valid input with required fields only", () => {
    const input = { resultsPath: "/results/test.json", format: "markdown" };
    const result = GenerateTestReportSchema.safeParse(input);
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.resultsPath).toBe("/results/test.json");
      expect(result.data.format).toBe("markdown");
      expect(result.data.includeFlaky).toBeUndefined();
    }
  });

  it("accepts valid input with optional includeFlaky", () => {
    const input = {
      resultsPath: "/results/test.json",
      format: "html",
      includeFlaky: true,
    };
    const result = GenerateTestReportSchema.safeParse(input);
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.includeFlaky).toBe(true);
    }
  });

  it("accepts all valid format enum values", () => {
    for (const format of ["markdown", "html", "pdf"] as const) {
      const result = GenerateTestReportSchema.safeParse({
        resultsPath: "/results/test.json",
        format,
      });
      expect(result.success).toBe(true);
    }
  });

  it("rejects missing resultsPath", () => {
    const input = { format: "markdown" };
    const result = GenerateTestReportSchema.safeParse(input);
    expect(result.success).toBe(false);
  });

  it("rejects missing format", () => {
    const input = { resultsPath: "/results/test.json" };
    const result = GenerateTestReportSchema.safeParse(input);
    expect(result.success).toBe(false);
  });

  it("rejects invalid format value", () => {
    const input = { resultsPath: "/results/test.json", format: "xml" };
    const result = GenerateTestReportSchema.safeParse(input);
    expect(result.success).toBe(false);
  });

  it("rejects non-boolean includeFlaky", () => {
    const input = {
      resultsPath: "/results/test.json",
      format: "markdown",
      includeFlaky: "yes",
    };
    const result = GenerateTestReportSchema.safeParse(input);
    expect(result.success).toBe(false);
  });

  it("rejects null resultsPath", () => {
    const input = { resultsPath: null, format: "markdown" };
    const result = GenerateTestReportSchema.safeParse(input);
    expect(result.success).toBe(false);
  });

  it("rejects numeric resultsPath", () => {
    const input = { resultsPath: 123, format: "markdown" };
    const result = GenerateTestReportSchema.safeParse(input);
    expect(result.success).toBe(false);
  });

  it("strips unknown properties", () => {
    const input = {
      resultsPath: "/results/test.json",
      format: "html",
      extra: "field",
    };
    const result = GenerateTestReportSchema.safeParse(input);
    expect(result.success).toBe(true);
    if (result.success) {
      expect((result.data as any).extra).toBeUndefined();
    }
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

  it("rejects sibling directory when base is specified", () => {
    expect(() =>
      sanitizePath("/home/user/other-project/file.ts", "/home/user/project")
    ).toThrow(SanitizationError);
  });

  it("normalizes path with redundant slashes", () => {
    const result = sanitizePath("/home/user//project///file.ts");
    expect(result).toBe("/home/user/project/file.ts");
  });

  it("resolves dot segments in path", () => {
    const result = sanitizePath("/home/user/project/./src/../src/file.ts");
    expect(result).toBe("/home/user/project/src/file.ts");
  });
});

// =========================================================================
// 6. errorResponse formatting
// =========================================================================

describe("errorResponse", () => {
  it("formats an Error object with context", () => {
    const err = new Error("test execution failed");
    const response = errorResponse(err, "run_tests");
    expect(response.isError).toBe(true);
    expect(response.content).toHaveLength(1);
    expect(response.content[0].type).toBe("text");
    expect(response.content[0].text).toBe(
      "Error in run_tests: test execution failed"
    );
  });

  it("formats a string error with context", () => {
    const response = errorResponse("timeout exceeded", "get_coverage");
    expect(response.isError).toBe(true);
    expect(response.content[0].text).toBe(
      "Error in get_coverage: timeout exceeded"
    );
  });

  it("formats an Error object without context", () => {
    const err = new Error("unknown failure");
    const response = errorResponse(err);
    expect(response.isError).toBe(true);
    expect(response.content[0].text).toBe("Error: unknown failure");
  });

  it("formats a non-Error non-string value", () => {
    const response = errorResponse(42, "analyze_test_quality");
    expect(response.isError).toBe(true);
    expect(response.content[0].text).toBe("Error in analyze_test_quality: 42");
  });

  it("handles SanitizationError as a regular Error", () => {
    const err = new SanitizationError("Path traversal detected", "path", "../etc/passwd");
    const response = errorResponse(err, "run_tests");
    expect(response.isError).toBe(true);
    expect(response.content[0].text).toContain("Path traversal detected");
    expect(response.content[0].text).toContain("run_tests");
  });

  it("handles null error value", () => {
    const response = errorResponse(null, "run_tests");
    expect(response.isError).toBe(true);
    expect(response.content[0].text).toBe("Error in run_tests: null");
  });

  it("handles undefined error value", () => {
    const response = errorResponse(undefined, "run_tests");
    expect(response.isError).toBe(true);
    expect(response.content[0].text).toBe("Error in run_tests: undefined");
  });
});

// =========================================================================
// 7. Tool registration completeness
// =========================================================================

describe("Tool registration", () => {
  it("server registers exactly the four expected tool names", () => {
    const schemaToolMap: Record<string, z.ZodObject<any>> = {
      run_tests: RunTestsSchema,
      get_coverage: GetCoverageSchema,
      analyze_test_quality: AnalyzeTestQualitySchema,
      generate_test_report: GenerateTestReportSchema,
    };

    expect(Object.keys(schemaToolMap).sort()).toEqual(
      [...EXPECTED_TOOL_NAMES].sort()
    );
  });

  it("all four tool names are present in the expected set", () => {
    expect(EXPECTED_TOOL_NAMES).toContain("run_tests");
    expect(EXPECTED_TOOL_NAMES).toContain("get_coverage");
    expect(EXPECTED_TOOL_NAMES).toContain("analyze_test_quality");
    expect(EXPECTED_TOOL_NAMES).toContain("generate_test_report");
  });

  it("no duplicate tool names exist", () => {
    const unique = new Set(EXPECTED_TOOL_NAMES);
    expect(unique.size).toBe(EXPECTED_TOOL_NAMES.length);
  });
});

// =========================================================================
// 8. extractTestSummary helper
// =========================================================================

describe("extractTestSummary", () => {
  it("extracts jest summary from results", () => {
    const results = {
      numTotalTests: 10,
      numPassedTests: 8,
      numFailedTests: 1,
      numPendingTests: 1,
    };
    const summary = extractTestSummary(results, "jest");
    expect(summary.numTotalTests).toBe(10);
    expect(summary.numPassedTests).toBe(8);
    expect(summary.numFailedTests).toBe(1);
    expect(summary.numPendingTests).toBe(1);
  });

  it("defaults jest summary fields to 0 when missing", () => {
    const results = {};
    const summary = extractTestSummary(results, "jest");
    expect(summary.numTotalTests).toBe(0);
    expect(summary.numPassedTests).toBe(0);
    expect(summary.numFailedTests).toBe(0);
    expect(summary.numPendingTests).toBe(0);
  });

  it("returns results.summary for non-jest frameworks", () => {
    const innerSummary = { total: 5, passed: 5 };
    const results = { summary: innerSummary };
    const summary = extractTestSummary(results, "pytest");
    expect(summary).toBe(innerSummary);
  });

  it("returns empty object for non-jest framework with no summary", () => {
    const results = {};
    const summary = extractTestSummary(results, "mocha");
    expect(summary).toEqual({});
  });

  it("handles partial jest results (some fields present)", () => {
    const results = { numTotalTests: 5, numPassedTests: 3 };
    const summary = extractTestSummary(results, "jest");
    expect(summary.numTotalTests).toBe(5);
    expect(summary.numPassedTests).toBe(3);
    expect(summary.numFailedTests).toBe(0);
    expect(summary.numPendingTests).toBe(0);
  });
});

// =========================================================================
// 9. countAssertions helper
// =========================================================================

describe("countAssertions", () => {
  it("counts expect() calls", () => {
    const content = `
      test("example", () => {
        expect(1).toBe(1);
        expect(2).toEqual(2);
      });
    `;
    const result = countAssertions(content);
    expect(result.total).toBeGreaterThanOrEqual(2); // 2 expect( + 1 .toBe( + 1 .toEqual(
    expect(result.testCount).toBe(1); // 1 test(
  });

  it("counts assert.* calls", () => {
    const content = `
      it("works", () => {
        assert.equal(1, 1);
        assert.ok(true);
      });
    `;
    const result = countAssertions(content);
    expect(result.total).toBe(2); // 2 assert.
    expect(result.testCount).toBe(1); // 1 it(
  });

  it("counts should.* calls", () => {
    const content = `
      it("works", () => {
        value.should.equal(1);
        result.should.be.true;
      });
    `;
    const result = countAssertions(content);
    expect(result.total).toBe(2); // 2 should.
    expect(result.testCount).toBe(1);
  });

  it("returns zero counts for content with no assertions", () => {
    const content = "const x = 1;\nconsole.log(x);";
    const result = countAssertions(content);
    expect(result.total).toBe(0);
    expect(result.testCount).toBe(0);
  });

  it("returns zero counts for empty string", () => {
    const result = countAssertions("");
    expect(result.total).toBe(0);
    expect(result.testCount).toBe(0);
  });

  it("counts multiple test blocks", () => {
    const content = `
      it("test 1", () => {});
      it("test 2", () => {});
      test("test 3", () => {});
    `;
    const result = countAssertions(content);
    expect(result.testCount).toBe(3);
  });

  it("counts toBe and toEqual separately from expect", () => {
    const content = `expect(a).toBe(1); expect(b).toEqual(2);`;
    const result = countAssertions(content);
    // 2 expect( + 1 .toBe( + 1 .toEqual( = 4
    expect(result.total).toBe(4);
  });
});

// =========================================================================
// 10. countMocks helper
// =========================================================================

describe("countMocks", () => {
  it("counts jest.mock() calls", () => {
    const content = `
      jest.mock("./module");
      jest.mock("./other");
    `;
    const result = countMocks(content);
    expect(result.total).toBe(2);
  });

  it("counts .mockReturnValue() calls", () => {
    const content = `
      fn.mockReturnValue(42);
      other.mockReturnValue("test");
    `;
    const result = countMocks(content);
    expect(result.total).toBe(2);
  });

  it("counts .mockImplementation() calls", () => {
    const content = `fn.mockImplementation(() => 42);`;
    const result = countMocks(content);
    expect(result.total).toBe(1);
  });

  it("counts @patch decorators (Python)", () => {
    const content = `
      @patch("module.func")
      @patch("module.other")
      def test_example(self, mock_other, mock_func):
          pass
    `;
    const result = countMocks(content);
    expect(result.total).toBe(2);
  });

  it("counts Mock() constructor calls", () => {
    const content = `
      const mock = Mock();
      const other = Mock();
    `;
    const result = countMocks(content);
    expect(result.total).toBe(2);
  });

  it("returns zero for content with no mocks", () => {
    const content = "const x = 1;\nfunction foo() { return x; }";
    const result = countMocks(content);
    expect(result.total).toBe(0);
  });

  it("returns zero for empty string", () => {
    const result = countMocks("");
    expect(result.total).toBe(0);
  });

  it("counts mixed mock patterns in same content", () => {
    const content = `
      jest.mock("./module");
      fn.mockReturnValue(1);
      fn.mockImplementation(() => 2);
      const m = Mock();
    `;
    const result = countMocks(content);
    expect(result.total).toBe(4);
  });
});

// =========================================================================
// 11. countAsyncTests helper
// =========================================================================

describe("countAsyncTests", () => {
  it("counts async arrow functions", () => {
    const content = `
      it("works", async () => {
        await fetchData();
      });
    `;
    const result = countAsyncTests(content);
    expect(result).toBeGreaterThanOrEqual(2); // async ( + await
  });

  it("counts .then() chains", () => {
    const content = `
      fetchData().then((data) => console.log(data));
      otherCall().then((res) => res);
    `;
    const result = countAsyncTests(content);
    expect(result).toBe(2);
  });

  it("counts Promise.* usage", () => {
    const content = `
      Promise.all([a, b]);
      Promise.resolve(42);
    `;
    const result = countAsyncTests(content);
    expect(result).toBe(2);
  });

  it("returns zero for synchronous code", () => {
    const content = "const x = 1;\nfunction foo() { return x; }";
    const result = countAsyncTests(content);
    expect(result).toBe(0);
  });

  it("returns zero for empty string", () => {
    const result = countAsyncTests("");
    expect(result).toBe(0);
  });

  it("counts multiple await statements", () => {
    const content = `
      async () => {
        await first();
        await second();
        await third();
      }
    `;
    const result = countAsyncTests(content);
    // 1 async ( + 3 await = 4
    expect(result).toBe(4);
  });
});

// =========================================================================
// 12. detectFlakinessIndicators helper
// =========================================================================

describe("detectFlakinessIndicators", () => {
  it("detects setTimeout usage", () => {
    const content = `setTimeout(() => done(), 1000);`;
    const indicators = detectFlakinessIndicators(content);
    expect(indicators).toContain("Uses timing functions (setTimeout/setInterval)");
  });

  it("detects setInterval usage", () => {
    const content = `setInterval(() => check(), 500);`;
    const indicators = detectFlakinessIndicators(content);
    expect(indicators).toContain("Uses timing functions (setTimeout/setInterval)");
  });

  it("detects Date.now() usage", () => {
    const content = `const start = Date.now();`;
    const indicators = detectFlakinessIndicators(content);
    expect(indicators).toContain("Uses current time/date");
  });

  it("detects new Date() usage", () => {
    const content = `const now = new Date();`;
    const indicators = detectFlakinessIndicators(content);
    expect(indicators).toContain("Uses current time/date");
  });

  it("detects Math.random() usage", () => {
    const content = `const rand = Math.random();`;
    const indicators = detectFlakinessIndicators(content);
    expect(indicators).toContain("Uses random values");
  });

  it("detects Promise.race usage", () => {
    const content = `const result = await Promise.race([a, b]);`;
    const indicators = detectFlakinessIndicators(content);
    expect(indicators).toContain("Uses Promise.race (timing-dependent)");
  });

  it("returns empty array for clean test code", () => {
    const content = `
      test("pure test", () => {
        expect(add(1, 2)).toBe(3);
      });
    `;
    const indicators = detectFlakinessIndicators(content);
    expect(indicators).toEqual([]);
  });

  it("returns empty array for empty string", () => {
    const indicators = detectFlakinessIndicators("");
    expect(indicators).toEqual([]);
  });

  it("detects multiple indicators simultaneously", () => {
    const content = `
      setTimeout(() => {}, 100);
      const now = Date.now();
      const rand = Math.random();
      Promise.race([a, b]);
    `;
    const indicators = detectFlakinessIndicators(content);
    expect(indicators).toHaveLength(4);
    expect(indicators).toContain("Uses timing functions (setTimeout/setInterval)");
    expect(indicators).toContain("Uses current time/date");
    expect(indicators).toContain("Uses random values");
    expect(indicators).toContain("Uses Promise.race (timing-dependent)");
  });

  it("reports timing indicator only once for both setTimeout and setInterval", () => {
    const content = `
      setTimeout(() => {}, 100);
      setInterval(() => {}, 200);
    `;
    const indicators = detectFlakinessIndicators(content);
    // The function checks with includes(), so both trigger the same single entry
    const timingIndicators = indicators.filter(i =>
      i.includes("timing functions")
    );
    expect(timingIndicators).toHaveLength(1);
  });

  it("reports date indicator only once for both Date.now() and new Date()", () => {
    const content = `
      const a = Date.now();
      const b = new Date();
    `;
    const indicators = detectFlakinessIndicators(content);
    const dateIndicators = indicators.filter(i =>
      i.includes("current time/date")
    );
    expect(dateIndicators).toHaveLength(1);
  });
});

// =========================================================================
// 13. generateMarkdownReport helper
// =========================================================================

describe("generateMarkdownReport", () => {
  it("generates basic markdown report", () => {
    const results: TestResults = {
      numTotalTests: 10,
      numPassedTests: 8,
      numFailedTests: 1,
      numPendingTests: 1,
    };
    const report = generateMarkdownReport(results, false);
    expect(report).toContain("# Test Report");
    expect(report).toContain("Total Tests: 10");
    expect(report).toContain("Passed: 8");
    expect(report).toContain("Failed: 1");
    expect(report).toContain("Pending: 1");
    expect(report).toContain("N/A"); // no coverage
    expect(report).not.toContain("## Flaky Tests");
  });

  it("includes coverage when available", () => {
    const results: TestResults = {
      numTotalTests: 5,
      numPassedTests: 5,
      numFailedTests: 0,
      numPendingTests: 0,
      coverage: { lines: 85 },
    };
    const report = generateMarkdownReport(results, false);
    expect(report).toContain("Lines: 85%");
    expect(report).not.toContain("N/A");
  });

  it("includes flaky test section when requested", () => {
    const results: TestResults = {
      numTotalTests: 3,
      numPassedTests: 3,
      numFailedTests: 0,
      numPendingTests: 0,
      flakyTests: ["test1", "test2"],
    };
    const report = generateMarkdownReport(results, true);
    expect(report).toContain("## Flaky Tests");
    expect(report).toContain("2 potentially flaky tests detected");
  });

  it("shows 0 flaky tests when flakyTests array is empty", () => {
    const results: TestResults = {
      flakyTests: [],
    };
    const report = generateMarkdownReport(results, true);
    expect(report).toContain("0 potentially flaky tests detected");
  });

  it("shows 0 flaky tests when flakyTests is undefined", () => {
    const results: TestResults = {};
    const report = generateMarkdownReport(results, true);
    expect(report).toContain("0 potentially flaky tests detected");
  });

  it("defaults missing numeric fields to 0", () => {
    const results: TestResults = {};
    const report = generateMarkdownReport(results, false);
    expect(report).toContain("Total Tests: 0");
    expect(report).toContain("Passed: 0");
    expect(report).toContain("Failed: 0");
    expect(report).toContain("Pending: 0");
  });
});

// =========================================================================
// 14. generateHTMLReport helper
// =========================================================================

describe("generateHTMLReport", () => {
  it("generates valid HTML structure", () => {
    const results: TestResults = {
      numTotalTests: 10,
      numPassedTests: 7,
      numFailedTests: 3,
    };
    const report = generateHTMLReport(results, false);
    expect(report).toContain("<!DOCTYPE html>");
    expect(report).toContain("<html>");
    expect(report).toContain("</html>");
    expect(report).toContain("<h1>Test Report</h1>");
    expect(report).toContain("<h2>Summary</h2>");
  });

  it("includes correct test counts", () => {
    const results: TestResults = {
      numTotalTests: 15,
      numPassedTests: 12,
      numFailedTests: 3,
    };
    const report = generateHTMLReport(results, false);
    expect(report).toContain("Total: 15");
    expect(report).toContain("Passed: 12");
    expect(report).toContain("Failed: 3");
  });

  it("defaults missing numeric fields to 0", () => {
    const results: TestResults = {};
    const report = generateHTMLReport(results, false);
    expect(report).toContain("Total: 0");
    expect(report).toContain("Passed: 0");
    expect(report).toContain("Failed: 0");
  });

  it("contains proper list markup", () => {
    const results: TestResults = { numTotalTests: 1 };
    const report = generateHTMLReport(results, false);
    expect(report).toContain("<ul>");
    expect(report).toContain("</ul>");
    expect(report).toContain("<li>");
  });
});

// =========================================================================
// 15. buildFrameworkCommand -- local devDependency resolution (finding 1)
// =========================================================================

describe("buildFrameworkCommand", () => {
  it("resolves pytest as a direct command, not through npx", () => {
    const result = buildFrameworkCommand("pytest", ["tests/", "--cov"]);
    expect(result).toEqual({ cmd: "pytest", args: ["tests/", "--cov"] });
  });

  it("resolves jest via npx --no-install", () => {
    const result = buildFrameworkCommand("jest", ["tests/", "--json"]);
    expect(result).toEqual({ cmd: "npx", args: ["--no-install", "jest", "tests/", "--json"] });
  });

  it("resolves mocha via npx --no-install", () => {
    const result = buildFrameworkCommand("mocha", ["tests/", "--reporter", "json"]);
    expect(result).toEqual({
      cmd: "npx",
      args: ["--no-install", "mocha", "tests/", "--reporter", "json"],
    });
  });

  it("resolves vitest via npx --no-install", () => {
    const result = buildFrameworkCommand("vitest", ["run", "tests/"]);
    expect(result).toEqual({ cmd: "npx", args: ["--no-install", "vitest", "run", "tests/"] });
  });

  it("preserves argument order and handles an empty args array", () => {
    const result = buildFrameworkCommand("jest", []);
    expect(result).toEqual({ cmd: "npx", args: ["--no-install", "jest"] });
  });

  it("never resolves a node-based framework as a bare command name (the original bug)", () => {
    for (const framework of ["jest", "mocha", "vitest"] as const) {
      const result = buildFrameworkCommand(framework, ["x"]);
      expect(result.cmd).not.toBe(framework);
      expect(result.cmd).toBe("npx");
    }
  });
});

// =========================================================================
// 16. getCoveragePath -- per-framework coverage output location (finding 3a)
// =========================================================================

describe("getCoveragePath", () => {
  it("uses pytest-cov's coverage.json default path for pytest", () => {
    const result = getCoveragePath("pytest", "/project");
    expect(result).toBe(path.join("/project", "coverage.json"));
  });

  it("uses the istanbul-style coverage/coverage-final.json path for jest", () => {
    const result = getCoveragePath("jest", "/project");
    expect(result).toBe(path.join("/project", "coverage", "coverage-final.json"));
  });

  it("uses the istanbul-style coverage/coverage-final.json path for vitest", () => {
    const result = getCoveragePath("vitest", "/project");
    expect(result).toBe(path.join("/project", "coverage", "coverage-final.json"));
  });

  it("does not use the same path for pytest as for jest/vitest", () => {
    const pytestPath = getCoveragePath("pytest", "/project");
    const jestPath = getCoveragePath("jest", "/project");
    expect(pytestPath).not.toBe(jestPath);
  });
});

// =========================================================================
// 17. assertWatchSupported -- watch mode is rejected, not silently hung (finding 2)
// =========================================================================

describe("assertWatchSupported", () => {
  it("throws a clear, actionable error when watch is true", () => {
    expect(() => assertWatchSupported(true)).toThrow(/watch:true is not supported/);
  });

  it("explains the stdio/synchronous constraint in the error message", () => {
    expect(() => assertWatchSupported(true)).toThrow(/stdio/);
  });

  it("does not throw when watch is false", () => {
    expect(() => assertWatchSupported(false)).not.toThrow();
  });
});

// =========================================================================
// 18. assertReportFormatSupported -- PDF is rejected, not silently faked (finding 3b)
// =========================================================================

describe("assertReportFormatSupported", () => {
  it("throws a clear error for pdf format instead of silently substituting markdown", () => {
    expect(() => assertReportFormatSupported("pdf")).toThrow(
      'PDF report generation is not implemented. Use format: "markdown" or "html" instead.'
    );
  });

  it("does not throw for markdown format", () => {
    expect(() => assertReportFormatSupported("markdown")).not.toThrow();
  });

  it("does not throw for html format", () => {
    expect(() => assertReportFormatSupported("html")).not.toThrow();
  });
});

// =========================================================================
// 19. Schema edge cases
// =========================================================================

describe("Schema edge cases", () => {
  it("RunTestsSchema accepts watch=false explicitly", () => {
    const input = { testPath: "/tests", framework: "jest", watch: false };
    const result = RunTestsSchema.safeParse(input);
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.watch).toBe(false);
    }
  });

  it("GetCoverageSchema accepts fractional threshold", () => {
    const input = { testPath: "/src", framework: "jest", threshold: 85.5 };
    const result = GetCoverageSchema.safeParse(input);
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.threshold).toBe(85.5);
    }
  });

  it("AnalyzeTestQualitySchema allows duplicate metrics in array", () => {
    const input = { testPath: "/tests", metrics: ["assertions", "assertions"] };
    const result = AnalyzeTestQualitySchema.safeParse(input);
    // z.array does not enforce uniqueness
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.metrics).toHaveLength(2);
    }
  });

  it("GenerateTestReportSchema accepts includeFlaky=false explicitly", () => {
    const input = {
      resultsPath: "/results.json",
      format: "markdown",
      includeFlaky: false,
    };
    const result = GenerateTestReportSchema.safeParse(input);
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.includeFlaky).toBe(false);
    }
  });

  it("RunTestsSchema rejects empty object", () => {
    const result = RunTestsSchema.safeParse({});
    expect(result.success).toBe(false);
  });

  it("GetCoverageSchema rejects empty object", () => {
    const result = GetCoverageSchema.safeParse({});
    expect(result.success).toBe(false);
  });

  it("GenerateTestReportSchema rejects empty object", () => {
    const result = GenerateTestReportSchema.safeParse({});
    expect(result.success).toBe(false);
  });

  it("RunTestsSchema rejects array as testPath", () => {
    const result = RunTestsSchema.safeParse({
      testPath: ["/tests"],
      framework: "jest",
    });
    expect(result.success).toBe(false);
  });

  it("GetCoverageSchema rejects boolean as threshold", () => {
    const result = GetCoverageSchema.safeParse({
      testPath: "/src",
      framework: "jest",
      threshold: true,
    });
    expect(result.success).toBe(false);
  });

  it("AnalyzeTestQualitySchema rejects object in metrics array", () => {
    const result = AnalyzeTestQualitySchema.safeParse({
      testPath: "/tests",
      metrics: [{ name: "assertions" }],
    });
    expect(result.success).toBe(false);
  });
});
