---
skill_name: Visual Regression Testing
description: Visual regression testing to catch unintended visual changes in web applications
category: Testing
priority: P1
agent: qa-testing-expert
version: 1.0.0
argument-hint: 'hello | hello ID'
author: Michel Abboud
license: Apache-2.0
repository: https://github.com/michelabboud/claude-code-helper
issues: https://github.com/michelabboud/claude-code-helper/issues
---

# Visual Regression Testing Skill

Comprehensive guide to visual regression testing, covering tools, patterns, and best practices for catching unintended visual changes in web applications.

## Overview

Visual regression testing automatically detects visual differences between expected (baseline) and actual UI renderings, catching CSS bugs, layout issues, and unintended visual changes that functional tests might miss.


## 📦 Installation

Copy this skill to your Claude Code skills directory:

```bash
# Global installation (available to all projects)
mkdir -p ~/.claude/skills/visual-regression-testing
cp visual-regression-testing.md ~/.claude/skills/visual-regression-testing/SKILL.md

# Or project-specific installation
mkdir -p .claude/skills/visual-regression-testing
cp visual-regression-testing.md .claude/skills/visual-regression-testing/SKILL.md
```

The skill will be automatically detected and hot-reloaded by Claude Code.

**Usage**: Once installed, Claude Code will use this skill automatically when relevant to your requests.

## Core Concepts

### What Visual Regression Testing Detects

```
✅ Detects:
- CSS changes affecting layout
- Font rendering differences
- Color/styling changes
- Responsive design breakage
- Cross-browser rendering issues
- Image loading problems
- Animation/transition changes

❌ Does NOT detect:
- Functional bugs
- JavaScript logic errors
- API integration issues
- Performance problems
```

### Visual Testing Workflow

```
1. Capture Baseline Screenshots
   ↓
2. Run Tests (Capture New Screenshots)
   ↓
3. Compare Screenshots (Pixel-by-Pixel)
   ↓
4. Generate Diff Report
   ↓
5. Review & Approve/Reject Changes
   ↓
6. Update Baselines (if approved)
```

---

## 1. Percy (Visual Testing Platform)

### Setup

```bash
# Install Percy CLI
npm install --save-dev @percy/cli @percy/playwright

# Or for Cypress
npm install --save-dev @percy/cli @percy/cypress
```

### Configuration

```javascript
// percy.config.js
module.exports = {
  version: 2,

  // Snapshot configuration
  snapshot: {
    widths: [375, 768, 1280, 1920],
    minHeight: 1024,
    percyCSS: `
      /* Hide dynamic content */
      .timestamp { visibility: hidden; }
      .random-banner { display: none; }
    `
  },

  // Discovery configuration
  discovery: {
    allowedHostnames: ['localhost', 'myapp.test'],
    networkIdleTimeout: 750
  }
}
```

### Playwright + Percy

```typescript
// tests/visual/homepage.spec.ts
import { test } from '@playwright/test'
import percySnapshot from '@percy/playwright'

test.describe('Homepage Visual Tests', () => {
  test('homepage renders correctly', async ({ page }) => {
    await page.goto('http://localhost:3000')

    // Wait for content to load
    await page.waitForSelector('.hero-section')

    // Take Percy snapshot
    await percySnapshot(page, 'Homepage')
  })

  test('homepage with dark mode', async ({ page }) => {
    await page.goto('http://localhost:3000')

    // Enable dark mode
    await page.click('[data-testid="theme-toggle"]')
    await page.waitForTimeout(300) // Wait for transition

    await percySnapshot(page, 'Homepage - Dark Mode')
  })

  test('responsive homepage', async ({ page }) => {
    await page.goto('http://localhost:3000')

    // Test multiple viewports
    await page.setViewportSize({ width: 375, height: 667 })
    await percySnapshot(page, 'Homepage - Mobile')

    await page.setViewportSize({ width: 768, height: 1024 })
    await percySnapshot(page, 'Homepage - Tablet')

    await page.setViewportSize({ width: 1920, height: 1080 })
    await percySnapshot(page, 'Homepage - Desktop')
  })
})
```

