---
hook_name: Build Validation Hook
event: PrePush
description: Validate build succeeds before push to remote
priority: P1
---

# Build Validation Hook

Ensure code builds successfully before pushing to prevent broken builds in CI/CD.

## Trigger Event

`PrePush` - Runs before `git push` operations

## Hook Timeout

Hooks have a **10-minute timeout** (extended from 60 seconds in earlier versions), ensuring sufficient time for full builds, test suites, and comprehensive validation before pushing code.

## Deployment Options

### Option 1: Standalone Hook File
Place in `~/.claude/hooks/build-validation.md` or `.claude/hooks/build-validation.md`

### Option 2: Frontmatter Hook (Inline)
Define directly in command or skill frontmatter for context-specific build validation:

```yaml
---
name: deploy-command
hooks:
  PrePush: |
    # Validate build before deployment push
    echo "🔨 Running build validation..."
    npm run build
    if [ $? -ne 0 ]; then
      echo "❌ Build failed - push blocked"
      exit 1
    fi
    npm test
    if [ $? -ne 0 ]; then
      echo "❌ Tests failed - push blocked"
      exit 1
    fi
    echo "✅ Build validation passed"
---
```

This approach is particularly useful for deployment commands that require guaranteed build success.

## Validation Steps

### 1. Build Compilation
```
🔨 Running build...
✅ TypeScript compilation successful
✅ Webpack bundle created
✅ No build errors
```

### 2. Type Checking
```
🔍 Type checking...
✅ No type errors found
✅ All imports resolved
```

### 3. Linting
```
🧹 Linting code...
✅ ESLint passed
✅ No linting errors
```

### 4. Tests
```
🧪 Running tests...
✅ All tests passed (127 tests)
⏱️  Completed in 8.3s
```

### 5. Bundle Size
```
📦 Checking bundle size...
✅ Bundle size: 245 KB (limit: 500 KB)
✅ Within budget
```

## Configuration

```json
{
  "enabled": true,
  "checks": {
    "build": true,
    "types": true,
    "lint": true,
    "test": true,
    "bundle_size": true
  },
  "bundle_size_limit": "500kb",
  "fail_on_warnings": false
}
```

## Example Failure

```
❌ Build Validation Failed

Build Errors:
- src/components/Dashboard.tsx(45,12): 
  Property 'data' does not exist on type 'Props'

Type Errors: 1
Test Failures: 0
Lint Warnings: 3

Push BLOCKED. Fix errors and try again.

Hint: Run 'npm run build' locally to see full errors
```

---

**Version**: 1.0.0
