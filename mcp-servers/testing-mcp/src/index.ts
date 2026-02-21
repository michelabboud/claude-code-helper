#!/usr/bin/env node

/**
 * Testing MCP Server
 *
 * Provides test execution, coverage analysis, and test quality metrics for Claude Code
 * through the Model Context Protocol.
 *
 * @author Michel Abboud (https://github.com/michelabboud)
 * @license MIT
 * @see https://github.com/michelabboud/claude-code-helper
 *
 * Created with assistance from Claude Code (Anthropic)
 */

import {
  ListToolsRequestSchema,
} from "@modelcontextprotocol/sdk/types.js";
import { z } from "zod";
import { execFile } from "child_process";
import { promisify } from "util";
import * as fs from "fs/promises";
import * as path from "path";
import { runServer, registerTrackedToolHandler, generateRequestId, measureDuration, sanitizePath, errorResponse, commandHealthCheck } from "mcp-shared";

// Interfaces for test analysis data structures
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

interface TestAnalysis {
  totalTests: number;
  totalFiles?: number;
  averageAssertionsPerTest?: number;
  metrics: {
    assertions?: AssertionMetrics;
    mocks?: MockMetrics;
    asyncTests?: number;
    flakinessIndicators?: string[];
  };
}

const execFileAsync = promisify(execFile);

const SERVER_NAME = "testing-mcp";
const SERVER_VERSION = "1.0.0";
const SERVER_COLOR_EMOJI = "🔴";

