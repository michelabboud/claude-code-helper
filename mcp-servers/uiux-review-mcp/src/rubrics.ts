/**
 * Image loading + evaluation rubrics for the UI/UX Review MCP server.
 *
 * WHY THIS FILE EXISTS (NO-FAKES fix):
 * This server previously read a screenshot only to confirm it existed on disk,
 * then returned hardcoded numeric scores (e.g. "score: 8") and fabricated
 * observations/issues that had nothing to do with the actual image content.
 * That is a fake — it looked like real analysis but was not.
 *
 * The MCP server itself has no vision model; it cannot genuinely evaluate an
 * image. The calling model (Claude), however, DOES have vision. So instead of
 * fabricating findings, every "analysis" tool now:
 *   1. reads the real image bytes and returns them as an MCP image content
 *      block, and
 *   2. returns a structured rubric describing exactly what to look for,
 *      addressed to the calling model as an instruction to evaluate the
 *      ATTACHED image.
 *
 * The rubric content itself (WCAG criteria, Nielsen's heuristics, type-scale
 * guidance, etc.) is real, useful domain knowledge — that part is kept.
 * What's removed is any claim that THIS SERVER computed a score or observed
 * something in an image it never looked at.
 */

import * as fs from "fs/promises";
import * as path from "path";

// ---------------------------------------------------------------------------
// Image loading
// ---------------------------------------------------------------------------

export interface ImageContentBlock {
  type: "image";
  data: string;
  mimeType: string;
}

const MIME_TYPES_BY_EXTENSION: Record<string, string> = {
  ".png": "image/png",
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
  ".webp": "image/webp",
  ".gif": "image/gif",
};

const DEFAULT_MIME_TYPE = "image/png";

/** Detect an MCP-compatible image mimeType from a file extension. Defaults to image/png for unknown extensions. */
export function detectImageMimeType(imagePath: string): string {
  const ext = path.extname(imagePath).toLowerCase();
  return MIME_TYPES_BY_EXTENSION[ext] ?? DEFAULT_MIME_TYPE;
}

/**
 * Read an image from disk and encode it as an MCP image content block so the
 * calling model can actually see it. Throws if the file cannot be read (the
 * caller is expected to surface that via errorResponse).
 */
export async function imageContentBlock(imagePath: string): Promise<ImageContentBlock> {
  const buffer = await fs.readFile(imagePath);
  return {
    type: "image",
    data: buffer.toString("base64"),
    mimeType: detectImageMimeType(imagePath),
  };
}

// ---------------------------------------------------------------------------
// Shared instruction framing
// ---------------------------------------------------------------------------

const EVALUATE_ATTACHED_IMAGE_NOTICE =
  "An image is attached to this response. Evaluate the ATTACHED SCREENSHOT directly — cite concrete, visible details (exact colors, sizes, spacing, copy, layout) rather than generic statements, and only report an issue if you can actually point to it in the image. Do not invent findings that aren't visible.";

// ---------------------------------------------------------------------------
// analyze_design rubric
// ---------------------------------------------------------------------------

export const DEFAULT_DESIGN_CHECKPOINTS = [
  "visual_hierarchy",
  "spacing",
  "typography",
  "color",
  "accessibility",
  "usability",
  "consistency",
];

