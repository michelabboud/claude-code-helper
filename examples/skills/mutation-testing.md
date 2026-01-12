# Mutation Testing Skill

Comprehensive guide to mutation testing for measuring test suite effectiveness by introducing controlled bugs (mutations) and verifying that tests catch them.

## Overview

Mutation testing evaluates the quality of your tests by deliberately introducing small changes (mutations) to your code and checking if your tests fail. If tests pass despite mutations, it indicates gaps in test coverage or weak test assertions.


## 📦 Installation

Copy this skill to your Claude Code skills directory:

```bash
# Global installation (available to all projects)
mkdir -p ~/.claude/skills/mutation-testing
cp mutation-testing.md ~/.claude/skills/mutation-testing/SKILL.md

# Or project-specific installation
mkdir -p .claude/skills/mutation-testing
cp mutation-testing.md .claude/skills/mutation-testing/SKILL.md
```

The skill will be automatically detected and hot-reloaded by Claude Code.

**Usage**: Once installed, Claude Code will use this skill automatically when relevant to your requests.

## Core Concepts

### What is Mutation Testing?

```
Original Code:
  if (x > 0) return true

Mutant 1:
  if (x >= 0) return true    // Boundary mutation

Mutant 2:
  if (x < 0) return true     // Conditional mutation

Mutant 3:
  if (true) return true      // Constant mutation

Tests should KILL all mutants (fail when mutants are introduced)
If tests PASS with mutant → Test gap detected!
```

### Mutation Score

```
Mutation Score = (Killed Mutants / Total Mutants) × 100%

Example:
- 100 mutants generated
- 85 mutants killed by tests
- Mutation Score = 85%

Target: 80-90% mutation score for critical code
```

---

## 1. Stryker (JavaScript/TypeScript)

### Installation

```bash
npm install --save-dev @stryker-mutator/core
npx stryker init
```

### Configuration

```javascript
// stryker.config.json
{
  "$schema": "./node_modules/@stryker-mutator/core/schema/stryker-schema.json",
  "packageManager": "npm",
  "testRunner": "jest",
  "jest": {
    "projectType": "custom",
    "configFile": "jest.config.js",
    "enableFindRelatedTests": true
  },
  "reporters": ["html", "clear-text", "progress", "dashboard"],
  "coverageAnalysis": "perTest",
  "mutate": [
    "src/**/*.ts",
    "!src/**/*.spec.ts",
    "!src/**/*.test.ts",
    "!src/**/*.d.ts"
  ],
  "thresholds": {
    "high": 80,
    "low": 60,
    "break": 50
  },
  "timeoutMS": 30000,
  "maxConcurrentTestRunners": 4,
  "ignorePatterns": [
    "node_modules",
    "dist",
    "coverage"
  ]
}
```

### Running Stryker

```bash
# Run mutation testing
npx stryker run

# Run with specific files
npx stryker run --mutate "src/utils/calculator.ts"

# Incremental mode (only changed files)
npx stryker run --incremental

# Generate HTML report
npx stryker run --reporters html,clear-text
```

### Example: Testing Calculator

**Source Code:**
```typescript
// src/utils/calculator.ts
export class Calculator {
  add(a: number, b: number): number {
    return a + b
  }

  subtract(a: number, b: number): number {
    return a - b
  }

  multiply(a: number, b: number): number {
    return a * b
  }

  divide(a: number, b: number): number {
    if (b === 0) {
      throw new Error('Division by zero')
    }
    return a / b
  }

  isPositive(n: number): boolean {
    return n > 0
  }

  max(a: number, b: number): number {
    return a > b ? a : b
  }
}
```

