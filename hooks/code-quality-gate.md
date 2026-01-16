---
hook_name: Code Quality Gate Hook
event: PreToolUse
description: Enforce code quality standards before code operations
priority: P1
---

# Code Quality Gate Hook

Automatic quality enforcement to maintain code standards and prevent technical debt.

## Trigger Event

`PreToolUse` - Runs before Write or Edit tool operations

## Hook Timeout

Hooks have a **10-minute timeout** (extended from 60 seconds in earlier versions), providing ample time for comprehensive quality checks, linting, formatting, and test execution.

## Deployment Options

### Option 1: Standalone Hook File
Place in `~/.claude/hooks/code-quality-gate.md` or `.claude/hooks/code-quality-gate.md`

### Option 2: Frontmatter Hook (Inline)
Define directly in agent, skill, or command frontmatter for context-specific quality enforcement:

```yaml
---
name: strict-typescript-skill
hooks:
  PreToolUse: |
    # Enforce strict quality for TypeScript files
    if [[ "$FILE_PATH" == *.ts ]] || [[ "$FILE_PATH" == *.tsx ]]; then
      # Check complexity
      npx eslint "$FILE_PATH" --rule "complexity: [error, 10]"
      if [ $? -ne 0 ]; then
        echo "❌ Code quality gate failed: Complexity too high"
        exit 1
      fi
    fi
---
```

This allows skills to enforce their own quality standards without affecting global hooks.

## Quality Checks

### Code Complexity
- Cyclomatic complexity threshold
- Cognitive complexity limit
- Function length limits
- Class size limits
- Nesting depth

### Code Style
- Linting rules (ESLint, Pylint)
- Formatting (Prettier, Black)
- Naming conventions
- Import organization
- Comment quality

### Type Safety
- TypeScript strict mode
- Type coverage percentage
- Any type usage
- Type assertion usage

### Test Coverage
- Line coverage minimum
- Branch coverage minimum
- Function coverage minimum
- New code coverage requirement

## Configuration

```json
{
  "enabled": true,
  "thresholds": {
    "complexity": 10,
    "line_length": 100,
    "function_length": 50,
    "test_coverage": 80
  },
  "enforce": {
    "linting": true,
    "formatting": true,
    "types": true,
    "tests": true
  }
}
```

## Example Output

```
❌ Code Quality Gate Failed

Issues Found:
1. [BLOCKER] Function exceeds complexity limit
   - File: src/services/user.ts:45
   - Complexity: 15 (limit: 10)
   - Suggestion: Extract method or simplify logic

2. [ERROR] Test coverage below threshold
   - Current: 65% (required: 80%)
   - Missing coverage in: src/utils/validation.ts

3. [WARNING] TypeScript 'any' type usage
   - File: src/types/index.ts:12
   - Use specific type instead

Action: BLOCKED - Fix issues to proceed
```

---

**Version**: 1.0.0
