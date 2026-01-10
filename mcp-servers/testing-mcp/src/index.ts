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

import { Server } from "@modelcontextprotocol/sdk/server/index.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import {
  CallToolRequestSchema,
  ListToolsRequestSchema,
} from "@modelcontextprotocol/sdk/types.js";
import { z } from "zod";
import { exec } from "child_process";
import { promisify } from "util";
import * as fs from "fs/promises";
import * as path from "path";

const execAsync = promisify(exec);

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

// MCP Server
const server = new Server(
  {
    name: "testing-mcp",
    version: "1.0.0",
  },
  {
    capabilities: {
      tools: {},
    },
  }
);

// Helper functions
async function runTests(
  testPath: string,
  framework: string,
  pattern?: string,
  watch: boolean = false
): Promise<string> {
  try {
    const commands: Record<string, string> = {
      jest: `jest ${testPath} ${pattern ? `-t "${pattern}"` : ""} ${watch ? "--watch" : ""} --json`,
      pytest: `pytest ${testPath} ${pattern ? `-k "${pattern}"` : ""} --json-report --json-report-file=test-results.json`,
      mocha: `mocha ${testPath} ${pattern ? `--grep "${pattern}"` : ""} --reporter json`,
      vitest: `vitest run ${testPath} ${pattern ? `--reporter=json` : ""} --reporter json`,
    };

    const { stdout, stderr } = await execAsync(commands[framework], {
      timeout: 300000, // 5 minute timeout
    });

    // Parse and format results
    let results;
    try {
      results = JSON.parse(stdout);
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
  } catch (error: any) {
    // Tests can fail but still produce output
    let results;
    try {
      results = JSON.parse(error.stdout);
    } catch {
      results = { error: error.message };
    }

    return JSON.stringify({
      framework,
      testPath,
      pattern,
      success: false,
      results,
      summary: extractTestSummary(results, framework),
      error: error.message,
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
    const commands: Record<string, string> = {
      jest: `jest ${testPath} --coverage --coverageReporters=${format} --coverageThreshold='{"global":{"lines":${threshold}}}'`,
      pytest: `pytest ${testPath} --cov --cov-report=${format}`,
      vitest: `vitest run ${testPath} --coverage --coverage.reporter=${format}`,
    };

    const { stdout, stderr } = await execAsync(commands[framework]);

    // Read coverage report
    let coverageData;
    if (format === "json") {
      const coveragePath = path.join(process.cwd(), "coverage", "coverage-final.json");
      try {
        const coverageFile = await fs.readFile(coveragePath, "utf-8");
        coverageData = JSON.parse(coverageFile);
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
  } catch (error: any) {
    return JSON.stringify({
      framework,
      testPath,
      threshold,
      error: error.message,
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
    const analysis: any = {
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
    analysis.averageAssertionsPerTest = analysis.metrics.assertions?.total / 
      (analysis.metrics.assertions?.testCount || 1);

    return JSON.stringify(analysis, null, 2);
  } catch (error: any) {
    return JSON.stringify({
      error: "Test quality analysis failed",
      details: error.message,
    }, null, 2);
  }
}

async function generateTestReport(
  resultsPath: string,
  format: string,
  includeFlaky: boolean = false
): Promise<string> {
  try {
    const results = JSON.parse(await fs.readFile(resultsPath, "utf-8"));
    
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
  } catch (error: any) {
    return JSON.stringify({
      error: "Report generation failed",
      details: error.message,
    }, null, 2);
  }
}

// Utility functions
function extractTestSummary(results: any, framework: string): any {
  // Framework-specific summary extraction
  if (framework === "jest") {
    return {
      numTotalTests: results.numTotalTests || 0,
      numPassedTests: results.numPassedTests || 0,
      numFailedTests: results.numFailedTests || 0,
      numPendingTests: results.numPendingTests || 0,
    };
  }
  // Add other frameworks...
  return results.summary || {};
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

function countAssertions(content: string): any {
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

function countMocks(content: string): any {
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

function generateMarkdownReport(results: any, includeFlaky: boolean): string {
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

function generateHTMLReport(results: any, includeFlaky: boolean): string {
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
    ],
  };
});

server.setRequestHandler(CallToolRequestSchema, async (request) => {
  const { name, arguments: args } = request.params;

  try {
    switch (name) {
      case "run_tests": {
        const { testPath, framework, pattern, watch } = RunTestsSchema.parse(args);
        const result = await runTests(testPath, framework, pattern, watch);
        return {
          content: [
            {
              type: "text",
              text: `Test execution results:\n\n${result}`,
            },
          ],
        };
      }

      case "get_coverage": {
        const { testPath, framework, threshold, format } = GetCoverageSchema.parse(args);
        const result = await getCoverage(testPath, framework, threshold, format);
        return {
          content: [
            {
              type: "text",
              text: `Coverage analysis:\n\n${result}`,
            },
          ],
        };
      }

      case "analyze_test_quality": {
        const { testPath, metrics } = AnalyzeTestQualitySchema.parse(args);
        const result = await analyzeTestQuality(testPath, metrics);
        return {
          content: [
            {
              type: "text",
              text: `Test quality analysis:\n\n${result}`,
            },
          ],
        };
      }

      case "generate_test_report": {
        const { resultsPath, format, includeFlaky } = GenerateTestReportSchema.parse(args);
        const result = await generateTestReport(resultsPath, format, includeFlaky);
        return {
          content: [
            {
              type: "text",
              text: result,
            },
          ],
        };
      }

      default:
        throw new Error(`Unknown tool: ${name}`);
    }
  } catch (error: any) {
    return {
      content: [
        {
          type: "text",
          text: `Error: ${error.message}`,
        },
      ],
      isError: true,
    };
  }
});

// Start server
async function main() {
  const transport = new StdioServerTransport();
  await server.connect(transport);
  console.error("Testing MCP Server running on stdio");
}

main().catch((error) => {
  console.error("Fatal error:", error);
  process.exit(1);
});