const DESIGN_CHECKPOINT_RUBRICS: Record<string, string> = {
  visual_hierarchy: [
    "## Visual hierarchy",
    "- Does the primary call-to-action stand out clearly (size, color, contrast, position) from secondary actions?",
    "- Do heading levels show a consistent, legible size/weight progression?",
    "- Is the most important content placed where users look first (top-left / center, per F- or Z-pattern scanning)?",
    "- Is information density balanced, or does content compete for attention?",
  ].join("\n"),
  spacing: [
    "## Spacing",
    "- Is there a consistent base spacing unit (commonly 8px) applied to margins, padding, and gaps?",
    "- Do similar elements (cards, buttons, form fields) share consistent spacing?",
    "- Is vertical rhythm consistent between sections?",
    "- Does spacing feel cramped or overly sparse anywhere?",
  ].join("\n"),
  typography: [
    "## Typography",
    "- Is there a clear, legible type scale between heading levels and body text?",
    "- Is body text large enough to read comfortably (commonly 16px-equivalent+) with adequate contrast?",
    "- Are line lengths and line-height comfortable for reading (~50-75 characters per line; ~1.5 line-height for body)?",
    "- How many distinct font families/weights are in use — is it a coherent, limited set?",
  ].join("\n"),
  color: [
    "## Color",
    "- Does the palette feel cohesive (a small set of intentional colors, not a grab-bag)?",
    "- Are text/background combinations likely to meet WCAG AA contrast (4.5:1 normal text, 3:1 large text)?",
    "- Is color used consistently to signal state (errors, success, links, disabled) alongside icons or text — not color alone?",
    "- If brand colors are known, are they used consistently for primary actions/branding?",
  ].join("\n"),
  accessibility: [
    "## Accessibility",
    "- Are interactive elements large enough to tap/click reliably (~44x44px), with visible affordance?",
    "- Do text/background pairs look like they meet WCAG AA contrast?",
    "- Would a keyboard or screen-reader user be able to tell what's focused/selected from the visuals alone?",
    "- Are form fields labeled visibly, not just via placeholder text?",
  ].join("\n"),
  usability: [
    "## Usability",
    "- Is the primary action/task obvious without instructions?",
    "- Is the navigation structure clear and predictable?",
    "- Would a user get feedback after taking an action (state changes, confirmations)?",
    "- Are destructive actions guarded by a visible confirmation pattern?",
  ].join("\n"),
  consistency: [
    "## Consistency",
    "- Do buttons, cards, and other repeated components share consistent styling?",
    "- Are spacing, corner radii, shadows, and iconography applied uniformly?",
    "- Does the design follow the platform's established conventions (iOS / Android / Material / Web)?",
  ].join("\n"),
  responsiveness: [
    "## Responsiveness",
    "- Does content fit the visible viewport without obvious overflow, clipping, or overlap?",
    "- Are touch targets and text sized appropriately for the apparent device/viewport?",
    "- Does the layout use available space sensibly (not overly cramped or overly sparse)?",
  ].join("\n"),
};

export function buildDesignRubric(
  designType: string | undefined,
  checkpoints: string[] | undefined,
  includeWireframe: boolean | undefined,
): string {
  const checks = checkpoints && checkpoints.length > 0 ? checkpoints : DEFAULT_DESIGN_CHECKPOINTS;
  const sections = checks
    .map((c) => DESIGN_CHECKPOINT_RUBRICS[c])
    .filter((s): s is string => Boolean(s));

  const lines = [
    `# Design Review Rubric${designType ? ` — ${designType} design` : ""}`,
    "",
    EVALUATE_ATTACHED_IMAGE_NOTICE,
    "",
    sections.join("\n\n"),
  ];

  if (includeWireframe) {
    lines.push(
      "",
      "## Wireframe suggestion",
      "After the review, describe (in text/ASCII) an improved layout that addresses the issues you found. For a polished HTML, ASCII, or Mermaid wireframe, call the `generate_wireframe` tool with a description of that improved layout.",
    );
  }

  return lines.join("\n");
}

// ---------------------------------------------------------------------------
// check_accessibility rubric
// ---------------------------------------------------------------------------

export const DEFAULT_ACCESSIBILITY_CHECKS = [
  "color_contrast",
  "text_size",
  "touch_targets",
  "focus_indicators",
];

