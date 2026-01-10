---
command: /refactor
description: Interactive refactoring workflow with safety checks and testing
category: Development
priority: P1
allowed-tools: Read, Write, Edit, Grep, Glob, Bash
---

# /refactor Command

Safe, systematic refactoring with automated testing and rollback support.

## About Commands and Skills

**Note**: Claude Code v2.1+ unifies commands and skills under a single mental model. This command supports all skill frontmatter options including hooks, context forking, and agent specification. You can convert this to a skill format or keep it as a command - both work identically.

## Installation

### Option 1: Global Installation (Available in All Projects)

Copy this file to your Claude Code commands directory:

```bash
# Create the commands directory if it doesn't exist
mkdir -p ~/.claude/commands

# Copy the command file
cp refactor.md ~/.claude/commands/refactor.md
```

### Option 2: Project-Specific Installation

Copy this file to your project's `.claude/commands` directory:

```bash
# From your project root
mkdir -p .claude/commands

# Copy the command file
cp /path/to/refactor.md .claude/commands/refactor.md
```

### Option 3: Quick One-Liner

```bash
# Global install
curl -o ~/.claude/commands/refactor.md https://raw.githubusercontent.com/michelabboud/claude-code-helper/main/examples/commands/refactor.md

# Or project-specific
mkdir -p .claude/commands && curl -o .claude/commands/refactor.md https://raw.githubusercontent.com/michelabboud/claude-code-helper/main/examples/commands/refactor.md
```

### Verify Installation

After installation, the command will be available immediately (no restart required). Verify by typing:

```
/refactor
```

Claude Code will recognize the command and show its description.

## Usage

```
/refactor <pattern> <target> [options]
```

## Refactoring Patterns

### Code Extraction

#### `extract-method`
Extracts a block of code into a new method or function.

**When to use**:
- Duplicate code blocks that can be consolidated
- Long functions that need to be broken down
- Code with a clear single responsibility

**Considerations**:
- Parameter passing and return values
- Side effects and state mutations
- Naming the new function clearly

#### `extract-class`
Extracts related functionality into a new class.

**When to use**:
- Class has multiple unrelated responsibilities
- Group of functions operate on the same data
- Feature deserves its own abstraction

**Considerations**:
- Dependency injection patterns
- Interface definitions
- File organization

### Renaming and Moving

#### `rename`
Safely renames variables, functions, classes, or files across the project.

**When to use**:
- Names don't reflect current purpose
- Inconsistent naming conventions
- Typos or unclear abbreviations

**Considerations**:
- All references including strings and comments
- Export/import statements
- Documentation and tests

#### `move`
Relocates code to different files or modules.

**When to use**:
- Code is in the wrong module
- Circular dependency issues
- Better logical organization needed

**Considerations**:
- Import path updates
- Barrel file (index.ts) updates
- Avoiding circular dependencies

### Simplification

#### `inline`
Inlines functions or variables that add unnecessary indirection.

**When to use**:
- Function is only called once
- Variable adds no clarity
- Abstraction is premature

**Considerations**:
- Readability trade-offs
- Debugging implications
- Future extensibility

#### `simplify`
Reduces complex logic to clearer, more maintainable code.

**When to use**:
- Nested conditionals
- Complex boolean expressions
- Overly clever code

**Considerations**:
- Preserving edge cases
- Performance implications
- Test coverage

### Modernization and Optimization

#### `modernize`
Updates code to use modern language features and patterns.

**When to use**:
- Legacy syntax (var, callbacks, etc.)
- Deprecated APIs
- Outdated patterns

**Transformations include**:
- `var` → `const`/`let`
- Callbacks → async/await
- Class components → functional components
- CommonJS → ES modules

#### `optimize`
Improves performance without changing behavior.

**When to use**:
- Identified performance bottlenecks
- Inefficient algorithms
- Memory issues

**Considerations**:
- Benchmark before and after
- Readability vs performance trade-off
- Premature optimization risks

## Examples

### Basic Usage

```bash
# Extract a method from a function
/refactor extract-method src/utils/parser.ts parseHeaders

# Rename a function across the project
/refactor rename getUserData fetchUserProfile

# Modernize a directory
/refactor modernize src/legacy/

# Optimize a specific file
/refactor optimize src/utils/heavy-computation.ts
```

### With Options

