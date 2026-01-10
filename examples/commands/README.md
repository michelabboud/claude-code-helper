# Claude Code Commands

Ready-to-use slash commands for Claude Code that extend its capabilities with specialized workflows.

## Available Commands

| Command | Description | Category |
|---------|-------------|----------|
| `/refactor` | Safe refactoring with testing and rollback | Development |
| `/scaffold` | Generate project scaffolding and boilerplate | Development |
| `/test-generate` | Generate comprehensive test suites | Testing |
| `/review` | Comprehensive code review | Quality |
| `/document` | Add documentation and comments | Documentation |

## Installation

### Install All Commands (Global)

```bash
# Create commands directory
mkdir -p ~/.claude/commands

# Copy all commands
cp *.md ~/.claude/commands/
```

### Install All Commands (Project-Specific)

```bash
# From your project root
mkdir -p .claude/commands
cp /path/to/examples/commands/*.md .claude/commands/
```

### Install Single Command

```bash
# Global
cp refactor.md ~/.claude/commands/

# Project-specific
mkdir -p .claude/commands && cp refactor.md .claude/commands/
```

### Quick Install via curl

```bash
# Install all commands globally
mkdir -p ~/.claude/commands
for cmd in refactor scaffold test-generate review document; do
  curl -sO ~/.claude/commands/${cmd}.md \
    https://raw.githubusercontent.com/michelabboud/claude-code-helper/main/examples/commands/${cmd}.md
done
```

### Verify Installation

Commands are available immediately (no restart needed):

```
/refactor
```

Claude Code will recognize the command and show its description.

---

## Command Reference

### /refactor

Safe, systematic refactoring with automated testing and rollback support.

#### Usage

```
/refactor <pattern> <target> [options]
```

#### Patterns

| Pattern | Description |
|---------|-------------|
| `extract-method` | Extract code into a new function |
| `extract-class` | Extract functionality into a new class |
| `rename` | Rename variables, functions, classes across project |
| `move` | Relocate code to different files/modules |
| `inline` | Inline functions or variables |
| `simplify` | Reduce complex logic |
| `modernize` | Update to modern syntax (var→const, callbacks→async) |
| `optimize` | Performance improvements |

#### Examples

```bash
# Extract a method
/refactor extract-method src/utils/parser.ts parseHeaders

# Rename across project
/refactor rename getUserData fetchUserProfile

# Modernize legacy code
/refactor modernize src/legacy/

# Optimize performance
/refactor optimize src/utils/heavy-computation.ts
```

#### Options

| Option | Description |
|--------|-------------|
| `--dry-run` | Preview changes without applying |
| `--no-tests` | Skip test verification |
| `--no-commit` | Don't create safety commits |
| `--scope <path>` | Limit to specific directory |
| `--include-tests` | Include related test files |
| `--rollback` | Undo last refactoring |

#### Workflow

1. **Analyze** - Parse target and build dependency graph
2. **Plan** - Show affected files and changes
3. **Confirm** - Request user approval
4. **Checkpoint** - Create git safety commit
5. **Execute** - Perform refactoring
6. **Test** - Run test suite
7. **Report** - Summarize results

#### Safety Features

- Pre-flight validation (clean workdir, passing tests)
- Git checkpoint before changes
- Automated test verification
- Rollback support
- Impact analysis

---

### /scaffold

Generate project scaffolding with best practices and boilerplate code.

#### Usage

```
/scaffold <project-type> [name] [options]
```

#### Project Types

**Frontend**: `react-app`, `nextjs-app`, `vue-app`, `vite-app`

**Backend**: `express-api`, `nestjs-api`, `fastapi-app`, `django-app`

**Full-Stack**: `mern-stack`, `t3-stack`, `python-fullstack`

**Mobile**: `react-native`, `expo-app`

**Other**: `node-package`, `python-package`, `monorepo`

#### Examples

```bash
# Basic React app
/scaffold react-app my-app

# Next.js with all the bells
/scaffold nextjs-app my-saas --typescript --tailwind --auth --database postgres

# Quick API
/scaffold express-api user-service --typescript --docker
```

#### Options

| Option | Description |
|--------|-------------|
| `--typescript` | Use TypeScript |
| `--eslint` | Include ESLint |
| `--prettier` | Include Prettier |
| `--docker` | Include Docker setup |
| `--auth` | Include authentication |
| `--database <type>` | Database setup (postgres, mysql, mongodb) |
| `--testing` | Include test setup |
| `--ci` | Include CI/CD workflow |

