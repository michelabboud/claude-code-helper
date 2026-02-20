#!/usr/bin/env node

/**
 * Code Review MCP Server
 *
 * Provides linting, security scanning, and code quality analysis tools for Claude Code
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
import { runServer, registerTrackedToolHandler, generateRequestId, measureDuration, sanitizePath, errorResponse, commandHealthCheck } from "mcp-shared";

const execFileAsync = promisify(execFile);

// Tool input schemas
const LintFileSchema = z.object({
  filePath: z.string().describe("Path to the file to lint"),
  linter: z.enum(["eslint", "pylint", "rubocop"]).describe("Linter to use"),
  fixable: z.boolean().optional().describe("Whether to auto-fix issues"),
});

const SecurityScanSchema = z.object({
  targetPath: z.string().describe("Path to scan (file or directory)"),
  scanner: z.enum(["bandit", "semgrep", "snyk"]).describe("Security scanner to use"),
  severity: z.enum(["low", "medium", "high", "critical"]).optional().describe("Minimum severity to report"),
});

const CodeComplexitySchema = z.object({
  filePath: z.string().describe("Path to analyze"),
  language: z.enum(["javascript", "python", "java"]).describe("Programming language"),
});

const FindDuplicatesSchema = z.object({
  directory: z.string().describe("Directory to scan for duplicates"),
  minLines: z.number().optional().describe("Minimum lines for duplicate detection (default: 5)"),
});

// Helper functions
async function runLinter(filePath: string, linter: string, fix: boolean = false): Promise<string> {
  try {
    const commands: Record<string, { cmd: string; args: string[] }> = {
      eslint: { cmd: "eslint", args: [...(fix ? ["--fix"] : []), filePath, "--format", "json"] },
      pylint: { cmd: "pylint", args: [filePath, "--output-format=json"] },
      rubocop: { cmd: "rubocop", args: [...(fix ? ["-a"] : []), filePath, "--format", "json"] },
    };

    const { cmd, args } = commands[linter];
    const { stdout, stderr } = await execFileAsync(cmd, args);

    if (stderr && !stdout) {
      return JSON.stringify({ error: stderr, issues: [] });
    }

    return stdout || JSON.stringify({ issues: [], message: "No issues found" });
  } catch (error: unknown) {
    // Linters often return non-zero exit codes when issues are found
    const execError = error as { stdout?: string; message?: string };
    return execError.stdout || JSON.stringify({
      error: "Linter execution failed",
      details: error instanceof Error ? error.message : String(error)
    });
  }
}

async function runSecurityScan(
  targetPath: string,
  scanner: string,
  severity?: string
): Promise<string> {
  try {
    const commands: Record<string, { cmd: string; args: string[] }> = {
      bandit: { cmd: "bandit", args: ["-r", targetPath, "-f", "json", ...(severity ? ["-ll", "-lll"] : [])] },
      semgrep: { cmd: "semgrep", args: ["--config=auto", targetPath, "--json"] },
      snyk: { cmd: "snyk", args: ["test", targetPath, "--json"] },
    };

    const { cmd, args } = commands[scanner];
    const { stdout, stderr } = await execFileAsync(cmd, args);

    if (stderr && !stdout) {
      return JSON.stringify({
        error: stderr,
        vulnerabilities: [],
        message: "Scan completed with warnings"
      });
    }

    return stdout || JSON.stringify({
      vulnerabilities: [],
      message: "No security issues found"
    });
  } catch (error: unknown) {
    const execError = error as { stdout?: string; message?: string };
    return execError.stdout || JSON.stringify({
      error: "Security scan failed",
      details: error instanceof Error ? error.message : String(error),
      vulnerabilities: []
    });
  }
}

async function analyzeComplexity(filePath: string, language: string): Promise<string> {
  try {
    // Using radon for Python, complexity-report for JS
    if (language === "java") {
      return JSON.stringify({ message: "Java complexity analysis requires PMD installation" });
    }

    const commands: Record<string, { cmd: string; args: string[] }> = {
      javascript: { cmd: "npx", args: ["complexity-report", filePath, "--format", "json"] },
      python: { cmd: "radon", args: ["cc", filePath, "-j"] },
    };

    const { cmd, args } = commands[language];
    const { stdout } = await execFileAsync(cmd, args);
    return stdout;
  } catch (error: unknown) {
    return JSON.stringify({
      error: "Complexity analysis failed",
      details: error instanceof Error ? error.message : String(error),
      metrics: {}
    });
  }
}

async function findDuplicates(directory: string, minLines: number = 5): Promise<string> {
  try {
    // Using jscpd for duplicate detection
    const { stdout } = await execFileAsync(
      "npx", ["jscpd", directory, "--min-lines", String(minLines), "--format", "json"]
    );
    return stdout;
  } catch (error: unknown) {
    return JSON.stringify({
      error: "Duplicate detection failed",
      details: error instanceof Error ? error.message : String(error),
      duplicates: []
    });
  }
}

// Start server
runServer({
  name: "code-review-mcp",
  version: "1.0.0",
  healthChecks: [
    commandHealthCheck("eslint"),
  ],
}, (instance) => {
  const { server, logger } = instance;
  // Tool handlers
  server.setRequestHandler(ListToolsRequestSchema, async () => {
    return {
      tools: [
        {
          name: "lint_file",
          description: "Run linter on a file to check code quality and style issues. Supports ESLint, Pylint, and Rubocop.",
          inputSchema: {
            type: "object",
            properties: {
              filePath: { type: "string", description: "Path to the file to lint" },
              linter: {
                type: "string",
                enum: ["eslint", "pylint", "rubocop"],
                description: "Linter to use"
              },
              fixable: {
                type: "boolean",
                description: "Whether to auto-fix issues (if supported)"
              },
            },
            required: ["filePath", "linter"],
          },
          annotations: {
            readOnlyHint: false, // Can modify files with --fix
            destructiveHint: false,
            idempotentHint: true,
          },
        },
        {
          name: "security_scan",
          description: "Scan code for security vulnerabilities using tools like Bandit, Semgrep, or Snyk. Returns detailed vulnerability reports.",
          inputSchema: {
            type: "object",
            properties: {
              targetPath: { type: "string", description: "Path to scan (file or directory)" },
              scanner: {
                type: "string",
                enum: ["bandit", "semgrep", "snyk"],
                description: "Security scanner to use"
              },
              severity: {
                type: "string",
                enum: ["low", "medium", "high", "critical"],
                description: "Minimum severity to report"
              },
            },
            required: ["targetPath", "scanner"],
          },
          annotations: {
            readOnlyHint: true,
            destructiveHint: false,
            idempotentHint: true,
          },
        },
        {
          name: "analyze_complexity",
          description: "Analyze code complexity metrics including cyclomatic complexity, maintainability index, and lines of code.",
          inputSchema: {
            type: "object",
            properties: {
              filePath: { type: "string", description: "Path to analyze" },
              language: {
                type: "string",
                enum: ["javascript", "python", "java"],
                description: "Programming language"
              },
            },
            required: ["filePath", "language"],
          },
          annotations: {
            readOnlyHint: true,
            destructiveHint: false,
            idempotentHint: true,
          },
        },
        {
          name: "find_duplicates",
          description: "Detect duplicate code blocks across files in a directory. Helps identify refactoring opportunities.",
          inputSchema: {
            type: "object",
            properties: {
              directory: { type: "string", description: "Directory to scan for duplicates" },
              minLines: {
                type: "number",
                description: "Minimum lines for duplicate detection (default: 5)"
              },
            },
            required: ["directory"],
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
        case "lint_file": {
          const { filePath, linter, fixable } = LintFileSchema.parse(args);
          const safePath = sanitizePath(filePath, process.cwd());
          const result = await runLinter(safePath, linter, fixable);
          response = {
            content: [
              {
                type: "text",
                text: `Linting results for ${filePath}:\n\n${result}`,
              },
            ],
          };
          break;
        }

        case "security_scan": {
          const { targetPath, scanner, severity } = SecurityScanSchema.parse(args);
          const safePath = sanitizePath(targetPath, process.cwd());
          const result = await runSecurityScan(safePath, scanner, severity);
          response = {
            content: [
              {
                type: "text",
                text: `Security scan results for ${targetPath}:\n\n${result}`,
              },
            ],
          };
          break;
        }

        case "analyze_complexity": {
          const { filePath, language } = CodeComplexitySchema.parse(args);
          const safePath = sanitizePath(filePath, process.cwd());
          const result = await analyzeComplexity(safePath, language);
          response = {
            content: [
              {
                type: "text",
                text: `Complexity analysis for ${filePath}:\n\n${result}`,
              },
            ],
          };
          break;
        }

        case "find_duplicates": {
          const { directory, minLines } = FindDuplicatesSchema.parse(args);
          const safeDir = sanitizePath(directory, process.cwd());
          const result = await findDuplicates(safeDir, minLines);
          response = {
            content: [
              {
                type: "text",
                text: `Duplicate code detection for ${directory}:\n\n${result}`,
              },
            ],
          };
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