**Weak Tests (Low Mutation Score):**
```typescript
// src/utils/calculator.weak.spec.ts
import { Calculator } from './calculator'

describe('Calculator - Weak Tests', () => {
  const calc = new Calculator()

  test('add should work', () => {
    expect(calc.add(2, 3)).toBe(5)
  })

  test('subtract should work', () => {
    expect(calc.subtract(5, 3)).toBe(2)
  })

  test('multiply should work', () => {
    expect(calc.multiply(2, 3)).toBe(6)
  })

  test('divide should work', () => {
    expect(calc.divide(6, 2)).toBe(3)
  })

  test('isPositive should work', () => {
    expect(calc.isPositive(5)).toBe(true)
  })

  test('max should work', () => {
    expect(calc.max(5, 3)).toBe(5)
  })
})

// Mutation Score: ~40-50%
// Many mutants survive because tests only check happy paths
```

**Strong Tests (High Mutation Score):**
```typescript
// src/utils/calculator.strong.spec.ts
import { Calculator } from './calculator'

describe('Calculator - Strong Tests', () => {
  const calc = new Calculator()

  describe('add', () => {
    test('adds positive numbers', () => {
      expect(calc.add(2, 3)).toBe(5)
    })

    test('adds negative numbers', () => {
      expect(calc.add(-2, -3)).toBe(-5)
    })

    test('adds zero', () => {
      expect(calc.add(5, 0)).toBe(5)
      expect(calc.add(0, 5)).toBe(5)
    })

    test('adds mixed signs', () => {
      expect(calc.add(5, -3)).toBe(2)
      expect(calc.add(-5, 3)).toBe(-2)
    })
  })

  describe('subtract', () => {
    test('subtracts positive numbers', () => {
      expect(calc.subtract(5, 3)).toBe(2)
    })

    test('subtracts resulting in negative', () => {
      expect(calc.subtract(3, 5)).toBe(-2)
    })

    test('subtracts zero', () => {
      expect(calc.subtract(5, 0)).toBe(5)
    })

    test('subtracts from zero', () => {
      expect(calc.subtract(0, 5)).toBe(-5)
    })
  })

  describe('multiply', () => {
    test('multiplies positive numbers', () => {
      expect(calc.multiply(2, 3)).toBe(6)
    })

    test('multiplies by zero', () => {
      expect(calc.multiply(5, 0)).toBe(0)
      expect(calc.multiply(0, 5)).toBe(0)
    })

    test('multiplies by one', () => {
      expect(calc.multiply(5, 1)).toBe(5)
    })

    test('multiplies negative numbers', () => {
      expect(calc.multiply(-2, 3)).toBe(-6)
      expect(calc.multiply(-2, -3)).toBe(6)
    })
  })

  describe('divide', () => {
    test('divides positive numbers', () => {
      expect(calc.divide(6, 2)).toBe(3)
    })

    test('divides negative numbers', () => {
      expect(calc.divide(-6, 2)).toBe(-3)
      expect(calc.divide(-6, -2)).toBe(3)
    })

    test('throws on division by zero', () => {
      expect(() => calc.divide(5, 0)).toThrow('Division by zero')
    })

    test('divides resulting in decimal', () => {
      expect(calc.divide(5, 2)).toBe(2.5)
    })

    test('divides zero', () => {
      expect(calc.divide(0, 5)).toBe(0)
    })
  })

  describe('isPositive', () => {
    test('returns true for positive numbers', () => {
      expect(calc.isPositive(5)).toBe(true)
      expect(calc.isPositive(0.1)).toBe(true)
    })

    test('returns false for negative numbers', () => {
      expect(calc.isPositive(-5)).toBe(false)
      expect(calc.isPositive(-0.1)).toBe(false)
    })

    test('returns false for zero', () => {
      expect(calc.isPositive(0)).toBe(false)
    })
  })

  describe('max', () => {
    test('returns first when larger', () => {
      expect(calc.max(5, 3)).toBe(5)
    })

    test('returns second when larger', () => {
      expect(calc.max(3, 5)).toBe(5)
    })

    test('returns either when equal', () => {
      expect(calc.max(5, 5)).toBe(5)
    })

    test('handles negative numbers', () => {
      expect(calc.max(-3, -5)).toBe(-3)
      expect(calc.max(3, -5)).toBe(3)
    })

    test('handles zero', () => {
      expect(calc.max(0, -5)).toBe(0)
      expect(calc.max(0, 5)).toBe(5)
    })
  })
})

// Mutation Score: ~85-95%
// Tests cover edge cases, boundaries, and error conditions
```

