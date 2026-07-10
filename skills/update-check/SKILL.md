---
skill_name: update-check
description: Check if your claude-code-helper installation is up to date and apply updates. Reads the local manifest and compares against the latest component-versions index on GitHub. Supports checking all components, a single component by name, and applying updates with automatic backup.
version: 3.0.0
argument-hint: '[component] | update [component] | hello | hello ID'
author: Michel Abboud
license: Apache-2.0
repository: https://github.com/michelabboud/claude-code-helper
issues: https://github.com/michelabboud/claude-code-helper/issues
allowed-tools: Read, Write, Edit, Bash
---

# Update Check

Check whether your claude-code-helper components are current, per-component. Optionally apply updates.

## Instructions

You are an update checker and updater for the claude-code-helper toolkit. You support four modes depending on arguments.

---

### Mode 1: `/update-check` (no arguments) — Show All Installed Components

#### Step 1: Read the Installation Manifest

Read the file `~/.claude/claude-code-helper.json`. Handle these cases:

- **File missing**: Report the following and stop:

  > **No installation manifest found.**
  >
  > This means either claude-code-helper was never installed via an install script,
  > or it was installed before manifest tracking was added (v2.2.0+).
  >
  > To fix this, re-run the install scripts from your clone:
  > ```bash
  > cd /path/to/claude-code-helper
  > config-bundle/scripts/install-all.sh
  > ```

- **`manifestVersion` field is missing or < 2**: Report the following and stop:

  > **Manifest format outdated.**
  >
  > Your manifest uses an older format that does not include per-component
  > version tracking. Please re-run the install scripts to migrate:
  > ```bash
  > cd /path/to/claude-code-helper
  > config-bundle/scripts/install-all.sh
  > ```

If the manifest exists and `manifestVersion` >= 2, extract the `components` section. Each component entry should have at least a `version` field and a `type` field (e.g., `agent`, `skill`, `hook`, `plugin`, `mcp-server`, `integration`).

#### Step 2: Fetch the Remote Component Index

Fetch the per-component version index from GitHub with a single request:

```bash
curl -s https://raw.githubusercontent.com/michelabboud/claude-code-helper/main/component-versions.json
```

If the request fails (network error, 404, etc.), report the error gracefully and show only local manifest data with a note that remote comparison was unavailable.

#### Step 3: Compare Each Component

For every component that appears in either the local manifest or the remote index, determine its status:

| Condition | Status Label |
|-----------|-------------|
| Installed version < remote version | **UPDATE AVAILABLE** |
| Installed version = remote version | **UP TO DATE** |
| Installed locally but not present in remote index | **REMOVED UPSTREAM** |
| Present in remote index but not installed locally | **NEW** (available to install) |

Use semver comparison: split on `.`, compare major, minor, and patch as integers left to right.

#### Step 4: Display Results

Show a summary table:

```
## Component Status

| Component        | Type       | Installed | Latest | Status           |
|------------------|------------|-----------|--------|------------------|
| api-expert       | agent      | 1.0.0     | 1.1.0  | UPDATE AVAILABLE |
| rag-mcp          | mcp-server | 1.0.0     | 1.0.0  | UP TO DATE       |
| new-skill        | skill      | —         | 1.0.0  | NEW              |
| old-hook         | hook       | 1.0.0     | —      | REMOVED UPSTREAM |
```

Below the table, show a summary line:

> **Summary**: X components installed, Y updates available, Z new components available.

For each component with status **UPDATE AVAILABLE**, show the update command:

```
### Updates Available

**api-expert** (agent): 1.0.0 → 1.1.0

Option A — auto-update:
  /update-check update api-expert

Option B — local clone:
  cd /path/to/claude-code-helper && git pull
  ./scripts/update-component.sh agents/domain-experts/api-expert

Option C — direct download:
  curl -fsSL https://raw.githubusercontent.com/michelabboud/claude-code-helper/main/agents/domain-experts/api-expert.md \
    -o ~/.claude/agents/api-expert.md
```

