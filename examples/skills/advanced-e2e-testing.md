# Advanced E2E Testing Scenarios

Comprehensive guide to advanced end-to-end testing patterns covering complex user journeys, multi-step workflows, authentication, API mocking, and cross-browser testing.

## Overview

Advanced E2E testing goes beyond basic "click and assert" tests to cover realistic user scenarios, error handling, edge cases, and complex interactions that span multiple pages and services.


## 📦 Installation

Copy this skill to your Claude Code skills directory:

```bash
# Global installation (available to all projects)
mkdir -p ~/.claude/skills/advanced-e2e-testing
cp advanced-e2e-testing.md ~/.claude/skills/advanced-e2e-testing/SKILL.md

# Or project-specific installation
mkdir -p .claude/skills/advanced-e2e-testing
cp advanced-e2e-testing.md .claude/skills/advanced-e2e-testing/SKILL.md
```

The skill will be automatically detected and hot-reloaded by Claude Code.

**Usage**: Once installed, Claude Code will use this skill automatically when relevant to your requests.

## Core Concepts

### E2E Testing Pyramid

```
        /\
       /UI\ ← E2E Tests (10%)
      /────\
     /  API \ ← Integration Tests (20%)
    /────────\
   /   Unit   \ ← Unit Tests (70%)
  /────────────\

E2E tests are:
- Expensive (slow, flaky)
- Valuable (test real user flows)
- Focused (critical paths only)
```

---

## 1. Authentication & Authorization Flows

### Playwright - Session Reuse Pattern

```typescript
// tests/auth.setup.ts
import { test as setup } from '@playwright/test'

const authFile = 'playwright/.auth/user.json'

setup('authenticate', async ({ page }) => {
  // Perform authentication
  await page.goto('http://localhost:3000/login')
  await page.fill('[data-testid="email"]', 'admin@example.com')
  await page.fill('[data-testid="password"]', 'Password123')
  await page.click('[data-testid="login-button"]')

  // Wait for redirect
  await page.waitForURL('**/dashboard')

  // Save authenticated state
  await page.context().storageState({ path: authFile })
})
```

```typescript
// playwright.config.ts
import { defineConfig } from '@playwright/test'

export default defineConfig({
  projects: [
    // Setup project
    {
      name: 'setup',
      testMatch: /.*\.setup\.ts/
    },

    // Authenticated tests
    {
      name: 'authenticated',
      testMatch: /.*\.spec\.ts/,
      dependencies: ['setup'],
      use: {
        storageState: 'playwright/.auth/user.json'
      }
    },

    // Guest tests (no auth)
    {
      name: 'guest',
      testMatch: /.*\.guest\.spec\.ts/
    }
  ]
})
```

```typescript
// tests/dashboard.spec.ts
import { test, expect } from '@playwright/test'

// This test uses authenticated state
test('view dashboard as authenticated user', async ({ page }) => {
  await page.goto('/dashboard')

  // Already authenticated!
  await expect(page.locator('h1')).toContainText('Dashboard')
  await expect(page.locator('[data-testid="user-menu"]')).toBeVisible()
})
```

### Multiple User Roles

```typescript
// tests/multi-role.spec.ts
import { test, expect } from '@playwright/test'

// Admin tests
test.describe('Admin Role', () => {
  test.use({ storageState: 'playwright/.auth/admin.json' })

  test('admin can access settings', async ({ page }) => {
    await page.goto('/admin/settings')
    await expect(page).toHaveURL(/\/admin\/settings/)
  })

  test('admin can manage users', async ({ page }) => {
    await page.goto('/admin/users')
    await expect(page.locator('[data-testid="delete-user"]')).toBeVisible()
  })
})

// Regular user tests
test.describe('User Role', () => {
  test.use({ storageState: 'playwright/.auth/user.json' })

  test('user cannot access admin settings', async ({ page }) => {
    await page.goto('/admin/settings')
    await expect(page).toHaveURL(/\/403|\/login/)
  })

  test('user can view profile', async ({ page }) => {
    await page.goto('/profile')
    await expect(page).toHaveURL(/\/profile/)
  })
})
```

---

## 2. Complex Multi-Step Workflows

### E-Commerce Checkout Flow

