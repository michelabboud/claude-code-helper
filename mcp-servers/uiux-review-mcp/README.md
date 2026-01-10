# UI/UX Review MCP Server

Expert UI/UX design review from screenshots with accessibility audits, typography analysis, and wireframe generation.

---

## 🎨 Features

### 9 Specialized Tools

| Tool | Purpose |
|------|---------|
| **analyze_design** | Comprehensive design review with scored findings |
| **check_accessibility** | WCAG conformance audit with specific fixes |
| **review_typography** | Typography hierarchy and readability analysis |
| **validate_spacing** | Grid system and spacing consistency check |
| **check_color_scheme** | Color palette analysis and contrast validation |
| **suggest_improvements** | Prioritized recommendations with impact/effort |
| **generate_wireframe** | Create improved wireframes (HTML/ASCII/Mermaid) |
| **compare_designs** | A/B test comparison with data-driven recommendation |
| **check_usability** | Nielsen's heuristics evaluation |

---

## 📸 How It Works

**Input:** Design screenshots (PNG, JPG, WebP)

**Output:** 
- Scored analysis (0-10 scale with letter grade)
- Specific issues with line-by-line feedback
- Actionable recommendations (priority + effort)
- Optional wireframe showing improvements

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

**What you get:**
```json
{
  "overallScore": 7,
  "grade": "C (Satisfactory)",
  "findings": [
    {
      "category": "accessibility",
      "score": 6,
      "issues": [
        "Low contrast on secondary text (3.2:1, needs 4.5:1)",
        "Focus indicators not visible",
        "Form inputs missing visible labels"
      ]
    }
  ],
  "recommendations": [
    {
      "priority": "critical",
      "issue": "Contrast ratio below WCAG AA",
      "suggestion": "Change color from #999 to #595959",
      "impact": "Improves readability for visually impaired users"
    }
  ],
  "wireframe": {
    "improvements": [
      "Larger primary CTA (48px height)",
      "Increased contrast on secondary text",
      "Visible focus indicators",
      "More generous spacing"
    ]
  }
}
```

---

### Example 2: Accessibility Audit

```
"Check WCAG AA accessibility on this design:
- Color contrast
- Text sizes
- Touch targets
- Focus indicators"
```

**Output:**
```json
{
  "wcagLevel": "AA",
  "conformance": "partial",
  "conformancePercentage": 65,
  "criticalIssues": [
    {
      "wcagCriterion": "1.4.3 Contrast (Minimum)",
      "findings": [
        {
          "element": "Secondary text",
          "contrast": "3.2:1",
          "required": "4.5:1",
          "suggestion": "Change from #999999 to #595959"
        }
      ]
    }
  ]
}
```

---

### Example 3: Typography Review

```
"Review typography in this design focusing on:
- Hierarchy
- Readability
- Font pairing
- Line height"
```

**Feedback:**
```json
{
  "overallScore": 8,
  "findings": [
    {
      "aspect": "hierarchy",
      "score": 9,
      "observations": [
        "Clear distinction between heading levels",
        "Good progression: H1: 36px, H2: 28px, H3: 20px"
      ]
    },
    {
      "aspect": "line_height",
      "score": 6,
      "issues": [
        "Body text too tight (1.4, should be 1.5-1.6)"
      ]
    }
  ],
  "recommendations": [
    {
      "priority": "high",
      "suggestion": "Increase body line-height to 1.6",
      "impact": "Significantly improves readability"
    }
  ]
}
```

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

## 🎯 What Gets Checked

### Visual Hierarchy (Score 0-10)
- ✅ Primary CTA prominence
- ✅ Heading size progression
- ✅ Information importance alignment
- ✅ Visual weight distribution
- ❌ Competing elements
- ❌ Unclear focal points

### Spacing (Score 0-10)
- ✅ Grid system adherence (e.g., 8px base)
- ✅ Consistent margins/padding
- ✅ Vertical rhythm
- ❌ Inconsistent spacing
- ❌ Cramped layouts

### Typography (Score 0-10)
- ✅ Clear hierarchy
- ✅ Readable font sizes (min 16px body)
- ✅ Appropriate line-height (1.5-1.6)
- ✅ Good font pairing
- ❌ Too many fonts (>2 families)
- ❌ Poor contrast

### Color (Score 0-10)
- ✅ Cohesive palette
- ✅ Brand consistency
- ✅ WCAG contrast ratios
- ❌ Color-only information
- ❌ Clashing combinations

### Accessibility (Score 0-10)
- ✅ 4.5:1 text contrast (WCAG AA)
- ✅ 44x44px touch targets (mobile)
- ✅ Visible focus indicators
- ✅ Form labels present
- ❌ Missing alt text
- ❌ Poor contrast

### Usability (Score 0-10)
- ✅ Clear CTAs
- ✅ Intuitive navigation
- ✅ Feedback on actions
- ✅ Error prevention
- ❌ Hidden functionality
- ❌ No confirmation dialogs

### Consistency (Score 0-10)
- ✅ Uniform button styles
- ✅ Standardized spacing
- ✅ Consistent iconography
- ❌ Pattern variations
- ❌ Mixed styling

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
1. **analyze_design** - comprehensive review
2. **check_accessibility** - WCAG audit (critical priority)
3. **review_typography** - type analysis
4. **validate_spacing** - grid consistency
5. **check_usability** - heuristics evaluation
6. **suggest_improvements** - prioritized recommendations

**Standards:**
- Accessibility is non-negotiable (WCAG AA minimum)
- Visual hierarchy must be clear
- Typography readable (min 16px, line-height 1.5+)
- Spacing follows grid (8px base)
- Touch targets min 44x44px

**Always:**
- Provide specific, actionable feedback
- Include exact values (colors, sizes, ratios)
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

### Analysis Capabilities
- Visual element detection
- Color extraction and analysis
- Text contrast calculation
- Spacing measurement
- Layout structure analysis
- Component identification

### WCAG Coverage
- **Level A:** Basic accessibility
- **Level AA:** Industry standard (recommended)
- **Level AAA:** Enhanced accessibility

---

## 📝 Scoring System

| Score | Grade | Meaning |
|-------|-------|---------|
| 9-10 | A | Excellent - professional quality |
| 8-9 | B | Good - minor improvements needed |
| 7-8 | C | Satisfactory - several improvements |
| 6-7 | D | Needs work - significant issues |
| 0-6 | F | Poor - major redesign needed |

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

## 🚨 Common Issues Fixed

### Critical (Fix Immediately)
- ❌ Contrast below WCAG AA (3.2:1 → 4.5:1)
- ❌ Missing focus indicators
- ❌ Touch targets too small (<44px)
- ❌ No form labels

### High Priority (This Week)
- ❌ Weak visual hierarchy
- ❌ Inconsistent spacing
- ❌ Poor typography scale
- ❌ Missing hover states

### Medium Priority (This Sprint)
- ❌ Color harmony issues
- ❌ Line-height too tight
- ❌ Icon size inconsistency
- ❌ CTA not prominent enough

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

## 👤 Credits

**Author:** [Michel Abboud](https://github.com/michelabboud)
**AI Assistance:** Created with the help of Claude Code (Anthropic)

This project is open source under the MIT License. Free to use for personal and commercial projects.
