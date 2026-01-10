---
command: /refactor
description: Interactive refactoring workflow with safety checks and testing
category: Development
priority: P1
---

# /refactor Command

Safe, systematic refactoring with automated testing and rollback support.

## About Commands and Skills

**Note**: Claude Code v2.1+ unifies commands and skills under a single mental model. This command supports all skill frontmatter options including hooks, context forking, and agent specification. You can convert this to a skill format or keep it as a command - both work identically.

## Usage

```
/refactor <target> [pattern]
```

## Refactoring Patterns

- `extract-method` - Extract code into a new method/function
- `extract-class` - Extract class from existing code
- `rename` - Rename variables, functions, classes safely
- `move` - Move code to different files/modules
- `inline` - Inline functions/variables
- `simplify` - Simplify complex logic
- `modernize` - Update to modern syntax/patterns
- `optimize` - Performance optimizations

## Examples

```bash
# Extract method from selected code
/refactor extract-method calculateTotal

# Rename across project
/refactor rename oldFunctionName newFunctionName

# Modernize code to latest syntax
/refactor modernize ./src

# Optimize performance
/refactor optimize ./src/utils/heavy-computation.ts
```

## Safety Features

✅ **Pre-flight checks**: Ensures tests exist and pass
✅ **Automated testing**: Runs tests before and after
✅ **Git integration**: Creates safety commits
✅ **Rollback support**: Easy undo if issues arise
✅ **Impact analysis**: Shows affected files
✅ **Type checking**: Verifies types after changes

## Workflow

1. **Analyze**: Identify refactoring opportunities
2. **Plan**: Show what will change
3. **Confirm**: User approval required
4. **Execute**: Perform refactoring
5. **Test**: Run test suite
6. **Verify**: Confirm success

---

**Version**: 1.0.0