const ACCESSIBILITY_CHECK_RUBRICS: Record<string, string> = {
  color_contrast: [
    "## Color contrast — WCAG 1.4.3 Contrast (Minimum, AA) / 1.4.6 (Enhanced, AAA)",
    "- Identify each distinct text/background color pairing visible in the image.",
    "- Estimate the contrast ratio for each pairing.",
    "- AA requires >=4.5:1 for normal text and >=3:1 for large text (>=18pt, or >=14pt bold); AAA requires >=7:1 / >=4.5:1.",
    "- Flag any pairing that looks like it falls short, and suggest a specific darker/lighter alternative.",
  ].join("\n"),
  text_size: [
    "## Text size — WCAG 1.4.4 Resize Text",
    "- Estimate whether body text is legible at a normal viewing distance (commonly 16px-equivalent or larger).",
    "- Note any text that looks unusually small, especially secondary/caption text.",
    "- Consider whether the text appears to use scalable units (rather than a fixed size that would clip at 200% zoom).",
  ].join("\n"),
  touch_targets: [
    "## Touch targets — WCAG 2.5.8 Target Size (Minimum, AA) / 2.5.5 (Enhanced, AAA)",
    "- Estimate the tap size of buttons, icons, and links (AA minimum ~24x24 CSS px; AAA / common mobile guidance ~44x44px).",
    "- Check spacing between adjacent targets to avoid accidental taps.",
    "- Flag any icon-only controls that look smaller than the recommended minimum.",
  ].join("\n"),
  focus_indicators: [
    "## Focus indicators — WCAG 2.4.7 Focus Visible / 2.4.11 Focus Not Obscured",
    "- If the screenshot shows a focused/active state, confirm there's a visible outline or highlight with sufficient contrast (>=3:1 against its background).",
    "- If no focus state is visible in this screenshot, say so explicitly — this check cannot be verified from a static image without one, and would need a focused-state screenshot or live testing.",
  ].join("\n"),
  alt_text_presence: [
    "## Alt text presence — WCAG 1.1.1 Non-text Content",
    "- Alt text is not visible in a rendered screenshot; this check cannot be verified from the image alone.",
    "- Note which images/icons appear to convey meaningful content (vs. purely decorative) so their alt text can be audited in the markup/code separately.",
  ].join("\n"),
};

export function buildAccessibilityRubric(
  wcagLevel: string | undefined,
  checks: string[] | undefined,
): string {
  const checksToRun = checks && checks.length > 0 ? checks : DEFAULT_ACCESSIBILITY_CHECKS;
  const sections = checksToRun
    .map((c) => ACCESSIBILITY_CHECK_RUBRICS[c])
    .filter((s): s is string => Boolean(s));

  return [
    `# Accessibility Audit Rubric — target conformance level: WCAG ${wcagLevel ?? "AA"}`,
    "",
    EVALUATE_ATTACHED_IMAGE_NOTICE,
    "",
    sections.join("\n\n"),
    "",
    "## Reporting instructions",
    "For each check above, report pass / fail / not-verifiable-from-image against the attached screenshot, with the specific element and your reasoning. Do not mark a check as failing unless you can point to what you see. Summarize overall conformance (full / partial / minimal) based only on what you actually found.",
  ].join("\n");
}

// ---------------------------------------------------------------------------
// review_typography rubric
// ---------------------------------------------------------------------------

export const DEFAULT_TYPOGRAPHY_ASPECTS = [
  "hierarchy",
  "readability",
  "font_pairing",
  "size_scale",
  "line_height",
];

