---
skill_name: Refactoring Strategy
description: Interactive refactoring workflow with safety checks, testing, and rollback support. Safe refactoring patterns, technical debt reduction, and code modernization strategies.
category: Development
priority: P1
argument-hint: '[pattern] [target] [options] | hello | hello ID'
allowed-tools: Read, Write, Edit, Grep, Glob, Bash
version: 1.0.0
author: Michel Abboud
license: Apache-2.0
repository: https://github.com/michelabboud/claude-code-helper
issues: https://github.com/michelabboud/claude-code-helper/issues
---

# Refactoring Strategy Skill

Systematic approach to safe refactoring, technical debt management, and code modernization.

## Advanced Frontmatter Options (Claude Code v2.1+)

This skill supports enhanced frontmatter configuration:

### Context Forking
```yaml
---
skill_name: Refactoring Strategy
context: fork
---
```
Execute in forked context for isolated refactoring sessions without cluttering main conversation.

### Agent Specification
```yaml
---
skill_name: Refactoring Strategy
agent: general-purpose
---
```
Specify an agent type (general-purpose, code-review, etc.) to automatically handle refactoring tasks with appropriate tooling.

### Inline Hooks
```yaml
---
skill_name: Refactoring Strategy
hooks:
  PreToolUse: |
    # Ensure tests exist before refactoring
    if [[ ! -f "tests/" ]]; then
      echo "⚠️  No tests found - write tests before refactoring"
      exit 1
    fi
---
```
Enforce safety requirements like test coverage before allowing refactoring operations.


## 📦 Installation

Copy this skill to your Claude Code skills directory:

```bash
# Global installation (available to all projects)
mkdir -p ~/.claude/skills/refactoring-strategy
cp refactoring-strategy.md ~/.claude/skills/refactoring-strategy/SKILL.md

# Or project-specific installation
mkdir -p .claude/skills/refactoring-strategy
cp refactoring-strategy.md .claude/skills/refactoring-strategy/SKILL.md
```

The skill will be automatically detected and hot-reloaded by Claude Code.

**Usage**: Once installed, Claude Code will use this skill automatically when relevant to your requests.

## Usage

```
/refactoring-strategy extract-method src/utils/parser.ts parseHeaders
/refactoring-strategy rename getUserData fetchUserProfile
/refactoring-strategy modernize src/legacy/
/refactoring-strategy optimize src/utils/heavy-computation.ts
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
  // Validate
  if (!order.items || order.items.length === 0) {
    throw new Error('Order must have items')
  }
  if (!order.customerId) {
    throw new Error('Customer ID required')
  }
  
  // Calculate total
  let total = 0
  for (const item of order.items) {
    total += item.price * item.quantity
  }
  
  // Apply discount
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
    (sum, item) => sum + item.price * item.quantity,
    0
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
When a class has too many responsibilities, split it.

### Introduce Parameter Object
Replace multiple parameters with a single object.

### Replace Conditional with Polymorphism
Use inheritance instead of complex if/switch statements.

### Replace Magic Numbers with Named Constants
Make code self-documenting.

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
- High Impact, Low Effort → Do first
- High Impact, High Effort → Plan carefully
- Low Impact, Low Effort → Do when convenient
- Low Impact, High Effort → Consider not doing

### Debt Tracking
```markdown
## Technical Debt Register

| ID | Description | Impact | Effort | Priority | Status |
|----|-------------|--------|--------|----------|--------|
| TD-001 | Refactor UserService | High | Medium | P1 | Open |
| TD-002 | Update React 16→18 | High | High | P1 | In Progress |
| TD-003 | Extract payment logic | Medium | Low | P2 | Open |
```

## Refactoring Strategies

### 1. Boy Scout Rule
"Always leave the code cleaner than you found it."
Make small improvements with every change.

### 2. Strangler Fig Pattern
Gradually replace old system with new one.

### 3. Branch by Abstraction
Create abstraction layer, switch implementations behind it.

### 4. Parallel Change (Expand-Contract)
1. Expand: Add new interface alongside old
2. Migrate: Move callers to new interface
3. Contract: Remove old interface

## Modernization Patterns

### Dependency Updates
```bash
# Check outdated packages
npm outdated
pip list --outdated

# Update safely (test between each)
1. Update dev dependencies
2. Update patch versions
3. Update minor versions
4. Update major versions (careful!)
```

### Legacy Code Refactoring
1. Add characterization tests
2. Identify seams for testing
3. Extract dependencies
4. Refactor in small steps
5. Improve design incrementally

## Anti-Patterns to Avoid

❌ **Big Bang Refactoring**: Rewriting everything at once
❌ **Refactoring Without Tests**: High risk of breaking things
❌ **Mixing Refactoring with Features**: Do separately
❌ **Premature Optimization**: Optimize based on profiling
❌ **Over-Engineering**: Keep it simple

## Refactoring Checklist

### Before Refactoring
- [ ] Tests exist and pass
- [ ] Code is under version control
- [ ] Team is informed
- [ ] Clear goal identified
- [ ] Time allocated

### During Refactoring
- [ ] Make small changes
- [ ] Run tests frequently
- [ ] Commit often
- [ ] Keep code working
- [ ] Document decisions

### After Refactoring
- [ ] All tests pass
- [ ] Code review completed
- [ ] Performance verified
- [ ] Documentation updated
- [ ] Team notified

## Tools

- **IDE Refactoring Tools**: Built-in safe refactorings
- **SonarQube**: Code quality and technical debt tracking
- **CodeClimate**: Automated code review
- **Sourcery** (Python): AI-powered refactoring
- **Rector** (PHP): Automated refactoring

## Metrics

Track refactoring impact:
- Code complexity (cyclomatic complexity)
- Test coverage
- Code duplication
- Build time
- Defect rate

## When to Use This Skill

Use when:
- Code is difficult to understand or modify
- Adding features is slow
- Bug rate is high
- Test coverage is low
- Code smells are present
- Dependencies are outdated

---

## Changelog

### 1.0.0 (2026-02-20)
- Initial versioned release

## Handshake Protocol

If invoked with argument `hello`:
> 👋 Hello! I'm **Refactoring Strategy** v1.0.0. Refactoring techniques, code smells, design patterns, and safe refactoring workflows. Use `/refactoring-strategy hello ID` for the full guide.

If invoked with argument `hello ID`, respond with full skill information:
- **Name**: Refactoring Strategy v1.0.0
- **What it covers**: Interactive refactoring workflow with safety checks, testing, and rollback support. Safe refactoring patterns, technical debt reduction, and code modernization strategies
- **How to invoke**: `/refactoring-strategy` (Claude Code will load this skill as context)
- **Author**: Michel Abboud — https://github.com/michelabboud/claude-code-helper
- **License**: Apache-2.0

---

**Author**: [Michel Abboud](https://github.com/michelabboud)
**License**: Apache-2.0
**Repository**: [claude-code-helper](https://github.com/michelabboud/claude-code-helper)
**Issues & Discussions**: [GitHub Issues](https://github.com/michelabboud/claude-code-helper/issues)