### Mutation Report Analysis

```
Stryker Mutation Report:

File: calculator.ts
Mutation Score: 87.5% (14/16 mutants killed)

Survived Mutants:
1. Line 3: return a + b → return a - b
   Status: SURVIVED
   Reason: No test verifies addition result with specific values

2. Line 27: a > b → a >= b
   Status: SURVIVED
   Reason: No test for equal values in max function

Recommendations:
✅ Add test: calc.max(5, 5) to kill boundary mutant
✅ Add assertion for specific addition values
```

---

## 2. PITest (Java/Kotlin)

### Maven Configuration

```xml
<!-- pom.xml -->
<plugin>
  <groupId>org.pitest</groupId>
  <artifactId>pitest-maven</artifactId>
  <version>1.15.3</version>
  <configuration>
    <targetClasses>
      <param>com.example.service.*</param>
    </targetClasses>
    <targetTests>
      <param>com.example.service.*Test</param>
    </targetTests>
    <outputFormats>
      <outputFormat>HTML</outputFormat>
      <outputFormat>XML</outputFormat>
    </outputFormats>
    <mutators>
      <mutator>DEFAULTS</mutator>
    </mutators>
    <timeoutConstant>5000</timeoutConstant>
    <threads>4</threads>
  </configuration>
</plugin>
```

### Running PITest

```bash
# Maven
mvn org.pitest:pitest-maven:mutationCoverage

# Gradle
./gradlew pitest
```

### Example: Java Service

```java
// src/main/java/com/example/UserValidator.java
public class UserValidator {

    public boolean isValidEmail(String email) {
        if (email == null || email.isEmpty()) {
            return false;
        }
        return email.contains("@") && email.contains(".");
    }

    public boolean isValidAge(int age) {
        return age >= 18 && age <= 120;
    }

    public boolean isStrongPassword(String password) {
        if (password == null || password.length() < 8) {
            return false;
        }

        boolean hasUpper = false;
        boolean hasLower = false;
        boolean hasDigit = false;

        for (char c : password.toCharArray()) {
            if (Character.isUpperCase(c)) hasUpper = true;
            if (Character.isLowerCase(c)) hasLower = true;
            if (Character.isDigit(c)) hasDigit = true;
        }

        return hasUpper && hasLower && hasDigit;
    }
}
```

**Strong Test Suite:**
```java
// src/test/java/com/example/UserValidatorTest.java
import org.junit.jupiter.api.Test;
import static org.junit.jupiter.api.Assertions.*;

class UserValidatorTest {
    private final UserValidator validator = new UserValidator();

    @Test
    void validEmailShouldReturnTrue() {
        assertTrue(validator.isValidEmail("user@example.com"));
    }

    @Test
    void emailWithoutAtShouldReturnFalse() {
        assertFalse(validator.isValidEmail("user.example.com"));
    }

    @Test
    void emailWithoutDotShouldReturnFalse() {
        assertFalse(validator.isValidEmail("user@examplecom"));
    }

    @Test
    void nullEmailShouldReturnFalse() {
        assertFalse(validator.isValidEmail(null));
    }

    @Test
    void emptyEmailShouldReturnFalse() {
        assertFalse(validator.isValidEmail(""));
    }

    @Test
    void validAgeShouldReturnTrue() {
        assertTrue(validator.isValidAge(25));
        assertTrue(validator.isValidAge(18)); // Boundary
        assertTrue(validator.isValidAge(120)); // Boundary
    }

    @Test
    void invalidAgeShouldReturnFalse() {
        assertFalse(validator.isValidAge(17));
        assertFalse(validator.isValidAge(121));
        assertFalse(validator.isValidAge(-1));
    }

    @Test
    void strongPasswordShouldReturnTrue() {
        assertTrue(validator.isStrongPassword("Password123"));
    }

    @Test
    void passwordWithoutUpperShouldReturnFalse() {
        assertFalse(validator.isStrongPassword("password123"));
    }

    @Test
    void passwordWithoutLowerShouldReturnFalse() {
        assertFalse(validator.isStrongPassword("PASSWORD123"));
    }

    @Test
    void passwordWithoutDigitShouldReturnFalse() {
        assertFalse(validator.isStrongPassword("Password"));
    }

    @Test
    void shortPasswordShouldReturnFalse() {
        assertFalse(validator.isStrongPassword("Pass12"));
    }

    @Test
    void nullPasswordShouldReturnFalse() {
        assertFalse(validator.isStrongPassword(null));
    }
}

// PITest Mutation Score: 92%
```