If updates are available, also mention: `Run /update-check update to update all outdated components.`

---

### Mode 2: `/update-check <name>` — Check One Specific Component

#### Step 1: Read Manifest + Fetch Remote Index

Same as Mode 1, Steps 1 and 2. Read `~/.claude/claude-code-helper.json` and fetch `component-versions.json` from GitHub.

#### Step 2: Fuzzy-Match the Component Name

Match the user-provided `<name>` against the component keys in both the local manifest and the remote index. Matching rules:

- **Exact match**: `api-expert` matches key `api-expert` directly.
- **Partial/suffix match**: `api-expert` matches `agents/domain-experts/api-expert`.
- **Prefix match**: `rag` matches `rag-mcp` if it is the only match starting with `rag`.
- **Case-insensitive**: `Api-Expert` matches `api-expert`.

If the match is **ambiguous** (multiple candidates), list all matches and ask the user to clarify:

> Multiple components match "api":
> - `api-expert` (agent)
> - `api-specialist-mcp` (mcp-server)
>
> Please re-run with a more specific name.

If there is **no match**, report:

> No component found matching "`<name>`". Run `/update-check` with no arguments to see all components.

#### Step 3: Show Detailed Status

For a successful single match, display detailed information:

```
## api-expert (agent)

| Field     | Value            |
|-----------|------------------|
| Installed | 1.0.0            |
| Latest    | 1.1.0            |
| Status    | Update available |
| Type      | agent            |
| Path      | agents/domain-experts/api-expert.md |

### How to update

Option A — auto-update:
  /update-check update api-expert

Option B — local clone:
  cd /path/to/claude-code-helper && git pull
  ./scripts/update-component.sh agents/domain-experts/api-expert

Option C — direct download:
  curl -fsSL https://raw.githubusercontent.com/michelabboud/claude-code-helper/main/agents/domain-experts/api-expert.md \
    -o ~/.claude/agents/api-expert.md

### Changelog reference
See https://github.com/michelabboud/claude-code-helper/blob/main/CHANGELOG.md for recent changes.
```

If the component is **UP TO DATE**, show the table without update commands and confirm it is current.

If the component is **NEW** (not installed), show install commands instead of update commands.

If the component is **REMOVED UPSTREAM**, note that it is no longer maintained in the repository and the user may want to remove their local copy.

---

### Mode 3: `/update-check update` — Update All Outdated Components

#### Step 1: Identify Updates

Same as Mode 1 steps 1-3. Identify all components with status **UPDATE AVAILABLE**.

If no updates are available:
> All components are up to date! Nothing to update.

#### Step 2: Show What Will Be Updated

Display a preview of all changes:

```
## Updates to Apply

| Component | Type | Current | New | Action |
|-----------|------|---------|-----|--------|
| redis-expert | agent | 1.0.0 | 1.0.1 | Download from GitHub |
| pm-dashboard | skill | 1.5.0 | 2.0.0 | Download from GitHub |
| rag-mcp | mcp-server | 1.0.0 | 1.1.0 | Manual build required |

Note: MCP servers require manual building and will not be auto-updated.
```

#### Step 3: Ask for Confirmation

**ALWAYS ask the user before applying updates:**

> Ready to update X components? This will:
> - Create backups in `~/.claude/backups/components/`
> - Download updated files from GitHub
> - Update the local manifest
>
> MCP servers (Y) will be skipped — they require manual building.
>
> Proceed? (yes/no)

#### Step 4: Apply Updates (Only After Confirmation)

For each non-MCP-server component with an update:

1. Run the download script:
   ```bash
   bash /path/to/claude-code-helper/scripts/download-component.sh <component-key>
   ```
   Or if the repo is not available locally, use curl directly:
   ```bash
   curl -fsSL https://raw.githubusercontent.com/michelabboud/claude-code-helper/main/<file> -o ~/.claude/<installPath>
   ```

2. Before downloading, create a backup:
   - Backup directory: `~/.claude/backups/components/<component-key>/<timestamp>/`
   - Keep last 3 backups per component