```typescript
// tests/checkout-flow.spec.ts
import { test, expect } from '@playwright/test'

test.describe('Complete Checkout Flow', () => {
  test('complete purchase from browsing to confirmation', async ({ page }) => {
    // Step 1: Browse products
    await page.goto('/products')
    await page.fill('[data-testid="search"]', 'laptop')
    await page.press('[data-testid="search"]', 'Enter')
    await page.waitForSelector('[data-testid="product-card"]')

    // Step 2: View product details
    await page.click('[data-testid="product-card"]:first-child')
    await expect(page.locator('h1')).toContainText('Laptop')

    // Step 3: Add to cart
    await page.click('[data-testid="add-to-cart"]')
    await expect(page.locator('[data-testid="cart-badge"]')).toContainText('1')

    // Step 4: View cart
    await page.click('[data-testid="cart-icon"]')
    await expect(page.locator('[data-testid="cart-item"]')).toHaveCount(1)

    // Step 5: Apply coupon
    await page.fill('[data-testid="coupon-input"]', 'SAVE10')
    await page.click('[data-testid="apply-coupon"]')
    await expect(page.locator('[data-testid="discount"]')).toContainText('10%')

    // Step 6: Proceed to checkout
    await page.click('[data-testid="checkout-button"]')
    await expect(page).toHaveURL(/\/checkout/)

    // Step 7: Fill shipping info
    await page.fill('[data-testid="name"]', 'John Doe')
    await page.fill('[data-testid="address"]', '123 Main St')
    await page.fill('[data-testid="city"]', 'New York')
    await page.fill('[data-testid="zip"]', '10001')

    // Step 8: Select shipping method
    await page.click('[data-testid="shipping-standard"]')

    // Step 9: Continue to payment
    await page.click('[data-testid="continue-to-payment"]')

    // Step 10: Fill payment details
    await page.fill('[data-testid="card-number"]', '4242424242424242')
    await page.fill('[data-testid="card-expiry"]', '12/25')
    await page.fill('[data-testid="card-cvc"]', '123')

    // Step 11: Review order
    await page.click('[data-testid="review-order"]')
    await expect(page.locator('[data-testid="order-summary"]')).toBeVisible()

    // Step 12: Place order
    await page.click('[data-testid="place-order"]')

    // Step 13: Wait for confirmation
    await page.waitForURL(/\/order-confirmation/)
    await expect(page.locator('h1')).toContainText('Order Confirmed')

    // Step 14: Verify order details
    const orderNumber = await page.locator('[data-testid="order-number"]').textContent()
    expect(orderNumber).toMatch(/^ORD-\d+$/)

    // Step 15: Verify email was sent (check test inbox)
    // This would check against a test email service
  })
})
```

### Multi-Page Form Wizard

```typescript
// tests/registration-wizard.spec.ts
test('complete multi-step registration', async ({ page }) => {
  await page.goto('/register')

  // Page 1: Personal Info
  await page.fill('[name="firstName"]', 'John')
  await page.fill('[name="lastName"]', 'Doe')
  await page.fill('[name="email"]', `test-${Date.now()}@example.com`)
  await page.click('button:has-text("Next")')

  // Page 2: Company Info
  await page.waitForSelector('h2:has-text("Company Information")')
  await page.fill('[name="company"]', 'Acme Corp')
  await page.fill('[name="role"]', 'Developer')
  await page.selectOption('[name="companySize"]', '50-100')
  await page.click('button:has-text("Next")')

  // Page 3: Preferences
  await page.waitForSelector('h2:has-text("Preferences")')
  await page.check('[name="newsletter"]')
  await page.selectOption('[name="plan"]', 'professional')
  await page.click('button:has-text("Next")')

  // Page 4: Review & Submit
  await page.waitForSelector('h2:has-text("Review")')
  await expect(page.locator('text=John Doe')).toBeVisible()
  await expect(page.locator('text=Acme Corp')).toBeVisible()

  await page.click('button:has-text("Submit")')

  // Confirmation
  await page.waitForURL(/\/registration-complete/)
  await expect(page.locator('h1')).toContainText('Registration Complete')
})
```

---

## 3. API Mocking & Network Interception

### Mock API Responses

