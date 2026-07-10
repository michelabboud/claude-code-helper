# UI/UX Review MCP Server

Screenshot-grounded UI/UX design review for Claude Code — WCAG accessibility rubrics, typography checklists, spacing/color/usability rubrics, and wireframe generation.

---

## 🎨 Features

### 9 Specialized Tools

| Tool | Purpose |
|------|---------|
| **analyze_design** | Screenshot + full design-review rubric (hierarchy, spacing, typography, color, accessibility, usability, consistency, responsiveness) |
| **check_accessibility** | Screenshot + WCAG rubric (contrast, text size, touch targets, focus, alt text) |
| **review_typography** | Screenshot + typography rubric (hierarchy, readability, font pairing, scale, line height) |
| **validate_spacing** | Screenshot + grid/spacing-consistency rubric |
| **check_color_scheme** | Screenshot + color rubric (contrast, harmony, accessibility, brand consistency) |
| **suggest_improvements** | Screenshot + prioritized checklist of areas to inspect for real issues |
| **generate_wireframe** | Create wireframes (HTML/ASCII/Mermaid) from a text description |
| **compare_designs** | Both screenshots + comparison rubric for a direct side-by-side evaluation |
| **check_usability** | Screenshot + Nielsen's usability heuristics rubric |

---

## 📸 How It Works

**This server has no vision model of its own.** It cannot look at an image and compute a score — and it doesn't pretend to. Instead, every review tool:

1. Reads the real screenshot bytes off disk and attaches them to the response as an **MCP image content block**.
2. Returns a structured **evaluation rubric** — the real WCAG success criteria, Nielsen's heuristics, typography/spacing/color checklists — addressed as instructions to the calling model.

The calling model (Claude, which *does* have vision) is the one that actually looks at the attached screenshot and evaluates it against the rubric. This server's job is to make sure the right image and the right checklist reach the model together — not to fabricate findings about an image it never analyzed.

**Input:** Design screenshots (PNG, JPG, WebP, GIF)

**Output:**
- The screenshot itself, as an MCP image content block, so the calling model can see it
- A structured rubric of what to evaluate (specific WCAG criteria, heuristics, checklists) — not a pre-computed verdict
- For `compare_designs`, both screenshots plus a rubric for comparing them directly

---

## 🚀 Quick Examples

### Example 1: Complete Design Review

```
"Review this mobile app design screenshot:
- Check visual hierarchy, spacing, typography, colors
- Audit accessibility (WCAG AA)
- Check usability
- Generate wireframe showing improvements"
```

**What you get back from the tool:** the screenshot (as an image block) plus a rubric like:

```
# Design Review Rubric — mobile design

An image is attached to this response. Evaluate the ATTACHED SCREENSHOT
directly — cite concrete, visible details rather than generic statements...

## Visual hierarchy
- Does the primary call-to-action stand out clearly (size, color, contrast,
  position) from secondary actions?
- Do heading levels show a consistent, legible size/weight progression?
...

## Accessibility
- Are interactive elements large enough to tap/click reliably (~44x44px)?
- Do text/background pairs look like they meet WCAG AA contrast?
...
```

Claude (the calling model) then evaluates the attached screenshot against each section and reports what it actually observes.

---

### Example 2: Accessibility Audit

```
"Check WCAG AA accessibility on this design:
- Color contrast
- Text sizes
- Touch targets
- Focus indicators"
```

**What you get back:** the screenshot plus a rubric citing the real WCAG success criteria (1.4.3 Contrast, 1.4.4 Resize Text, 2.5.8 Target Size, 2.4.7 Focus Visible) for Claude to check against the attached image, with reporting instructions ("pass / fail / not-verifiable-from-image, with the specific element and reasoning").

---

### Example 3: Typography Review

```
"Review typography in this design focusing on:
- Hierarchy
- Readability
- Font pairing
- Line height"
```

**What you get back:** the screenshot plus a rubric covering hierarchy, readability (line length, line-height), font pairing, and size scale — for Claude to evaluate against what it actually sees.

---

### Example 4: Generate Wireframe

```
"Generate a mobile wireframe for:
- E-commerce product page
- Hero image, title, price, buy button
- Product details tabs
- Related products section

Format: HTML with annotations"
```

**Creates:**
- Interactive HTML wireframe
- Proper spacing annotations
- Touch target sizes marked
- Accessibility notes included

This tool generates a wireframe from your text description — it doesn't analyze an existing image, so there's nothing to fabricate here.

---

## 💬 Common Use Cases

