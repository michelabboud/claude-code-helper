---
command: /refactor
description: Interactive refactoring workflow with safety checks and testing
category: Development
priority: P1
allowed-tools: Read, Write, Edit, Grep, Glob, Bash
---

Perform safe, systematic code refactoring with automated testing and rollback support.

## Workflow

1. **Analyze** - Parse target code and build dependency graph
2. **Plan** - Show affected files and proposed changes
3. **Confirm** - Request user approval before proceeding
4. **Checkpoint** - Create git commit for safety
5. **Execute** - Perform the refactoring
6. **Test** - Run test suite to verify no regressions
7. **Report** - Summarize changes and results

## Supported Patterns

- `extract-method` - Extract code into a new function
- `extract-class` - Extract functionality into a new class
- `rename` - Rename variables, functions, classes across project
- `move` - Relocate code to different files/modules
- `inline` - Inline functions or variables
- `simplify` - Reduce complex logic
- `modernize` - Update to modern syntax (var→const, callbacks→async)
- `optimize` - Performance improvements

## Safety Requirements

- Verify tests pass before starting
- Create git checkpoint before changes
- Run tests after refactoring
- Provide rollback option if tests fail
- Show impact analysis before proceeding
