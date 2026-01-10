---
guide_name: Testing Strategy Guide
description: Comprehensive testing strategy for different project types and scales
category: Advanced Patterns
priority: P1
difficulty: Intermediate to Advanced
---

# Testing Strategy Guide

Comprehensive guide to building effective testing strategies across the software development lifecycle.

## Table of Contents

1. [Testing Fundamentals](#testing-fundamentals)
2. [The Test Pyramid](#the-test-pyramid)
3. [Test Types and When to Use Them](#test-types-and-when-to-use-them)
4. [Testing Strategies by Project Type](#testing-strategies-by-project-type)
5. [Test-Driven Development (TDD)](#test-driven-development-tdd)
6. [Testing Best Practices](#testing-best-practices)
7. [Tools and Frameworks](#tools-and-frameworks)
8. [CI/CD Integration](#cicd-integration)
9. [Performance and Load Testing](#performance-and-load-testing)
10. [Security Testing](#security-testing)

## Testing Fundamentals

### Why Test?

**Benefits**:
- ✅ Catch bugs early (cheaper to fix)
- ✅ Enable confident refactoring
- ✅ Document expected behavior
- ✅ Improve code design
- ✅ Reduce debugging time
- ✅ Enable faster deployments

**Costs**:
- ⏱️ Time to write tests
- ⏱️ Time to maintain tests
- ⏱️ Slower feedback loop (if poorly designed)
- ⏱️ False positives (flaky tests)

### Testing Principles

1. **Fast**: Tests should run quickly
2. **Independent**: Tests shouldn't depend on each other
3. **Repeatable**: Same result every time
4. **Self-Validating**: Clear pass/fail
5. **Timely**: Written at the right time (ideally before code)

### Test Coverage Metrics

```
Line Coverage: % of lines executed
Branch Coverage: % of branches taken
Function Coverage: % of functions called
Statement Coverage: % of statements executed
```

**Target Coverage**:
- Critical paths: 100%
- Business logic: 80-90%
- Infrastructure code: 60-70%
- Overall: 70-80%

> **Note**: 100% coverage doesn't mean bug-free code!

## The Test Pyramid

```
        ┌─────────────┐
        │     E2E     │  ← Few (Slow, Expensive, Brittle)
        │   Tests     │
        ├─────────────┤
        │ Integration │  ← Some (Medium Speed/Cost)
        │    Tests    │
        ├─────────────┤
        │    Unit     │  ← Many (Fast, Cheap, Stable)
        │   Tests     │
        └─────────────┘
```

### Why This Shape?

**Unit Tests (70%)**:
- Fast feedback (milliseconds)
- Cheap to write and maintain
- Test single units in isolation
- Easy to pinpoint failures

**Integration Tests (20%)**:
- Test component interactions
- Verify contracts between modules
- Catch integration issues
- Moderate speed (seconds)

**E2E Tests (10%)**:
- Test complete user workflows
- Verify system works as a whole
- Catch UI/UX issues
- Slow (minutes), expensive, flaky

### Anti-Pattern: Ice Cream Cone

```
        ┌─────────────┐
        │    Unit     │  ← Few
        ├─────────────┤
        │ Integration │  ← Some
        ├─────────────┤
        │     E2E     │  ← Many (Wrong!)
        │   Manual    │
        └─────────────┘
```

**Problems**:
- ❌ Slow feedback loop
- ❌ Expensive to maintain
- ❌ Flaky tests
- ❌ Hard to debug failures
- ❌ Bottleneck for releases

## Test Types and When to Use Them

### 1. Unit Tests

**Purpose**: Test single function/class in isolation

**When to Use**:
- Testing business logic
- Testing utility functions
- Testing data transformations
- Testing algorithms

**Example** (TypeScript with Jest):
```typescript
// Function to test
export function calculateDiscount(
  price: number,
  discountPercent: number
): number {
  if (price < 0 || discountPercent < 0 || discountPercent > 100) {
    throw new Error('Invalid input')
  }
  return price * (1 - discountPercent / 100)
}

// Unit tests
describe('calculateDiscount', () => {
  it('should calculate discount correctly', () => {
    expect(calculateDiscount(100, 20)).toBe(80)
  })
  
  it('should handle zero discount', () => {
    expect(calculateDiscount(100, 0)).toBe(100)
  })
  
  it('should handle 100% discount', () => {
    expect(calculateDiscount(100, 100)).toBe(0)
  })
  
  it('should throw error for negative price', () => {
    expect(() => calculateDiscount(-10, 20)).toThrow('Invalid input')
  })
  
  it('should throw error for invalid discount', () => {
    expect(() => calculateDiscount(100, 150)).toThrow('Invalid input')
  })
})
```

**Best Practices**:
- ✅ Test one thing per test
- ✅ Use descriptive test names
- ✅ Test edge cases and boundaries
- ✅ Test error conditions
- ✅ Mock external dependencies

---

### 2. Integration Tests

**Purpose**: Test interaction between components

**When to Use**:
- Testing API endpoints with database
- Testing service interactions
- Testing message queue consumers
- Testing third-party integrations

**Example** (NestJS with Supertest):
```typescript
describe('UserController (Integration)', () => {
  let app: INestApplication
  let prisma: PrismaService
  
  beforeAll(async () => {
    const module = await Test.createTestingModule({
      imports: [AppModule],
    }).compile()
    
    app = module.createNestApplication()
    prisma = module.get<PrismaService>(PrismaService)
    await app.init()
  })
  
  afterAll(async () => {
    await prisma.clearDatabase()
    await app.close()
  })
  
  describe('POST /users', () => {
    it('should create a new user', async () => {
      const response = await request(app.getHttpServer())
        .post('/users')
        .send({
          email: 'test@example.com',
          name: 'Test User',
        })
        .expect(201)
      
      expect(response.body).toMatchObject({
        email: 'test@example.com',
        name: 'Test User',
      })
      
      // Verify in database
      const user = await prisma.user.findUnique({
        where: { email: 'test@example.com' },
      })
      expect(user).toBeTruthy()
    })
    
    it('should reject duplicate email', async () => {
      // Create first user
      await prisma.user.create({
        data: { email: 'test@example.com', name: 'First' },
      })
      
      // Try to create duplicate
      await request(app.getHttpServer())
        .post('/users')
        .send({
          email: 'test@example.com',
          name: 'Second',
        })
        .expect(409) // Conflict
    })
  })
})
```

**Best Practices**:
- ✅ Use test database (not production!)
- ✅ Clean up data between tests
- ✅ Test happy path and error cases
- ✅ Verify side effects (DB, messages, etc.)
- ✅ Use transactions when possible

---

### 3. End-to-End (E2E) Tests

**Purpose**: Test complete user workflows

**When to Use**:
- Testing critical user journeys
- Testing cross-browser compatibility
- Testing UI interactions
- Testing full system integration

**Example** (Playwright):
```typescript
import { test, expect } from '@playwright/test'

test.describe('User Registration Flow', () => {
  test('should register new user successfully', async ({ page }) => {
    // Navigate to signup page
    await page.goto('/signup')
    
    // Fill in form
    await page.fill('[name="email"]', 'newuser@example.com')
    await page.fill('[name="password"]', 'SecurePass123!')
    await page.fill('[name="confirmPassword"]', 'SecurePass123!')
    await page.check('[name="termsAccepted"]')
    
    // Submit form
    await page.click('button[type="submit"]')
    
    // Verify redirect to dashboard
    await expect(page).toHaveURL('/dashboard')
    
    // Verify welcome message
    await expect(page.locator('.welcome-message')).toContainText(
      'Welcome, newuser@example.com'
    )
    
    // Verify email sent (check test inbox)
    // Implementation depends on email testing strategy
  })
  
  test('should show validation errors for invalid input', async ({ page }) => {
    await page.goto('/signup')
    
    // Submit empty form
    await page.click('button[type="submit"]')
    
    // Verify error messages
    await expect(page.locator('.error-email')).toContainText(
      'Email is required'
    )
    await expect(page.locator('.error-password')).toContainText(
      'Password is required'
    )
  })
  
  test('should handle existing email gracefully', async ({ page }) => {
    await page.goto('/signup')
    
    // Try to register with existing email
    await page.fill('[name="email"]', 'existing@example.com')
    await page.fill('[name="password"]', 'SecurePass123!')
    await page.fill('[name="confirmPassword"]', 'SecurePass123!')
    await page.click('button[type="submit"]')
    
    // Verify error message
    await expect(page.locator('.error-message')).toContainText(
      'Email already exists'
    )
  })
})
```

**Best Practices**:
- ✅ Test critical paths only
- ✅ Use page object pattern
- ✅ Run in parallel when possible
- ✅ Handle async operations properly
- ✅ Take screenshots on failure
- ✅ Use realistic test data

---

### 4. Contract Tests

**Purpose**: Verify API contracts between services

**When to Use**:
- Microservices architecture
- API-first development
- Multiple teams/services

**Example** (Pact):
```typescript
// Consumer test (Frontend)
import { Pact } from '@pact-foundation/pact'

describe('User API Contract', () => {
  const provider = new Pact({
    consumer: 'frontend',
    provider: 'user-service',
  })
  
  beforeAll(() => provider.setup())
  afterAll(() => provider.finalize())
  
  it('should get user by id', async () => {
    // Define expected interaction
    await provider.addInteraction({
      state: 'user with id 123 exists',
      uponReceiving: 'a request for user 123',
      withRequest: {
        method: 'GET',
        path: '/users/123',
        headers: {
          Accept: 'application/json',
        },
      },
      willRespondWith: {
        status: 200,
        headers: {
          'Content-Type': 'application/json',
        },
        body: {
          id: 123,
          email: 'user@example.com',
          name: 'Test User',
        },
      },
    })
    
    // Make actual request
    const response = await fetch(`${provider.mockService.baseUrl}/users/123`, {
      headers: { Accept: 'application/json' },
    })
    
    expect(response.status).toBe(200)
    const data = await response.json()
    expect(data.id).toBe(123)
    
    // Verify interaction
    await provider.verify()
  })
})

// Provider verification (Backend)
import { Verifier } from '@pact-foundation/pact'

describe('User Service Provider', () => {
  it('should satisfy contracts', async () => {
    await new Verifier({
      provider: 'user-service',
      providerBaseUrl: 'http://localhost:3000',
      pactUrls: ['./pacts/frontend-user-service.json'],
      stateHandlers: {
        'user with id 123 exists': async () => {
          // Setup test data
          await db.users.create({
            id: 123,
            email: 'user@example.com',
            name: 'Test User',
          })
        },
      },
    }).verifyProvider()
  })
})
```

---

### 5. Visual Regression Tests

**Purpose**: Catch unintended UI changes

**When to Use**:
- Component library development
- UI-heavy applications
- After CSS/styling changes

**Example** (Percy or Chromatic):
```typescript
import { test } from '@playwright/test'
import percySnapshot from '@percy/playwright'

test.describe('Component Visual Tests', () => {
  test('Button variants', async ({ page }) => {
    await page.goto('/components/button')
    
    // Capture screenshot
    await percySnapshot(page, 'Button - All Variants')
  })
  
  test('Dark mode theme', async ({ page }) => {
    await page.goto('/')
    
    // Toggle dark mode
    await page.click('[data-testid="theme-toggle"]')
    
    // Capture screenshot
    await percySnapshot(page, 'Homepage - Dark Mode')
  })
  
  test('Responsive layouts', async ({ page }) => {
    await page.goto('/dashboard')
    
    // Test different viewports
    await page.setViewportSize({ width: 375, height: 667 }) // Mobile
    await percySnapshot(page, 'Dashboard - Mobile')
    
    await page.setViewportSize({ width: 768, height: 1024 }) // Tablet
    await percySnapshot(page, 'Dashboard - Tablet')
    
    await page.setViewportSize({ width: 1920, height: 1080 }) // Desktop
    await percySnapshot(page, 'Dashboard - Desktop')
  })
})
```

---

### 6. Performance Tests

**Purpose**: Verify system performance under load

**When to Use**:
- Before production release
- After performance optimizations
- Capacity planning
- SLA verification

**Example** (k6):
```javascript
import http from 'k6/http'
import { check, sleep } from 'k6'

export const options = {
  stages: [
    { duration: '2m', target: 100 },  // Ramp up to 100 users
    { duration: '5m', target: 100 },  // Stay at 100 for 5 minutes
    { duration: '2m', target: 200 },  // Spike to 200 users
    { duration: '5m', target: 200 },  // Stay at 200
    { duration: '2m', target: 0 },    // Ramp down
  ],
  thresholds: {
    http_req_duration: ['p(95)<500'],  // 95% requests < 500ms
    http_req_failed: ['rate<0.01'],    // Error rate < 1%
  },
}

export default function () {
  // Test API endpoint
  const response = http.get('https://api.example.com/users')
  
  check(response, {
    'status is 200': (r) => r.status === 200,
    'response time < 500ms': (r) => r.timings.duration < 500,
  })
  
  sleep(1)
}
```

## Testing Strategies by Project Type

### Web Application (React/Next.js)

**Test Distribution**:
- Unit tests: 70% (components, hooks, utils)
- Integration tests: 20% (API calls, routing)
- E2E tests: 10% (critical user flows)

**What to Test**:
- ✅ Component rendering with different props
- ✅ User interactions (clicks, form submissions)
- ✅ State management logic
- ✅ API integration
- ✅ Routing and navigation
- ✅ Authentication flows
- ✅ Error boundaries

**Testing Stack**:
- Jest + React Testing Library (unit/integration)
- Playwright or Cypress (E2E)
- MSW (API mocking)
- Percy/Chromatic (visual regression)

---

### REST API (Node.js/Express)

**Test Distribution**:
- Unit tests: 60% (business logic, utilities)
- Integration tests: 35% (endpoints with DB)
- E2E tests: 5% (critical workflows)

**What to Test**:
- ✅ Request validation
- ✅ Business logic
- ✅ Database operations
- ✅ Authentication/authorization
- ✅ Error handling
- ✅ Response format
- ✅ API rate limiting

**Testing Stack**:
- Jest + Supertest (integration)
- Postman/Newman (API testing)
- Artillery/k6 (load testing)

---

### Microservices

**Test Distribution**:
- Unit tests: 50%
- Integration tests: 30%
- Contract tests: 15%
- E2E tests: 5%

**What to Test**:
- ✅ Service-to-service communication
- ✅ Message queue interactions
- ✅ API contracts (Pact)
- ✅ Resilience (circuit breakers, retries)
- ✅ Observability (logs, metrics, traces)

**Testing Stack**:
- Pact (contract testing)
- Testcontainers (integration testing)
- Chaos engineering tools

---

### Mobile App (React Native)

**Test Distribution**:
- Unit tests: 60%
- Integration tests: 25%
- E2E tests: 15%

**What to Test**:
- ✅ Component rendering
- ✅ Navigation flows
- ✅ Offline functionality
- ✅ Push notifications
- ✅ Deep linking
- ✅ Platform-specific code (iOS/Android)

**Testing Stack**:
- Jest + React Native Testing Library
- Detox (E2E)
- Maestro (E2E alternative)

## Test-Driven Development (TDD)

### Red-Green-Refactor Cycle

```
🔴 Red → Write failing test
  ↓
🟢 Green → Write minimal code to pass
  ↓
🔵 Refactor → Improve code without breaking tests
  ↓
(repeat)
```

### TDD Example

**Step 1: Write failing test (RED)**
```typescript
describe('PasswordValidator', () => {
  it('should reject passwords shorter than 8 characters', () => {
    const validator = new PasswordValidator()
    expect(validator.isValid('pass')).toBe(false)
  })
})

// Run test → FAILS (PasswordValidator doesn't exist)
```

**Step 2: Write minimal code (GREEN)**
```typescript
export class PasswordValidator {
  isValid(password: string): boolean {
    return password.length >= 8
  }
}

// Run test → PASSES
```

**Step 3: Refactor (BLUE)**
```typescript
// Add more test cases
it('should accept valid passwords', () => {
  expect(validator.isValid('ValidPass123!')).toBe(true)
})

it('should require at least one number', () => {
  expect(validator.isValid('NoNumbers!')).toBe(false)
})

// Refactor implementation
export class PasswordValidator {
  private readonly MIN_LENGTH = 8
  
  isValid(password: string): boolean {
    if (password.length < this.MIN_LENGTH) {
      return false
    }
    
    if (!/\d/.test(password)) {
      return false
    }
    
    return true
  }
}
```

### When to Use TDD

**Good for**:
- ✅ Business logic
- ✅ Algorithms
- ✅ Utility functions
- ✅ Bug fixes (write failing test first)
- ✅ API design (forces good interfaces)

**Not ideal for**:
- ❌ UI experimentation
- ❌ Prototyping
- ❌ Infrastructure setup
- ❌ Exploratory development

## Testing Best Practices

### 1. Test Naming

**Good**:
```typescript
describe('UserService', () => {
  describe('createUser', () => {
    it('should create user with valid data', () => {})
    it('should throw error for duplicate email', () => {})
    it('should hash password before saving', () => {})
  })
})
```

**Bad**:
```typescript
describe('test suite', () => {
  it('test 1', () => {})
  it('test 2', () => {})
})
```

### 2. Arrange-Act-Assert (AAA) Pattern

```typescript
it('should calculate total price with tax', () => {
  // Arrange: Setup
  const cart = new ShoppingCart()
  cart.addItem({ name: 'Item', price: 100 })
  const taxRate = 0.1
  
  // Act: Execute
  const total = cart.calculateTotal(taxRate)
  
  // Assert: Verify
  expect(total).toBe(110)
})
```

### 3. Test Data Builders

```typescript
// Builder pattern for test data
class UserBuilder {
  private user: Partial<User> = {
    email: 'test@example.com',
    name: 'Test User',
    role: 'user',
  }
  
  withEmail(email: string): this {
    this.user.email = email
    return this
  }
  
  withRole(role: string): this {
    this.user.role = role
    return this
  }
  
  build(): User {
    return this.user as User
  }
}

// Usage
const admin = new UserBuilder()
  .withEmail('admin@example.com')
  .withRole('admin')
  .build()
```

### 4. Avoid Test Interdependence

**Bad**:
```typescript
describe('User tests', () => {
  let userId: string
  
  it('should create user', async () => {
    const user = await createUser({ email: 'test@example.com' })
    userId = user.id // State shared across tests!
  })
  
  it('should get user', async () => {
    const user = await getUser(userId) // Depends on previous test
    expect(user).toBeTruthy()
  })
})
```

**Good**:
```typescript
describe('User tests', () => {
  it('should create user', async () => {
    const user = await createUser({ email: 'test@example.com' })
    expect(user.id).toBeTruthy()
  })
  
  it('should get user', async () => {
    // Create user within this test
    const created = await createUser({ email: 'test2@example.com' })
    const fetched = await getUser(created.id)
    expect(fetched).toEqual(created)
  })
})
```

### 5. Mock Appropriately

**When to Mock**:
- External APIs
- Database (for unit tests)
- File system
- Time/dates
- Random values

**When NOT to Mock**:
- Business logic you're testing
- Simple utilities
- Pure functions
- In integration tests (use real dependencies)

**Example**:
```typescript
// Mock external API
jest.mock('./api/payment-gateway', () => ({
  processPayment: jest.fn().mockResolvedValue({ success: true }),
}))

// Test business logic
it('should create order after successful payment', async () => {
  const order = await orderService.createOrder({
    items: [{ id: 1, quantity: 2 }],
    paymentMethod: 'credit_card',
  })
  
  expect(order.status).toBe('confirmed')
  expect(paymentGateway.processPayment).toHaveBeenCalledWith({
    amount: 200,
    method: 'credit_card',
  })
})
```

## Tools and Frameworks

### JavaScript/TypeScript

**Testing Frameworks**:
- Jest: All-in-one (most popular)
- Vitest: Fast, Vite-native
- Mocha + Chai: Flexible, modular

**E2E Testing**:
- Playwright: Cross-browser, modern
- Cypress: Developer-friendly, great DX
- Puppeteer: Headless Chrome automation

**API Testing**:
- Supertest: HTTP assertions
- MSW: API mocking
- Postman/Newman: API testing platform

### Python

**Testing Frameworks**:
- pytest: Most popular, powerful
- unittest: Built-in
- nose2: Extends unittest

**Mocking**:
- unittest.mock: Built-in
- pytest-mock: pytest integration
- responses: HTTP mocking

### Go

**Testing**:
- testing: Built-in
- testify: Assertions and mocks
- gomock: Mock generation

### Mobile

**React Native**:
- Jest + React Native Testing Library
- Detox: E2E testing
- Maestro: UI testing

**iOS**:
- XCTest: Built-in
- Quick/Nimble: BDD-style

**Android**:
- JUnit: Unit testing
- Espresso: UI testing
- Mockito: Mocking

## CI/CD Integration

### GitHub Actions Example

```yaml
name: Test Suite

on: [push, pull_request]

jobs:
  test:
    runs-on: ubuntu-latest
    
    services:
      postgres:
        image: postgres:15
        env:
          POSTGRES_PASSWORD: postgres
        options: >-
          --health-cmd pg_isready
          --health-interval 10s
          --health-timeout 5s
          --health-retries 5
    
    steps:
      - uses: actions/checkout@v3
      
      - name: Setup Node.js
        uses: actions/setup-node@v3
        with:
          node-version: '20'
          cache: 'npm'
      
      - name: Install dependencies
        run: npm ci
      
      - name: Run linter
        run: npm run lint
      
      - name: Run unit tests
        run: npm run test:unit
      
      - name: Run integration tests
        run: npm run test:integration
        env:
          DATABASE_URL: postgresql://postgres:postgres@localhost:5432/test
      
      - name: Run E2E tests
        run: npm run test:e2e
      
      - name: Upload coverage
        uses: codecov/codecov-action@v3
        with:
          files: ./coverage/coverage-final.json
      
      - name: Upload test results
        if: always()
        uses: actions/upload-artifact@v3
        with:
          name: test-results
          path: test-results/
```

### Test Optimization

**Parallel Execution**:
```json
{
  "scripts": {
    "test": "jest --maxWorkers=4",
    "test:watch": "jest --watch"
  }
}
```

**Test Splitting** (for large suites):
```yaml
# GitHub Actions matrix strategy
strategy:
  matrix:
    shard: [1, 2, 3, 4]

steps:
  - name: Run tests
    run: npm run test -- --shard=${{ matrix.shard }}/4
```

## Performance and Load Testing

### Load Testing Strategy

**Metrics to Track**:
- Response time (p50, p90, p95, p99)
- Throughput (requests per second)
- Error rate
- Resource utilization (CPU, memory)

**Load Testing Scenarios**:
1. **Baseline**: Normal load
2. **Stress**: Increasing load until failure
3. **Spike**: Sudden traffic spike
4. **Soak**: Sustained load over time (find memory leaks)

### Example Load Test (k6)

```javascript
import http from 'k6/http'
import { check } from 'k6'

export const options = {
  scenarios: {
    // Baseline test
    baseline: {
      executor: 'constant-vus',
      vus: 10,
      duration: '5m',
    },
    
    // Stress test
    stress: {
      executor: 'ramping-vus',
      startVUs: 0,
      stages: [
        { duration: '5m', target: 100 },
        { duration: '10m', target: 100 },
        { duration: '5m', target: 0 },
      ],
    },
    
    // Spike test
    spike: {
      executor: 'ramping-vus',
      startVUs: 10,
      stages: [
        { duration: '1m', target: 10 },
        { duration: '10s', target: 200 }, // Sudden spike
        { duration: '3m', target: 200 },
        { duration: '10s', target: 10 },
      ],
    },
  },
  
  thresholds: {
    http_req_duration: ['p(95)<500', 'p(99)<1000'],
    http_req_failed: ['rate<0.01'],
  },
}

export default function () {
  const response = http.get('https://api.example.com/products')
  
  check(response, {
    'status is 200': (r) => r.status === 200,
    'has products': (r) => JSON.parse(r.body).length > 0,
  })
}
```

## Security Testing

### Security Test Types

**SAST** (Static Application Security Testing):
- Analyze source code for vulnerabilities
- Tools: SonarQube, Snyk, Semgrep

**DAST** (Dynamic Application Security Testing):
- Test running application
- Tools: OWASP ZAP, Burp Suite

**Dependency Scanning**:
- Check for vulnerable dependencies
- Tools: npm audit, Snyk, Dependabot

### Security Test Example

```typescript
describe('Security Tests', () => {
  describe('SQL Injection Prevention', () => {
    it('should sanitize user input', async () => {
      const maliciousInput = "'; DROP TABLE users; --"
      
      // Should not throw error or execute SQL
      const result = await userService.findByName(maliciousInput)
      
      expect(result).toBeNull()
      
      // Verify users table still exists
      const users = await userService.findAll()
      expect(users).toBeDefined()
    })
  })
  
  describe('XSS Prevention', () => {
    it('should escape HTML in user content', async () => {
      const xssPayload = '<script>alert("XSS")</script>'
      
      const post = await postService.create({
        title: xssPayload,
        content: 'Test content',
      })
      
      // Should be escaped
      expect(post.title).not.toContain('<script>')
      expect(post.title).toContain('&lt;script&gt;')
    })
  })
  
  describe('Authentication', () => {
    it('should require authentication for protected routes', async () => {
      const response = await request(app)
        .get('/api/admin/users')
        .expect(401)
      
      expect(response.body.error).toBe('Unauthorized')
    })
    
    it('should reject invalid JWT tokens', async () => {
      const response = await request(app)
        .get('/api/profile')
        .set('Authorization', 'Bearer invalid_token')
        .expect(401)
    })
  })
})
```

## Measuring Test Quality

### Mutation Testing

Tests the tests by introducing bugs:

```bash
# Install Stryker (mutation testing)
npm install --save-dev @stryker-mutator/core @stryker-mutator/jest-runner

# Run mutation testing
npx stryker run
```

**Example Mutations**:
- Change `>` to `>=`
- Change `&&` to `||`
- Remove function calls
- Change constants

**Mutation Score**: % of mutations caught by tests

### Test Code Metrics

**Flakiness Rate**:
```
Flaky Tests / Total Test Runs
```

**Target**: < 1% flaky tests

**Test Execution Time**:
- Unit tests: < 10 seconds
- Integration tests: < 2 minutes
- E2E tests: < 10 minutes

## Common Testing Mistakes

❌ **Testing Implementation Details**
```typescript
// Bad: Testing internal state
expect(component.state.count).toBe(1)

// Good: Testing behavior
expect(screen.getByText('Count: 1')).toBeInTheDocument()
```

❌ **Too Many Mocks**
```typescript
// Bad: Over-mocking
jest.mock('./utils/math')
jest.mock('./utils/string')
jest.mock('./utils/date')

// Good: Only mock external dependencies
jest.mock('./api/external-service')
```

❌ **Brittle Tests**
```typescript
// Bad: Tied to exact implementation
expect(element.classList.contains('btn-primary')).toBe(true)

// Good: Test user-facing behavior
expect(button).toHaveRole('button')
expect(button).toBeEnabled()
```

❌ **Testing Too Much in One Test**
```typescript
// Bad: Multiple concerns
it('should handle user creation and update and deletion', () => {
  // Create user
  // Update user
  // Delete user
})

// Good: Separate tests
it('should create user with valid data', () => {})
it('should update user email', () => {})
it('should delete user by id', () => {})
```

## Conclusion

A comprehensive testing strategy balances coverage, speed, and maintainability. Follow the test pyramid, write tests that provide value, and integrate testing into your development workflow.

**Key Takeaways**:
1. Prioritize unit tests for fast feedback
2. Use integration tests for component interactions
3. Reserve E2E tests for critical user journeys
4. Automate testing in CI/CD
5. Measure and improve test quality
6. Make tests fast, independent, and repeatable

---

**Document Version**: 1.0.0
**Last Updated**: January 10, 2026
**Status**: Production Ready ✅
