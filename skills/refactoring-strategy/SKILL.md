---
name: refactoring-strategy
skill_name: Refactoring Strategy
description: Interactive refactoring workflow with safety checks, testing, and rollback support. Use when cleaning up code, simplifying functions, extracting methods or classes, renaming across a project, reducing complexity, modernizing syntax, eliminating code smells, managing technical debt, or improving code structure. Triggers on "refactor", "clean up", "simplify", "extract method", "rename", "reduce complexity", "code smells", "technical debt", "modernize code".
category: Development
priority: P1
argument-hint: '[pattern] [target] [options] | hello | hello ID'
allowed-tools: Read, Write, Edit, Grep, Glob, Bash
agent: general-purpose
context: fork
version: 1.1.0
author: Michel Abboud
license: Apache-2.0
repository: https://github.com/michelabboud/claude-code-helper
issues: https://github.com/michelabboud/claude-code-helper/issues
---

# Refactoring Strategy Skill

Systematic approach to safe refactoring, technical debt management, and code modernization.

## Usage

```
/refactoring-strategy extract-method src/utils/parser.ts parseHeaders
/refactoring-strategy rename getUserData fetchUserProfile
/refactoring-strategy modernize src/legacy/
/refactoring-strategy simplify src/utils/heavy-computation.ts
```

## Workflow

1. **Analyze** - Parse target code and build dependency graph
2. **Plan** - Show affected files and proposed changes
3. **Confirm** - Request user approval before proceeding
4. **Checkpoint** - Create git commit for safety
5. **Execute** - Perform the refactoring
6. **Test** - Run test suite to verify no regressions
7. **Report** - Summarize changes and results

## Supported Patterns

| Pattern | Description |
|---------|-------------|
| `extract-method` | Extract code into a new function |
| `extract-class` | Extract functionality into a new class |
| `rename` | Rename variables, functions, classes across project |
| `move` | Relocate code to different files/modules |
| `inline` | Inline functions or variables |
| `simplify` | Reduce complex logic |
| `modernize` | Update to modern syntax (var->const, callbacks->async) |
| `optimize` | Performance improvements |

## Safety Requirements

- Verify tests pass before starting
- Create git checkpoint before changes
- Run tests after refactoring
- Provide rollback option if tests fail
- Show impact analysis before proceeding

## Refactoring Principles

### The Golden Rule
**Always have tests before refactoring.** If no tests exist, write them first.

### Safe Refactoring Process
1. **Identify**: Find code that needs refactoring
2. **Test**: Ensure comprehensive test coverage
3. **Refactor**: Make small, incremental changes
4. **Verify**: Run tests after each change
5. **Commit**: Commit frequently

## Common Refactoring Patterns

### Extract Method

**Before**:
```javascript
function processOrder(order) {
  if (!order.items || order.items.length === 0) {
    throw new Error('Order must have items')
  }
  if (!order.customerId) {
    throw new Error('Customer ID required')
  }

  let total = 0
  for (const item of order.items) {
    total += item.price * item.quantity
  }

  if (order.discountCode) {
    const discount = lookupDiscount(order.discountCode)
    total *= (1 - discount)
  }

  return { ...order, total }
}
```

**After**:
```javascript
function processOrder(order) {
  validateOrder(order)
  const total = calculateTotal(order)
  return { ...order, total }
}

function validateOrder(order) {
  if (!order.items || order.items.length === 0) {
    throw new Error('Order must have items')
  }
  if (!order.customerId) {
    throw new Error('Customer ID required')
  }
}

function calculateTotal(order) {
  const subtotal = order.items.reduce(
    (sum, item) => sum + item.price * item.quantity, 0
  )
  return applyDiscount(subtotal, order.discountCode)
}

function applyDiscount(amount, discountCode) {
  if (!discountCode) return amount
  const discount = lookupDiscount(discountCode)
  return amount * (1 - discount)
}
```

### Extract Class

