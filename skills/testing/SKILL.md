---
skill_name: testing
description: "Comprehensive testing skill covering TDD, E2E, BDD, contract testing, mutation testing, and visual regression. Use when writing tests, designing test strategy, adding test coverage, fixing flaky tests, mocking services, setting up testing frameworks, or any testing task. Triggers on 'write tests', 'add test coverage', 'test strategy', 'fix flaky test', 'mock', 'E2E test', 'unit test', 'integration test'."
category: Testing
priority: P1
argument-hint: '[target] [type] | tdd | e2e | bdd | contract | mutation | visual | hello | hello ID'
allowed-tools: Read, Write, Edit, Bash, Grep, Glob
agent: qa-testing-expert
context: fork
version: 2.0.0
author: Michel Abboud
license: Apache-2.0
repository: https://github.com/michelabboud/claude-code-helper
issues: https://github.com/michelabboud/claude-code-helper/issues
---

# Testing Skill

Comprehensive testing toolkit covering test generation, TDD workflows, E2E patterns, BDD frameworks, contract testing, mutation testing, and visual regression testing.

## Usage

```
/testing src/utils/validation.ts unit       # Generate unit tests
/testing src/services/user-service           # Auto-detect test type
/testing "user registration flow" e2e        # Generate E2E tests
/testing tdd                                 # TDD Red-Green-Refactor workflow
/testing e2e                                 # Advanced E2E patterns
/testing bdd                                 # BDD with Cucumber/Gherkin
/testing contract                            # Contract testing with Pact
/testing mutation                            # Mutation testing guidance
/testing visual                              # Visual regression testing
```

---

## Default: Test Generation

Generate tests by specifying a target and optional type.

### Test Types

| Type | Description | Speed | Scope |
|------|-------------|-------|-------|
| `unit` | Single functions/methods | Fast (<100ms) | Isolated |
| `integration` | Module interactions | Moderate | Connected |
| `e2e` | Complete user flows | Slow | Full stack |
| `api` | API endpoint tests | Moderate | HTTP layer |
| `component` | React/Vue component tests | Fast | UI layer |

### Test Structure (AAA Pattern)

```javascript
describe('Component/Function Name', () => {
  it('should do something specific', () => {
    // Arrange - Set up test data
    const input = { foo: 'bar' }

    // Act - Execute the code
    const result = functionUnderTest(input)

    // Assert - Verify results
    expect(result).toEqual(expectedOutput)
  })
})
```

### Supported Frameworks

| Framework | Language | Use Case |
|-----------|----------|----------|
| Jest | JavaScript/TypeScript | General testing |
| Vitest | Vite projects | Fast ESM-native testing |
| pytest | Python | Python testing |
| RSpec | Ruby | Ruby testing |
| JUnit | Java | Java testing |

### Generation Best Practices

1. **Descriptive Names**: `it('should return 401 when token is expired')`
2. **One Assert Per Concept**: Test one behavior at a time
3. **Independent Tests**: No shared mutable state between tests
4. **Use Factories**: Create test data with factories/fixtures
5. **Mock External Services**: APIs, databases, file system
6. **Test Edge Cases**: null, undefined, empty, boundary values
7. **Coverage Targets**: 80%+ statement coverage on critical paths

### Example Output

```typescript
describe('UserService', () => {
  describe('createUser', () => {
    it('should create user with valid data', async () => {
      const userData = { email: 'test@example.com', name: 'Test' };
      const user = await service.createUser(userData);
      expect(user.id).toBeDefined();
      expect(user.email).toBe('test@example.com');
    });

    it('should throw error for duplicate email', async () => {
      await service.createUser({ email: 'dup@example.com', name: 'A' });
      await expect(
        service.createUser({ email: 'dup@example.com', name: 'B' })
      ).rejects.toThrow('Email already registered');
    });

    it('should hash password before saving', async () => {
      const user = await service.createUser({
        email: 'test@example.com', password: 'plain123',
      });
      expect(user.password).not.toBe('plain123');
      expect(user.password).toMatch(/^\$2[aby]\$/);
    });
  });
});
```

---

## `/testing tdd` -- TDD Red-Green-Refactor

### The Cycle

1. **RED**: Write a failing test for functionality that does not exist yet
2. **GREEN**: Write the minimal code to make it pass (hardcoding is fine)
3. **REFACTOR**: Improve code structure while keeping tests green
4. Repeat

### Core Principles

- **Test First**: Write tests before implementation
- **Baby Steps**: Small, incremental changes
- **YAGNI**: Only implement what is tested
- **Refactor Continuously**: Clean up after every green

### Key Patterns

**Fake It Till You Make It** -- Start with hardcoded values, add tests to force generalization:

```typescript
// Test 1 -> hardcode return 'Hello, Alice!'
// Test 2 (greet('Bob')) -> forced to implement `Hello, ${name}!`
```

**Triangulation** -- Use multiple test cases to force a general solution.

**One to Many** -- Start with a single item, then generalize to collections.

### When TDD Works Best