### Cypress + Percy

```javascript
// cypress/e2e/visual/dashboard.cy.js
describe('Dashboard Visual Tests', () => {
  beforeEach(() => {
    cy.login()
    cy.visit('/dashboard')
  })

  it('displays dashboard correctly', () => {
    cy.get('.dashboard-content').should('be.visible')

    // Take Percy snapshot
    cy.percySnapshot('Dashboard')
  })

  it('displays dashboard with filters', () => {
    cy.get('[data-testid="date-filter"]').select('Last 30 days')
    cy.get('[data-testid="apply-filters"]').click()

    // Wait for data to load
    cy.get('.loading-spinner').should('not.exist')

    cy.percySnapshot('Dashboard - Filtered View')
  })

  it('displays empty state', () => {
    cy.intercept('GET', '/api/dashboard/data', { data: [] })
    cy.visit('/dashboard')

    cy.get('.empty-state').should('be.visible')
    cy.percySnapshot('Dashboard - Empty State')
  })
})
```

### Running Percy Tests

```bash
# Set Percy token
export PERCY_TOKEN=your_percy_token

# Run tests with Percy
npx percy exec -- playwright test

# Or with Cypress
npx percy exec -- cypress run
```

---

## 2. Chromatic (Storybook Visual Testing)

### Storybook Setup

```bash
npm install --save-dev chromatic storybook
```

### Story Examples

```typescript
// src/components/Button/Button.stories.tsx
import type { Meta, StoryObj } from '@storybook/react'
import { Button } from './Button'

const meta: Meta<typeof Button> = {
  title: 'Components/Button',
  component: Button,
  parameters: {
    // Chromatic parameters
    chromatic: {
      viewports: [320, 768, 1200],
      delay: 300, // Wait for animations
      pauseAnimationAtEnd: true
    }
  }
}

export default meta
type Story = StoryObj<typeof Button>

// Visual test cases
export const Primary: Story = {
  args: {
    variant: 'primary',
    children: 'Primary Button'
  }
}

export const Secondary: Story = {
  args: {
    variant: 'secondary',
    children: 'Secondary Button'
  }
}

export const Disabled: Story = {
  args: {
    disabled: true,
    children: 'Disabled Button'
  }
}

export const Loading: Story = {
  args: {
    loading: true,
    children: 'Loading Button'
  }
}

// Test different states
export const AllStates: Story = {
  render: () => (
    <div style={{ display: 'flex', gap: '1rem', flexDirection: 'column' }}>
      <Button variant="primary">Primary</Button>
      <Button variant="secondary">Secondary</Button>
      <Button variant="danger">Danger</Button>
      <Button disabled>Disabled</Button>
      <Button loading>Loading</Button>
    </div>
  )
}

// Test responsive behavior
export const Responsive: Story = {
  args: {
    children: 'Responsive Button'
  },
  parameters: {
    viewport: {
      viewports: {
        mobile: { name: 'Mobile', styles: { width: '375px', height: '667px' } },
        tablet: { name: 'Tablet', styles: { width: '768px', height: '1024px' } },
        desktop: { name: 'Desktop', styles: { width: '1920px', height: '1080px' } }
      }
    },
    chromatic: {
      viewports: [375, 768, 1920]
    }
  }
}
```

### Complex Component Testing

```typescript
// src/components/Dashboard/Dashboard.stories.tsx
import { Dashboard } from './Dashboard'
import { mockDashboardData } from './mocks'

export default {
  title: 'Pages/Dashboard',
  component: Dashboard,
  parameters: {
    layout: 'fullscreen',
    chromatic: {
      viewports: [1280, 1920],
      delay: 500
    }
  }
}

export const Default = {
  args: {
    data: mockDashboardData
  }
}

export const WithFilters = {
  args: {
    data: mockDashboardData,
    activeFilters: ['last-30-days', 'revenue']
  }
}

export const Loading = {
  args: {
    isLoading: true
  }
}

export const Error = {
  args: {
    error: 'Failed to load dashboard data'
  }
}

export const EmptyState = {
  args: {
    data: { metrics: [], charts: [] }
  }
}

// Test dark mode
export const DarkMode = {
  args: {
    data: mockDashboardData
  },
  parameters: {
    backgrounds: { default: 'dark' }
  },
  decorators: [
    (Story) => (
      <div className="dark">
        <Story />
      </div>
    )
  ]
}
```