```typescript
// tests/api-mocking.spec.ts
test('mock slow API response', async ({ page }) => {
  // Mock API route
  await page.route('**/api/products', async (route) => {
    // Simulate slow network
    await new Promise(resolve => setTimeout(resolve, 3000))

    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({
        products: [
          { id: 1, name: 'Product 1', price: 99.99 },
          { id: 2, name: 'Product 2', price: 149.99 }
        ]
      })
    })
  })

  await page.goto('/products')

  // Loading state should be visible
  await expect(page.locator('[data-testid="loading"]')).toBeVisible()

  // Products should appear after delay
  await expect(page.locator('[data-testid="product-card"]')).toHaveCount(2)
})

test('test error handling with failed API', async ({ page }) => {
  // Mock API failure
  await page.route('**/api/users', (route) => {
    route.fulfill({
      status: 500,
      contentType: 'application/json',
      body: JSON.stringify({ error: 'Internal Server Error' })
    })
  })

  await page.goto('/users')

  // Error message should be displayed
  await expect(page.locator('[data-testid="error-message"]'))
    .toContainText('Failed to load users')

  // Retry button should be visible
  await expect(page.locator('[data-testid="retry-button"]')).toBeVisible()
})
```

### Intercept and Verify Requests

```typescript
test('verify request payload on form submit', async ({ page }) => {
  // Listen for request
  const requestPromise = page.waitForRequest(
    request => request.url().includes('/api/users') && request.method() === 'POST'
  )

  await page.goto('/create-user')
  await page.fill('[name="name"]', 'John Doe')
  await page.fill('[name="email"]', 'john@example.com')
  await page.click('button[type="submit"]')

  // Verify request
  const request = await requestPromise
  const postData = request.postDataJSON()

  expect(postData).toEqual({
    name: 'John Doe',
    email: 'john@example.com'
  })
})
```

---

## 4. File Upload & Download

### File Upload Testing

```typescript
// tests/file-upload.spec.ts
test('upload single file', async ({ page }) => {
  await page.goto('/upload')

  // Upload file
  const fileInput = page.locator('input[type="file"]')
  await fileInput.setInputFiles('test-files/document.pdf')

  // Verify file is listed
  await expect(page.locator('[data-testid="file-name"]'))
    .toContainText('document.pdf')

  // Submit
  await page.click('button:has-text("Upload")')

  // Verify success
  await expect(page.locator('[data-testid="success-message"]'))
    .toContainText('File uploaded successfully')
})

test('upload multiple files', async ({ page }) => {
  await page.goto('/upload')

  await page.locator('input[type="file"]').setInputFiles([
    'test-files/image1.jpg',
    'test-files/image2.jpg',
    'test-files/document.pdf'
  ])

  await expect(page.locator('[data-testid="file-item"]')).toHaveCount(3)
})

test('validate file type restrictions', async ({ page }) => {
  await page.goto('/upload')

  await page.locator('input[type="file"]').setInputFiles('test-files/malware.exe')

  await expect(page.locator('[data-testid="error"]'))
    .toContainText('File type not allowed')
})
```

### File Download Testing

```typescript
test('download generated report', async ({ page }) => {
  await page.goto('/reports')

  // Start waiting for download before clicking
  const downloadPromise = page.waitForEvent('download')
  await page.click('[data-testid="download-report"]')

  // Wait for download to complete
  const download = await downloadPromise

  // Verify filename
  expect(download.suggestedFilename()).toContain('report-')
  expect(download.suggestedFilename()).toContain('.pdf')

  // Save and verify file
  const path = await download.path()
  expect(path).toBeTruthy()

  // Optional: Verify file content
  const fs = require('fs')
  const fileSize = fs.statSync(path).size
  expect(fileSize).toBeGreaterThan(0)
})
```

---

## 5. WebSocket & Real-Time Testing

```typescript
// tests/websocket.spec.ts
test('receive real-time notifications', async ({ page }) => {
  await page.goto('/dashboard')

  // Wait for WebSocket connection
  await page.waitForTimeout(1000)

  // Trigger action that sends notification
  await page.evaluate(() => {
    // Simulate server sending notification via WebSocket
    window.dispatchEvent(new CustomEvent('notification', {
      detail: { message: 'New order received', type: 'success' }
    }))
  })

  // Verify notification appears
  await expect(page.locator('[data-testid="notification"]'))
    .toContainText('New order received')
})

test('chat functionality', async ({ page }) => {
  await page.goto('/chat')

  // Send message
  await page.fill('[data-testid="message-input"]', 'Hello from E2E test')
  await page.press('[data-testid="message-input"]', 'Enter')

  // Verify message appears in chat
  await expect(page.locator('[data-testid="message"]').last())
    .toContainText('Hello from E2E test')

  // Simulate receiving message
  await page.evaluate(() => {
    window.dispatchEvent(new CustomEvent('message', {
      detail: { text: 'Response from server', user: 'Bot' }
    }))
  })

  await expect(page.locator('[data-testid="message"]').last())
    .toContainText('Response from server')
})
```