const TYPOGRAPHY_ASPECT_RUBRICS: Record<string, string> = {
  hierarchy: [
    "## Hierarchy",
    "- Do heading levels (H1/H2/H3...) show a clear, consistent size/weight progression?",
    "- Is visual weight distributed appropriately across primary vs. secondary text?",
  ].join("\n"),
  readability: [
    "## Readability",
    "- Is body text large enough and high-contrast enough to read comfortably?",
    "- Is line length roughly 50-75 characters?",
    "- Is line-height generous enough for the text size (commonly 1.5-1.6 for body)?",
  ].join("\n"),
  font_pairing: [
    "## Font pairing",
    "- How many distinct font families are visible? (Two or fewer is usually cleaner.)",
    "- Do the fonts contrast intentionally (e.g. a sans-serif heading with serif body) or do they clash?",
  ].join("\n"),
  size_scale: [
    "## Size scale",
    "- Do font sizes follow a consistent scale/ratio rather than arbitrary jumps?",
    "- Are similar elements (e.g. all card titles) sized consistently?",
  ].join("\n"),
  line_height: [
    "## Line height",
    "- Is line-height comfortable for body text (~1.5-1.6) and tighter for large headings (~1.1-1.3)?",
    "- Does any text look visually cramped or overly loose?",
  ].join("\n"),
  letter_spacing: [
    "## Letter spacing",
    "- Do large headings have appropriately tight letter-spacing?",
    "- Does small/uppercase text have slightly looser tracking for legibility?",
  ].join("\n"),
};

export function buildTypographyRubric(aspects: string[] | undefined): string {
  const aspectsToCheck = aspects && aspects.length > 0 ? aspects : DEFAULT_TYPOGRAPHY_ASPECTS;
  const sections = aspectsToCheck
    .map((a) => TYPOGRAPHY_ASPECT_RUBRICS[a])
    .filter((s): s is string => Boolean(s));

  return [
    "# Typography Review Rubric",
    "",
    EVALUATE_ATTACHED_IMAGE_NOTICE,
    "",
    sections.join("\n\n"),
  ].join("\n");
}

// ---------------------------------------------------------------------------
// validate_spacing rubric
// ---------------------------------------------------------------------------

export function buildSpacingRubric(
  baseUnit: number | undefined,
  checkConsistency: boolean | undefined,
): string {
  const unit = baseUnit ?? 8;
  const lines = [
    "# Spacing Validation Rubric",
    "",
    `Base grid unit to check against: ${unit}px`,
    "",
    EVALUATE_ATTACHED_IMAGE_NOTICE,
    "",
    "- Estimate the margins, padding, and gaps around key elements (page margins, card padding, button padding, section gaps).",
    `- Check whether each measurement is a clean multiple of the ${unit}px base unit (or close to it).`,
  ];
  if (checkConsistency !== false) {
    lines.push(
      "- Compare spacing across similar/repeated elements (e.g. all cards, all buttons) for consistency.",
    );
  }
  lines.push(
    "- Note the specific values you observe (even approximate) and flag any that look off-grid, with a suggested corrected value.",
  );
  return lines.join("\n");
}

// ---------------------------------------------------------------------------
// check_color_scheme rubric
// ---------------------------------------------------------------------------

export const DEFAULT_COLOR_CHECKS = ["contrast", "harmony", "accessibility"];

const COLOR_CHECK_RUBRICS: Record<string, string> = {
  contrast: [
    "## Contrast",
    "- Identify the text/background color pairings visible in the image and estimate their contrast ratios.",
    "- Flag any pairing that looks likely to fall below WCAG AA (4.5:1 normal text / 3:1 large text).",
  ].join("\n"),
  harmony: [
    "## Harmony",
    "- Describe the color relationships in the palette (e.g. complementary, analogous, triadic, monochrome + one accent).",
    "- Note the balance of warm vs. cool tones and how neutrals are used.",
  ].join("\n"),
  accessibility: [
    "## Accessibility (color-independence)",
    "- Check whether color is ever the *only* way information is conveyed (e.g. red/green status, required-field indicators, links).",
    "- Flag cases missing an icon or text label alongside the color.",
  ].join("\n"),
};

