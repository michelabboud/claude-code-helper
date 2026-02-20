---
skill_name: Testing Standards
description: Generate comprehensive test suites and write tests following TDD and best practices. Use when generating unit tests, integration tests, E2E tests, or API tests for any code.
category: Testing
priority: P1
argument-hint: '[target] [type]'
allowed-tools: Read, Write, Edit, Bash, Grep, Glob
agent: qa-testing-expert
---

# Testing Standards Skill

Comprehensive guide to writing and generating tests following industry best practices.

## Usage

```
/testing-standards src/utils/validation.ts unit
/testing-standards src/services/user-service
/testing-standards "user registration flow" e2e
/testing-standards /api/users api
```

## Test Types

| Type | Description | Speed | Scope |
|------|-------------|-------|-------|
| `unit` | Single functions/methods | Fast (<100ms) | Isolated |
| `integration` | Module interactions | Moderate | Connected |
| `e2e` | Complete user flows | Slow | Full stack |
| `api` | API endpoint tests | Moderate | HTTP layer |
| `component` | React/Vue component tests | Fast | UI layer |

## Test Structure (AAA Pattern)

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

## Test Categories

### Unit Tests
- Test single functions/methods
- Mock all dependencies
- Fast (<100ms per test)
- High coverage (80%+)

### Integration Tests
- Test component interactions
- Use test database
- Moderate speed
- Focus on critical paths

### E2E Tests
- Test complete user flows
- Use real browser
- Slower execution
- Test happy paths + critical error paths

### API Tests
- Test HTTP endpoints
- Verify status codes, response schemas
- Test auth flows
- Validate error responses

### Component Tests
- Test React/Vue components in isolation
- Use testing-library patterns
- Verify user interactions
- Test accessibility

## Generation Features

When generating tests, include:
- Edge case identification and coverage
- Mock generation for dependencies
- Realistic test data (factories/fixtures)
- Comprehensive assertions
- Test documentation (what each test verifies)

## Supported Frameworks

| Framework | Language | Use Case |
|-----------|----------|----------|
| Jest | JavaScript/TypeScript | General testing |
| Vitest | Vite projects | Fast ESM-native testing |
| pytest | Python | Python testing |
| RSpec | Ruby | Ruby testing |
| JUnit | Java | Java testing |

## Best Practices

1. **Descriptive Names**: `it('should return 401 when token is expired')`
2. **One Assert Per Concept**: Test one thing at a time
3. **Independent Tests**: No shared state between tests
4. **Use Factories**: Create test data with factories
5. **Mock External Services**: APIs, databases, file system
6. **Test Edge Cases**: null, undefined, empty, boundary values
7. **Coverage Targets**: Aim for 80%+ statement coverage on critical paths

## Example Output

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
        email: 'test@example.com',
        password: 'plain123',
      });
      expect(user.password).not.toBe('plain123');
      expect(user.password).toMatch(/^\$2[aby]\$/);
    });
  });
});
```

---

## Credits

**Author:** [Michel Abboud](https://github.com/michelabboud)
**AI Assistance:** Created with the help of Claude Code (Anthropic)
**License:** MIT