---

## 6. Mobile & Responsive Testing

```typescript
// tests/responsive.spec.ts
const devices = [
  { name: 'iPhone 12', viewport: { width: 390, height: 844 } },
  { name: 'iPad', viewport: { width: 768, height: 1024 } },
  { name: 'Desktop', viewport: { width: 1920, height: 1080 } }
]

for (const device of devices) {
  test(`navigation works on ${device.name}`, async ({ page }) => {
    await page.setViewportSize(device.viewport)
    await page.goto('/')

    if (device.viewport.width < 768) {
      // Mobile: hamburger menu
      await page.click('[data-testid="hamburger-menu"]')
      await page.click('[data-testid="mobile-nav"] a:has-text("Products")')
    } else {
      // Desktop: direct nav
      await page.click('nav a:has-text("Products")')
    }

    await expect(page).toHaveURL(/\/products/)
  })
}

test('mobile gestures', async ({ page }) => {
  await page.setViewportSize({ width: 375, height: 667 })
  await page.goto('/gallery')

  // Swipe gesture
  const image = page.locator('[data-testid="image"]')
  const box = await image.boundingBox()

  await page.mouse.move(box!.x + box!.width / 2, box!.y + box!.height / 2)
  await page.mouse.down()
  await page.mouse.move(box!.x - 200, box!.y + box!.height / 2)
  await page.mouse.up()

  // Verify next image loaded
  await expect(page.locator('[data-testid="image-index"]')).toContainText('2')
})
```

---

## 7. Cross-Browser Testing

```typescript
// playwright.config.ts
export default defineConfig({
  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] }
    },
    {
      name: 'firefox',
      use: { ...devices['Desktop Firefox'] }
    },
    {
      name: 'webkit',
      use: { ...devices['Desktop Safari'] }
    },
    {
      name: 'mobile-chrome',
      use: { ...devices['Pixel 5'] }
    },
    {
      name: 'mobile-safari',
      use: { ...devices['iPhone 12'] }
    }
  ]
})
```

```bash
# Run on all browsers
npx playwright test

# Run on specific browser
npx playwright test --project=chromium

# Run on mobile only
npx playwright test --project=mobile-*
```

---

## 8. Performance & Accessibility Testing

### Performance Metrics

```typescript
// tests/performance.spec.ts
test('page load performance', async ({ page }) => {
  await page.goto('/')

  // Collect performance metrics
  const metrics = await page.evaluate(() => {
    const perf = performance.getEntriesByType('navigation')[0] as PerformanceNavigationTiming
    return {
      domContentLoaded: perf.domContentLoadedEventEnd - perf.domContentLoadedEventStart,
      loadComplete: perf.loadEventEnd - perf.loadEventStart,
      firstPaint: performance.getEntriesByType('paint')[0]?.startTime,
      responseTime: perf.responseEnd - perf.requestStart
    }
  })

  // Assert performance thresholds
  expect(metrics.domContentLoaded).toBeLessThan(1000) // < 1s
  expect(metrics.loadComplete).toBeLessThan(3000)     // < 3s
  expect(metrics.firstPaint).toBeLessThan(500)        // < 500ms
})
```

### Accessibility Testing

```typescript
// tests/accessibility.spec.ts
import { test, expect } from '@playwright/test'
import AxeBuilder from '@axe-core/playwright'

test('homepage has no accessibility violations', async ({ page }) => {
  await page.goto('/')

  const accessibilityScanResults = await new AxeBuilder({ page }).analyze()

  expect(accessibilityScanResults.violations).toEqual([])
})

test('form is keyboard accessible', async ({ page }) => {
  await page.goto('/contact')

  // Tab through form
  await page.keyboard.press('Tab') // Focus first field
  await page.keyboard.type('John Doe')

  await page.keyboard.press('Tab') // Next field
  await page.keyboard.type('john@example.com')

  await page.keyboard.press('Tab') // Next field
  await page.keyboard.type('Test message')

  await page.keyboard.press('Tab') // Submit button
  await page.keyboard.press('Enter')

  // Form should submit
  await expect(page.locator('[data-testid="success"]')).toBeVisible()
})
```

