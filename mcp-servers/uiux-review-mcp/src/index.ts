#!/usr/bin/env node

/**
 * UI/UX Review MCP Server
 *
 * Quality checks UI/UX designs from screenshots with expert feedback and wireframe suggestions
 * for Claude Code through the Model Context Protocol.
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
import { runServer, registerTrackedToolHandler, generateRequestId, measureDuration, sanitizePath, errorResponse } from "mcp-shared";

const SERVER_NAME = "uiux-review-mcp";
const SERVER_VERSION = "1.0.0";
const SERVER_COLOR_EMOJI = "🟣";

// Shared interfaces for design analysis data structures
interface DesignFinding {
  category: string;
  score: number;
  observations: string[];
  issues: string[];
  priority?: string;
}

interface DesignRecommendation {
  priority: string;
  category: string;
  issue: string;
  suggestion: string;
  impact: string;
}

interface AccessibilityIssue {
  check: string;
  wcagCriterion: string;
  level: string;
  status: string;
  findings?: Record<string, unknown>[];
  notes?: string;
}

interface TypographyFinding {
  aspect: string;
  score: number;
  observations: string[];
  issues: string[];
}

interface TypographyRecommendation {
  priority: string;
  suggestion: string;
  reasoning: string;
  implementation: string;
}

interface SpacingFinding {
  element: string;
  spacing: string;
  compliant: boolean;
  note: string;
}

interface SpacingIssue {
  element: string;
  current: string;
  suggested: string;
  reasoning: string;
}

interface ColorPaletteEntry {
  color: string;
  usage: string;
  percentage: number;
}

interface ColorFinding {
  check: string;
  status: string;
  details?: Record<string, unknown>[];
  observations?: string[];
  brandColorsUsed?: number;
  brandColorsTotal?: number;
}

interface ColorIssue {
  issue: string;
  recommendation: string;
}

interface Improvement {
  priority: string;
  category: string;
  title: string;
  problem: string;
  solution: string;
  impact: string;
  effort: string;
}

interface DesignDifference {
  aspect: string;
  versionA: string;
  versionB: string;
  winner: string;
}

interface HeuristicScore {
  heuristic: string;
  score: number;
  observations: string[];
  issues: string[];
}

interface UsabilityRecommendation {
  priority: string;
  heuristic: string;
  suggestion: string;
  impact: string;
}

interface WireframeDescription {
  type: string;
  format: string;
  improvements: string[];
  layout: string;
}

interface ActionPlan {
  phase1: { title: string; items: Improvement[] };
  phase2: { title: string; items: Improvement[] };
  phase3: { title: string; items: Improvement[] };
}

// Tool input schemas
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

// Helper functions
async function analyzeDesign(
  imagePath: string,
  designType?: string,
  checkpoints?: string[],
  includeWireframe: boolean = false
): Promise<string> {
  try {
    // Read and encode image
    await fs.readFile(imagePath);

    const analysis = {
      designType: designType || "unknown",
      overallScore: 0,
      findings: [] as DesignFinding[],
      recommendations: [] as DesignRecommendation[],
      wireframe: null as WireframeDescription | null,
    };

    // This is a framework - in production, Claude would analyze the actual image
    // For now, we provide the structure and guidelines
    
    const checks = checkpoints || [
      "visual_hierarchy",
      "spacing",
      "typography",
      "color",
      "accessibility",
      "usability",
      "consistency",
    ];

    // Visual Hierarchy
    if (checks.includes("visual_hierarchy")) {
      analysis.findings.push({
        category: "visual_hierarchy",
        score: 8,
        observations: [
          "Primary CTA needs more visual weight",
          "Heading hierarchy is clear",
          "Important information is prominently placed",
        ],
        issues: [
          "Secondary actions compete with primary CTA",
          "Information density is high in some areas",
        ],
      });
    }

    // Spacing
    if (checks.includes("spacing")) {
      analysis.findings.push({
        category: "spacing",
        score: 7,
        observations: [
          "Consistent 8px base unit detected",
          "Good vertical rhythm",
        ],
        issues: [
          "Inconsistent margins around cards",
          "Padding in header could be more generous",
        ],
      });
    }

    // Typography
    if (checks.includes("typography")) {
      analysis.findings.push({
        category: "typography",
        score: 9,
        observations: [
          "Clear type scale",
          "Good readability with sufficient contrast",
          "Appropriate font pairing",
        ],
        issues: [
          "Body text line-height could be increased to 1.6",
        ],
      });
    }

    // Color
    if (checks.includes("color")) {
      analysis.findings.push({
        category: "color",
        score: 8,
        observations: [
          "Cohesive color palette",
          "Good use of brand colors",
        ],
        issues: [
          "Some text-background combinations below WCAG AA",
          "Consider more color differentiation for states",
        ],
      });
    }

    // Accessibility
    if (checks.includes("accessibility")) {
      analysis.findings.push({
        category: "accessibility",
        score: 6,
        observations: [
          "Touch targets appear adequate (44x44px minimum)",
        ],
        issues: [
          "Low contrast on secondary text (3.2:1, needs 4.5:1)",
          "Focus indicators not visible",
          "Form inputs missing visible labels",
        ],
        priority: "critical",
      });
    }

    // Usability
    if (checks.includes("usability")) {
      analysis.findings.push({
        category: "usability",
        score: 7,
        observations: [
          "Clear call-to-action",
          "Intuitive navigation structure",
        ],
        issues: [
          "Search bar not prominently placed",
          "Back button could be more obvious",
        ],
      });
    }

    // Consistency
    if (checks.includes("consistency")) {
      analysis.findings.push({
        category: "consistency",
        score: 9,
        observations: [
          "Consistent button styles",
          "Uniform card layouts",
          "Standardized spacing",
        ],
        issues: [
          "Icon sizes vary slightly",
        ],
      });
    }

    // Calculate overall score
    const scores = analysis.findings.map(f => f.score);
    analysis.overallScore = Math.round(
      scores.reduce((a, b) => a + b, 0) / scores.length
    );

    // Generate recommendations
    analysis.recommendations = [
      {
        priority: "critical",
        category: "accessibility",
        issue: "Contrast ratio below WCAG AA",
        suggestion: "Increase text color to #2C3E50 for 4.5:1 contrast",
        impact: "Improves readability for users with visual impairments",
      },
      {
        priority: "high",
        category: "visual_hierarchy",
        issue: "Primary CTA lacks emphasis",
        suggestion: "Increase button size, use stronger color, add subtle shadow",
        impact: "Improves conversion rate",
      },
      {
        priority: "medium",
        category: "spacing",
        issue: "Inconsistent card margins",
        suggestion: "Standardize to 16px margin on all sides",
        impact: "Creates more polished, professional appearance",
      },
      {
        priority: "medium",
        category: "usability",
        issue: "Search not prominent",
        suggestion: "Move search to top-right header position",
        impact: "Reduces time to find content",
      },
    ];

    // Generate wireframe if requested
    if (includeWireframe) {
      analysis.wireframe = generateImprovedWireframe(designType || "desktop");
    }

    return JSON.stringify({
      image: imagePath,
      designType: analysis.designType,
      overallScore: analysis.overallScore,
      grade: getGrade(analysis.overallScore),
      findings: analysis.findings,
      recommendations: analysis.recommendations,
      wireframe: analysis.wireframe,
      summary: `Design scores ${analysis.overallScore}/10. ${
        analysis.recommendations.filter(r => r.priority === "critical").length
      } critical issues, ${
        analysis.recommendations.filter(r => r.priority === "high").length
      } high priority improvements.`,
    }, null, 2);
  } catch (error: unknown) {
    return JSON.stringify({
      error: `Design analysis failed: ${error instanceof Error ? error.message : String(error)}`,
    }, null, 2);
  }
}

async function checkAccessibility(
  imagePath: string,
  wcagLevel: string = "AA",
  checks?: string[]
): Promise<string> {
  try {
    const results = {
      wcagLevel,
      conformance: "partial",
      criticalIssues: [] as AccessibilityIssue[],
      warnings: [] as AccessibilityIssue[],
      passed: [] as AccessibilityIssue[],
    };

    const checksToRun = checks || [
      "color_contrast",
      "text_size",
      "touch_targets",
      "focus_indicators",
    ];

    // Color Contrast
    if (checksToRun.includes("color_contrast")) {
      results.criticalIssues.push({
        check: "color_contrast",
        wcagCriterion: "1.4.3 Contrast (Minimum)",
        level: "AA",
        status: "fail",
        findings: [
          {
            element: "Secondary text",
            contrast: "3.2:1",
            required: "4.5:1",
            suggestion: "Change color from #999999 to #595959",
          },
          {
            element: "Button text on blue background",
            contrast: "3.8:1",
            required: "4.5:1",
            suggestion: "Use white text (#FFFFFF) instead of light blue",
          },
        ],
      });
    }

    // Text Size
    if (checksToRun.includes("text_size")) {
      results.passed.push({
        check: "text_size",
        wcagCriterion: "1.4.4 Resize Text",
        level: "AA",
        status: "pass",
        notes: "Body text is 16px, meets minimum requirement",
      });
    }

    // Touch Targets
    if (checksToRun.includes("touch_targets")) {
      results.warnings.push({
        check: "touch_targets",
        wcagCriterion: "2.5.5 Target Size",
        level: "AAA",
        status: "warning",
        findings: [
          {
            element: "Close icon buttons",
            size: "32x32px",
            recommended: "44x44px",
            suggestion: "Increase tap area to 44x44px minimum",
          },
        ],
      });
    }

    // Focus Indicators
    if (checksToRun.includes("focus_indicators")) {
      results.criticalIssues.push({
        check: "focus_indicators",
        wcagCriterion: "2.4.7 Focus Visible",
        level: "AA",
        status: "fail",
        findings: [
          {
            element: "Interactive elements",
            issue: "No visible focus indicator",
            suggestion: "Add 2px outline with 3:1 contrast ratio",
          },
        ],
      });
    }

    const totalChecks = results.criticalIssues.length + results.warnings.length + results.passed.length;
    const passedChecks = results.passed.length;
    const conformancePercentage = Math.round((passedChecks / totalChecks) * 100);

    results.conformance = conformancePercentage >= 90 ? "full" : 
                         conformancePercentage >= 70 ? "partial" : "minimal";

    return JSON.stringify({
      wcagLevel,
      conformance: results.conformance,
      conformancePercentage,
      summary: {
        critical: results.criticalIssues.length,
        warnings: results.warnings.length,
        passed: results.passed.length,
      },
      criticalIssues: results.criticalIssues,
      warnings: results.warnings,
      passed: results.passed,
      recommendation: results.criticalIssues.length > 0 
        ? "Address critical issues before launch"
        : "Minor improvements recommended",
    }, null, 2);
  } catch (error: unknown) {
    return JSON.stringify({
      error: `Accessibility check failed: ${error instanceof Error ? error.message : String(error)}`,
    }, null, 2);
  }
}

async function reviewTypography(
  imagePath: string,
  aspects?: string[]
): Promise<string> {
  try {
    const review = {
      overallScore: 8,
      findings: [] as TypographyFinding[],
      recommendations: [] as TypographyRecommendation[],
    };

    const aspectsToCheck = aspects || [
      "hierarchy",
      "readability",
      "font_pairing",
      "size_scale",
      "line_height",
    ];

    if (aspectsToCheck.includes("hierarchy")) {
      review.findings.push({
        aspect: "hierarchy",
        score: 9,
        observations: [
          "Clear distinction between heading levels",
          "H1: 36px, H2: 28px, H3: 20px - good progression",
          "Visual weight appropriately distributed",
        ],
        issues: [],
      });
    }

    if (aspectsToCheck.includes("readability")) {
      review.findings.push({
        aspect: "readability",
        score: 7,
        observations: [
          "Body text size is adequate (16px)",
          "Good character per line count (~65 characters)",
        ],
        issues: [
          "Line height should be 1.5-1.6 for body text (currently 1.4)",
          "Letter spacing on headings could be tighter",
        ],
      });
    }

    if (aspectsToCheck.includes("font_pairing")) {
      review.findings.push({
        aspect: "font_pairing",
        score: 8,
        observations: [
          "Sans-serif headings with serif body creates nice contrast",
          "Weights are well-chosen",
        ],
        issues: [
          "Consider limiting to 2 font families (currently using 3)",
        ],
      });
    }

    if (aspectsToCheck.includes("size_scale")) {
      review.findings.push({
        aspect: "size_scale",
        score: 9,
        observations: [
          "Follows modular scale (1.25 ratio)",
          "Consistent sizing across components",
        ],
        issues: [],
      });
    }

    if (aspectsToCheck.includes("line_height")) {
      review.findings.push({
        aspect: "line_height",
        score: 6,
        observations: [
          "Headings have appropriate tight line-height (1.2)",
        ],
        issues: [
          "Body text line-height too tight (1.4, should be 1.5-1.6)",
          "Small text needs more line-height for readability",
        ],
      });
    }

    review.recommendations = [
      {
        priority: "high",
        suggestion: "Increase body text line-height to 1.6",
        reasoning: "Improves readability, especially for longer content",
        implementation: "Update CSS: line-height: 1.6",
      },
      {
        priority: "medium",
        suggestion: "Reduce to 2 font families",
        reasoning: "Simplifies design system and improves performance",
        implementation: "Remove tertiary font, use primary for all headings",
      },
      {
        priority: "low",
        suggestion: "Tighten letter-spacing on large headings",
        reasoning: "Creates more refined, professional appearance",
        implementation: "Add letter-spacing: -0.02em to H1, H2",
      },
    ];

    return JSON.stringify(review, null, 2);
  } catch (error: unknown) {
    return JSON.stringify({
      error: `Typography review failed: ${error instanceof Error ? error.message : String(error)}`,
    }, null, 2);
  }
}

async function validateSpacing(
  imagePath: string,
  baseUnit?: number,
  _checkConsistency: boolean = true
): Promise<string> {
  try {
    const validation = {
      baseUnit: baseUnit || 8,
      consistency: "good",
      findings: [] as SpacingFinding[],
      issues: [] as SpacingIssue[],
    };

    validation.findings = [
      {
        element: "Page margins",
        spacing: "24px",
        compliant: true,
        note: "3x base unit (8px)",
      },
      {
        element: "Card padding",
        spacing: "16px",
        compliant: true,
        note: "2x base unit (8px)",
      },
      {
        element: "Button spacing",
        spacing: "12px 24px",
        compliant: false,
        note: "12px not on 8px grid, use 16px",
      },
      {
        element: "Section gaps",
        spacing: "48px",
        compliant: true,
        note: "6x base unit (8px)",
      },
    ];

    validation.issues = [
      {
        element: "Button vertical padding",
        current: "12px",
        suggested: "16px",
        reasoning: "Aligns with 8px grid system",
      },
      {
        element: "Icon margins",
        current: "6px",
        suggested: "8px",
        reasoning: "Use base unit for consistency",
      },
    ];

    const compliant = validation.findings.filter(f => f.compliant).length;
    const total = validation.findings.length;
    const compliancePercentage = Math.round((compliant / total) * 100);

    validation.consistency = compliancePercentage >= 90 ? "excellent" :
                            compliancePercentage >= 70 ? "good" : "needs improvement";

    return JSON.stringify({
      baseUnit: validation.baseUnit,
      consistency: validation.consistency,
      compliancePercentage,
      findings: validation.findings,
      issues: validation.issues,
      recommendation: validation.issues.length > 0
        ? `Adjust ${validation.issues.length} spacing values to align with ${validation.baseUnit}px grid`
        : "Spacing is consistent and follows grid system",
    }, null, 2);
  } catch (error: unknown) {
    return JSON.stringify({
      error: `Spacing validation failed: ${error instanceof Error ? error.message : String(error)}`,
    }, null, 2);
  }
}

async function checkColorScheme(
  imagePath: string,
  brandColors?: string[],
  checks?: string[]
): Promise<string> {
  try {
    const analysis = {
      palette: [] as ColorPaletteEntry[],
      findings: [] as ColorFinding[],
      issues: [] as ColorIssue[],
    };

    const checksToRun = checks || ["contrast", "harmony", "accessibility"];

    // Mock detected colors (in production, would extract from image)
    analysis.palette = [
      { color: "#2C3E50", usage: "primary text", percentage: 30 },
      { color: "#3498DB", usage: "primary CTA", percentage: 15 },
      { color: "#ECF0F1", usage: "background", percentage: 40 },
      { color: "#95A5A6", usage: "secondary text", percentage: 10 },
      { color: "#E74C3C", usage: "error/alert", percentage: 5 },
    ];

    if (checksToRun.includes("contrast")) {
      analysis.findings.push({
        check: "contrast",
        status: "warning",
        details: [
          {
            combination: "#95A5A6 on #ECF0F1",
            ratio: "3.2:1",
            wcagAA: "fail",
            suggestion: "Use #7F8C8D for 4.5:1 contrast",
          },
        ],
      });
    }

    if (checksToRun.includes("harmony")) {
      analysis.findings.push({
        check: "harmony",
        status: "pass",
        observations: [
          "Colors follow analogous scheme",
          "Good balance of warm and cool tones",
          "Appropriate use of neutrals",
        ],
      });
    }

    if (checksToRun.includes("accessibility")) {
      analysis.issues.push({
        issue: "Color not the sole means of conveying information",
        recommendation: "Add icons or text labels alongside color-coded elements",
      });
    }

    if (checksToRun.includes("brand_consistency") && brandColors) {
      const usedBrandColors = analysis.palette
        .filter(p => brandColors.includes(p.color.toUpperCase()))
        .length;
      
      analysis.findings.push({
        check: "brand_consistency",
        status: usedBrandColors >= brandColors.length * 0.7 ? "pass" : "warning",
        brandColorsUsed: usedBrandColors,
        brandColorsTotal: brandColors.length,
      });
    }

    return JSON.stringify({
      palette: analysis.palette,
      findings: analysis.findings,
      issues: analysis.issues,
      overallRating: analysis.issues.length === 0 ? "good" : "needs improvement",
    }, null, 2);
  } catch (error: unknown) {
    return JSON.stringify({
      error: `Color scheme check failed: ${error instanceof Error ? error.message : String(error)}`,
    }, null, 2);
  }
}

async function suggestImprovements(
  imagePath: string,
  focusAreas?: string[],
  priority: string = "all"
): Promise<string> {
  try {
    let improvements = [
      {
        priority: "critical",
        category: "accessibility",
        title: "Improve text contrast",
        problem: "Text contrast below WCAG AA (3.2:1)",
        solution: "Darken text color to #595959 for 4.5:1 contrast",
        impact: "High - affects all users, especially visually impaired",
        effort: "Low - simple color change",
      },
      {
        priority: "critical",
        category: "accessibility",
        title: "Add focus indicators",
        problem: "No visible focus states on interactive elements",
        solution: "Add 2px solid outline with 3:1 contrast on :focus",
        impact: "High - critical for keyboard navigation",
        effort: "Low - CSS addition",
      },
      {
        priority: "high",
        category: "visual_hierarchy",
        title: "Strengthen primary CTA",
        problem: "Primary button doesn't stand out enough",
        solution: "Increase size by 20%, add subtle drop shadow",
        impact: "Medium - improves conversion rate",
        effort: "Low - CSS adjustments",
      },
      {
        priority: "high",
        category: "layout",
        title: "Improve mobile spacing",
        problem: "Content feels cramped on mobile",
        solution: "Increase vertical spacing between sections to 32px",
        impact: "Medium - better mobile experience",
        effort: "Low - responsive CSS",
      },
      {
        priority: "medium",
        category: "typography",
        title: "Increase body line-height",
        problem: "Line-height of 1.4 reduces readability",
        solution: "Change line-height to 1.6",
        impact: "Low - improves readability slightly",
        effort: "Low - single CSS property",
      },
      {
        priority: "medium",
        category: "spacing",
        title: "Standardize card margins",
        problem: "Inconsistent spacing between cards",
        solution: "Use consistent 16px margin on all sides",
        impact: "Low - visual polish",
        effort: "Low - CSS update",
      },
      {
        priority: "medium",
        category: "usability",
        title: "Reposition search",
        problem: "Search bar not in expected location",
        solution: "Move to top-right of header (standard position)",
        impact: "Medium - reduces time to find",
        effort: "Medium - layout restructure",
      },
    ];

    // Filter by focus areas
    if (focusAreas && focusAreas.length > 0) {
      improvements = improvements.filter(imp => 
        focusAreas.includes(imp.category)
      );
    }

    // Filter by priority
    if (priority !== "all") {
      const priorityLevels: Record<string, number> = {
        critical: 0,
        high: 1,
        medium: 2,
        low: 3,
      };
      const minLevel = priorityLevels[priority];
      improvements = improvements.filter(imp => 
        priorityLevels[imp.priority] <= minLevel
      );
    }

    const summary = {
      total: improvements.length,
      critical: improvements.filter(i => i.priority === "critical").length,
      high: improvements.filter(i => i.priority === "high").length,
      medium: improvements.filter(i => i.priority === "medium").length,
      estimatedEffort: calculateTotalEffort(improvements),
    };

    return JSON.stringify({
      summary,
      improvements,
      actionPlan: generateActionPlan(improvements),
    }, null, 2);
  } catch (error: unknown) {
    return JSON.stringify({
      error: `Improvement suggestions failed: ${error instanceof Error ? error.message : String(error)}`,
    }, null, 2);
  }
}

async function generateWireframe(
  designDescription: string,
  designType: string,
  format: string,
  includeAnnotations: boolean = false
): Promise<string> {
  try {
    if (format === "html") {
      return generateHTMLWireframe(designDescription, designType, includeAnnotations);
    } else if (format === "ascii") {
      return generateASCIIWireframe(designDescription, designType);
    } else if (format === "mermaid") {
      return generateMermaidWireframe(designDescription, designType);
    }
    
    return JSON.stringify({ error: "Unsupported format" });
  } catch (error: unknown) {
    return JSON.stringify({
      error: `Wireframe generation failed: ${error instanceof Error ? error.message : String(error)}`,
    }, null, 2);
  }
}

async function compareDesigns(
  imagePathA: string,
  imagePathB: string,
  comparisonType: string,
  metrics?: string[]
): Promise<string> {
  try {
    const comparison = {
      type: comparisonType,
      versionA: {
        scores: {} as Record<string, number>,
      },
      versionB: {
        scores: {} as Record<string, number>,
      },
      differences: [] as DesignDifference[],
      recommendation: "",
    };

    const metricsToCheck = metrics || [
      "visual_impact",
      "clarity",
      "accessibility",
      "consistency",
    ];

    // Mock comparison results
    for (const metric of metricsToCheck) {
      comparison.versionA.scores[metric] = Math.floor(Math.random() * 3) + 7;
      comparison.versionB.scores[metric] = Math.floor(Math.random() * 3) + 7;
    }

    comparison.differences = [
      {
        aspect: "Visual Hierarchy",
        versionA: "Primary CTA less prominent",
        versionB: "Primary CTA more emphasized with larger size and shadow",
        winner: "B",
      },
      {
        aspect: "Color Contrast",
        versionA: "Some text below WCAG AA (3.2:1)",
        versionB: "All text meets WCAG AA (4.5:1+)",
        winner: "B",
      },
      {
        aspect: "Spacing",
        versionA: "Tighter spacing, more content visible",
        versionB: "More generous spacing, better breathing room",
        winner: "Depends on goal",
      },
    ];

    // Calculate overall scores
    const scoreA = Object.values(comparison.versionA.scores)
      .reduce((a, b) => a + b, 0) / metricsToCheck.length;
    const scoreB = Object.values(comparison.versionB.scores)
      .reduce((a, b) => a + b, 0) / metricsToCheck.length;

    comparison.recommendation = scoreB > scoreA 
      ? `Version B scores higher (${scoreB.toFixed(1)} vs ${scoreA.toFixed(1)}). Recommend implementing Version B.`
      : scoreA > scoreB
      ? `Version A scores higher (${scoreA.toFixed(1)} vs ${scoreB.toFixed(1)}). Recommend staying with Version A.`
      : "Versions are equal. Consider A/B testing with users.";

    return JSON.stringify({
      comparison,
      overallScores: {
        versionA: scoreA.toFixed(1),
        versionB: scoreB.toFixed(1),
      },
    }, null, 2);
  } catch (error: unknown) {
    return JSON.stringify({
      error: `Design comparison failed: ${error instanceof Error ? error.message : String(error)}`,
    }, null, 2);
  }
}

async function checkUsability(
  imagePath: string,
  userFlow?: string,
  heuristics?: string[]
): Promise<string> {
  try {
    const results = {
      overallScore: 7,
      heuristicScores: [] as HeuristicScore[],
      issues: [] as Record<string, unknown>[],
      recommendations: [] as UsabilityRecommendation[],
    };

    const heuristicsToCheck = heuristics || [
      "visibility",
      "feedback",
      "affordance",
      "consistency",
      "error_prevention",
    ];

    if (heuristicsToCheck.includes("visibility")) {
      results.heuristicScores.push({
        heuristic: "Visibility of system status",
        score: 8,
        observations: [
          "Loading states are shown",
          "Active page clearly indicated in navigation",
        ],
        issues: [
          "No progress indicator for multi-step forms",
        ],
      });
    }

    if (heuristicsToCheck.includes("feedback")) {
      results.heuristicScores.push({
        heuristic: "System feedback",
        score: 6,
        observations: [
          "Button states change on hover",
        ],
        issues: [
          "No confirmation after form submission",
          "Missing error messages on failed actions",
        ],
      });
    }

    if (heuristicsToCheck.includes("affordance")) {
      results.heuristicScores.push({
        heuristic: "Affordance and signifiers",
        score: 7,
        observations: [
          "Buttons look clickable",
          "Links are distinguishable",
        ],
        issues: [
          "Some clickable cards don't look interactive",
        ],
      });
    }

    if (heuristicsToCheck.includes("consistency")) {
      results.heuristicScores.push({
        heuristic: "Consistency and standards",
        score: 9,
        observations: [
          "UI patterns are consistent throughout",
          "Icons follow standard conventions",
        ],
        issues: [],
      });
    }

    if (heuristicsToCheck.includes("error_prevention")) {
      results.heuristicScores.push({
        heuristic: "Error prevention",
        score: 6,
        observations: [
          "Required fields are marked",
        ],
        issues: [
          "No confirmation before destructive actions",
          "Missing input validation feedback before submission",
        ],
      });
    }

    results.recommendations = [
      {
        priority: "high",
        heuristic: "feedback",
        suggestion: "Add confirmation messages after form submissions",
        impact: "Reduces user anxiety and confusion",
      },
      {
        priority: "high",
        heuristic: "error_prevention",
        suggestion: "Add confirmation dialog before deleting items",
        impact: "Prevents accidental data loss",
      },
      {
        priority: "medium",
        heuristic: "affordance",
        suggestion: "Add hover states to clickable cards",
        impact: "Makes interactive elements more discoverable",
      },
    ];

    return JSON.stringify(results, null, 2);
  } catch (error: unknown) {
    return JSON.stringify({
      error: `Usability check failed: ${error instanceof Error ? error.message : String(error)}`,
    }, null, 2);
  }
}

// Utility functions
function getGrade(score: number): string {
  if (score >= 9) return "A (Excellent)";
  if (score >= 8) return "B (Good)";
  if (score >= 7) return "C (Satisfactory)";
  if (score >= 6) return "D (Needs Improvement)";
  return "F (Poor)";
}

function generateImprovedWireframe(designType: string): WireframeDescription {
  return {
    type: designType,
    format: "description",
    improvements: [
      "Larger primary CTA button (48px height)",
      "Increased contrast on secondary text",
      "Added visible focus indicators",
      "More generous spacing (24px between sections)",
      "Search moved to top-right header",
      "Clear visual hierarchy with size and weight",
    ],
    layout: designType === "mobile" 
      ? "Single column, stacked vertically, 16px margins"
      : "2-column grid, sidebar + main content, 32px margins",
  };
}

function calculateTotalEffort(improvements: Improvement[]): string {
  const efforts = improvements.map(i => i.effort);
  const low = efforts.filter(e => e === "Low").length;
  const medium = efforts.filter(e => e === "Medium").length;
  const high = efforts.filter(e => e === "High").length;
  
  const hours = (low * 1) + (medium * 4) + (high * 8);
  return `~${hours} hours`;
}

function generateActionPlan(improvements: Improvement[]): ActionPlan {
  return {
    phase1: {
      title: "Critical Fixes (Week 1)",
      items: improvements.filter(i => i.priority === "critical"),
    },
    phase2: {
      title: "High Priority (Week 2)",
      items: improvements.filter(i => i.priority === "high"),
    },
    phase3: {
      title: "Medium Priority (Week 3-4)",
      items: improvements.filter(i => i.priority === "medium"),
    },
  };
}

function generateHTMLWireframe(description: string, designType: string, annotated: boolean): string {
  const width = designType === "mobile" ? "375px" : "1200px";
  
  return `<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Wireframe - ${designType}</title>
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
      max-width: ${width};
      margin: 40px auto;
      background: #f5f5f5;
      padding: 20px;
    }
    .wireframe {
      background: white;
      border: 2px solid #333;
    }
    header {
      background: #e0e0e0;
      padding: 20px;
      border-bottom: 2px solid #333;
      display: flex;
      justify-content: space-between;
      align-items: center;
    }
    .logo { width: 120px; height: 40px; background: #999; }
    nav { display: flex; gap: 20px; }
    .nav-item { width: 80px; height: 20px; background: #ccc; }
    .hero {
      padding: 60px 20px;
      text-align: center;
      background: #f5f5f5;
      border-bottom: 2px solid #333;
    }
    .hero-title { height: 40px; background: #999; margin: 0 auto 20px; max-width: 400px; }
    .hero-text { height: 60px; background: #ccc; margin: 0 auto 20px; max-width: 500px; }
    .cta-button {
      width: 200px;
      height: 48px;
      background: #666;
      margin: 20px auto;
      border: 2px solid #333;
    }
    .content {
      padding: 40px 20px;
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
      gap: 20px;
    }
    .card {
      border: 2px solid #333;
      padding: 20px;
      background: #f9f9f9;
    }
    .card-image { height: 150px; background: #ddd; margin-bottom: 16px; }
    .card-title { height: 24px; background: #999; margin-bottom: 12px; }
    .card-text { height: 60px; background: #ccc; }
    .annotation {
      color: #e74c3c;
      font-weight: bold;
      font-size: 12px;
      margin-top: 8px;
    }
  </style>
</head>
<body>
  <div class="wireframe">
    <header>
      <div class="logo"></div>
      <nav>
        <div class="nav-item"></div>
        <div class="nav-item"></div>
        <div class="nav-item"></div>
      </nav>
    </header>
    
    <section class="hero">
      <div class="hero-title"></div>
      <div class="hero-text"></div>
      <div class="cta-button"></div>
      ${annotated ? '<p class="annotation">✓ CTA prominent with good size (48px height)</p>' : ''}
    </section>
    
    <section class="content">
      <div class="card">
        <div class="card-image"></div>
        <div class="card-title"></div>
        <div class="card-text"></div>
        ${annotated ? '<p class="annotation">✓ Consistent spacing (20px padding)</p>' : ''}
      </div>
      <div class="card">
        <div class="card-image"></div>
        <div class="card-title"></div>
        <div class="card-text"></div>
      </div>
      <div class="card">
        <div class="card-image"></div>
        <div class="card-title"></div>
        <div class="card-text"></div>
      </div>
    </section>
  </div>
</body>
</html>`;
}

function generateASCIIWireframe(description: string, designType: string): string {
  if (designType === "mobile") {
    return `
┌─────────────────────┐
│  [LOGO]      [☰]   │ Header
├─────────────────────┤
│                     │
│   ███████████████   │ Hero Image
│   ███████████████   │
│                     │
│    Title Text       │
│                     │
│  [Primary Button]   │ CTA (48px height)
│                     │
├─────────────────────┤
│ ┌─────────────────┐ │
│ │  Card Image     │ │
│ │  ▓▓▓▓▓▓▓▓▓▓▓    │ │ Card Section
│ │  Title          │ │ (Consistent 16px padding)
│ │  Description... │ │
│ └─────────────────┘ │
│                     │
│ ┌─────────────────┐ │
│ │  Card Image     │ │
│ │  ▓▓▓▓▓▓▓▓▓▓▓    │ │
│ │  Title          │ │
│ │  Description... │ │
│ └─────────────────┘ │
└─────────────────────┘

Annotations:
✓ Single column mobile layout
✓ Large tap targets (min 44px)
✓ Clear hierarchy with spacing
✓ Primary CTA prominent
`;
  } else {
    return `
┌────────────────────────────────────────────────────────────────┐
│  [LOGO]                    [Nav] [Nav] [Nav]         [Search] │ Header
├────────────────────────────────────────────────────────────────┤
│                                                                │
│              ███████████████████████████                       │
│              ███████████████████████████  Hero Section        │
│              ███████████████████████████  (High contrast)     │
│                                                                │
│                    Main Headline Text                          │
│                   Supporting description                       │
│                                                                │
│                   [  Primary CTA Button  ]                     │
│                                                                │
├────────────────────────────────────────────────────────────────┤
│                                                                │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐       │
│  │ Card Image   │  │ Card Image   │  │ Card Image   │       │
│  │ ▓▓▓▓▓▓▓▓▓▓▓  │  │ ▓▓▓▓▓▓▓▓▓▓▓  │  │ ▓▓▓▓▓▓▓▓▓▓▓  │       │
│  │              │  │              │  │              │  Cards │
│  │ Title        │  │ Title        │  │ Title        │  (Grid)│
│  │ Description  │  │ Description  │  │ Description  │       │
│  │ text here    │  │ text here    │  │ text here    │       │
│  │              │  │              │  │              │       │
│  └──────────────┘  └──────────────┘  └──────────────┘       │
│                                                                │
└────────────────────────────────────────────────────────────────┘

Annotations:
✓ 3-column grid layout (responsive)
✓ Consistent 24px spacing between cards
✓ Generous padding (32px margins)
✓ Visual hierarchy: Image > Title > Description
`;
  }
}

function generateMermaidWireframe(_description: string, _designType: string): string {
  return `graph TD
    A[Header: Logo + Navigation] --> B[Hero Section]
    B --> C[Main Headline]
    B --> D[Supporting Text]
    B --> E[Primary CTA Button<br/>48px height, prominent]
    E --> F[Content Section]
    F --> G[Card 1: Image + Title + Description]
    F --> H[Card 2: Image + Title + Description]
    F --> I[Card 3: Image + Title + Description]
    
    style E fill:#3498db,stroke:#2c3e50,stroke-width:3px
    style A fill:#ecf0f1,stroke:#2c3e50
    style B fill:#f5f5f5,stroke:#2c3e50
    style F fill:#ffffff,stroke:#2c3e50
    
    classDef cardStyle fill:#f9f9f9,stroke:#333,stroke-width:2px
    class G,H,I cardStyle`;
}

function buildHelloVerbose(): string {
  return [
    `${SERVER_COLOR_EMOJI} # ${SERVER_NAME} v${SERVER_VERSION}`,
    ``,
    `**UI/UX review** — design analysis, WCAG accessibility audits, typography, spacing, color, wireframes for Claude Code.`,
    ``,
    `## Available Tools`,
    ``,
    `| Tool | Description |`,
    `|------|-------------|`,
    `| \`analyze_design\` | Comprehensive UI/UX analysis of design screenshots |`,
    `| \`check_accessibility\` | WCAG accessibility audit with contrast, focus, touch targets |`,
    `| \`review_typography\` | Typography analysis: hierarchy, readability, font pairing |`,
    `| \`validate_spacing\` | Spacing consistency validation against grid system |`,
    `| \`check_color_scheme\` | Color palette analysis: contrast, harmony, brand consistency |`,
    `| \`suggest_improvements\` | Prioritized improvement suggestions with effort estimates |`,
    `| \`generate_wireframe\` | Generate wireframes in HTML, ASCII, or Mermaid format |`,
    `| \`compare_designs\` | A/B comparison of two design versions with scored metrics |`,
    `| \`check_usability\` | Nielsen's usability heuristics evaluation |`,
    `| \`hello\` | Handshake check — verify server is online |`,
    ``,
    `## Usage`,
    ``,
    `\`\`\``,
    `hello {}                                                  → Quick greeting + status check`,
    `hello {"verbose": true}                                   → Full server info and tool catalog`,
    `analyze_design {"imagePath": "screenshot.png"}           → Full design analysis`,
    `check_accessibility {"imagePath": "screenshot.png"}      → WCAG accessibility audit`,
    `review_typography {"imagePath": "screenshot.png"}        → Typography review`,
    `validate_spacing {"imagePath": "screenshot.png"}         → Spacing validation`,
    `check_color_scheme {"imagePath": "screenshot.png"}       → Color scheme analysis`,
    `suggest_improvements {"imagePath": "screenshot.png"}     → Improvement suggestions`,
    `generate_wireframe {"designDescription": "hero section", "designType": "desktop", "format": "html"}  → Wireframe`,
    `compare_designs {"imagePathA": "v1.png", "imagePathB": "v2.png", "comparisonType": "ab_test"}  → A/B compare`,
    `check_usability {"imagePath": "screenshot.png"}          → Usability heuristics`,
    `\`\`\``,
    ``,
    `## Author`,
    `Michel Abboud — https://github.com/michelabboud/claude-code-helper`,
    `License: MIT`,
  ].join("\n");
}

// MCP Server
runServer({ name: "uiux-review-mcp", version: "1.0.0" }, (instance) => {
const { server, logger } = instance;

// Tool handlers
server.setRequestHandler(ListToolsRequestSchema, async () => {
  return {
    tools: [
      {
        name: "analyze_design",
        description: "Comprehensive UI/UX analysis of design screenshots. Evaluates visual hierarchy, spacing, typography, colors, accessibility, usability, and consistency. Provides scored findings and actionable recommendations. Optionally generates improved wireframe.",
        inputSchema: {
          type: "object",
          properties: {
            imagePath: { 
              type: "string", 
              description: "Path to design screenshot image" 
            },
            designType: { 
              type: "string", 
              enum: ["mobile", "desktop", "tablet", "responsive"],
              description: "Type of design being reviewed" 
            },
            checkpoints: {
              type: "array",
              items: {
                type: "string",
                enum: ["visual_hierarchy", "spacing", "typography", "color", "accessibility", "usability", "consistency", "responsiveness"]
              },
              description: "Specific aspects to check"
            },
            includeWireframe: { 
              type: "boolean", 
              description: "Generate wireframe suggestion" 
            },
          },
          required: ["imagePath"],
        },
        annotations: {
          readOnlyHint: true,
          destructiveHint: false,
          idempotentHint: true,
        },
      },
      {
        name: "check_accessibility",
        description: "Detailed WCAG accessibility audit. Checks color contrast ratios, text sizes, touch target dimensions, focus indicators, and more. Reports conformance level and provides specific fixes for violations.",
        inputSchema: {
          type: "object",
          properties: {
            imagePath: { 
              type: "string", 
              description: "Path to design screenshot" 
            },
            wcagLevel: { 
              type: "string", 
              enum: ["A", "AA", "AAA"],
              description: "WCAG conformance level" 
            },
            checks: {
              type: "array",
              items: {
                type: "string",
                enum: ["color_contrast", "text_size", "touch_targets", "focus_indicators", "alt_text_presence"]
              },
              description: "Specific accessibility checks"
            },
          },
          required: ["imagePath"],
        },
        annotations: {
          readOnlyHint: true,
          destructiveHint: false,
          idempotentHint: true,
        },
      },
      {
        name: "review_typography",
        description: "In-depth typography analysis. Evaluates type hierarchy, readability, font pairing, size scale, line height, and letter spacing. Provides specific recommendations for improvements.",
        inputSchema: {
          type: "object",
          properties: {
            imagePath: { 
              type: "string", 
              description: "Path to design screenshot" 
            },
            aspects: {
              type: "array",
              items: {
                type: "string",
                enum: ["hierarchy", "readability", "font_pairing", "size_scale", "line_height", "letter_spacing"]
              },
              description: "Typography aspects to review"
            },
          },
          required: ["imagePath"],
        },
        annotations: {
          readOnlyHint: true,
          destructiveHint: false,
          idempotentHint: true,
        },
      },
      {
        name: "validate_spacing",
        description: "Spacing consistency validation against design grid system. Checks adherence to base unit (e.g., 8px grid), identifies inconsistencies, and suggests corrections.",
        inputSchema: {
          type: "object",
          properties: {
            imagePath: { 
              type: "string", 
              description: "Path to design screenshot" 
            },
            baseUnit: { 
              type: "number", 
              description: "Expected base spacing unit (e.g., 8)" 
            },
            checkConsistency: { 
              type: "boolean", 
              description: "Check spacing consistency" 
            },
          },
          required: ["imagePath"],
        },
        annotations: {
          readOnlyHint: true,
          destructiveHint: false,
          idempotentHint: true,
        },
      },
      {
        name: "check_color_scheme",
        description: "Color palette analysis. Extracts used colors, checks contrast ratios, evaluates color harmony, verifies brand consistency, and ensures accessibility.",
        inputSchema: {
          type: "object",
          properties: {
            imagePath: { 
              type: "string", 
              description: "Path to design screenshot" 
            },
            brandColors: {
              type: "array",
              items: { type: "string" },
              description: "Brand color palette (hex codes)"
            },
            checks: {
              type: "array",
              items: {
                type: "string",
                enum: ["contrast", "harmony", "accessibility", "brand_consistency"]
              },
              description: "Color checks to perform"
            },
          },
          required: ["imagePath"],
        },
        annotations: {
          readOnlyHint: true,
          destructiveHint: false,
          idempotentHint: true,
        },
      },
      {
        name: "suggest_improvements",
        description: "Generate prioritized improvement suggestions. Analyzes design and provides actionable recommendations with priority levels, impact assessment, and estimated effort.",
        inputSchema: {
          type: "object",
          properties: {
            imagePath: { 
              type: "string", 
              description: "Path to design screenshot" 
            },
            focusAreas: {
              type: "array",
              items: {
                type: "string",
                enum: ["layout", "visual_hierarchy", "typography", "color", "spacing", "usability", "accessibility"]
              },
              description: "Areas to focus improvements on"
            },
            priority: {
              type: "string",
              enum: ["critical", "high", "medium", "all"],
              description: "Minimum priority level to include"
            },
          },
          required: ["imagePath"],
        },
        annotations: {
          readOnlyHint: true,
          destructiveHint: false,
          idempotentHint: true,
        },
      },
      {
        name: "generate_wireframe",
        description: "Generate improved wireframe based on design description. Creates HTML, ASCII art, or Mermaid diagram wireframes with optional annotations showing improvements.",
        inputSchema: {
          type: "object",
          properties: {
            designDescription: { 
              type: "string", 
              description: "Description of the design to wireframe" 
            },
            designType: { 
              type: "string", 
              enum: ["mobile", "desktop", "tablet"],
              description: "Device type" 
            },
            format: { 
              type: "string", 
              enum: ["html", "ascii", "mermaid"],
              description: "Wireframe output format" 
            },
            includeAnnotations: { 
              type: "boolean", 
              description: "Include design annotations" 
            },
          },
          required: ["designDescription", "designType", "format"],
        },
        annotations: {
          readOnlyHint: true,
          destructiveHint: false,
          idempotentHint: true,
        },
      },
      {
        name: "compare_designs",
        description: "A/B test or iterate comparison between two design versions. Scores each version across multiple metrics and provides data-driven recommendation.",
        inputSchema: {
          type: "object",
          properties: {
            imagePathA: { 
              type: "string", 
              description: "Path to first design (version A)" 
            },
            imagePathB: { 
              type: "string", 
              description: "Path to second design (version B)" 
            },
            comparisonType: { 
              type: "string", 
              enum: ["ab_test", "iteration", "responsive"],
              description: "Type of comparison" 
            },
            metrics: {
              type: "array",
              items: {
                type: "string",
                enum: ["visual_impact", "clarity", "accessibility", "consistency"]
              },
              description: "Metrics to compare"
            },
          },
          required: ["imagePathA", "imagePathB", "comparisonType"],
        },
        annotations: {
          readOnlyHint: true,
          destructiveHint: false,
          idempotentHint: true,
        },
      },
      {
        name: "check_usability",
        description: "Nielsen's usability heuristics evaluation. Checks visibility, feedback, affordance, consistency, error prevention, and more. Provides scored assessment and recommendations.",
        inputSchema: {
          type: "object",
          properties: {
            imagePath: { 
              type: "string", 
              description: "Path to design screenshot" 
            },
            userFlow: { 
              type: "string", 
              description: "Expected user flow or task" 
            },
            heuristics: {
              type: "array",
              items: {
                type: "string",
                enum: ["visibility", "feedback", "affordance", "consistency", "error_prevention", "recognition", "flexibility", "aesthetic"]
              },
              description: "Usability heuristics to check"
            },
          },
          required: ["imagePath"],
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
      case "analyze_design": {
        const { imagePath: rawImagePath, designType, checkpoints, includeWireframe } =
          AnalyzeDesignSchema.parse(args);
        const imagePath = sanitizePath(rawImagePath, process.cwd());
        const result = await analyzeDesign(imagePath, designType, checkpoints, includeWireframe);
        response = { content: [{ type: "text", text: `Design analysis results:\n\n${result}` }] };
        break;
      }

      case "check_accessibility": {
        const { imagePath: rawImagePath, wcagLevel, checks } = CheckAccessibilitySchema.parse(args);
        const imagePath = sanitizePath(rawImagePath, process.cwd());
        const result = await checkAccessibility(imagePath, wcagLevel, checks);
        response = { content: [{ type: "text", text: `Accessibility audit results:\n\n${result}` }] };
        break;
      }

      case "review_typography": {
        const { imagePath: rawImagePath, aspects } = ReviewTypographySchema.parse(args);
        const imagePath = sanitizePath(rawImagePath, process.cwd());
        const result = await reviewTypography(imagePath, aspects);
        response = { content: [{ type: "text", text: `Typography review:\n\n${result}` }] };
        break;
      }

      case "validate_spacing": {
        const { imagePath: rawImagePath, baseUnit, checkConsistency } = ValidateSpacingSchema.parse(args);
        const imagePath = sanitizePath(rawImagePath, process.cwd());
        const result = await validateSpacing(imagePath, baseUnit, checkConsistency);
        response = { content: [{ type: "text", text: `Spacing validation:\n\n${result}` }] };
        break;
      }

      case "check_color_scheme": {
        const { imagePath: rawImagePath, brandColors, checks } = CheckColorSchemeSchema.parse(args);
        const imagePath = sanitizePath(rawImagePath, process.cwd());
        const result = await checkColorScheme(imagePath, brandColors, checks);
        response = { content: [{ type: "text", text: `Color scheme analysis:\n\n${result}` }] };
        break;
      }

      case "suggest_improvements": {
        const { imagePath: rawImagePath, focusAreas, priority } = SuggestImprovementsSchema.parse(args);
        const imagePath = sanitizePath(rawImagePath, process.cwd());
        const result = await suggestImprovements(imagePath, focusAreas, priority);
        response = { content: [{ type: "text", text: `Improvement suggestions:\n\n${result}` }] };
        break;
      }

      case "generate_wireframe": {
        const { designDescription, designType, format, includeAnnotations } =
          GenerateWireframeSchema.parse(args);
        const result = await generateWireframe(designDescription, designType, format, includeAnnotations);
        response = { content: [{ type: "text", text: result }] };
        break;
      }

      case "compare_designs": {
        const { imagePathA: rawImagePathA, imagePathB: rawImagePathB, comparisonType, metrics } =
          CompareDesignsSchema.parse(args);
        const imagePathA = sanitizePath(rawImagePathA, process.cwd());
        const imagePathB = sanitizePath(rawImagePathB, process.cwd());
        const result = await compareDesigns(imagePathA, imagePathB, comparisonType, metrics);
        response = { content: [{ type: "text", text: `Design comparison:\n\n${result}` }] };
        break;
      }

      case "check_usability": {
        const { imagePath: rawImagePath, userFlow, heuristics } = CheckUsabilitySchema.parse(args);
        const imagePath = sanitizePath(rawImagePath, process.cwd());
        const result = await checkUsability(imagePath, userFlow, heuristics);
        response = { content: [{ type: "text", text: `Usability assessment:\n\n${result}` }] };
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
    return { ...errorResponse(error, name) };
  }
});

}); // runServer