```bash
# Dry run to preview changes
/refactor rename oldName newName --dry-run

# Skip test verification
/refactor extract-method src/api.ts helper --no-tests

# Limit scope to specific directory
/refactor modernize ./src --scope src/utils/

# Include related test files
/refactor move src/helpers.ts src/lib/helpers.ts --include-tests
```

### Pattern-Specific Examples

#### Extract Method
```bash
# Extract validation logic
/refactor extract-method src/forms/signup.ts validateEmail

# Extract with explicit line range
/refactor extract-method src/api/users.ts:45-67 processUserData
```

#### Rename
```bash
# Rename function
/refactor rename calculateTotal computeOrderTotal

# Rename class
/refactor rename UserService UserAccountService

# Rename file (updates all imports)
/refactor rename src/utils.ts src/helpers.ts
```

#### Extract Class
```bash
# Extract authentication logic into its own class
/refactor extract-class src/api/server.ts AuthenticationHandler

# Extract with interface generation
/refactor extract-class src/services/user.ts UserValidator --interface
```

#### Modernize
```bash
# Modernize entire codebase
/refactor modernize ./src

# Modernize specific patterns only
/refactor modernize ./src --only async,modules

# Target specific ECMAScript version
/refactor modernize ./src --target es2022
```

#### Optimize
```bash
# Optimize with profiling
/refactor optimize src/search.ts --profile

# Optimize for memory
/refactor optimize src/cache.ts --focus memory

# Optimize loops and iterations
/refactor optimize src/data-processing.ts --focus loops
```

## Options

### Common Options

| Option | Description |
|--------|-------------|
| `--dry-run` | Preview changes without applying them |
| `--no-tests` | Skip test verification (use with caution) |
| `--no-commit` | Don't create safety commits |
| `--scope <path>` | Limit refactoring to specific directory |
| `--include-tests` | Include related test files in refactoring |
| `--verbose` | Show detailed progress information |

### Safety Options

| Option | Description |
|--------|-------------|
| `--force` | Proceed even with failing tests (dangerous) |
| `--backup` | Create backup files before changes |
| `--rollback` | Undo the last refactoring operation |

### Pattern-Specific Options

#### For `modernize`
| Option | Description |
|--------|-------------|
| `--target <version>` | Target ECMAScript version (es2020, es2022, etc.) |
| `--only <patterns>` | Only apply specific modernizations |
| `--skip <patterns>` | Skip specific modernizations |

#### For `optimize`
| Option | Description |
|--------|-------------|
| `--profile` | Run profiler before and after |
| `--focus <area>` | Focus on: memory, cpu, loops, io |
| `--benchmark` | Run benchmarks to verify improvement |

#### For `rename`
| Option | Description |
|--------|-------------|
| `--case-sensitive` | Match case exactly |
| `--include-strings` | Also rename in string literals |
| `--include-comments` | Also rename in comments |

## Safety Features

✅ **Pre-flight checks**: Validates codebase state before starting
- Ensures working directory is clean (or stashes changes)
- Verifies tests exist and pass
- Checks for TypeScript/lint errors

✅ **Automated testing**: Runs test suite before and after
- Compares test results to catch regressions
- Reports any newly failing tests
- Validates type checking passes

✅ **Git integration**: Creates safety commits
- Commits before refactoring (checkpoint)
- Commits after successful refactoring
- Easy diff review of changes

✅ **Rollback support**: Easy undo if issues arise
- Use `--rollback` to undo last refactoring
- Git history preserved for manual rollback
- Stashed changes restored on failure

✅ **Impact analysis**: Shows affected files before proceeding
- Lists all files that will be modified
- Shows number of changes per file
- Warns about high-impact refactorings

✅ **Type checking**: Verifies types after changes
- Runs TypeScript compiler
- Reports any new type errors
- Ensures type safety maintained

## Workflow

The refactoring workflow follows these phases:

### 1. Analysis
```
📊 Analyzing refactoring target...
   - Parsing source files
   - Building dependency graph
   - Identifying affected code
```

### 2. Planning
```
📋 Refactoring Plan:
   - 5 files will be modified
   - 23 references will be updated
   - Estimated complexity: Medium
```

### 3. Confirmation
```
⚠️  The following changes will be made:

   src/utils/parser.ts
     - Extract lines 45-67 to new function 'parseHeaders'
     - Add import for new function

   src/api/handler.ts
     - Update 3 call sites

   Proceed? [y/N]
```

### 4. Execution
```
🔧 Executing refactoring...
   ✓ Modified src/utils/parser.ts
   ✓ Modified src/api/handler.ts
   ✓ Updated 3 references
```

