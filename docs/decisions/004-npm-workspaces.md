# ADR 004: npm Workspaces Monorepo

- **Status**: Accepted
- **Date**: 2026-02-20
- **Author**: Michel Abboud

## Context

The repository contains 11 separate npm projects:

- `mcp-servers/mcp-shared` (shared library)
- 9 MCP servers (`mcp-servers/api-specialist-mcp`, `mcp-servers/code-review-mcp`, etc.)
- `trigger-matcher` (file pattern matching library)

Each project had its own `node_modules` directory and `package.json`. This caused:

- **Slow installs**: CI ran `npm install` 11 times sequentially, spending the majority of pipeline time on dependency resolution
- **Duplicate dependencies**: TypeScript, `@modelcontextprotocol/sdk`, `zod`, and `jest` were installed 10+ times, consuming significant disk space
- **Version drift**: Each server could pin different versions of shared dependencies, causing subtle compatibility bugs
- **No cross-project references**: `mcp-shared` had to be published or symlinked manually; `npm link` was fragile and not reproducible in CI

## Decision

Adopt npm workspaces with a root `package.json` declaring all projects as workspace members:

```json
{
  "workspaces": [
    "mcp-servers/mcp-shared",
    "mcp-servers/api-specialist-mcp",
    "mcp-servers/code-review-mcp",
    "...",
    "trigger-matcher"
  ]
}
```

MCP servers reference `mcp-shared` using the `*` version specifier (npm resolves it from the workspace):

```json
{
  "dependencies": {
    "mcp-shared": "*"
  }
}
```

A single `npm install` from the repository root installs all dependencies, hoists common packages to the root `node_modules`, and creates symlinks for workspace packages. The root `package.json` also defines aggregate scripts: `npm run build` builds all servers in dependency order, `npm test` runs all test suites.

## Consequences

**Positive:**
- Single `npm install` from root replaces 11 separate installs; CI install time reduced significantly
- Common dependencies (`typescript`, `zod`, `jest`) are hoisted and shared, eliminating redundant copies
- `mcp-shared` is automatically linked as a workspace package; no manual `npm link` or publishing required
- Consistent dependency versions enforced across all servers via the root `package-lock.json`
- Aggregate `build` and `test` scripts simplify both local development and CI configuration

**Negative:**
- Requires npm 7 or higher; older npm versions do not support workspaces
- Hoisting can cause phantom dependency issues where a package is accessible without being declared as a direct dependency; this must be caught by strict TypeScript imports
- The root `node_modules` can become large; clean installs in space-constrained environments may be slower than per-project installs
- Workspace `*` version pins mean all servers always use the latest local `mcp-shared`; a breaking change in `mcp-shared` breaks all servers simultaneously and must be coordinated