### Running Chromatic

```bash
# Run Chromatic
npx chromatic --project-token=your_project_token

# Auto-accept changes
npx chromatic --auto-accept-changes

# Only run on specific stories
npx chromatic --only-story-names="Button/**"
```

---

## 3. BackstopJS (Self-Hosted Solution)

### Setup

```bash
npm install --save-dev backstopjs
npx backstop init
```

### Configuration

```json
// backstop.json
{
  "id": "my_app_visual_tests",
  "viewports": [
    {
      "label": "phone",
      "width": 375,
      "height": 667
    },
    {
      "label": "tablet",
      "width": 768,
      "height": 1024
    },
    {
      "label": "desktop",
      "width": 1920,
      "height": 1080
    }
  ],
  "scenarios": [
    {
      "label": "Homepage",
      "url": "http://localhost:3000",
      "delay": 500,
      "selectors": ["document"],
      "misMatchThreshold": 0.1,
      "requireSameDimensions": true
    },
    {
      "label": "Dashboard",
      "url": "http://localhost:3000/dashboard",
      "delay": 1000,
      "cookiePath": "backstop_data/cookies.json",
      "selectors": [".dashboard-content"],
      "hideSelectors": [".timestamp", ".live-badge"],
      "removeSelectors": ["#cookie-banner"]
    },
    {
      "label": "Product Page - Hover State",
      "url": "http://localhost:3000/products/123",
      "delay": 500,
      "hoverSelector": ".add-to-cart-button",
      "postInteractionWait": 300,
      "selectors": [".product-card"]
    },
    {
      "label": "Modal Open",
      "url": "http://localhost:3000",
      "clickSelector": "[data-testid='open-modal']",
      "postInteractionWait": 500,
      "selectors": [".modal-overlay"]
    }
  ],
  "paths": {
    "bitmaps_reference": "backstop_data/bitmaps_reference",
    "bitmaps_test": "backstop_data/bitmaps_test",
    "html_report": "backstop_data/html_report",
    "ci_report": "backstop_data/ci_report"
  },
  "report": ["browser", "CI"],
  "engine": "puppeteer",
  "engineOptions": {
    "args": ["--no-sandbox"]
  },
  "asyncCaptureLimit": 5,
  "asyncCompareLimit": 50
}
```

### Advanced Scenarios

```json
{
  "scenarios": [
    {
      "label": "Form Validation States",
      "url": "http://localhost:3000/signup",
      "onBeforeScript": "puppet/onBefore.js",
      "onReadyScript": "puppet/fillForm.js",
      "selectors": ["form"],
      "delay": 500
    },
    {
      "label": "Responsive Navigation",
      "url": "http://localhost:3000",
      "viewports": [
        { "label": "mobile", "width": 375, "height": 667 }
      ],
      "clickSelector": ".hamburger-menu",
      "postInteractionWait": 300,
      "selectors": [".navigation"]
    }
  ]
}
```

### Custom Scripts

```javascript
// backstop_data/engine_scripts/puppet/fillForm.js
module.exports = async (page, scenario, viewport) => {
  console.log('Filling form...')

  // Fill form fields
  await page.type('#email', 'test@example.com')
  await page.type('#password', 'password123')

  // Trigger validation
  await page.click('#submit')
  await page.waitForSelector('.error-message', { timeout: 2000 })

  console.log('Form filled and validated')
}
```

### Running BackstopJS

```bash
# Create reference screenshots
npx backstop reference

# Run tests
npx backstop test

# Approve changes
npx backstop approve

# Open report
npx backstop openReport
```

---

## 4. Playwright Visual Comparisons

### Built-in Screenshot Testing