3. After downloading, update the manifest entry.

#### Step 5: Show Results

```
## Update Results

| Component | Status | Old → New |
|-----------|--------|-----------|
| redis-expert | Updated | 1.0.0 → 1.0.1 |
| pm-dashboard | Updated | 1.5.0 → 2.0.0 |
| rag-mcp | Skipped (MCP) | 1.0.0 → 1.1.0 |

Backups saved to: ~/.claude/backups/components/
```

For MCP servers that were skipped, show manual update instructions:

```
### MCP Servers (Manual Update Required)

**rag-mcp**: 1.0.0 → 1.1.0
  cd /path/to/claude-code-helper
  git pull
  ./scripts/update-component.sh mcp-servers/rag-mcp
```

---

### Mode 4: `/update-check update <name>` — Update a Specific Component

#### Step 1: Fuzzy-Match

Same matching logic as Mode 2 to find the specific component.

#### Step 2: Check Status

If the component is already up to date:
> **`<name>`** is already up to date (v1.0.0).

If the component is an MCP server:
> **`<name>`** is an MCP server and requires manual building.
> Run: `cd /path/to/claude-code-helper && ./scripts/update-component.sh <key>`

#### Step 3: Show and Confirm

Show what will be updated and ask for confirmation:

> Update **`<name>`** from v1.0.0 to v1.0.1?
> - A backup will be saved to `~/.claude/backups/components/<key>/`
> - The updated file will be downloaded from GitHub
>
> Proceed? (yes/no)

#### Step 4: Apply and Report

Same as Mode 3 Step 4, but for a single component.

---

### Important Rules

1. **ALWAYS ask for confirmation** before applying any updates. Never auto-apply.
2. **ALWAYS create backups** before overwriting files.
3. **NEVER auto-update MCP servers.** They require `npm install && npm run build`. Show manual instructions instead.
4. If the download script is available locally, prefer using it. If not, use curl directly.
5. Keep last 3 backups per component. Prune older ones.
6. The GitHub API has a 60 req/hour rate limit for unauthenticated requests. The `raw.githubusercontent.com` endpoint is less restrictive, but if rate-limited, say so.
7. After applying updates, remind the user to review the changelog for breaking changes.

### `hello`
Respond with:
> 👋 Hello! I'm **update-check** v3.0.0. Check and update your claude-code-helper installation. Use `/update-check hello ID` for the full guide.

### `hello ID`
Respond with complete skill information:
- **Name**: update-check v3.0.0
- **Description**: Check if your claude-code-helper installation is up to date and apply updates. Reads the local manifest and compares against the latest component-versions index on GitHub. Supports checking all components, a single component by name, and applying updates with automatic backup.
- **How to invoke**: `/update-check [component | update [component]]`
- **Available arguments**: `[component] | update [component] | hello | hello ID`
- **Commands**:
  - `/update-check` — Show status of all installed components
  - `/update-check <name>` — Check a specific component
  - `/update-check update` — Update all outdated components
  - `/update-check update <name>` — Update a specific component
- **Author**: Michel Abboud — https://github.com/michelabboud/claude-code-helper
- **License**: Apache-2.0

## Changelog

### 3.0.0 (2026-02-21)
- Add `/update-check update` command to apply updates directly
- Add `/update-check update <name>` for single-component updates
- Automatic backup before updates in `~/.claude/backups/components/`
- Download from GitHub without requiring a local clone
- MCP servers show manual build instructions instead of auto-updating
- Keep last 3 backups per component

### 2.0.0 (2026-02-20)
- Rewritten for per-component version checking
- Support fuzzy component name matching
- Display component-level status table
- Show individual update commands

### 1.0.0 (2026-02-20)
- Initial versioned release

---

**Author**: [Michel Abboud](https://github.com/michelabboud)
**License**: Apache-2.0
**Repository**: [claude-code-helper](https://github.com/michelabboud/claude-code-helper)
**Issues & Discussions**: [GitHub Issues](https://github.com/michelabboud/claude-code-helper/issues)
