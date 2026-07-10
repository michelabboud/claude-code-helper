#!/usr/bin/env node

/**
 * UI/UX Review MCP Server
 *
 * Screenshot-grounded UI/UX review for Claude Code through the Model Context
 * Protocol. This server does NOT compute scores or perform image analysis
 * itself — it has no vision model. Instead, each review tool reads the real
 * screenshot bytes, attaches them as an MCP image content block, and returns
 * a structured evaluation rubric addressed to the calling model (Claude),
 * which has vision and can genuinely evaluate what's in the image. See
 * `src/rubrics.ts` for the rubric content and image-loading helper.
 *
 * @author Michel Abboud (https://github.com/michelabboud)
 * @license Apache-2.0
 * @see https://github.com/michelabboud/claude-code-helper
 *
 * Created with assistance from Claude Code (Anthropic)
 */

import {
  ListToolsRequestSchema,
} from "@modelcontextprotocol/sdk/types.js";
import { z } from "zod";
import { runServer, registerTrackedToolHandler, generateRequestId, measureDuration, sanitizePath, errorResponse } from "mcp-shared";
import {
  imageContentBlock,
  buildDesignRubric,
  buildAccessibilityRubric,
  buildTypographyRubric,
  buildSpacingRubric,
  buildColorRubric,
  buildUsabilityRubric,
  buildComparisonRubric,
  buildImprovementsRubric,
} from "./rubrics.js";
import type { ImageContentBlock } from "./rubrics.js";

/** An MCP tool-result content block: either text or an image. */
type ToolContentBlock = { type: "text"; text: string } | ImageContentBlock;
/** The shape of every tool response this server returns. */
type ToolResponse = { content: ToolContentBlock[] };

const SERVER_NAME = "uiux-review-mcp";
const SERVER_VERSION = "1.0.1";
const SERVER_COLOR_EMOJI = "🟣";

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

// ---------------------------------------------------------------------------
// Wireframe generation — legitimate, deterministic text/HTML/diagram
// generation from a text description. This does NOT analyze an image, so it
// is unaffected by the NO-FAKES fix applied to the review tools above.
// ---------------------------------------------------------------------------

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
    `**UI/UX review** — screenshot-grounded design review for Claude Code. This server has no vision model of its own: each review tool reads the real screenshot and returns it as an image, paired with a structured evaluation rubric (WCAG criteria, Nielsen's heuristics, typography/spacing/color checklists) for the calling model — which does have vision — to evaluate against the attached image. The server never fabricates scores or findings.`,
    ``,
    `## Available Tools`,
    ``,
    `| Tool | Description |`,
    `|------|-------------|`,
    `| \`analyze_design\` | Returns the screenshot + a full design-review rubric (hierarchy, spacing, typography, color, accessibility, usability, consistency, responsiveness) to evaluate |`,
    `| \`check_accessibility\` | Returns the screenshot + a WCAG rubric (contrast, text size, touch targets, focus indicators) to evaluate |`,
    `| \`review_typography\` | Returns the screenshot + a typography rubric (hierarchy, readability, font pairing, scale, line height) to evaluate |`,
    `| \`validate_spacing\` | Returns the screenshot + a spacing/grid-consistency rubric to evaluate |`,
    `| \`check_color_scheme\` | Returns the screenshot + a color rubric (contrast, harmony, accessibility, brand consistency) to evaluate |`,
    `| \`suggest_improvements\` | Returns the screenshot + a prioritized checklist of areas to inspect for real, concrete improvements |`,
    `| \`generate_wireframe\` | Generate wireframes in HTML, ASCII, or Mermaid format from a text description |`,
    `| \`compare_designs\` | Returns both screenshots + a comparison rubric for the calling model to compare directly |`,
    `| \`check_usability\` | Returns the screenshot + Nielsen's usability heuristics rubric to evaluate |`,
    `| \`hello\` | Handshake check — verify server is online |`,
    ``,
    `## Usage`,
    ``,
    `\`\`\``,
    `hello {}                                                  → Quick greeting + status check`,
    `hello {"verbose": true}                                   → Full server info and tool catalog`,
    `analyze_design {"imagePath": "screenshot.png"}           → Screenshot + design review rubric`,
    `check_accessibility {"imagePath": "screenshot.png"}      → Screenshot + WCAG rubric`,
    `review_typography {"imagePath": "screenshot.png"}        → Screenshot + typography rubric`,
    `validate_spacing {"imagePath": "screenshot.png"}         → Screenshot + spacing rubric`,
    `check_color_scheme {"imagePath": "screenshot.png"}       → Screenshot + color rubric`,
    `suggest_improvements {"imagePath": "screenshot.png"}     → Screenshot + improvement checklist`,
    `generate_wireframe {"designDescription": "hero section", "designType": "desktop", "format": "html"}  → Wireframe`,
    `compare_designs {"imagePathA": "v1.png", "imagePathB": "v2.png", "comparisonType": "ab_test"}  → Both screenshots + comparison rubric`,
    `check_usability {"imagePath": "screenshot.png"}          → Screenshot + usability heuristics rubric`,
    `\`\`\``,
    ``,
    `## Author`,
    `Michel Abboud — https://github.com/michelabboud/claude-code-helper`,
    `License: Apache-2.0`,
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
        description: "Reads the design screenshot and returns it as an image, together with a structured design-review rubric (visual hierarchy, spacing, typography, color, accessibility, usability, consistency, responsiveness) for you to evaluate against the attached image. Optionally requests a wireframe suggestion for the improved layout.",
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
        description: "Reads the design screenshot and returns it as an image, together with a WCAG accessibility rubric (color contrast, text size, touch target dimensions, focus indicators, alt-text presence) for you to evaluate against the attached image.",
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
        description: "Reads the design screenshot and returns it as an image, together with a typography evaluation rubric (hierarchy, readability, font pairing, size scale, line height, letter spacing) for you to evaluate against the attached image.",
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
        description: "Reads the design screenshot and returns it as an image, together with a spacing/grid-consistency rubric (base unit adherence, margin/padding consistency, vertical rhythm) for you to evaluate against the attached image.",
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
        description: "Reads the design screenshot and returns it as an image, together with a color rubric (contrast, harmony, color-independence for accessibility, brand consistency) for you to evaluate against the attached image.",
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
        description: "Reads the design screenshot and returns it as an image, together with a prioritized checklist of areas to inspect (layout, visual hierarchy, typography, color, spacing, usability, accessibility) so you can report concrete, real improvements found in the attached image.",
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
        description: "Reads both design screenshots and returns them as images (version A, then version B), together with a comparison rubric for you to directly compare the two attached images metric by metric and give a reasoned recommendation. No score is computed by the server.",
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
        description: "Reads the design screenshot and returns it as an image, together with Nielsen's usability heuristics rubric (visibility, feedback, affordance, consistency, error prevention, recognition, flexibility, aesthetic) for you to evaluate against the attached image.",
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
    ].map(t => ({ ...t, description: `${SERVER_COLOR_EMOJI} ${t.description}` })),
  };
});