- Business logic, algorithms, pure functions
- API endpoints, bug fixes
- Complex calculations and validations

### When to Skip TDD

- UI prototyping, infrastructure setup, spike/POC work, simple CRUD

### TDD Anti-Patterns

- Testing implementation details (private fields) instead of behavior
- Writing too much test at once (multiple unrelated assertions)
- Skipping the refactor phase
- Not running tests after each change

---

## `/testing e2e` -- Advanced E2E with Playwright

### Auth Session Reuse

```typescript
// tests/auth.setup.ts -- authenticate once, save state
setup('authenticate', async ({ page }) => {
  await page.goto('/login')
  await page.fill('[data-testid="email"]', 'admin@example.com')
  await page.fill('[data-testid="password"]', 'Password123')
  await page.click('[data-testid="login-button"]')
  await page.waitForURL('**/dashboard')
  await page.context().storageState({ path: 'playwright/.auth/user.json' })
})
```

Configure in `playwright.config.ts` with `dependencies: ['setup']` and `storageState`.

### Multi-Role Testing

```typescript
test.describe('Admin Role', () => {
  test.use({ storageState: 'playwright/.auth/admin.json' })
  test('admin can access settings', async ({ page }) => { /* ... */ })
})
test.describe('User Role', () => {
  test.use({ storageState: 'playwright/.auth/user.json' })
  test('user cannot access admin settings', async ({ page }) => { /* ... */ })
})
```

### API Mocking & Network Interception

```typescript
await page.route('**/api/products', async (route) => {
  await route.fulfill({ status: 200, body: JSON.stringify({ products: [...] }) })
})
```

Mock errors (500s), slow responses (setTimeout), and verify request payloads with `page.waitForRequest`.

### Page Object Model

Encapsulate page interactions in classes (`LoginPage`, `DashboardPage`) for reusability and maintainability.

### Key Patterns

- **File upload/download**: `setInputFiles()`, `page.waitForEvent('download')`
- **Responsive testing**: Loop over viewport sizes, test mobile hamburger menus
- **Cross-browser**: Configure `projects` in playwright.config.ts for chromium/firefox/webkit
- **Performance**: Collect `performance.getEntriesByType('navigation')` metrics and assert thresholds
- **Accessibility**: Use `@axe-core/playwright` with `new AxeBuilder({ page }).analyze()`

---

## `/testing bdd` -- BDD with Cucumber/Gherkin

### Given-When-Then Pattern

```gherkin
Feature: User Authentication
  Scenario: Successful login
    Given a user exists with email "john@example.com" and password "Pass123"
    When I login with those credentials
    Then I should be redirected to the dashboard
```

### Framework Setup

| Framework | Language | Install |
|-----------|----------|---------|
| Cucumber | JS/TS | `npm i -D @cucumber/cucumber` |
| Behave | Python | `pip install behave` |
| SpecFlow | C#/.NET | NuGet: `SpecFlow` |

### Step Definitions (TypeScript)

```typescript
Given('a user exists with email {string} and password {string}',
  async function(email: string, password: string) {
    this.currentUser = await this.userService.createUser({ email, password })
  })
When('I login with those credentials', async function() {
  await this.authPage.login(this.currentUser.email, this.currentUser.password)
})
Then('I should be redirected to the dashboard', async function() {
  expect(await this.authPage.getCurrentUrl()).toContain('/dashboard')
})
```

### Best Practices

- **Declarative over imperative**: `When I login with valid credentials` not `When I click the Login button and type...`
- **Use Background** for shared preconditions
- **Tags** for organization: `@smoke`, `@regression`, `@slow`
- **Scenario Outline** with Examples table for data-driven tests
- **Data Tables** for complex structured input

### Running

```bash
npx cucumber-js --tags "@smoke"                        # Run tagged tests
npx cucumber-js --tags "@regression and not @slow"     # Combine tags
```

---

## `/testing contract` -- Contract Testing with Pact

### Consumer-Driven Contracts

```
Consumer defines expectations -> Generates contract file -> Provider verifies it
Both sides test independently, no need to run both services simultaneously.
```

### Consumer Test (Pact)

```typescript
const provider = new PactV3({ consumer: 'FrontendApp', provider: 'UserService' })

test('gets a user by ID', async () => {
  await provider
    .given('user with ID 123 exists')
    .uponReceiving('a request for user 123')
    .withRequest({ method: 'GET', path: '/users/123' })
    .willRespondWith({
      status: 200,
      body: { id: like(123), name: like('John'), email: like('john@example.com') }
    })
    .executeTest(async (mockServer) => {
      const user = await userService.getUser(123)
      expect(user.name).toBe('John')
    })
})
```

### Provider Verification

Use `Verifier` with `stateHandlers` to set up test data for each provider state. Publish results to Pact Broker for deployment safety (`can-i-deploy`).

### Key Matchers

`like()` (type), `eachLike()` (array), `regex()`, `iso8601DateTime()`, `uuid()`, `integer()`, `decimal()`, `boolean()`

### Advanced Patterns

