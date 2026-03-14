# Release v2.9.0 - Stable MCP Server Paths

**Date:** 2026-02-21

**MCP servers now install to `~/.claude/mcp-servers/` for stable paths independent of the repo clone location.**

---

## Overview

Previously, MCP server paths in Claude Desktop configuration pointed directly into the cloned repository (e.g., `/home/user/projects/claude-code-helper/mcp-servers/code-review-mcp/build/index.js`). This caused breakage when users moved, renamed, or re-cloned the repository. Starting with v2.9.0, all MCP servers are copied to `~/.claude/mcp-servers/` during installation, providing stable absolute paths that survive repo changes.

---

## Key Changes

### MCP Servers Install to `~/.claude/mcp-servers/`

- `install-all.sh` now builds each server in the repo, then copies the built output to `~/.claude/mcp-servers/<server-name>/`
- Claude Desktop configuration references `~/.claude/mcp-servers/` paths instead of repo-relative paths
- Servers work correctly regardless of where the repository is cloned

### mcp-shared Bundled as Local `file:` Dependency

- The shared MCP utility package (`mcp-shared`) is now bundled as a local `file:` dependency in each server's `package.json`
- This eliminates the need for symlinks or workspace-level `npm install`
- Each server is fully self-contained after installation

### component-versions.json `installPath` Updated

- The `installPath` field in `component-versions.json` now reflects the `~/.claude/mcp-servers/` installation directory
- Tooling that reads component metadata can locate installed servers without knowing the repo path

### Documentation Updated

- All references to MCP server paths updated across:
  - `README.md`
  - `CLAUDE.md`
  - `mcp-servers/README.md`
  - Individual server README files
  - Configuration examples

### Scripts Updated

- **`install-all.sh`** - Builds in repo, copies to `~/.claude/mcp-servers/`, generates config with stable paths
- **`update-component.sh`** - Rebuilds a single server in repo and syncs to `~/.claude/mcp-servers/`

---

## Migration

Users upgrading from earlier versions should re-run the install script:

```bash
cd mcp-servers
./install-all.sh
```

This will:
1. Build all servers in the repository
2. Copy built output to `~/.claude/mcp-servers/`
3. Print updated Claude Desktop configuration with the new paths

Update your `claude_desktop_config.json` with the printed configuration to switch to stable paths.

---

## Files Changed

| File | Changes |
|------|---------|
| `mcp-servers/install-all.sh` | Copies built servers to `~/.claude/mcp-servers/`, generates stable-path config |
| `scripts/update-component.sh` | Syncs single server builds to `~/.claude/mcp-servers/` |
| `mcp-servers/component-versions.json` | `installPath` updated to `~/.claude/mcp-servers/` |
| `mcp-servers/mcp-shared/` | Prepared for `file:` dependency bundling |
| `README.md` | Updated MCP path references |
| `CLAUDE.md` | Updated MCP path references and install instructions |
| `mcp-servers/README.md` | Updated paths and installation docs |
| `CHANGELOG.md` | v2.9.0 entry |