export function buildColorRubric(
  brandColors: string[] | undefined,
  checks: string[] | undefined,
): string {
  const checksToRun = checks && checks.length > 0 ? checks : DEFAULT_COLOR_CHECKS;
  const sections: string[] = [];

  for (const check of checksToRun) {
    if (check === "brand_consistency") {
      sections.push(
        [
          "## Brand consistency",
          brandColors && brandColors.length > 0
            ? `- Compare the colors you observe in the image against this brand palette: ${brandColors.join(", ")}.`
            : "- No brand palette was provided, so this check is qualitative only: note whether the visible palette looks internally consistent.",
          "- Estimate how much of the design's color usage maps to the brand palette vs. off-palette colors.",
        ].join("\n"),
      );
      continue;
    }
    const rubric = COLOR_CHECK_RUBRICS[check];
    if (rubric) sections.push(rubric);
  }

  return [
    "# Color Scheme Rubric",
    "",
    EVALUATE_ATTACHED_IMAGE_NOTICE,
    "",
    "First, list the actual colors you observe in the image (best-guess hex values, where each is used, and roughly how much area it covers). Then evaluate each check below against what you see.",
    "",
    sections.join("\n\n"),
  ].join("\n");
}

// ---------------------------------------------------------------------------
// check_usability rubric (Nielsen's usability heuristics)
// ---------------------------------------------------------------------------

export const DEFAULT_USABILITY_HEURISTICS = [
  "visibility",
  "feedback",
  "affordance",
  "consistency",
  "error_prevention",
];

const USABILITY_HEURISTIC_RUBRICS: Record<string, string> = {
  visibility: [
    "## Visibility of system status (Nielsen Heuristic 1)",
    "- Does the design show loading states, clearly indicate the active/current page, or otherwise keep the user informed of what's happening?",
  ].join("\n"),
  feedback: [
    "## Feedback",
    "- Would the user get clear confirmation after taking an action (button state changes, success/error messages)?",
  ].join("\n"),
  affordance: [
    "## Affordance & signifiers",
    "- Do interactive elements look interactive (buttons, links, clickable cards) versus static content?",
  ].join("\n"),
  consistency: [
    "## Consistency and standards (Nielsen Heuristic 4)",
    "- Are UI patterns, icons, and terminology consistent throughout, and do they follow common platform conventions?",
  ].join("\n"),
  error_prevention: [
    "## Error prevention (Nielsen Heuristic 5)",
    "- Are destructive actions guarded by a visible confirmation pattern?",
    "- Are required fields/constraints clearly marked before submission?",
  ].join("\n"),
  recognition: [
    "## Recognition rather than recall (Nielsen Heuristic 6)",
    "- Are options and actions visible in context, rather than requiring the user to remember information from elsewhere?",
  ].join("\n"),
  flexibility: [
    "## Flexibility and efficiency of use (Nielsen Heuristic 7)",
    "- Are there accelerators (shortcuts, saved preferences, bulk actions) for experienced users, without hurting novices?",
  ].join("\n"),
  aesthetic: [
    "## Aesthetic and minimalist design (Nielsen Heuristic 8)",
    "- Is every visible element relevant, or is there visual clutter competing for attention?",
  ].join("\n"),
};

export function buildUsabilityRubric(
  userFlow: string | undefined,
  heuristics: string[] | undefined,
): string {
  const heuristicsToCheck = heuristics && heuristics.length > 0 ? heuristics : DEFAULT_USABILITY_HEURISTICS;
  const sections = heuristicsToCheck
    .map((h) => USABILITY_HEURISTIC_RUBRICS[h])
    .filter((s): s is string => Boolean(s));

  const lines = ["# Usability Heuristics Rubric (Nielsen's 10 Usability Heuristics)", ""];
  if (userFlow) {
    lines.push(`Expected user flow / task: "${userFlow}". Consider whether the screenshot supports completing that task efficiently.`, "");
  }
  lines.push(EVALUATE_ATTACHED_IMAGE_NOTICE, "", sections.join("\n\n"));
  return lines.join("\n");
}

// ---------------------------------------------------------------------------
// compare_designs rubric
// ---------------------------------------------------------------------------