**Before** — a class with too many responsibilities:
```typescript
class UserService {
  async createUser(data: CreateUserDto) { /* ... */ }
  async deleteUser(id: string) { /* ... */ }
  async sendWelcomeEmail(user: User) { /* ... */ }
  async sendPasswordReset(email: string) { /* ... */ }
  async generateReport(userId: string) { /* ... */ }
  async exportToCsv(users: User[]) { /* ... */ }
}
```

**After** — split by responsibility:
```typescript
class UserService {
  constructor(
    private emailService: EmailService,
    private reportService: UserReportService
  ) {}
  async createUser(data: CreateUserDto) { /* ... */ }
  async deleteUser(id: string) { /* ... */ }
}

class EmailService {
  async sendWelcomeEmail(user: User) { /* ... */ }
  async sendPasswordReset(email: string) { /* ... */ }
}

class UserReportService {
  async generateReport(userId: string) { /* ... */ }
  async exportToCsv(users: User[]) { /* ... */ }
}
```

### Introduce Parameter Object

**Before** — too many parameters signal a missing abstraction:
```typescript
function createInvoice(
  customerId: string, customerName: string, customerEmail: string,
  items: LineItem[], taxRate: number, discount: number,
  currency: string, dueDate: Date, notes: string
) { /* ... */ }
```

**After** — group related parameters into objects:
```typescript
interface Customer {
  id: string
  name: string
  email: string
}

interface InvoiceOptions {
  taxRate: number
  discount: number
  currency: string
  dueDate: Date
  notes?: string
}

function createInvoice(
  customer: Customer, items: LineItem[], options: InvoiceOptions
) { /* ... */ }
```

### Replace Conditional with Polymorphism

**Before** — a growing switch statement that changes with every new type:
```typescript
function calculateShipping(order: Order): number {
  switch (order.shippingType) {
    case 'standard':
      return order.weight * 0.5
    case 'express':
      return order.weight * 1.5 + 10
    case 'overnight':
      return order.weight * 3.0 + 25
    case 'international':
      return order.weight * 5.0 + 50 + calculateCustomsDuty(order)
    default:
      throw new Error(`Unknown shipping type: ${order.shippingType}`)
  }
}
```

**After** — each type encapsulates its own logic:
```typescript
interface ShippingStrategy {
  calculate(order: Order): number
}

class StandardShipping implements ShippingStrategy {
  calculate(order: Order) { return order.weight * 0.5 }
}

class ExpressShipping implements ShippingStrategy {
  calculate(order: Order) { return order.weight * 1.5 + 10 }
}

class OvernightShipping implements ShippingStrategy {
  calculate(order: Order) { return order.weight * 3.0 + 25 }
}

class InternationalShipping implements ShippingStrategy {
  calculate(order: Order) {
    return order.weight * 5.0 + 50 + calculateCustomsDuty(order)
  }
}

const strategies: Record<string, ShippingStrategy> = {
  standard: new StandardShipping(),
  express: new ExpressShipping(),
  overnight: new OvernightShipping(),
  international: new InternationalShipping(),
}

function calculateShipping(order: Order): number {
  const strategy = strategies[order.shippingType]
  if (!strategy) throw new Error(`Unknown shipping type: ${order.shippingType}`)
  return strategy.calculate(order)
}
```

### Replace Magic Numbers with Named Constants

**Before**:
```typescript
if (password.length < 8) return false
if (retries > 3) throw new Error('Too many attempts')
const timeout = setTimeout(callback, 30000)
if (score >= 0.7) return 'pass'
```

**After**:
```typescript
const MIN_PASSWORD_LENGTH = 8
const MAX_RETRY_ATTEMPTS = 3
const SESSION_TIMEOUT_MS = 30_000
const PASSING_SCORE_THRESHOLD = 0.7

if (password.length < MIN_PASSWORD_LENGTH) return false
if (retries > MAX_RETRY_ATTEMPTS) throw new Error('Too many attempts')
const timeout = setTimeout(callback, SESSION_TIMEOUT_MS)
if (score >= PASSING_SCORE_THRESHOLD) return 'pass'
```