### 5. Testing
```
🧪 Running test suite...
   ✓ 142 tests passed
   ✓ No regressions detected
   ✓ Type checking passed
```

### 6. Verification
```
✅ Refactoring complete!

   Summary:
   - 2 files modified
   - 1 new function created
   - All tests passing

   Git commits created:
   - abc1234: checkpoint before refactoring
   - def5678: refactor: extract parseHeaders function
```

## Expected Output

### Successful Refactoring
```
/refactor rename getUserData fetchUserProfile

🔍 Analyzing 'getUserData'...
   Found 12 references in 5 files

📋 Plan:
   src/api/users.ts        - 1 definition, 2 usages
   src/services/auth.ts    - 3 usages
   src/components/Profile.tsx - 2 usages
   src/hooks/useUser.ts    - 3 usages
   tests/api/users.test.ts - 1 usage

⚠️  Proceed with rename? [y/N] y

🔧 Executing...
   ✓ Renamed definition in src/api/users.ts
   ✓ Updated 11 references
   ✓ Updated 1 test file

🧪 Running tests...
   ✓ All 89 tests passed

✅ Successfully renamed 'getUserData' to 'fetchUserProfile'
```

### Dry Run Output
```
/refactor modernize ./src/legacy --dry-run

🔍 Analyzing ./src/legacy...
   Found 8 files with modernization opportunities

📋 Proposed Changes (dry run):

src/legacy/utils.js:
  Line 3:  var count = 0  →  let count = 0
  Line 12: var result = []  →  const result = []
  Line 24: function(cb) { ... }  →  async function() { ... }

src/legacy/api.js:
  Line 8:  require('axios')  →  import axios from 'axios'
  Line 15: module.exports  →  export default

... (6 more files)

Summary:
  - 23 var → const/let conversions
  - 8 callback → async/await conversions
  - 12 CommonJS → ES module conversions

No changes made (dry run mode)
```

## Troubleshooting

### Common Issues

**Tests fail after refactoring**
```bash
# Check what changed
git diff HEAD~1

# Rollback if needed
/refactor --rollback

# Or manually reset
git reset --hard HEAD~1
```

**Circular dependency introduced**
```bash
# Analyze dependencies
/refactor analyze-deps src/

# Move code to break cycle
/refactor move src/a.ts:utilFunction src/shared/utils.ts
```

**Type errors after rename**
```bash
# Check for string references not caught
grep -r "oldName" src/

# Use include-strings option
/refactor rename oldName newName --include-strings
```

**Too many files affected**
```bash
# Use scope to limit changes
/refactor rename commonName newName --scope src/feature/

# Or use dry-run first
/refactor rename commonName newName --dry-run
```

### Recovery Options

1. **Use rollback command**:
   ```bash
   /refactor --rollback
   ```

2. **Git reset to checkpoint**:
   ```bash
   git log --oneline  # Find checkpoint commit
   git reset --hard <commit>
   ```

3. **Restore from stash** (if changes were stashed):
   ```bash
   git stash list
   git stash pop
   ```

## Best Practices

### Before Refactoring

1. **Ensure tests pass** - Don't refactor broken code
2. **Commit current work** - Clean working directory
3. **Review the plan** - Use `--dry-run` first
4. **Start small** - Refactor incrementally

### During Refactoring

1. **One pattern at a time** - Don't combine multiple refactorings
2. **Keep scope focused** - Use `--scope` to limit blast radius
3. **Watch for warnings** - Pay attention to impact analysis

### After Refactoring

1. **Run full test suite** - Not just affected tests
2. **Review the diff** - Ensure changes look correct
3. **Test manually** - Verify critical paths work
4. **Update documentation** - If APIs changed

## Configuration

Create `.refactorrc.json` in your project root:

```json
{
  "defaultOptions": {
    "includeTests": true,
    "verbose": false
  },
  "modernize": {
    "target": "es2022",
    "skip": ["optional-chaining"]
  },
  "safety": {
    "requireTests": true,
    "requireCleanWorkdir": true,
    "createCommits": true
  },
  "ignore": [
    "node_modules",
    "dist",
    "*.generated.ts"
  ]
}
```

## Related Commands

- `/review` - Review code before refactoring
- `/test-generate` - Generate tests for refactored code
- `/document` - Update documentation after refactoring
- `/scaffold` - Generate new code structures

---

**Version**: 1.0.0
**Status**: Production Ready ✅
