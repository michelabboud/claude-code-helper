# Design System MCP Server

Comprehensive design system validation, component compliance checking, accessibility auditing, and design token management for UI consistency.

---

## 🎯 Features

### 5 Specialized Tools

| Tool | Purpose | Key Features |
|------|---------|--------------|
| **validate_tokens** | Design token validation | Naming conventions, color contrast, spacing scales, typography |
| **check_component** | Component compliance | Token usage, accessibility, responsive design, API consistency |
| **validate_color_palette** | Color accessibility | WCAG AA/AAA contrast compliance checking |
| **analyze_spacing** | Spacing consistency | Spacing scale compliance, non-standard value detection |
| **generate_report** | Comprehensive reports | Markdown, HTML, JSON with fix recommendations |

---

## 📦 Installation

```bash
cd design-system-mcp
npm install
npm run build
```

**Verify:**
```bash
npm run inspector
```

---

## ⚙️ Configuration

### Claude Desktop

Add to `claude_desktop_config.json`:

```json
{
  "mcpServers": {
    "design-system": {
      "command": "node",
      "args": ["/absolute/path/to/design-system-mcp/build/index.js"]
    }
  }
}
```

### Claude Code

Add to `.claude-code/config.json`:

```json
{
  "mcp_servers": [
    {
      "name": "design-system",
      "command": "node",
      "args": ["/absolute/path/to/design-system-mcp/build/index.js"]
    }
  ]
}
```

---

## 🚀 Usage Examples

### 1. Validate Design Tokens

```javascript
{
  "tool": "validate_tokens",
  "args": {
    "tokensFile": "./design-tokens.json",
    "rules": ["naming_convention", "color_contrast", "spacing_scale", "typography_scale"]
  }
}
```

**Validation Rules:**
- **naming_convention** - Ensures kebab-case naming (e.g., `primary-blue`, `spacing-md`)
- **color_contrast** - Validates text/background color combinations
- **spacing_scale** - Checks spacing values follow consistent scale
- **typography_scale** - Validates font sizes follow modular scale

**Token File Format (JSON):**
```json
{
  "colors": {
    "primary-blue": "#0066CC",
    "text-primary": "#1A1A1A",
    "bg-light": "#FFFFFF"
  },
  "spacing": {
    "xs": "4px",
    "sm": "8px",
    "md": "16px",
    "lg": "24px",
    "xl": "32px"
  },
  "typography": {
    "body": "16px",
    "heading-1": "32px",
    "heading-2": "24px"
  }
}
```

**Output:**
```json
{
  "valid": true,
  "errors": [],
  "warnings": [
    {
      "rule": "naming_convention",
      "message": "Token 'primaryBlue' should use kebab-case: 'primary-blue'",
      "severity": "warning"
    }
  ],
  "stats": {
    "totalTokens": 42,
    "validNames": 40,
    "colorContrastIssues": 0,
    "spacingScaleCompliant": true
  }
}
```

---

### 2. Check Component Compliance

```javascript
{
  "tool": "check_component",
  "args": {
    "componentPath": "./src/Button.tsx",
    "designSystemPath": "./design-tokens.json",
    "checks": ["token_usage", "accessibility", "responsive_design"]
  }
}
```

**Compliance Checks:**
- **token_usage** - Verifies component uses design tokens instead of hardcoded values
- **accessibility** - ARIA attributes, keyboard navigation, focus management
- **responsive_design** - Media queries, flexible units, breakpoint consistency

**Output:**
```json
{
  "component": "Button.tsx",
  "compliant": false,
  "checks": {
    "token_usage": {
      "passed": false,
      "issues": [
        {
          "line": 24,
          "message": "Hardcoded color '#0066CC' should use design token 'primary-blue'",
          "recommendation": "Replace with: color: var(--primary-blue)"
        }
      ]
    },
    "accessibility": {
      "passed": true,
      "score": 95,
      "notes": ["ARIA labels present", "Keyboard navigation supported"]
    },
    "responsive_design": {
      "passed": true,
      "breakpoints": ["mobile", "tablet", "desktop"]
    }
  },
  "summary": {
    "totalChecks": 3,
    "passed": 2,
    "failed": 1,
    "overallScore": 75
  }
}
```