---

## 9. Page Object Model (POM)

```typescript
// page-objects/LoginPage.ts
export class LoginPage {
  constructor(private page: Page) {}

  async goto() {
    await this.page.goto('/login')
  }

  async login(email: string, password: string) {
    await this.page.fill('[data-testid="email"]', email)
    await this.page.fill('[data-testid="password"]', password)
    await this.page.click('[data-testid="login-button"]')
  }

  async getErrorMessage() {
    return await this.page.locator('[data-testid="error"]').textContent()
  }

  async isLoggedIn() {
    return await this.page.locator('[data-testid="user-menu"]').isVisible()
  }
}

// page-objects/DashboardPage.ts
export class DashboardPage {
  constructor(private page: Page) {}

  async goto() {
    await this.page.goto('/dashboard')
  }

  async getWelcomeMessage() {
    return await this.page.locator('h1').textContent()
  }

  async navigateToSettings() {
    await this.page.click('[data-testid="settings-link"]')
  }
}

// tests/using-pom.spec.ts
test('login and navigate', async ({ page }) => {
  const loginPage = new LoginPage(page)
  const dashboardPage = new DashboardPage(page)

  await loginPage.goto()
  await loginPage.login('admin@example.com', 'Password123')

  await expect(page).toHaveURL(/\/dashboard/)

  const message = await dashboardPage.getWelcomeMessage()
  expect(message).toContain('Welcome')

  await dashboardPage.navigateToSettings()
  await expect(page).toHaveURL(/\/settings/)
})
```

---

## 10. Test Data Management

```typescript
// fixtures/test-data.ts
import { faker } from '@faker-js/faker'

export const testData = {
  users: {
    admin: {
      email: 'admin@example.com',
      password: 'AdminPass123',
      role: 'admin'
    },
    user: {
      email: 'user@example.com',
      password: 'UserPass123',
      role: 'user'
    }
  },

  generateUser: () => ({
    name: faker.person.fullName(),
    email: faker.internet.email(),
    password: faker.internet.password({ length: 12 }),
    phone: faker.phone.number()
  }),

  generateProduct: () => ({
    name: faker.commerce.productName(),
    price: parseFloat(faker.commerce.price()),
    description: faker.commerce.productDescription(),
    sku: faker.string.alphanumeric(8).toUpperCase()
  })
}

// tests/with-test-data.spec.ts
test('create user with generated data', async ({ page }) => {
  const user = testData.generateUser()

  await page.goto('/admin/users/new')
  await page.fill('[name="name"]', user.name)
  await page.fill('[name="email"]', user.email)
  await page.fill('[name="password"]', user.password)
  await page.click('button[type="submit"]')

  await expect(page.locator('[data-testid="success"]'))
    .toContainText('User created')
})
```

---

## When to Use This Skill

Invoke the Advanced E2E Testing skill when:

1. **Testing critical user journeys** end-to-end
2. **Validating multi-step workflows** (checkout, registration, etc.)
3. **Testing authentication flows** with multiple roles
4. **Verifying real-time features** (WebSockets, notifications)
5. **Cross-browser compatibility** testing
6. **Mobile responsive** behavior validation
7. **Performance and accessibility** testing
8. **Integration with third-party services**

---

## Related Resources

- **Visual Regression Testing**: `examples/skills/visual-regression-testing.md`
- **BDD Framework**: `examples/skills/bdd-framework-examples.md`
- **Testing Strategy**: `guides/advanced-patterns/testing-strategy.md`

---

**Version**: 1.0.0
**Last Updated**: 2026-01-10
**Status**: Production Ready ✅

---

## Credits

**Author:** [Michel Abboud](https://github.com/michelabboud)
**AI Assistance:** Created with the help of Claude Code (Anthropic)
**License:** MIT

💡 **Want more?** Explore [claude-code-helper](https://github.com/michelabboud/claude-code-helper) for 30+ agents, 13+ skills, 9 MCP servers, and comprehensive guides.