---

### /test-generate

Automatically generate comprehensive test suites.

#### Usage

```
/test-generate <target> [type]
```

#### Test Types

| Type | Description |
|------|-------------|
| `unit` | Unit tests for functions/methods |
| `integration` | Integration tests for modules |
| `e2e` | End-to-end tests for user flows |
| `api` | API endpoint tests |
| `component` | React/Vue component tests |

#### Examples

```bash
# Unit tests for a file
/test-generate src/utils/validation.ts unit

# Tests for entire module
/test-generate src/services/user-service

# E2E tests
/test-generate "user registration flow" e2e

# API tests
/test-generate /api/users api
```

#### Features

- Edge case identification
- Mock generation
- Realistic test data
- Comprehensive assertions
- Test documentation

#### Supported Frameworks

Jest, Vitest, pytest, RSpec, JUnit

---

### /review

Comprehensive code review with security, quality, and performance analysis.

#### Usage

```
/review [target]
```

#### Examples

```bash
# Review current changes
/review

# Review specific file
/review src/api/auth.ts

# Review directory
/review src/services/
```

#### Analysis Areas

- **Security**: Vulnerabilities, injection risks, auth issues
- **Quality**: Code smells, complexity, maintainability
- **Performance**: Bottlenecks, memory issues, optimization opportunities
- **Best Practices**: Patterns, conventions, documentation

---

### /document

Add comprehensive documentation to code.

#### Usage

```
/document [target]
```

#### Examples

```bash
# Document a file
/document src/utils/helpers.ts

# Document a function
/document src/api/users.ts:createUser

# Document entire module
/document src/services/
```

#### Documentation Types

- JSDoc/TSDoc comments
- Inline comments for complex logic
- README updates
- API documentation
- Usage examples

---

## Troubleshooting

### Command Not Found

```bash
# Verify file exists
ls ~/.claude/commands/

# Check file has .md extension
# Commands must be .md files
```

### Command Not Working as Expected

- Ensure frontmatter is valid YAML
- Check `allowed-tools` includes needed tools
- Verify command content is clear instructions

### Changes Not Taking Effect

Commands hot-reload automatically. If issues persist:
- Check file was saved correctly
- Verify no syntax errors in frontmatter

---

## Creating Custom Commands

### Basic Structure

```markdown
---
description: What this command does
allowed-tools: Read, Write, Edit, Bash
---

Clear instructions for Claude to follow when this command is invoked.
```

### Frontmatter Options

| Field | Description |
|-------|-------------|
| `command` | Command name (optional, defaults to filename) |
| `description` | Short description shown in command list |
| `category` | Grouping category |
| `priority` | P0-P3 priority level |
| `allowed-tools` | Tools Claude can use |
| `hooks` | Inline hook definitions |
| `context` | `fork` for isolated execution |
| `agent` | Specify agent type |

### Best Practices

1. **Keep it focused** - One command, one purpose
2. **Be specific** - Clear, unambiguous instructions
3. **List steps** - Numbered workflow helps consistency
4. **Specify tools** - Use `allowed-tools` to limit scope
5. **Stay lean** - Put docs in README, not the command

---

## Configuration

### Command Priority

Commands can specify priority for ordering:
- `P0` - Critical/frequent use
- `P1` - High priority
- `P2` - Normal priority
- `P3` - Low priority

### Tool Restrictions

Limit what tools a command can use:

```yaml
allowed-tools: Read, Grep, Glob  # Read-only command
```

Common tool sets:
- **Read-only**: `Read, Grep, Glob`
- **Edit files**: `Read, Write, Edit`
- **Full access**: `Read, Write, Edit, Grep, Glob, Bash`

---

## Related Resources

- [Skills Examples](../skills/) - Reusable skill definitions
- [Agents Examples](../agents/) - Agent configurations
- [Hooks Examples](../hooks/) - Event automation
- [Complete Guide](../../guides/complete-guide/) - Full Claude Code guide

---

## Credits

These commands are part of the [claude-code-helper](https://github.com/michelabboud/claude-code-helper) project.

**Author**: Michel Abboud ([@michelabboud](https://github.com/michelabboud))

**Contributors**: Contributions welcome! See the main repository for guidelines.

**License**: MIT

---

**Version**: 1.0.0