## Technical Debt Management

### Identifying Technical Debt
- Code smells (long methods, large classes, duplicated code)
- Low test coverage
- Complex/unclear code
- Outdated dependencies
- Performance issues
- Security vulnerabilities

### Prioritizing Debt
**Impact vs Effort Matrix**:
- High Impact, Low Effort -> Do first
- High Impact, High Effort -> Plan carefully
- Low Impact, Low Effort -> Do when convenient
- Low Impact, High Effort -> Consider not doing

### Debt Tracking
```markdown
| ID | Description | Impact | Effort | Priority | Status |
|----|-------------|--------|--------|----------|--------|
| TD-001 | Refactor UserService | High | Medium | P1 | Open |
| TD-002 | Update React 16->18 | High | High | P1 | In Progress |
| TD-003 | Extract payment logic | Medium | Low | P2 | Open |
```

## Refactoring Strategies

### 1. Boy Scout Rule
"Always leave the code cleaner than you found it." Make small improvements with every change.

### 2. Strangler Fig Pattern
Gradually replace old system with new one. Route traffic to the new implementation piece by piece until the old one can be removed.

### 3. Branch by Abstraction
Create abstraction layer, switch implementations behind it. Callers depend on the abstraction, so swapping the concrete implementation is safe.

### 4. Parallel Change (Expand-Contract)
1. Expand: Add new interface alongside old
2. Migrate: Move callers to new interface
3. Contract: Remove old interface

## Anti-Patterns to Avoid

- **Big Bang Refactoring**: Rewriting everything at once
- **Refactoring Without Tests**: High risk of breaking things
- **Mixing Refactoring with Features**: Do separately
- **Premature Optimization**: Optimize based on profiling
- **Over-Engineering**: Keep it simple

## Refactoring Checklist

### Before
- [ ] Tests exist and pass
- [ ] Code is under version control
- [ ] Clear goal identified

### During
- [ ] Make small changes
- [ ] Run tests frequently
- [ ] Commit often

### After
- [ ] All tests pass
- [ ] Performance verified
- [ ] Documentation updated

## When to Use This Skill

- Code is difficult to understand or modify
- Adding features is slow due to tangled code
- Bug rate is high in a specific module
- Test coverage is low and needs characterization tests first
- Code smells are present (long methods, god classes, duplicated logic)
- Dependencies are outdated and need safe migration

## Handshake Protocol

If invoked with argument `hello`:
> Hello! I'm **Refactoring Strategy** v1.1.0. Safe refactoring workflows, code smell remediation, technical debt management, and code modernization. Use `/refactoring-strategy hello ID` for the full guide.

If invoked with argument `hello ID`, respond with full skill information:
- **Name**: Refactoring Strategy v1.1.0
- **Description**: Interactive refactoring workflow with safety checks, testing, and rollback support. Safe refactoring patterns, technical debt reduction, and code modernization strategies.
- **How to invoke**: `/refactoring-strategy [pattern] [target]`
- **Available arguments**: `[pattern] [target] [options] | hello | hello ID`
- **Author**: Michel Abboud -- https://github.com/michelabboud/claude-code-helper
- **License**: Apache-2.0

## Changelog

### 1.1.0 (2026-03-15)
- Improved description for better trigger accuracy
- Added `agent: general-purpose` and `context: fork` frontmatter
- Added before/after code examples for Extract Class, Parameter Object, Replace Conditional, Magic Numbers
- Removed meta-documentation (Skills 2.0 tutorial, installation instructions)
- Streamlined checklist sections

### 1.0.0 (2026-02-20)
- Initial versioned release

---

**Author**: [Michel Abboud](https://github.com/michelabboud)
**License**: Apache-2.0
**Repository**: [claude-code-helper](https://github.com/michelabboud/claude-code-helper)
**Issues & Discussions**: [GitHub Issues](https://github.com/michelabboud/claude-code-helper/issues)
