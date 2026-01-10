#!/usr/bin/env node

/**
 * Code Review MCP Server
 * Provides linting, security scanning, and code quality analysis tools
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

// MCP Server
const server = new Server(
  {
    name: "code-review-mcp",
    version: "1.0.0",
  },
  {
    capabilities: {
      tools: {},
    },
  }
);

// Helper functions
async function runLinter(filePath: string, linter: string, fix: boolean = false): Promise<string> {
  try {
    const commands: Record<string, string> = {
      eslint: `eslint ${fix ? "--fix" : ""} ${filePath} --format json`,
      pylint: `pylint ${filePath} --output-format=json`,
      rubocop: `rubocop ${fix ? "-a" : ""} ${filePath} --format json`,
    };

    const { stdout, stderr } = await execAsync(commands[linter]);
    
    if (stderr && !stdout) {
      return JSON.stringify({ error: stderr, issues: [] });
    }

    return stdout || JSON.stringify({ issues: [], message: "No issues found" });
  } catch (error: any) {
    // Linters often return non-zero exit codes when issues are found
    return error.stdout || JSON.stringify({ 
      error: "Linter execution failed", 
      details: error.message 
    });
  }
}

async function runSecurityScan(
  targetPath: string, 
  scanner: string, 
  severity?: string
): Promise<string> {
  try {
    const commands: Record<string, string> = {
      bandit: `bandit -r ${targetPath} -f json ${severity ? `-ll -lll` : ""}`,
      semgrep: `semgrep --config=auto ${targetPath} --json`,
      snyk: `snyk test ${targetPath} --json`,
    };

    const { stdout, stderr } = await execAsync(commands[scanner]);
    
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
  } catch (error: any) {
    return error.stdout || JSON.stringify({ 
      error: "Security scan failed", 
      details: error.message,
      vulnerabilities: []
    });
  }
}

async function analyzeComplexity(filePath: string, language: string): Promise<string> {
  try {
    // Using radon for Python, complexity-report for JS
    const commands: Record<string, string> = {
      javascript: `npx complexity-report ${filePath} --format json`,
      python: `radon cc ${filePath} -j`,
      java: `echo '{"message": "Java complexity analysis requires PMD installation"}'`,
    };

    const { stdout } = await execAsync(commands[language]);
    return stdout;
  } catch (error: any) {
    return JSON.stringify({ 
      error: "Complexity analysis failed", 
      details: error.message,
      metrics: {} 
    });
  }
}

async function findDuplicates(directory: string, minLines: number = 5): Promise<string> {
  try {
    // Using jscpd for duplicate detection
    const { stdout } = await execAsync(
      `npx jscpd ${directory} --min-lines ${minLines} --format json`
    );
    return stdout;
  } catch (error: any) {
    return JSON.stringify({ 
      error: "Duplicate detection failed", 
      details: error.message,
      duplicates: [] 
    });
  }
}

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

server.setRequestHandler(CallToolRequestSchema, async (request) => {
  const { name, arguments: args } = request.params;

  try {
    switch (name) {
      case "lint_file": {
        const { filePath, linter, fixable } = LintFileSchema.parse(args);
        const result = await runLinter(filePath, linter, fixable);
        return {
          content: [
            {
              type: "text",
              text: `Linting results for ${filePath}:\n\n${result}`,
            },
          ],
        };
      }

      case "security_scan": {
        const { targetPath, scanner, severity } = SecurityScanSchema.parse(args);
        const result = await runSecurityScan(targetPath, scanner, severity);
        return {
          content: [
            {
              type: "text",
              text: `Security scan results for ${targetPath}:\n\n${result}`,
            },
          ],
        };
      }

      case "analyze_complexity": {
        const { filePath, language } = CodeComplexitySchema.parse(args);
        const result = await analyzeComplexity(filePath, language);
        return {
          content: [
            {
              type: "text",
              text: `Complexity analysis for ${filePath}:\n\n${result}`,
            },
          ],
        };
      }

      case "find_duplicates": {
        const { directory, minLines } = FindDuplicatesSchema.parse(args);
        const result = await findDuplicates(directory, minLines);
        return {
          content: [
            {
              type: "text",
              text: `Duplicate code detection for ${directory}:\n\n${result}`,
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
  console.error("Code Review MCP Server running on stdio");
}

main().catch((error) => {
  console.error("Fatal error:", error);
  process.exit(1);
});