---

## 3. Mutmut (Python)

### Installation

```bash
pip install mutmut
```

### Running Mutmut

```bash
# Run mutation testing
mutmut run

# Show results
mutmut results

# Show specific mutant
mutmut show 1

# Apply mutant (for debugging)
mutmut apply 1
```

### Example: Python Module

```python
# src/calculator.py
class Calculator:
    def add(self, a: float, b: float) -> float:
        """Add two numbers."""
        return a + b

    def is_even(self, n: int) -> bool:
        """Check if number is even."""
        return n % 2 == 0

    def factorial(self, n: int) -> int:
        """Calculate factorial of n."""
        if n < 0:
            raise ValueError("Factorial not defined for negative numbers")
        if n == 0 or n == 1:
            return 1
        result = 1
        for i in range(2, n + 1):
            result *= i
        return result

    def find_max(self, numbers: list[int]) -> int | None:
        """Find maximum number in list."""
        if not numbers:
            return None
        max_num = numbers[0]
        for num in numbers[1:]:
            if num > max_num:
                max_num = num
        return max_num
```

**Comprehensive Tests:**
```python
# tests/test_calculator.py
import pytest
from src.calculator import Calculator

class TestCalculator:
    def setup_method(self):
        self.calc = Calculator()

    # Add tests
    def test_add_positive_numbers(self):
        assert self.calc.add(2, 3) == 5

    def test_add_negative_numbers(self):
        assert self.calc.add(-2, -3) == -5

    def test_add_zero(self):
        assert self.calc.add(5, 0) == 5
        assert self.calc.add(0, 5) == 5

    # Is even tests
    def test_even_number(self):
        assert self.calc.is_even(2) is True
        assert self.calc.is_even(4) is True

    def test_odd_number(self):
        assert self.calc.is_even(3) is False
        assert self.calc.is_even(5) is False

    def test_zero_is_even(self):
        assert self.calc.is_even(0) is True

    def test_negative_even(self):
        assert self.calc.is_even(-2) is True
        assert self.calc.is_even(-3) is False

    # Factorial tests
    def test_factorial_zero(self):
        assert self.calc.factorial(0) == 1

    def test_factorial_one(self):
        assert self.calc.factorial(1) == 1

    def test_factorial_positive(self):
        assert self.calc.factorial(5) == 120
        assert self.calc.factorial(3) == 6

    def test_factorial_negative_raises(self):
        with pytest.raises(ValueError, match="Factorial not defined"):
            self.calc.factorial(-1)

    # Find max tests
    def test_find_max_single_element(self):
        assert self.calc.find_max([5]) == 5

    def test_find_max_multiple_elements(self):
        assert self.calc.find_max([1, 5, 3, 2]) == 5

    def test_find_max_negative_numbers(self):
        assert self.calc.find_max([-1, -5, -3]) == -1

    def test_find_max_empty_list(self):
        assert self.calc.find_max([]) is None

    def test_find_max_duplicates(self):
        assert self.calc.find_max([5, 5, 3, 5]) == 5

# Mutmut Score: ~88%
```

---

## 4. Mutation Testing Best Practices

### 1. Focus on Critical Code

```javascript
// stryker.config.json - Target critical business logic
{
  "mutate": [
    "src/services/payment/**/*.ts",    // High priority
    "src/services/auth/**/*.ts",       // High priority
    "src/utils/validation/**/*.ts",    // Medium priority
    "!src/**/*.spec.ts"               // Exclude tests
  ]
}
```