---

### 3. Validate Color Palette

```javascript
{
  "tool": "validate_color_palette",
  "args": {
    "colorsFile": "./colors.json",
    "wcagLevel": "AA"
  }
}
```

**WCAG Levels:**
- **AA** - Standard compliance (4.5:1 for normal text, 3:1 for large text)
- **AAA** - Enhanced compliance (7:1 for normal text, 4.5:1 for large text)

**Colors File Format:**
```json
{
  "text": {
    "primary": "#1A1A1A",
    "secondary": "#666666",
    "disabled": "#CCCCCC"
  },
  "background": {
    "white": "#FFFFFF",
    "gray": "#F5F5F5",
    "dark": "#1A1A1A"
  }
}
```

**Output:**
```json
{
  "wcagLevel": "AA",
  "compliant": false,
  "issues": [
    {
      "combination": "text-secondary on bg-gray",
      "contrast": 3.2,
      "required": 4.5,
      "severity": "error",
      "recommendation": "Darken text-secondary to #555555 for 4.5:1 contrast"
    }
  ],
  "summary": {
    "totalCombinations": 24,
    "passing": 21,
    "failing": 3,
    "complianceRate": "87.5%"
  }
}
```

---

### 4. Analyze Spacing Consistency

```javascript
{
  "tool": "analyze_spacing",
  "args": {
    "directory": "./src/components",
    "baseUnit": 8
  }
}
```

**Base Unit:** Design systems typically use 4px or 8px base units

**Analysis:** Scans CSS/SCSS files for spacing values (margin, padding, gap)

**Output:**
```json
{
  "baseUnit": 8,
  "spacingScale": [0, 4, 8, 16, 24, 32, 40, 48, 64],
  "analysis": {
    "totalSpacingValues": 156,
    "compliant": 142,
    "nonCompliant": 14,
    "complianceRate": "91%"
  },
  "issues": [
    {
      "file": "src/components/Header.css",
      "line": 23,
      "property": "margin-top",
      "value": "15px",
      "recommendation": "Use 16px (closest scale value) instead of 15px",
      "severity": "warning"
    },
    {
      "file": "src/components/Card.css",
      "line": 45,
      "property": "padding",
      "value": "12px",
      "recommendation": "Use 8px or 16px from spacing scale",
      "severity": "warning"
    }
  ],
  "recommendations": {
    "mostCommonNonCompliant": ["12px (5 occurrences)", "15px (3 occurrences)"],
    "suggestedFixes": [
      "Replace 12px with 8px or 16px",
      "Replace 15px with 16px"
    ]
  }
}
```

---

### 5. Generate Design System Report

```javascript
{
  "tool": "generate_report",
  "args": {
    "resultsPath": "./validation-results.json",
    "format": "html",
    "includeRecommendations": true
  }
}
```

**Formats:**
- **markdown** - GitHub-friendly documentation
- **html** - Interactive visual report
- **json** - Machine-readable data

**Output:** (Markdown example)
```markdown
# Design System Validation Report

## Overall Score: 82/100

### Summary
- **Design Tokens:** ✅ Valid (42 tokens, 2 warnings)
- **Component Compliance:** ⚠️ 3/5 components passing
- **Color Accessibility:** ✅ WCAG AA compliant
- **Spacing Consistency:** ⚠️ 91% compliant (14 non-standard values)

### Issues Found

#### High Priority
1. **Button.tsx** - Hardcoded colors instead of design tokens
   - Line 24: `color: #0066CC` → Use `var(--primary-blue)`
   - Line 31: `background: #FFFFFF` → Use `var(--bg-white)`

#### Medium Priority
2. **Header.css** - Non-standard spacing values
   - Line 23: `margin-top: 15px` → Use `16px`
   - Line 45: `padding: 12px` → Use `8px` or `16px`