- **GraphQL contracts**: Use `GraphQLInteraction` with queries/mutations
- **Message/event contracts**: Use `MessageConsumerPact` for async event-driven architectures
- **Contract evolution**: Use `optional()` for backward-compatible new fields

---

## `/testing mutation` -- Mutation Testing

### Concept

Mutation testing introduces controlled bugs (mutants) into your code and checks if tests catch them. Surviving mutants reveal test gaps.

```
Mutation Score = (Killed Mutants / Total Mutants) x 100%
Target: 80-90% for critical code
```

### Tools

| Tool | Language | Install |
|------|----------|---------|
| Stryker | JS/TS | `npm i -D @stryker-mutator/core && npx stryker init` |
| PITest | Java | Maven plugin `pitest-maven` |
| Mutmut | Python | `pip install mutmut` |

### Stryker Configuration

```json
{
  "testRunner": "jest",
  "mutate": ["src/**/*.ts", "!src/**/*.spec.ts"],
  "thresholds": { "high": 80, "low": 60, "break": 50 },
  "coverageAnalysis": "perTest"
}
```

### Running

```bash
npx stryker run                                    # Full run
npx stryker run --mutate "src/utils/calculator.ts" # Specific file
npx stryker run --incremental                      # Changed files only
```

### Common Mutation Operators

- **Arithmetic**: `+` to `-`, `*` to `/`
- **Relational**: `>` to `>=`, `==` to `!=`
- **Logical**: `&&` to `||`, remove `!`
- **Return values**: `true` to `false`, `0` to `1`

### Fixing Surviving Mutants

When a mutant survives, add a test that asserts the specific behavior the mutation breaks. Example: if `price * (1 - discount)` mutates to `price * (1 + discount)` and survives, add `expect(discounted).toBeLessThan(original)`.

---

## `/testing visual` -- Visual Regression Testing

### What It Catches

CSS layout changes, font rendering differences, color/styling changes, responsive design breakage, cross-browser rendering issues.

### Tools

| Tool | Type | Best For |
|------|------|----------|
| Percy | SaaS | Playwright/Cypress integration |
| Chromatic | SaaS | Storybook component testing |
| BackstopJS | Self-hosted | Free, CI-friendly |
| Playwright | Built-in | `toHaveScreenshot()` comparisons |

### Playwright Built-in Screenshots

```typescript
// Element snapshot
await expect(page.locator('[data-testid="button"]'))
  .toHaveScreenshot('button.png', { threshold: 0.2, maxDiffPixels: 100 })

// Full page snapshot
await expect(page).toHaveScreenshot('homepage.png', {
  fullPage: true, animations: 'disabled'
})
```

### Percy Integration

```typescript
import percySnapshot from '@percy/playwright'
await percySnapshot(page, 'Homepage')
// Run: PERCY_TOKEN=xxx npx percy exec -- playwright test
```

### Chromatic (Storybook)

Write stories with `chromatic: { viewports: [320, 768, 1200] }` parameter. Run `npx chromatic --project-token=xxx`.

### Best Practices

- **Hide dynamic content**: Timestamps, random banners, live badges
- **Wait for stability**: `networkidle`, `document.fonts.ready`, image loading
- **Freeze animations**: Disable CSS animations before snapshots
- **Test themes**: Loop over light/dark/high-contrast themes
- **Organize baselines**: Separate directories per browser

---

## Handshake Protocol

### `hello`
Respond with:
> Hello! I'm **Testing** v2.0.0. Comprehensive testing skill covering test generation, TDD, E2E, BDD, contract testing, mutation testing, and visual regression. Use `/testing hello ID` for the full guide.

### `hello ID`
Respond with complete skill information:
- **Name**: Testing v2.0.0
- **Description**: Comprehensive testing skill covering TDD, E2E, BDD, contract testing, mutation testing, and visual regression. Use for writing tests, test strategy, or any testing task.
- **How to invoke**: `/testing [target] [type]` for test generation, or `/testing tdd|e2e|bdd|contract|mutation|visual` for specialized modes
- **Available arguments**: `[target] [type] | tdd | e2e | bdd | contract | mutation | visual | hello | hello ID`
- **Author**: Michel Abboud -- https://github.com/michelabboud/claude-code-helper
- **License**: Apache-2.0

## Changelog

### 2.0.0 (2026-03-14)
- Merged 7 testing skills into unified `/testing` skill with subcommands
- Consolidated from: testing-standards, tdd-workflow, advanced-e2e-testing, bdd-framework-examples, contract-testing, mutation-testing, visual-regression-testing
- Each former skill is now a subcommand: tdd, e2e, bdd, contract, mutation, visual
- Default mode (no subcommand) generates tests like the former testing-standards skill

### 1.0.0 (2026-02-20)
- Initial versioned release (as testing-standards)

---

**Author**: [Michel Abboud](https://github.com/michelabboud)
**License**: Apache-2.0
**Repository**: [claude-code-helper](https://github.com/michelabboud/claude-code-helper)
**Issues & Discussions**: [GitHub Issues](https://github.com/michelabboud/claude-code-helper/issues)