### 2. Set Realistic Thresholds

```javascript
{
  "thresholds": {
    "high": 80,    // Critical code should reach 80%
    "low": 60,     // Acceptable for less critical code
    "break": 50    // CI fails below 50%
  }
}
```

### 3. Analyze Surviving Mutants

```typescript
// Example: Surviving mutant analysis
// Original:
function discount(price: number, percentage: number): number {
  return price * (1 - percentage / 100)
}

// Mutant survived: price * (1 + percentage / 100)
// Why? No test verified result decreases!

// Fix: Add assertion
test('discount reduces price', () => {
  const original = 100
  const discounted = discount(original, 10)
  expect(discounted).toBe(90)
  expect(discounted).toBeLessThan(original) // Kills mutant!
})
```

### 4. Incremental Mutation Testing

```bash
# Only test changed files
npx stryker run --incremental

# Use in CI for pull requests
if [ "$CI" = "true" ]; then
  npx stryker run --incremental --concurrency 2
fi
```

### 5. Integrate with CI/CD

```yaml
# .github/workflows/mutation-tests.yml
name: Mutation Testing

on:
  pull_request:
    branches: [main]
  schedule:
    - cron: '0 2 * * 0'  # Weekly on Sunday

jobs:
  mutation-tests:
    runs-on: ubuntu-latest
    timeout-minutes: 60

    steps:
      - uses: actions/checkout@v4

      - name: Setup Node.js
        uses: actions/setup-node@v4
        with:
          node-version: '20'
          cache: 'npm'

      - run: npm ci

      - name: Run mutation tests
        run: npx stryker run --incremental

      - name: Upload mutation report
        if: always()
        uses: actions/upload-artifact@v3
        with:
          name: mutation-report
          path: reports/mutation/

      - name: Comment PR with results
        if: github.event_name == 'pull_request'
        uses: actions/github-script@v6
        with:
          script: |
            const fs = require('fs')
            const report = JSON.parse(fs.readFileSync('reports/mutation/mutation.json'))
            const score = report.mutationScore

            github.rest.issues.createComment({
              issue_number: context.issue.number,
              owner: context.repo.owner,
              repo: context.repo.repo,
              body: `## Mutation Testing Results\n\n` +
                    `Mutation Score: **${score}%**\n\n` +
                    `- Killed: ${report.killed}\n` +
                    `- Survived: ${report.survived}\n` +
                    `- Timeout: ${report.timeout}\n` +
                    `- No Coverage: ${report.noCoverage}`
            })
```

---

## 5. Common Mutation Operators

### Arithmetic Operators
```
+ → -    (Addition to Subtraction)
- → +    (Subtraction to Addition)
* → /    (Multiplication to Division)
/ → *    (Division to Multiplication)
% → *    (Modulo to Multiplication)
```

### Relational Operators
```
> → >=   (Greater than to Greater or Equal)
>= → >   (Greater or Equal to Greater than)
< → <=   (Less than to Less or Equal)
== → !=  (Equal to Not Equal)
```

### Logical Operators
```
&& → ||  (AND to OR)
|| → &&  (OR to AND)
!  → ""  (Negation removal)
```

### Return Values
```
return true → return false
return 0 → return 1
return x → return x + 1
```

---

## When to Use This Skill

Invoke the Mutation Testing skill when:

1. **Measuring test quality** beyond code coverage
2. **Improving test suites** for critical business logic
3. **Identifying weak tests** that pass but don't verify behavior
4. **Ensuring boundary testing** is comprehensive
5. **Validating error handling** tests are effective
6. **Before major refactoring** to ensure tests are robust
7. **In CI/CD pipelines** for quality gates
8. **Training teams** on effective testing practices

---

## Related Resources

- **Testing Strategy**: `guides/advanced-patterns/testing-strategy.md`
- **TDD Workflow**: `examples/skills/tdd-workflow.md`
- **Code Quality**: `examples/skills/code-quality.md`

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
