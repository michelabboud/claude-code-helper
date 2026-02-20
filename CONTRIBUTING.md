# Contributing to claude-code-helper

Thank you for your interest in contributing! This guide covers the development workflow, conventions, and submission process.

## Prerequisites

- **Node.js** >= 18.0.0
- **npm** >= 7 (for workspace support)
- **Git**
- **ShellCheck** (for bash script validation)

## Getting Started

```bash
# Clone the repository
git clone https://github.com/michelabboud/claude-code-helper.git
cd claude-code-helper

# Install all dependencies (single command for all 12 workspaces)
npm install

# Build the shared library (required before building servers)
npm run build-shared

# Build all MCP servers
npm run build:mcp

# Run all tests
npm run test:all
```

## Repository Structure

This is an **npm workspaces monorepo** with 12 packages:

| Package | Path | Description |
|---------|------|-------------|
| mcp-shared | `mcp-servers/mcp-shared` | Shared utilities for MCP servers |
| 10 MCP servers | `mcp-servers/*` | Specialized tool servers |
| trigger-matcher | `trigger-matcher` | File pattern matching library |

86 distributable components live in the root directories: `agents/`, `skills/`, `hooks/`, `plugins/`, `integrations/`.

## Development Workflow

### Running Tests

```bash
# All workspace tests
npm run test:all

# Specific workspace
npm run test:mcp-shared
npm run test:trigger-matcher

# Script tests (versioning infrastructure)
npm run test:scripts

# Linting (zero-tolerance — 0 errors, 0 warnings)
npm run lint

# Frontmatter validation
npm run validate
```

### Building

```bash
# Build shared library first (other servers depend on it)
npm run build-shared

# Build all MCP servers
npm run build:mcp

# Build a specific server
cd mcp-servers/code-review-mcp && npm run build
```

### Pre-commit Hooks

The repository uses **husky** + **lint-staged**. On commit, ESLint runs automatically on staged TypeScript files in `mcp-servers/` and `trigger-matcher/` with zero-warning tolerance.

## Adding Components

### Adding an Agent

1. Create a `.md` file in `agents/domain-experts/` with YAML frontmatter:

```yaml
---
name: my-agent
description: What this agent specializes in
version: 1.0.0
author: Your Name
license: Apache-2.0
repository: https://github.com/michelabboud/claude-code-helper
issues: https://github.com/michelabboud/claude-code-helper/issues
---
```

2. Add agent content (system prompt, tools, model preferences)
3. Add a `## Changelog` section at the bottom
4. Regenerate the version index: `npm run generate:versions`
5. Verify: `npm run validate`

### Adding a Skill

1. Create a directory in `skills/my-skill/` with a `SKILL.md` file
2. Follow the same frontmatter pattern as agents
3. Regenerate and validate as above

### Adding an MCP Server

1. Create directory in `mcp-servers/my-server/`
2. Add `package.json` with `"mcp-shared": "*"` dependency
3. Create `tsconfig.json` extending `../tsconfig.base.json`:

```json
{
  "extends": "../tsconfig.base.json",
  "compilerOptions": { "outDir": "./build", "rootDir": "./src" },
  "include": ["src/**/*"],
  "exclude": ["node_modules", "build"]
}
```

4. Use `runServer()` from mcp-shared (see `mcp-servers/mcp-shared/API.md`)
5. Add to the `workspaces` array in root `package.json`
6. Add to the CI matrix in `.github/workflows/ci.yml` (both build and test jobs)
7. Create a `CHANGELOG.md`

## Code Conventions

### TypeScript (MCP Servers)

- **Strict mode** enabled via `tsconfig.base.json`
- **ESLint** with zero-tolerance warnings
- Use `execFile()` (never `exec()`) for subprocess calls
- Use `sanitizePath()` with `basePath` for all user-provided file paths
- Use `sanitizeUrl()` for all user-provided URLs
- Use `generateRequestId()` and `measureDuration()` for request tracing
- Use `successResponse()`, `jsonResponse()`, `errorResponse()` for tool returns

### Bash Scripts

- Must pass **ShellCheck** at warning level
- Critical install scripts must pass at error level
- Use `set -euo pipefail` at the top
- Quote all variables

### Component Metadata

Every `.md` component must include:
- `version` in YAML frontmatter
- `author`, `license`, `repository`, `issues` fields
- `## Changelog` section with version history

## Versioning

- The **repository** has its own version in root `package.json` (e.g., `2.3.0`)
- Each **component** has an independent version in its frontmatter or `package.json`
- `component-versions.json` is the central index — regenerate with `npm run generate:versions`
- CI validates the index is in sync; commits that bump versions must also regenerate it

### Bumping a Version

1. Update the version in the component's source file
2. Update its `## Changelog` section
3. Run `npm run generate:versions`
4. Commit both the source file and `component-versions.json`

## CI Pipeline

The CI pipeline runs 13+ jobs on every push and PR to `main`:

- **Build**: All 10 MCP servers (matrix)
- **Test**: mcp-shared, 10 MCP servers (matrix), trigger-matcher, scripts
- **Quality**: ESLint, TypeScript type checking, frontmatter validation, version index sync
- **Security**: Secrets scan, npm audit
- **Performance**: Build benchmarks with trend detection
- **Validation**: ShellCheck, markdown link validation

Branch protection requires all key checks to pass before merging.

## Architecture Decisions

Key design decisions are documented as ADRs in `docs/decisions/`:

| ADR | Decision |
|-----|----------|
| 001 | Extract mcp-shared library |
| 002 | Per-component versioning |
| 003 | Manifest v2 design |
| 004 | npm workspaces monorepo |
| 005 | CI pipeline design |

When making significant architectural changes, add a new ADR following the template in the existing files.

## Submitting Changes

1. Fork the repository
2. Create a feature branch: `git checkout -b feature/my-change`
3. Make your changes following the conventions above
4. Run the full validation suite:
   ```bash
   npm run lint
   npm run validate
   npm run generate:versions
   npm run test:scripts
   npm run build:mcp
   ```
5. Commit with a descriptive message
6. Open a pull request against `main`

## License

By contributing, you agree that your contributions will be licensed under the **Apache-2.0** license.