registerTrackedToolHandler(instance, async (request) => {
  const { name, arguments: args } = request.params;
  const requestId = generateRequestId();
  const startTime = performance.now();

  logger.info("Tool called", { requestId, tool: name, args });

  try {
    // Responses mix MCP text and image content blocks (images are returned so
    // the calling vision model does the analysis, rather than server-computed
    // scores — see rubrics.ts).
    let response: ToolResponse;

    switch (name) {
      case "analyze_design": {
        const { imagePath: rawImagePath, designType, checkpoints, includeWireframe } =
          AnalyzeDesignSchema.parse(args);
        const imagePath = sanitizePath(rawImagePath, process.cwd());
        const image = await imageContentBlock(imagePath);
        const rubric = buildDesignRubric(designType, checkpoints, includeWireframe);
        response = { content: [image, { type: "text", text: rubric }] };
        break;
      }

      case "check_accessibility": {
        const { imagePath: rawImagePath, wcagLevel, checks } = CheckAccessibilitySchema.parse(args);
        const imagePath = sanitizePath(rawImagePath, process.cwd());
        const image = await imageContentBlock(imagePath);
        const rubric = buildAccessibilityRubric(wcagLevel, checks);
        response = { content: [image, { type: "text", text: rubric }] };
        break;
      }

      case "review_typography": {
        const { imagePath: rawImagePath, aspects } = ReviewTypographySchema.parse(args);
        const imagePath = sanitizePath(rawImagePath, process.cwd());
        const image = await imageContentBlock(imagePath);
        const rubric = buildTypographyRubric(aspects);
        response = { content: [image, { type: "text", text: rubric }] };
        break;
      }

      case "validate_spacing": {
        const { imagePath: rawImagePath, baseUnit, checkConsistency } = ValidateSpacingSchema.parse(args);
        const imagePath = sanitizePath(rawImagePath, process.cwd());
        const image = await imageContentBlock(imagePath);
        const rubric = buildSpacingRubric(baseUnit, checkConsistency);
        response = { content: [image, { type: "text", text: rubric }] };
        break;
      }

      case "check_color_scheme": {
        const { imagePath: rawImagePath, brandColors, checks } = CheckColorSchemeSchema.parse(args);
        const imagePath = sanitizePath(rawImagePath, process.cwd());
        const image = await imageContentBlock(imagePath);
        const rubric = buildColorRubric(brandColors, checks);
        response = { content: [image, { type: "text", text: rubric }] };
        break;
      }

      case "suggest_improvements": {
        const { imagePath: rawImagePath, focusAreas, priority } = SuggestImprovementsSchema.parse(args);
        const imagePath = sanitizePath(rawImagePath, process.cwd());
        const image = await imageContentBlock(imagePath);
        const rubric = buildImprovementsRubric(focusAreas, priority);
        response = { content: [image, { type: "text", text: rubric }] };
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
        const [imageA, imageB] = await Promise.all([
          imageContentBlock(imagePathA),
          imageContentBlock(imagePathB),
        ]);
        const rubric = buildComparisonRubric(comparisonType, metrics);
        response = {
          content: [
            { type: "text", text: "Version A screenshot:" },
            imageA,
            { type: "text", text: "Version B screenshot:" },
            imageB,
            { type: "text", text: rubric },
          ],
        };
        break;
      }

      case "check_usability": {
        const { imagePath: rawImagePath, userFlow, heuristics } = CheckUsabilitySchema.parse(args);
        const imagePath = sanitizePath(rawImagePath, process.cwd());
        const image = await imageContentBlock(imagePath);
        const rubric = buildUsabilityRubric(userFlow, heuristics);
        response = { content: [image, { type: "text", text: rubric }] };
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
    // mcp-shared's tracked-handler return type models text-only content; the MCP
    // protocol and SDK also permit image content blocks, which the analysis tools
    // return so the calling vision model can see the screenshot.
    return response as unknown as { content: { type: string; text: string }[] };
  } catch (error: unknown) {
    const durationMs = measureDuration(startTime);
    logger.error("Tool failed", { requestId, tool: name, durationMs, error: error instanceof Error ? error.message : String(error) });
    return { ...errorResponse(error, name) };
  }
});

}); // runServer