```typescript
// tests/visual/components.spec.ts
import { test, expect } from '@playwright/test'

test.describe('Component Visual Tests', () => {
  test('button component matches snapshot', async ({ page }) => {
    await page.goto('http://localhost:3000/components/button')

    const button = page.locator('[data-testid="primary-button"]')

    // Take screenshot and compare
    await expect(button).toHaveScreenshot('primary-button.png', {
      threshold: 0.2, // 20% difference threshold
      maxDiffPixels: 100
    })
  })

  test('full page snapshot', async ({ page }) => {
    await page.goto('http://localhost:3000')

    // Full page screenshot
    await expect(page).toHaveScreenshot('homepage-full.png', {
      fullPage: true,
      animations: 'disabled'
    })
  })

  test('component with interactions', async ({ page }) => {
    await page.goto('http://localhost:3000/components/dropdown')

    const dropdown = page.locator('[data-testid="dropdown"]')

    // Closed state
    await expect(dropdown).toHaveScreenshot('dropdown-closed.png')

    // Open state
    await dropdown.click()
    await page.waitForTimeout(300) // Wait for animation
    await expect(dropdown).toHaveScreenshot('dropdown-open.png')
  })

  test('responsive component', async ({ page }) => {
    await page.goto('http://localhost:3000/components/card')

    const card = page.locator('[data-testid="card"]')

    // Desktop
    await page.setViewportSize({ width: 1920, height: 1080 })
    await expect(card).toHaveScreenshot('card-desktop.png')

    // Mobile
    await page.setViewportSize({ width: 375, height: 667 })
    await expect(card).toHaveScreenshot('card-mobile.png')
  })
})
```

### Custom Screenshot Configuration

```typescript
// playwright.config.ts
import { defineConfig } from '@playwright/test'

export default defineConfig({
  use: {
    screenshot: 'only-on-failure',

    // Screenshot options
    viewport: { width: 1280, height: 720 },
  },

  expect: {
    toHaveScreenshot: {
      threshold: 0.2,
      maxDiffPixels: 100,
      animations: 'disabled',
      caret: 'hide'
    }
  },

  projects: [
    {
      name: 'chromium',
      use: { browserName: 'chromium' }
    },
    {
      name: 'webkit',
      use: { browserName: 'webkit' }
    }
  ]
})
```

---

## 5. Best Practices

### 1. Baseline Management

```bash
# Organized baseline structure
tests/
├── visual/
│   ├── baselines/
│   │   ├── chrome/
│   │   ├── firefox/
│   │   └── safari/
│   ├── diffs/
│   └── snapshots/
```

### 2. Ignore Dynamic Content

```typescript
// Hide dynamic content before snapshot
await page.evaluate(() => {
  // Hide timestamps
  document.querySelectorAll('.timestamp').forEach(el => {
    el.style.visibility = 'hidden'
  })

  // Hide random content
  document.querySelectorAll('[data-random]').forEach(el => {
    el.remove()
  })

  // Freeze animations
  document.querySelectorAll('*').forEach(el => {
    const style = window.getComputedStyle(el)
    if (style.animationName !== 'none') {
      el.style.animation = 'none'
    }
  })
})
```

### 3. Wait for Stability

```typescript
async function waitForStability(page: Page) {
  // Wait for network idle
  await page.waitForLoadState('networkidle')

  // Wait for fonts
  await page.evaluate(() => document.fonts.ready)

  // Wait for images
  await page.evaluate(() => {
    return Promise.all(
      Array.from(document.images)
        .filter(img => !img.complete)
        .map(img => new Promise(resolve => {
          img.onload = img.onerror = resolve
        }))
    )
  })

  // Wait for custom loading indicators
  await page.waitForSelector('.loading-spinner', { state: 'hidden' })
}
```

### 4. Cross-Browser Testing

```typescript
// Test across browsers
const browsers = ['chromium', 'firefox', 'webkit']

for (const browserType of browsers) {
  test.describe(`${browserType} visual tests`, () => {
    test.use({ browserName: browserType })

    test('renders consistently', async ({ page }) => {
      await page.goto('http://localhost:3000')
      await expect(page).toHaveScreenshot(`homepage-${browserType}.png`)
    })
  })
}
```