// Tool input schemas
const RunTestsSchema = z.object({
  testPath: z.string().describe("Path to test file or directory"),
  framework: z.enum(["jest", "pytest", "mocha", "vitest"]).describe("Test framework to use"),
  pattern: z.string().optional().describe("Test name pattern to match (e.g., 'should handle errors')"),
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

// Helper functions
async function runTests(
  testPath: string,
  framework: string,
  pattern?: string,
  watch: boolean = false
): Promise<string> {
  try {
    const commands: Record<string, { cmd: string; args: string[] }> = {
      jest: { cmd: "jest", args: [testPath, ...(pattern ? ["-t", pattern] : []), ...(watch ? ["--watch"] : []), "--json"] },
      pytest: { cmd: "pytest", args: [testPath, ...(pattern ? ["-k", pattern] : []), "--json-report", "--json-report-file=test-results.json"] },
      mocha: { cmd: "mocha", args: [testPath, ...(pattern ? ["--grep", pattern] : []), "--reporter", "json"] },
      vitest: { cmd: "vitest", args: ["run", testPath, "--reporter", "json"] },
    };

    const { cmd, args } = commands[framework];
    const { stdout, stderr } = await execFileAsync(cmd, args, {
      timeout: 300000, // 5 minute timeout
    });

    // Parse and format results
    let results: Record<string, unknown>;
    try {
      results = JSON.parse(stdout) as Record<string, unknown>;
    } catch {
      results = { output: stdout, stderr: stderr };
    }

    return JSON.stringify({
      framework,
      testPath,
      pattern,
      success: true,
      results,
      summary: extractTestSummary(results, framework),
    }, null, 2);
  } catch (error: unknown) {
    // Tests can fail but still produce output
    const execError = error as { stdout?: string; message?: string };
    let results: Record<string, unknown>;
    try {
      results = JSON.parse(execError.stdout || "{}") as Record<string, unknown>;
    } catch {
      results = { error: error instanceof Error ? error.message : String(error) };
    }

    return JSON.stringify({
      framework,
      testPath,
      pattern,
      success: false,
      results,
      summary: extractTestSummary(results, framework),
      error: error instanceof Error ? error.message : String(error),
    }, null, 2);
  }
}

async function getCoverage(
  testPath: string,
  framework: string,
  threshold: number = 80,
  format: string = "json"
): Promise<string> {
  try {
    const commands: Record<string, { cmd: string; args: string[] }> = {
      jest: { cmd: "jest", args: [testPath, "--coverage", `--coverageReporters=${format}`, `--coverageThreshold={"global":{"lines":${threshold}}}`] },
      pytest: { cmd: "pytest", args: [testPath, "--cov", `--cov-report=${format}`] },
      vitest: { cmd: "vitest", args: ["run", testPath, "--coverage", `--coverage.reporter=${format}`] },
    };

    const { cmd, args } = commands[framework];
    const { stdout, stderr } = await execFileAsync(cmd, args);

    // Read coverage report
    let coverageData: Record<string, unknown>;
    if (format === "json") {
      const coveragePath = path.join(process.cwd(), "coverage", "coverage-final.json");
      try {
        const coverageFile = await fs.readFile(coveragePath, "utf-8");
        coverageData = JSON.parse(coverageFile) as Record<string, unknown>;
      } catch {
        coverageData = { message: "Coverage file not found", output: stdout };
      }
    } else {
      coverageData = { output: stdout, format };
    }

    return JSON.stringify({
      framework,
      testPath,
      threshold,
      format,
      coverage: coverageData,
      meetsThreshold: !stderr.includes("Coverage threshold"),
    }, null, 2);
  } catch (error: unknown) {
    return JSON.stringify({
      framework,
      testPath,
      threshold,
      error: error instanceof Error ? error.message : String(error),
      meetsThreshold: false,
    }, null, 2);
  }
}

async function analyzeTestQuality(
  testPath: string,
  metrics: string[] = ["assertions", "mocks", "async", "flakiness"]
): Promise<string> {
  try {
    const files = await getTestFiles(testPath);
    const analysis: TestAnalysis = {
      totalTests: 0,
      metrics: {},
    };

    for (const file of files) {
      const content = await fs.readFile(file, "utf-8");

      if (metrics.includes("assertions")) {
        analysis.metrics.assertions = countAssertions(content);
      }
      if (metrics.includes("mocks")) {
        analysis.metrics.mocks = countMocks(content);
      }
      if (metrics.includes("async")) {
        analysis.metrics.asyncTests = countAsyncTests(content);
      }
      if (metrics.includes("flakiness")) {
        analysis.metrics.flakinessIndicators = detectFlakinessIndicators(content);
      }
    }

    analysis.totalFiles = files.length;
    analysis.averageAssertionsPerTest = (analysis.metrics.assertions?.total ?? 0) /
      (analysis.metrics.assertions?.testCount || 1);

    return JSON.stringify(analysis, null, 2);
  } catch (error: unknown) {
    return JSON.stringify({
      error: "Test quality analysis failed",
      details: error instanceof Error ? error.message : String(error),
    }, null, 2);
  }
}

async function generateTestReport(
  resultsPath: string,
  format: string,
  includeFlaky: boolean = false
): Promise<string> {
  try {
    const results = JSON.parse(await fs.readFile(resultsPath, "utf-8")) as TestResults;

    let report = "";

    if (format === "markdown") {
      report = generateMarkdownReport(results, includeFlaky);
    } else if (format === "html") {
      report = generateHTMLReport(results, includeFlaky);
    } else if (format === "pdf") {
      report = "PDF generation requires additional setup. Generating markdown instead.";
      report += "\n\n" + generateMarkdownReport(results, includeFlaky);
    }

    return report;
  } catch (error: unknown) {
    return JSON.stringify({
      error: "Report generation failed",
      details: error instanceof Error ? error.message : String(error),
    }, null, 2);
  }
}

// Utility functions
function extractTestSummary(results: Record<string, unknown>, framework: string): TestSummary {
  // Framework-specific summary extraction
  if (framework === "jest") {
    return {
      numTotalTests: (results.numTotalTests as number) || 0,
      numPassedTests: (results.numPassedTests as number) || 0,
      numFailedTests: (results.numFailedTests as number) || 0,
      numPendingTests: (results.numPendingTests as number) || 0,
    };
  }
  // Add other frameworks...
  return (results.summary as TestSummary) || {};
}

async function getTestFiles(testPath: string): Promise<string[]> {
  const files: string[] = [];
  const stat = await fs.stat(testPath);

  if (stat.isFile()) {
    return [testPath];
  }

  const entries = await fs.readdir(testPath, { withFileTypes: true });
  for (const entry of entries) {
    const fullPath = path.join(testPath, entry.name);
    if (entry.isFile() && /\.(test|spec)\.(js|ts|jsx|tsx|py)$/.test(entry.name)) {
      files.push(fullPath);
    } else if (entry.isDirectory()) {
      files.push(...await getTestFiles(fullPath));
    }
  }

  return files;
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

function buildHelloVerbose(): string {
  return [
    `${SERVER_COLOR_EMOJI} # ${SERVER_NAME} v${SERVER_VERSION}`,
    ``,
    `**Test automation** — execute tests, measure coverage, analyze test quality, and generate reports for Claude Code.`,
    ``,
    `## Available Tools`,
    ``,
    `| Tool | Description |`,
    `|------|-------------|`,
    `| \`run_tests\` | Execute tests with Jest, Pytest, Mocha, or Vitest |`,
    `| \`get_coverage\` | Generate code coverage reports with threshold checking |`,
    `| \`analyze_test_quality\` | Analyze assertion counts, mock usage, and flakiness |`,
    `| \`generate_test_report\` | Generate Markdown/HTML/PDF test reports |`,
    `| \`hello\` | Handshake check — verify server is online |`,
    ``,
    `## Usage`,
    ``,
    `\`\`\``,
    `hello {}                                          → Quick greeting + status check`,
    `hello {"verbose": true}                           → Full server info and tool catalog`,
    `run_tests {"testPath": "tests/", "framework": "jest"} → Run tests`,
    `get_coverage {"testPath": "src/", "framework": "jest"} → Get coverage`,
    `analyze_test_quality {"testPath": "tests/"}       → Analyze test quality`,
    `generate_test_report {"resultsPath": "results.json", "format": "markdown"} → Report`,
    `\`\`\``,
    ``,
    `## Author`,
    `Michel Abboud — https://github.com/michelabboud/claude-code-helper`,
    `License: MIT`,
  ].join("\n");
}

// Start server
runServer({
  name: "testing-mcp",
  version: "1.0.0",
  healthChecks: [
    commandHealthCheck("npx"),
  ],
}, (instance) => {
  const { server, logger } = instance;
  // Tool handlers
  server.setRequestHandler(ListToolsRequestSchema, async () => {
    return {
      tools: [
        {
          name: "run_tests",
          description: "Execute tests using various frameworks (Jest, Pytest, Mocha, Vitest). Returns detailed test results including pass/fail status.",
          inputSchema: {
            type: "object",
            properties: {
              testPath: { type: "string", description: "Path to test file or directory" },
              framework: {
                type: "string",
                enum: ["jest", "pytest", "mocha", "vitest"],
                description: "Test framework to use"
              },
              pattern: { type: "string", description: "Test name pattern to match" },
              watch: { type: "boolean", description: "Run in watch mode" },
            },
            required: ["testPath", "framework"],
          },
          annotations: {
            readOnlyHint: true,
            destructiveHint: false,
            idempotentHint: false, // Watch mode makes this non-idempotent
          },
        },
        {
          name: "get_coverage",
          description: "Generate code coverage reports with configurable thresholds. Supports multiple output formats (JSON, HTML, text).",
          inputSchema: {
            type: "object",
            properties: {
              testPath: { type: "string", description: "Path to test or source directory" },
              framework: {
                type: "string",
                enum: ["jest", "pytest", "vitest"],
                description: "Test framework"
              },
              threshold: { type: "number", description: "Minimum coverage % (default: 80)" },
              format: {
                type: "string",
                enum: ["json", "html", "text"],
                description: "Coverage report format"
              },
            },
            required: ["testPath", "framework"],
          },
          annotations: {
            readOnlyHint: true,
            destructiveHint: false,
            idempotentHint: true,
          },
        },
        {
          name: "analyze_test_quality",
          description: "Analyze test quality metrics including assertion counts, mock usage, async patterns, and flakiness indicators.",
          inputSchema: {
            type: "object",
            properties: {
              testPath: { type: "string", description: "Path to test files" },
              metrics: {
                type: "array",
                items: {
                  type: "string",
                  enum: ["assertions", "mocks", "async", "flakiness"]
                },
                description: "Metrics to analyze"
              },
            },
            required: ["testPath"],
          },
          annotations: {
            readOnlyHint: true,
            destructiveHint: false,
            idempotentHint: true,
          },
        },
        {
          name: "generate_test_report",
          description: "Generate comprehensive test reports in various formats (Markdown, HTML, PDF) with optional flaky test analysis.",
          inputSchema: {
            type: "object",
            properties: {
              resultsPath: { type: "string", description: "Path to test results JSON" },
              format: {
                type: "string",
                enum: ["markdown", "html", "pdf"],
                description: "Report format"
              },
              includeFlaky: { type: "boolean", description: "Include flaky test analysis" },
            },
            required: ["resultsPath", "format"],
          },
          annotations: {
            readOnlyHint: true,
            destructiveHint: false,
            idempotentHint: true,
          },
        },
        {
          name: "hello",
          description: "Handshake check — verify this server is online. Returns a greeting. Pass verbose=true for the full tool catalog, usage guide, and server info.",
          inputSchema: {
            type: "object",
            properties: {
              verbose: { type: "boolean", description: "If true, return full server info, all tools with descriptions, and usage guide" },
            },
            required: [],
          },
          annotations: {
            readOnlyHint: true,
            destructiveHint: false,
            idempotentHint: true,
          },
        },
      ],
    };
  });

  registerTrackedToolHandler(instance, async (request) => {
    const { name, arguments: args } = request.params;
    const requestId = generateRequestId();
    const startTime = performance.now();

    logger.info("Tool called", { requestId, tool: name, args });

    try {
      let response;

      switch (name) {
        case "run_tests": {
          const { testPath, framework, pattern, watch } = RunTestsSchema.parse(args);
          const safePath = sanitizePath(testPath, process.cwd());
          const result = await runTests(safePath, framework, pattern, watch);
          response = { content: [{ type: "text", text: `Test execution results:\n\n${result}` }] };
          break;
        }

        case "get_coverage": {
          const { testPath, framework, threshold, format } = GetCoverageSchema.parse(args);
          const safePath = sanitizePath(testPath, process.cwd());
          const result = await getCoverage(safePath, framework, threshold, format);
          response = { content: [{ type: "text", text: `Coverage analysis:\n\n${result}` }] };
          break;
        }

        case "analyze_test_quality": {
          const { testPath, metrics } = AnalyzeTestQualitySchema.parse(args);
          const safePath = sanitizePath(testPath, process.cwd());
          const result = await analyzeTestQuality(safePath, metrics);
          response = { content: [{ type: "text", text: `Test quality analysis:\n\n${result}` }] };
          break;
        }

        case "generate_test_report": {
          const { resultsPath, format, includeFlaky } = GenerateTestReportSchema.parse(args);
          const safePath = sanitizePath(resultsPath, process.cwd());
          const result = await generateTestReport(safePath, format, includeFlaky);
          response = { content: [{ type: "text", text: result }] };
          break;
        }

        case "hello": {
          const verbose = (args as { verbose?: boolean })?.verbose ?? false;
          if (!verbose) {
            response = {
              content: [{
                type: "text",
                text: `${SERVER_COLOR_EMOJI} Hello! I'm **${SERVER_NAME}** v${SERVER_VERSION}.\n\nI'm online and ready to help!\n\nCall \`hello\` with \`{"verbose": true}\` for my full tool catalog and usage guide.`,
              }],
            };
          } else {
            response = {
              content: [{
                type: "text",
                text: buildHelloVerbose(),
              }],
            };
          }
          break;
        }

        default:
          throw new Error(`Unknown tool: ${name}`);
      }

      const durationMs = measureDuration(startTime);
      logger.info("Tool completed", { requestId, tool: name, durationMs });
      return response;
    } catch (error: unknown) {
      const durationMs = measureDuration(startTime);
      logger.error("Tool failed", { requestId, tool: name, durationMs, error: error instanceof Error ? error.message : String(error) });
      return errorResponse(error, name);
    }
  });
});
