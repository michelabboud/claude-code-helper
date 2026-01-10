---
command: /test-generate
description: Generate comprehensive test suites for existing code
category: Testing
priority: P1
---

# /test-generate Command

Automatically generate unit, integration, and E2E tests with high coverage.

## About Commands and Skills

**Note**: As of Claude Code v2.1+, commands and skills are unified concepts. This command benefits from the same frontmatter enhancements as skills - you can add hooks for pre-test validation, specify context forking for isolated test generation, or designate a specific testing agent to handle the work.

## Usage

```
/test-generate <target> [type]
```

## Test Types

- `unit` - Unit tests for functions/methods
- `integration` - Integration tests for modules
- `e2e` - End-to-end tests for user flows
- `api` - API endpoint tests
- `component` - React/Vue component tests

## Examples

```bash
# Generate unit tests for a file
/test-generate src/utils/validation.ts unit

# Generate tests for entire module
/test-generate src/services/user-service

# Generate E2E tests for user flow
/test-generate "user registration flow" e2e

# Generate API tests
/test-generate /api/users api
```

## Features

✅ **Edge case coverage**: Automatically identifies edge cases
✅ **Mock generation**: Creates mocks for dependencies
✅ **Test data**: Generates realistic test data
✅ **Assertions**: Includes comprehensive assertions
✅ **Documentation**: Explains what each test verifies

## Test Frameworks

Supports:
- Jest (JavaScript/TypeScript)
- Vitest (Vite projects)
- pytest (Python)
- RSpec (Ruby)
- JUnit (Java)

## Example Output

```typescript
describe('UserService', () => {
  describe('createUser', () => {
    it('should create user with valid data', async () => {
      // Test implementation
    })

    it('should throw error for duplicate email', async () => {
      // Test implementation
    })

    it('should hash password before saving', async () => {
      // Test implementation
    })
  })
})
```

---

**Version**: 1.0.0