### Pre-Launch Design Check
```
"Complete pre-launch check for this landing page:
1. Design review (all checkpoints)
2. WCAG AA accessibility
3. Typography analysis
4. Color scheme validation
5. Usability heuristics

Provide pass/fail for launch readiness"
```

### A/B Test Comparison
```
"Compare these two versions:
- Version A: original-design.png
- Version B: redesign.png

Compare: visual impact, clarity, accessibility
Recommend which version to launch"
```

`compare_designs` returns both screenshots (labeled Version A / Version B) plus a comparison rubric. Claude compares the two attached images directly — no coin flip, no server-side scoring.

### Iteration Review
```
"Review this iteration:
- Previous version: v1.png
- Current version: v2.png

Check if improvements were implemented correctly"
```

### Accessibility Compliance
```
"Audit for WCAG AAA compliance:
- All contrast checks
- Touch target sizes
- Focus indicators
- Text sizes

Report all violations with specific fixes"
```

---

## 🎯 What Gets Evaluated

Each rubric below is real domain knowledge (WCAG criteria, Nielsen's heuristics, typography/spacing conventions) that the *calling model* applies to the attached screenshot. The server does not score these itself.

### Visual Hierarchy
- Primary CTA prominence
- Heading size progression
- Information importance alignment
- Visual weight distribution
- Competing elements
- Unclear focal points

### Spacing
- Grid system adherence (e.g., 8px base)
- Consistent margins/padding
- Vertical rhythm
- Inconsistent spacing
- Cramped layouts

### Typography
- Clear hierarchy
- Readable font sizes (min 16px body)
- Appropriate line-height (1.5-1.6)
- Good font pairing
- Too many fonts (>2 families)
- Poor contrast

### Color
- Cohesive palette
- Brand consistency
- WCAG contrast ratios
- Color-only information
- Clashing combinations

### Accessibility (WCAG)
- 4.5:1 text contrast (WCAG AA, 1.4.3)
- 44x44px touch targets on mobile (2.5.5/2.5.8)
- Visible focus indicators (2.4.7)
- Form labels present
- Missing alt text (flagged as not verifiable from a screenshot alone — needs code/markup review)

### Usability (Nielsen's Heuristics)
- Visibility of system status
- Feedback on actions
- Affordance and signifiers
- Consistency and standards
- Error prevention
- Recognition vs. recall
- Flexibility and efficiency
- Aesthetic and minimalist design

### Consistency
- Uniform button styles
- Standardized spacing
- Consistent iconography
- Pattern variations
- Mixed styling

---

## 📊 Output Formats

### Wireframe Formats

**HTML (Interactive)**
- Full HTML page with CSS
- Responsive layout
- Annotated improvements
- Ready to open in browser

**ASCII (Terminal)**
- Text-based wireframe
- Shows layout structure
- Spacing annotations
- Perfect for documentation

**Mermaid (Diagram)**
- Flow-based wireframe
- Component hierarchy
- Relationship visualization
- GitHub/GitLab compatible

---

## 🎓 Best Practices

### 1. Start with Accessibility
Always check accessibility first - it's non-negotiable:
```
"Accessibility audit first, then design review"
```

### 2. Provide Context
Better results with context:
```
"Review this SaaS dashboard for enterprise users.
Target: professionals aged 30-50.
Brand: modern, trustworthy, efficient."
```

### 3. Specify Design Type
Help the tool understand the medium:
```
"Mobile app design, iOS guidelines"
"Desktop web application, 1920x1080"
"Responsive website, mobile-first"
```

### 4. Focus Your Review
For quick checks, specify areas:
```
"Only check: typography and spacing"
"Focus on accessibility and usability"
```

### 5. Compare Iterations
Track improvements:
```
"Compare v1.png and v2.png
Check if accessibility issues were fixed"
```

---

## 🤖 Agent Configuration

Create `uiux-reviewer-agent.json`:

```json
{
  "name": "uiux-reviewer",
  "description": "Expert UI/UX designer providing design critiques",
  "instructions": "You are a senior UI/UX designer and accessibility expert.

**Review Process:**
1. **analyze_design** - get the screenshot + full-design rubric
2. **check_accessibility** - get the screenshot + WCAG rubric (critical priority)
3. **review_typography** - get the screenshot + type rubric
4. **validate_spacing** - get the screenshot + grid-consistency rubric
5. **check_usability** - get the screenshot + heuristics rubric
6. **suggest_improvements** - get the screenshot + prioritized inspection checklist

Each tool call returns the screenshot plus a rubric — YOU (this model) perform the
actual evaluation against the attached image. The server never computes a score.

**Standards:**
- Accessibility is non-negotiable (WCAG AA minimum)
- Visual hierarchy must be clear
- Typography readable (min 16px, line-height 1.5+)
- Spacing follows grid (8px base)
- Touch targets min 44x44px

**Always:**
- Base every observation on what you actually see in the attached screenshot
- Include exact values you observe (colors, sizes, ratios) — never invented ones
- Prioritize: critical > high > medium
- Generate wireframes showing improvements",
  "mcp_servers": ["uiux-review"],
  "temperature": 0.4
}
```

---

## 🔧 Technical Details

### Supported Image Formats
- PNG (.png)
- JPEG (.jpg, .jpeg)
- WebP (.webp)
- GIF (.gif)

Unknown extensions default to `image/png` as the MCP content-block mimeType.

### What This Server Does
- Reads the screenshot bytes from disk (path-sanitized against traversal) and returns them as a real MCP image content block
- Returns a structured rubric (real WCAG criteria, Nielsen's heuristics, typography/spacing/color checklists) for the calling model to apply
- Generates wireframes (HTML/ASCII/Mermaid) directly from a text description

### What This Server Does NOT Do
- It does not run computer vision, OCR, or color extraction on the image
- It does not compute a numeric score, grade, or pass/fail verdict
- It does not pick an A/B winner — `compare_designs` never uses randomness or a coin flip; the calling model makes the call based on what it sees

### WCAG Coverage
- **Level A:** Basic accessibility
- **Level AA:** Industry standard (recommended)
- **Level AAA:** Enhanced accessibility

---

## 🎨 Example Wireframes

### Mobile Wireframe (ASCII)
```
┌─────────────────────┐
│  [LOGO]      [☰]   │
├─────────────────────┤
│   Hero Image        │
│   ▓▓▓▓▓▓▓▓▓▓▓▓▓     │
│                     │
│  Main Headline      │
│                     │
│  [Primary Button]   │ ← 48px height
│                     │
├─────────────────────┤
│ ┌─────────────────┐ │
│ │  Card Image     │ │ ← 16px padding
│ │  Title          │ │
│ │  Description    │ │
│ └─────────────────┘ │
└─────────────────────┘
```

### Desktop Wireframe (HTML)
Interactive HTML wireframe with:
- Proper grid layout
- Annotated spacing
- Responsive breakpoints
- Accessibility notes

---

## 💡 Pro Tips

### Get Better Results

**✅ Do:**
- Upload high-resolution screenshots
- Provide multiple views (mobile + desktop)
- Include brand guidelines
- Specify target audience
- Ask for wireframes

**❌ Don't:**
- Upload blurry images
- Mix different projects
- Skip context
- Ignore critical issues

### Quick Workflows

**Daily Design Review:**
```
"Quick check on today's designs:
1. analyze_design
2. check_accessibility
3. suggest_improvements (critical only)"
```

**Pre-Meeting Prep:**
```
"Prepare for design review meeting:
- Full analysis with wireframes
- A/B comparison if multiple versions
- Prioritized action items
- Estimated fix time"
```

**Handoff to Developers:**
```
"Developer handoff checklist:
- Spacing grid validation
- Typography specifications
- Color palette with hex codes
- Accessibility requirements
- Component annotations"
```

---

## 🤝 Integration Examples

### Figma Plugin Workflow
```bash
# 1. Export design from Figma
# 2. Run review
claude-code --agent uiux-reviewer \
  --prompt "Review exported-design.png"

# 3. Apply suggested changes in Figma
# 4. Re-export and verify
```

### CI/CD Design Checks
```yaml
- name: Design Review
  run: |
    claude-code --agent uiux-reviewer \
      --prompt "Check design-system-compliance.png" \
      --fail-on-critical
```

---

## 📚 Resources

**WCAG Guidelines:**
- https://www.w3.org/WAI/WCAG21/quickref/

**Nielsen's Heuristics:**
- https://www.nngroup.com/articles/ten-usability-heuristics/

**Design Systems:**
- Material Design
- Apple Human Interface Guidelines
- Fluent Design System

---

Happy designing! 🎨

---


---

## Credits

**Author:** [Michel Abboud](https://github.com/michelabboud)
**AI Assistance:** Created with the help of Claude Code (Anthropic)
**License:** Apache-2.0

💡 **Want more?** Explore [claude-code-helper](https://github.com/michelabboud/claude-code-helper) for 30+ agents, 13+ skills, 11 MCP servers, and comprehensive guides.