### 5. CI/CD Integration

```yaml
# .github/workflows/visual-tests.yml
name: Visual Regression Tests

on: [push, pull_request]

jobs:
  visual-tests:
    runs-on: ubuntu-latest

    steps:
      - uses: actions/checkout@v4

      - name: Setup Node.js
        uses: actions/setup-node@v4
        with:
          node-version: '20'
          cache: 'npm'

      - run: npm ci

      - name: Build application
        run: npm run build

      - name: Start server
        run: npm start &

      - name: Wait for server
        run: npx wait-on http://localhost:3000

      # Percy
      - name: Run Percy tests
        run: npx percy exec -- playwright test
        env:
          PERCY_TOKEN: ${{ secrets.PERCY_TOKEN }}

      # Or BackstopJS
      - name: Run BackstopJS
        run: |
          npx backstop test || true

      - name: Upload BackstopJS report
        if: always()
        uses: actions/upload-artifact@v3
        with:
          name: backstop-report
          path: backstop_data/html_report/
```

---

## 6. Common Patterns

### Testing Component States

```typescript
const states = ['default', 'hover', 'active', 'disabled', 'loading']

for (const state of states) {
  test(`button ${state} state`, async ({ page }) => {
    await page.goto(`http://localhost:3000/components/button?state=${state}`)

    const button = page.locator('[data-testid="button"]')

    if (state === 'hover') {
      await button.hover()
      await page.waitForTimeout(200)
    }

    await expect(button).toHaveScreenshot(`button-${state}.png`)
  })
}
```

### Testing Themes

```typescript
const themes = ['light', 'dark', 'high-contrast']

for (const theme of themes) {
  test(`dashboard with ${theme} theme`, async ({ page }) => {
    await page.goto('http://localhost:3000/dashboard')

    // Apply theme
    await page.evaluate((t) => {
      document.documentElement.setAttribute('data-theme', t)
    }, theme)

    await page.waitForTimeout(300) // Wait for theme transition

    await expect(page).toHaveScreenshot(`dashboard-${theme}.png`)
  })
}
```

---

## When to Use This Skill

Invoke the Visual Regression Testing skill when:

1. **Setting up visual testing** for a new or existing project
2. **Catching CSS regressions** in component libraries or design systems
3. **Testing responsive designs** across multiple breakpoints
4. **Verifying cross-browser compatibility** visually
5. **Testing theme switching** (light/dark mode)
6. **Documenting component variations** in Storybook
7. **CI/CD integration** for automated visual checks
8. **Reviewing UI changes** in pull requests

---

## Related Resources

- **E2E Testing Guide**: `skills/advanced-e2e-testing.md`
- **Testing Strategy**: `guides/advanced-patterns/testing-strategy.md`
- **Component Testing**: `skills/component-testing.md`

**Last Updated**: 2026-01-10
**Status**: Production Ready ✅

## Changelog

### 1.0.0 (2026-02-20)
- Initial versioned release

## Handshake Protocol

If invoked with argument `hello`:
> 👋 Hello! I'm **Visual Regression Testing** v1.0.0. Visual regression testing with Percy, Chromatic, and screenshot comparison tools. Use `/visual-regression-testing hello ID` for the full guide.

If invoked with argument `hello ID`, respond with full skill information:
- **Name**: Visual Regression Testing v1.0.0
- **What it covers**: Visual regression testing to catch unintended visual changes in web applications, covering tools like Percy, Chromatic, and Playwright screenshot comparison, baseline management, and CI integration
- **How to invoke**: `/visual-regression-testing` (Claude Code will load this skill as context)
- **Author**: Michel Abboud — https://github.com/michelabboud/claude-code-helper
- **License**: Apache-2.0

---

**Author**: [Michel Abboud](https://github.com/michelabboud)
**License**: Apache-2.0
**Repository**: [claude-code-helper](https://github.com/michelabboud/claude-code-helper)
**Issues & Discussions**: [GitHub Issues](https://github.com/michelabboud/claude-code-helper/issues)