### Recommendations
1. Create design token variables in CSS/SCSS
2. Replace all hardcoded colors with token references
3. Standardize spacing to 8px scale: 0, 8, 16, 24, 32, 40, 48, 64
4. Add automated validation to CI/CD pipeline
```

---

## 🔧 Design Token Setup

### Example Design Tokens File

```json
{
  "colors": {
    "primary": "#0066CC",
    "secondary": "#FF6B35",
    "text-primary": "#1A1A1A",
    "text-secondary": "#666666",
    "bg-white": "#FFFFFF",
    "bg-gray": "#F5F5F5"
  },
  "spacing": {
    "none": "0",
    "xs": "4px",
    "sm": "8px",
    "md": "16px",
    "lg": "24px",
    "xl": "32px",
    "2xl": "40px",
    "3xl": "48px"
  },
  "typography": {
    "body-sm": "14px",
    "body": "16px",
    "body-lg": "18px",
    "heading-1": "32px",
    "heading-2": "24px",
    "heading-3": "20px"
  },
  "borderRadius": {
    "sm": "4px",
    "md": "8px",
    "lg": "12px",
    "full": "9999px"
  }
}
```

### CSS Variable Generation

```css
:root {
  /* Colors */
  --primary: #0066CC;
  --secondary: #FF6B35;
  --text-primary: #1A1A1A;

  /* Spacing */
  --spacing-xs: 4px;
  --spacing-sm: 8px;
  --spacing-md: 16px;

  /* Typography */
  --body: 16px;
  --heading-1: 32px;
}
```

---

## 💡 Best Practices

### 1. Validate Tokens First

Ensure design tokens are properly structured:
```
"Validate design tokens at ./tokens.json for all rules"
```

### 2. Check Component Compliance

Regular compliance checks maintain consistency:
```
"Check Button component compliance including token usage and accessibility"
```

### 3. Audit Color Accessibility

Ensure WCAG compliance for all color combinations:
```
"Validate color palette for WCAG AAA compliance"
```

### 4. Monitor Spacing Consistency

Track spacing scale adherence:
```
"Analyze spacing in src/components using 8px base unit"
```

---

## 🎯 Common Workflows

### Design System Audit

```
"Complete design system audit:
1. Validate all design tokens
2. Check color palette for WCAG AA compliance
3. Analyze spacing consistency in components
4. Generate comprehensive HTML report
Provide prioritized fix list"
```

### Component Review

```
"Review new Card component:
1. Check design token usage
2. Validate accessibility (ARIA, keyboard navigation)
3. Verify responsive design
4. Analyze component API consistency
Report compliance score and issues"
```

### CI/CD Quality Gate

```
"Design system quality gate:
1. Validate design tokens (fail on errors)
2. Check all components for token usage
3. Verify WCAG AA compliance
4. Generate JSON report for CI
Fail build if compliance < 90%"
```

---

## 🚨 Limitations

- CSS/SCSS parsing may not catch all edge cases
- Component analysis works best with React/Vue (JSX/template) files
- Color contrast calculation uses sRGB color space
- Accessibility checks are heuristic-based (not a replacement for manual testing)
- Requires design tokens in JSON format

---

## 🤝 Integration with Other MCPs

Works great with:
- **Code Review MCP:** Component code quality analysis
- **Testing MCP:** Component testing and coverage
- **API Specialist MCP:** Design system API documentation

---

## 📊 Example Agent Configuration

See `../../agents/mcp-integrated/design-system-guardian.json` for a pre-configured agent that uses this MCP server for comprehensive design system enforcement.

---

Happy designing! 🎨

---


---

## Credits

**Author:** [Michel Abboud](https://github.com/michelabboud)
**AI Assistance:** Created with the help of Claude Code (Anthropic)
**License:** Apache-2.0

💡 **Want more?** Explore [claude-code-helper](https://github.com/michelabboud/claude-code-helper) for 30+ agents, 13+ skills, 11 MCP servers, and comprehensive guides.