export const DEFAULT_COMPARISON_METRICS = [
  "visual_impact",
  "clarity",
  "accessibility",
  "consistency",
];

const COMPARISON_METRIC_RUBRICS: Record<string, string> = {
  visual_impact: "## Visual impact\n- Which version has stronger visual hierarchy and draws attention to the right elements first?",
  clarity: "## Clarity\n- Which version communicates its purpose and primary action more clearly, with less ambiguity?",
  accessibility: "## Accessibility\n- Compare contrast, text size, and touch target sizing between the two — which is closer to WCAG AA?",
  consistency: "## Consistency\n- Compare the internal consistency of styling (buttons, spacing, type) within each version.",
};

export function buildComparisonRubric(
  comparisonType: string,
  metrics: string[] | undefined,
): string {
  const metricsToCheck = metrics && metrics.length > 0 ? metrics : DEFAULT_COMPARISON_METRICS;
  const sections = metricsToCheck
    .map((m) => COMPARISON_METRIC_RUBRICS[m])
    .filter((s): s is string => Boolean(s));

  return [
    `# Design Comparison Rubric — ${comparisonType}`,
    "",
    "Two screenshots are attached below: the first is VERSION A, the second is VERSION B.",
    "",
    "For each metric, compare the two ATTACHED IMAGES directly and note concrete differences you actually observe. Do not assign a numeric score unless you can justify it from what's visible in the images — a qualitative comparison is preferable to an invented number.",
    "",
    sections.join("\n\n"),
    "",
    "## Recommendation",
    `Conclude with a reasoned recommendation appropriate to a "${comparisonType}" comparison (which version better serves the goal, or whether they're roughly equivalent) based only on what you observed in the two images — never a coin flip or random pick.`,
  ].join("\n");
}

// ---------------------------------------------------------------------------
// suggest_improvements rubric
// ---------------------------------------------------------------------------

export const DEFAULT_IMPROVEMENT_AREAS = [
  "layout",
  "visual_hierarchy",
  "typography",
  "color",
  "spacing",
  "usability",
  "accessibility",
];

const IMPROVEMENT_AREA_RUBRICS: Record<string, string> = {
  layout: "## Layout\n- Is space used efficiently without feeling cramped or empty? Is content organized in a scannable order?",
  visual_hierarchy: "## Visual hierarchy\n- Does the primary action clearly outrank secondary ones? Is anything competing for attention that shouldn't be?",
  typography: "## Typography\n- Is the type scale, line-height, and font pairing serving readability?",
  color: "## Color\n- Is the palette cohesive, and are contrast ratios adequate?",
  spacing: "## Spacing\n- Is spacing consistent and grid-aligned across similar elements?",
  usability: "## Usability\n- Are actions discoverable, and is feedback provided after they're taken?",
  accessibility: "## Accessibility\n- Are contrast, touch targets, and focus/labeling handled well?",
};

export function buildImprovementsRubric(
  focusAreas: string[] | undefined,
  priority: string | undefined,
): string {
  const areas = focusAreas && focusAreas.length > 0 ? focusAreas : DEFAULT_IMPROVEMENT_AREAS;
  const sections = areas
    .map((a) => IMPROVEMENT_AREA_RUBRICS[a])
    .filter((s): s is string => Boolean(s));
  const minPriority = priority ?? "all";

  return [
    "# Improvement Suggestions Rubric",
    "",
    EVALUATE_ATTACHED_IMAGE_NOTICE,
    "",
    sections.join("\n\n"),
    "",
    "## Reporting instructions",
    `For each ACTUAL issue you observe (not a hypothetical one), report: category, a one-line problem statement citing what you see, a concrete suggested fix, estimated impact, and estimated effort (Low / Medium / High). Only include issues at or above priority: "${minPriority}". Order the output by priority (critical > high > medium > low).`,
  ].join("\n");
}
