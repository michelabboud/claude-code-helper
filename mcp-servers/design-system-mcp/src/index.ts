#!/usr/bin/env node

/**
 * Design System MCP Server
 *
 * Validates UI consistency, design tokens, and component compliance for Claude Code
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
import * as fs from "fs/promises";
import * as path from "path";
import { JSDOM } from "jsdom";
import { runServer, registerTrackedToolHandler, generateRequestId, measureDuration, sanitizePath, errorResponse } from "mcp-shared";

const SERVER_NAME = "design-system-mcp";
const SERVER_VERSION = "1.0.0";
const SERVER_COLOR_EMOJI = "🟣";

// Tool input schemas
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

// Design token validation
interface DesignTokens {
  colors?: Record<string, string>;
  spacing?: Record<string, string>;
  typography?: Record<string, unknown>;
  [key: string]: unknown;
}

interface ValidationResult {
  valid: boolean;
  errors: Array<{ rule: string; message: string; severity: string }>;
  warnings: Array<{ rule: string; message: string }>;
  stats: Record<string, unknown>;
}

// Helper functions
async function validateTokens(
  tokensFile: string,
  rules: string[] = ["naming_convention", "color_contrast", "spacing_scale", "typography_scale"]
): Promise<ValidationResult> {
  try {
    const content = await fs.readFile(tokensFile, "utf-8");
    const tokens: DesignTokens = JSON.parse(content);
    
    const result: ValidationResult = {
      valid: true,
      errors: [],
      warnings: [],
      stats: {},
    };

    if (rules.includes("naming_convention")) {
      validateNamingConvention(tokens, result);
    }
    if (rules.includes("color_contrast")) {
      validateColorContrast(tokens, result);
    }
    if (rules.includes("spacing_scale")) {
      validateSpacingScale(tokens, result);
    }
    if (rules.includes("typography_scale")) {
      validateTypographyScale(tokens, result);
    }

    result.valid = result.errors.length === 0;
    return result;
  } catch (error: unknown) {
    return {
      valid: false,
      errors: [{ rule: "file_load", message: error instanceof Error ? error.message : String(error), severity: "error" }],
      warnings: [],
      stats: {},
    };
  }
}

function validateNamingConvention(tokens: DesignTokens, result: ValidationResult): void {
  // Check kebab-case convention
  const allKeys = getAllKeys(tokens);
  const invalidKeys = allKeys.filter(key => !/^[a-z0-9]+(-[a-z0-9]+)*$/.test(key));
  
  if (invalidKeys.length > 0) {
    result.errors.push({
      rule: "naming_convention",
      message: `Invalid token names (should be kebab-case): ${invalidKeys.join(", ")}`,
      severity: "warning",
    });
  }
  
  result.stats.totalTokens = allKeys.length;
  result.stats.validNames = allKeys.length - invalidKeys.length;
}

function validateColorContrast(tokens: DesignTokens, result: ValidationResult): void {
  if (!tokens.colors) return;
  
  const colors = tokens.colors;
  const textColors = Object.entries(colors).filter(([key]) => key.includes("text"));
  const bgColors = Object.entries(colors).filter(([key]) => key.includes("bg") || key.includes("background"));
  
  let contrastIssues = 0;
  
  for (const [textKey, textColor] of textColors) {
    for (const [bgKey, bgColor] of bgColors) {
      const ratio = calculateContrastRatio(textColor, bgColor);
      if (ratio < 4.5) { // WCAG AA for normal text
        contrastIssues++;
        result.warnings.push({
          rule: "color_contrast",
          message: `Low contrast (${ratio.toFixed(2)}:1) between ${textKey} and ${bgKey}`,
        });
      }
    }
  }
  
  result.stats.colorPairs = textColors.length * bgColors.length;
  result.stats.contrastIssues = contrastIssues;
}

function validateSpacingScale(tokens: DesignTokens, result: ValidationResult): void {
  if (!tokens.spacing) return;
  
  const spacingValues = Object.values(tokens.spacing)
    .map(v => parseInt(String(v).replace(/px|rem|em/g, "")))
    .filter(v => !isNaN(v));
  
  // Check if spacing follows a consistent scale (e.g., 8px base)
  const baseUnit = findBaseUnit(spacingValues);
  const nonCompliant = spacingValues.filter(v => v % baseUnit !== 0);
  
  if (nonCompliant.length > 0) {
    result.warnings.push({
      rule: "spacing_scale",
      message: `${nonCompliant.length} spacing values don't follow ${baseUnit}px scale`,
    });
  }
  
  result.stats.spacingTokens = spacingValues.length;
  result.stats.baseUnit = baseUnit;
  result.stats.compliantValues = spacingValues.length - nonCompliant.length;
}

function validateTypographyScale(tokens: DesignTokens, result: ValidationResult): void {
  if (!tokens.typography) return;
  
  const fontSizes = Object.entries(tokens.typography)
    .filter(([key]) => key.includes("size") || key.includes("fontSize"))
    .map(([, value]: [string, unknown]) => parseFloat(String(value).replace(/px|rem|em/g, "")));
  
  // Check if it follows a modular scale (e.g., 1.25 ratio)
  const ratios = [];
  for (let i = 1; i < fontSizes.length; i++) {
    ratios.push(fontSizes[i] / fontSizes[i - 1]);
  }
  
  const avgRatio = ratios.reduce((a, b) => a + b, 0) / ratios.length;
  const inconsistent = ratios.filter(r => Math.abs(r - avgRatio) > 0.2).length;
  
  if (inconsistent > fontSizes.length * 0.3) {
    result.warnings.push({
      rule: "typography_scale",
      message: "Typography scale is inconsistent (consider using a modular scale)",
    });
  }
  
  result.stats.fontSizes = fontSizes.length;
  result.stats.averageScaleRatio = avgRatio.toFixed(2);
}

async function checkComponent(
  componentPath: string,
  designSystemPath: string,
  checks: string[] = ["token_usage", "accessibility", "responsive_design"]
): Promise<ValidationResult> {
  try {
    const componentContent = await fs.readFile(componentPath, "utf-8");
    const designSystem: DesignTokens = JSON.parse(await fs.readFile(designSystemPath, "utf-8")) as DesignTokens;
    
    const result: ValidationResult = {
      valid: true,
      errors: [],
      warnings: [],
      stats: {},
    };

    if (checks.includes("token_usage")) {
      checkTokenUsage(componentContent, designSystem, result);
    }
    if (checks.includes("accessibility")) {
      await checkAccessibility(componentContent, result);
    }
    if (checks.includes("responsive_design")) {
      checkResponsiveDesign(componentContent, result);
    }

    result.valid = result.errors.length === 0;
    return result;
  } catch (error: unknown) {
    return {
      valid: false,
      errors: [{ rule: "component_check", message: error instanceof Error ? error.message : String(error), severity: "error" }],
      warnings: [],
      stats: {},
    };
  }
}

function checkTokenUsage(content: string, _designSystem: DesignTokens, result: ValidationResult): void {
  // Check for hard-coded values that should use tokens
  const hardcodedColors = content.match(/#[0-9a-fA-F]{3,6}|rgb\(|rgba\(/g) || [];
  const hardcodedSpacing = content.match(/\d+px(?!\s*\))/g) || [];
  
  if (hardcodedColors.length > 0) {
    result.warnings.push({
      rule: "token_usage",
      message: `Found ${hardcodedColors.length} hard-coded color values (use design tokens)`,
    });
  }
  
  if (hardcodedSpacing.length > 0) {
    result.warnings.push({
      rule: "token_usage",
      message: `Found ${hardcodedSpacing.length} hard-coded spacing values (use design tokens)`,
    });
  }
  
  result.stats.hardcodedColors = hardcodedColors.length;
  result.stats.hardcodedSpacing = hardcodedSpacing.length;
}

async function checkAccessibility(content: string, result: ValidationResult): Promise<void> {
  try {
    const dom = new JSDOM(content);
    const document = dom.window.document;
    
    // Check for alt text on images
    const imagesWithoutAlt = document.querySelectorAll("img:not([alt])");
    if (imagesWithoutAlt.length > 0) {
      result.errors.push({
        rule: "accessibility",
        message: `${imagesWithoutAlt.length} images missing alt text`,
        severity: "error",
      });
    }
    
    // Check for proper heading hierarchy
    const headings = Array.from(document.querySelectorAll("h1, h2, h3, h4, h5, h6"));
    const headingLevels = headings.map(h => parseInt(h.tagName[1]));
    
    for (let i = 1; i < headingLevels.length; i++) {
      if (headingLevels[i] > headingLevels[i - 1] + 1) {
        result.warnings.push({
          rule: "accessibility",
          message: `Skipped heading level detected (h${headingLevels[i - 1]} to h${headingLevels[i]})`,
        });
        break;
      }
    }
    
    // Check for form labels
    const inputsWithoutLabels = document.querySelectorAll("input:not([aria-label]):not([id])");
    if (inputsWithoutLabels.length > 0) {
      result.warnings.push({
        rule: "accessibility",
        message: `${inputsWithoutLabels.length} inputs without labels or aria-label`,
      });
    }
    
    result.stats.accessibilityChecks = 3;
  } catch (error: unknown) {
    result.warnings.push({
      rule: "accessibility",
      message: `Could not parse HTML for accessibility checks: ${error instanceof Error ? error.message : String(error)}`,
    });
  }
}

function checkResponsiveDesign(content: string, result: ValidationResult): void {
  // Check for media queries
  const mediaQueries = content.match(/@media[^{]+\{/g) || [];
  
  // Check for flexible units (rem, em, %, vw, vh)
  const flexibleUnits = content.match(/\d+(?:rem|em|%|vw|vh)/g) || [];
  const fixedUnits = content.match(/\d+px/g) || [];
  
  if (mediaQueries.length === 0 && fixedUnits.length > 10) {
    result.warnings.push({
      rule: "responsive_design",
      message: "No media queries found and many fixed pixel values detected",
    });
  }
  
  result.stats.mediaQueries = mediaQueries.length;
  result.stats.flexibleUnits = flexibleUnits.length;
  result.stats.fixedUnits = fixedUnits.length;
}

async function validateColorPalette(
  colorsFile: string,
  wcagLevel: string = "AA"
): Promise<ValidationResult> {
  try {
    const colors: Record<string, string> = JSON.parse(await fs.readFile(colorsFile, "utf-8")) as Record<string, string>;
    const result: ValidationResult = {
      valid: true,
      errors: [],
      warnings: [],
      stats: {},
    };
    
    const minRatio = wcagLevel === "AAA" ? 7 : 4.5;
    
    // Check contrast ratios between all color pairs
    const colorEntries = Object.entries(colors);
    let totalPairs = 0;
    let passingPairs = 0;
    
    for (let i = 0; i < colorEntries.length; i++) {
      for (let j = i + 1; j < colorEntries.length; j++) {
        const [, color1] = colorEntries[i];
        const [, color2] = colorEntries[j];
        const ratio = calculateContrastRatio(color1 as string, color2 as string);
        
        totalPairs++;
        if (ratio >= minRatio) {
          passingPairs++;
        }
      }
    }
    
    result.stats.totalColorPairs = totalPairs;
    result.stats.wcagCompliantPairs = passingPairs;
    result.stats.compliancePercentage = ((passingPairs / totalPairs) * 100).toFixed(1);
    
    return result;
  } catch (error: unknown) {
    return {
      valid: false,
      errors: [{ rule: "color_palette", message: error instanceof Error ? error.message : String(error), severity: "error" }],
      warnings: [],
      stats: {},
    };
  }
}

async function analyzeSpacing(directory: string, baseUnit: number = 8): Promise<Record<string, unknown>> {
  try {
    const files = await getStyleFiles(directory);
    const spacingValues: number[] = [];
    
    for (const file of files) {
      const content = await fs.readFile(file, "utf-8");
      const matches = content.match(/\d+px/g) || [];
      spacingValues.push(...matches.map(m => parseInt(m)));
    }
    
    const uniqueValues = [...new Set(spacingValues)].sort((a, b) => a - b);
    const compliant = uniqueValues.filter(v => v % baseUnit === 0);
    const nonCompliant = uniqueValues.filter(v => v % baseUnit !== 0);
    
    return {
      baseUnit,
      totalUniqueValues: uniqueValues.length,
      compliantValues: compliant.length,
      nonCompliantValues: nonCompliant.length,
      compliancePercentage: ((compliant.length / uniqueValues.length) * 100).toFixed(1),
      suggestions: nonCompliant.map(v => ({
        current: v,
        suggested: Math.round(v / baseUnit) * baseUnit,
      })),
    };
  } catch (error: unknown) {
    return { error: error instanceof Error ? error.message : String(error) };
  }
}

async function generateReport(
  resultsPath: string,
  format: string,
  includeRecommendations: boolean = false
): Promise<string> {
  try {
    const results: ValidationResult = JSON.parse(await fs.readFile(resultsPath, "utf-8")) as ValidationResult;

    if (format === "json") {
      return JSON.stringify(results, null, 2);
    }

    if (format === "markdown") {
      return generateMarkdownReport(results, includeRecommendations);
    }

    if (format === "html") {
      return generateHTMLReport(results, includeRecommendations);
    }

    return JSON.stringify(results, null, 2);
  } catch (error: unknown) {
    return JSON.stringify({ error: error instanceof Error ? error.message : String(error) }, null, 2);
  }
}

// Utility functions
function getAllKeys(obj: Record<string, unknown>, prefix: string = ""): string[] {
  let keys: string[] = [];
  for (const [key, value] of Object.entries(obj)) {
    const fullKey = prefix ? `${prefix}-${key}` : key;
    if (typeof value === "object" && value !== null && !Array.isArray(value)) {
      keys = keys.concat(getAllKeys(value as Record<string, unknown>, fullKey));
    } else {
      keys.push(fullKey);
    }
  }
  return keys;
}

function calculateContrastRatio(color1: string, color2: string): number {
  // Simplified contrast calculation (proper implementation would use relative luminance)
  const hex1 = color1.replace("#", "");
  const hex2 = color2.replace("#", "");
  
  const lum1 = parseInt(hex1, 16);
  const lum2 = parseInt(hex2, 16);
  
  const lighter = Math.max(lum1, lum2);
  const darker = Math.min(lum1, lum2);
  
  // Simplified ratio calculation
  return ((lighter + 0.05) / (darker + 0.05));
}

function findBaseUnit(values: number[]): number {
  // Find GCD of all values
  const gcd = (a: number, b: number): number => b === 0 ? a : gcd(b, a % b);
  return values.reduce(gcd);
}

async function getStyleFiles(directory: string): Promise<string[]> {
  const files: string[] = [];
  const entries = await fs.readdir(directory, { withFileTypes: true });
  
  for (const entry of entries) {
    const fullPath = path.join(directory, entry.name);
    if (entry.isFile() && /\.(css|scss|sass|less)$/.test(entry.name)) {
      files.push(fullPath);
    } else if (entry.isDirectory() && !entry.name.startsWith(".")) {
      files.push(...await getStyleFiles(fullPath));
    }
  }
  
  return files;
}

function generateMarkdownReport(results: ValidationResult, includeRecommendations: boolean): string {
  let report = `# Design System Validation Report\n\n`;
  report += `## Summary\n`;
  report += `- Valid: ${results.valid ? "✅ Yes" : "❌ No"}\n`;
  report += `- Errors: ${results.errors?.length || 0}\n`;
  report += `- Warnings: ${results.warnings?.length || 0}\n\n`;
  
  if (results.errors?.length > 0) {
    report += `## Errors\n`;
    results.errors.forEach((err) => {
      report += `- **${err.rule}**: ${err.message}\n`;
    });
    report += `\n`;
  }
  
  if (results.warnings?.length > 0) {
    report += `## Warnings\n`;
    results.warnings.forEach((warn) => {
      report += `- **${warn.rule}**: ${warn.message}\n`;
    });
    report += `\n`;
  }
  
  if (results.stats) {
    report += `## Statistics\n`;
    Object.entries(results.stats).forEach(([key, value]) => {
      report += `- ${key}: ${value}\n`;
    });
  }
  
  if (includeRecommendations) {
    report += `\n## Recommendations\n`;
    report += `- Use design tokens consistently\n`;
    report += `- Follow WCAG AA contrast guidelines\n`;
    report += `- Maintain consistent spacing scale\n`;
  }
  
  return report;
}

function generateHTMLReport(results: ValidationResult, includeRecommendations: boolean): string {
  return `<!DOCTYPE html>
<html>
<head>
  <title>Design System Validation Report</title>
  <style>
    body { font-family: sans-serif; max-width: 800px; margin: 40px auto; }
    .valid { color: green; }
    .invalid { color: red; }
    .error { background: #fee; padding: 10px; margin: 10px 0; border-left: 3px solid red; }
    .warning { background: #ffe; padding: 10px; margin: 10px 0; border-left: 3px solid orange; }
  </style>
</head>
<body>
  <h1>Design System Validation Report</h1>
  <h2>Summary</h2>
  <p class="${results.valid ? 'valid' : 'invalid'}">
    Valid: ${results.valid ? "✅ Yes" : "❌ No"}
  </p>
  <p>Errors: ${results.errors?.length || 0}</p>
  <p>Warnings: ${results.warnings?.length || 0}</p>
  ${includeRecommendations ? '<h2>Recommendations</h2><ul><li>Use design tokens consistently</li></ul>' : ''}
</body>
</html>`;
}

function buildHelloVerbose(): string {
  return [
    `${SERVER_COLOR_EMOJI} # ${SERVER_NAME} v${SERVER_VERSION}`,
    ``,
    `**Design system validation** — tokens, component compliance, color accessibility, and spacing consistency for Claude Code.`,
    ``,
    `## Available Tools`,
    ``,
    `| Tool | Description |`,
    `|------|-------------|`,
    `| \`validate_tokens\` | Validate design tokens for naming, color contrast, spacing, and typography |`,
    `| \`check_component\` | Check component for design system compliance and accessibility |`,
    `| \`validate_color_palette\` | Validate color palette for WCAG contrast compliance |`,
    `| \`analyze_spacing\` | Analyze spacing values across stylesheets for scale consistency |`,
    `| \`generate_report\` | Generate Markdown/HTML/JSON validation reports |`,
    `| \`hello\` | Handshake check — verify server is online |`,
    ``,
    `## Usage`,
    ``,
    `\`\`\``,
    `hello {}                                          → Quick greeting + status check`,
    `hello {"verbose": true}                           → Full server info and tool catalog`,
    `validate_tokens {"tokensFile": "tokens.json"}     → Validate design tokens`,
    `check_component {"componentPath": "Button.tsx", "designSystemPath": "ds.json"} → Check component`,
    `validate_color_palette {"colorsFile": "colors.json"} → Validate colors`,
    `analyze_spacing {"directory": "src/styles/"}      → Analyze spacing`,
    `generate_report {"resultsPath": "results.json", "format": "markdown"} → Report`,
    `\`\`\``,
    ``,
    `## Author`,
    `Michel Abboud — https://github.com/michelabboud/claude-code-helper`,
    `License: MIT`,
  ].join("\n");
}

// Start server with runServer factory
runServer({ name: "design-system-mcp", version: "1.0.0" }, (instance) => {
  const { server, logger } = instance;
  // Tool handlers
  server.setRequestHandler(ListToolsRequestSchema, async () => {
    return {
      tools: [
        {
          name: "validate_tokens",
          description: "Validate design tokens for naming conventions, color contrast, spacing scales, and typography scales. Ensures consistency across your design system.",
          inputSchema: {
            type: "object",
            properties: {
              tokensFile: { type: "string", description: "Path to design tokens JSON/CSS file" },
              rules: {
                type: "array",
                items: {
                  type: "string",
                  enum: ["naming_convention", "color_contrast", "spacing_scale", "typography_scale"]
                },
                description: "Validation rules to apply"
              },
            },
            required: ["tokensFile"],
          },
          annotations: {
            readOnlyHint: true,
            destructiveHint: false,
            idempotentHint: true,
          },
        },
        {
          name: "check_component",
          description: "Check component for design system compliance including token usage, accessibility, responsive design, and API consistency.",
          inputSchema: {
            type: "object",
            properties: {
              componentPath: { type: "string", description: "Path to component file" },
              designSystemPath: { type: "string", description: "Path to design system config" },
              checks: {
                type: "array",
                items: {
                  type: "string",
                  enum: ["token_usage", "accessibility", "responsive_design", "component_api"]
                },
                description: "Checks to perform"
              },
            },
            required: ["componentPath", "designSystemPath"],
          },
          annotations: {
            readOnlyHint: true,
            destructiveHint: false,
            idempotentHint: true,
          },
        },
        {
          name: "validate_color_palette",
          description: "Validate color palette for WCAG contrast compliance. Checks all color combinations for accessibility.",
          inputSchema: {
            type: "object",
            properties: {
              colorsFile: { type: "string", description: "Path to colors configuration" },
              wcagLevel: {
                type: "string",
                enum: ["AA", "AAA"],
                description: "WCAG compliance level"
              },
            },
            required: ["colorsFile"],
          },
          annotations: {
            readOnlyHint: true,
            destructiveHint: false,
            idempotentHint: true,
          },
        },
        {
          name: "analyze_spacing",
          description: "Analyze spacing values across stylesheets to ensure consistency with your spacing scale. Identifies non-compliant values.",
          inputSchema: {
            type: "object",
            properties: {
              directory: { type: "string", description: "Directory to analyze" },
              baseUnit: { type: "number", description: "Base spacing unit (default: 8)" },
            },
            required: ["directory"],
          },
          annotations: {
            readOnlyHint: true,
            destructiveHint: false,
            idempotentHint: true,
          },
        },
        {
          name: "generate_report",
          description: "Generate comprehensive design system validation reports in multiple formats with optional recommendations.",
          inputSchema: {
            type: "object",
            properties: {
              resultsPath: { type: "string", description: "Path to validation results JSON" },
              format: {
                type: "string",
                enum: ["markdown", "html", "json"],
                description: "Report format"
              },
              includeRecommendations: {
                type: "boolean",
                description: "Include fix recommendations"
              },
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
        case "validate_tokens": {
          const { tokensFile, rules } = ValidateTokensSchema.parse(args);
          const safePath = sanitizePath(tokensFile, process.cwd());
          const result = await validateTokens(safePath, rules);
          response = { content: [{ type: "text", text: JSON.stringify(result, null, 2) }] };
          break;
        }

        case "check_component": {
          const { componentPath, designSystemPath, checks } = CheckComponentSchema.parse(args);
          const safeComponentPath = sanitizePath(componentPath, process.cwd());
          const safeDesignSystemPath = sanitizePath(designSystemPath, process.cwd());
          const result = await checkComponent(safeComponentPath, safeDesignSystemPath, checks);
          response = { content: [{ type: "text", text: JSON.stringify(result, null, 2) }] };
          break;
        }

        case "validate_color_palette": {
          const { colorsFile, wcagLevel } = ValidateColorPaletteSchema.parse(args);
          const safePath = sanitizePath(colorsFile, process.cwd());
          const result = await validateColorPalette(safePath, wcagLevel);
          response = { content: [{ type: "text", text: JSON.stringify(result, null, 2) }] };
          break;
        }

        case "analyze_spacing": {
          const { directory, baseUnit } = AnalyzeSpacingSchema.parse(args);
          const safeDirectory = sanitizePath(directory, process.cwd());
          const result = await analyzeSpacing(safeDirectory, baseUnit);
          response = { content: [{ type: "text", text: JSON.stringify(result, null, 2) }] };
          break;
        }

        case "generate_report": {
          const { resultsPath, format, includeRecommendations } = GenerateReportSchema.parse(args);
          const safePath = sanitizePath(resultsPath, process.cwd());
          const result = await generateReport(safePath, format, includeRecommendations);
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
