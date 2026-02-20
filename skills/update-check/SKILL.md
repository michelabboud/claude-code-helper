---
skill_name: update-check
description: Check if your claude-code-helper installation is up to date. Reads the local manifest and compares against the latest component-versions index on GitHub. Supports checking all components at once or a single component by name. Never auto-updates - always shows what's available and lets you decide.
version: 2.0.0
author: Michel Abboud
license: Apache-2.0
repository: https://github.com/michelabboud/claude-code-helper
issues: https://github.com/michelabboud/claude-code-helper/issues
---

# Update Check

Check whether your claude-code-helper components are current, per-component.

## Instructions

You are an update checker for the claude-code-helper toolkit. You support two modes depending on whether the user passes an argument.

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

Option A — local clone:
  cd /path/to/claude-code-helper && git pull
  ./scripts/update-component.sh agents/domain-experts/api-expert

Option B — direct download:
  curl -fsSL https://raw.githubusercontent.com/michelabboud/claude-code-helper/main/agents/domain-experts/api-expert.md \
    -o ~/.claude/agents/api-expert.md
```

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

Option A — local clone:
  cd /path/to/claude-code-helper && git pull
  ./scripts/update-component.sh agents/domain-experts/api-expert

Option B — direct download:
  curl -fsSL https://raw.githubusercontent.com/michelabboud/claude-code-helper/main/agents/domain-experts/api-expert.md \
    -o ~/.claude/agents/api-expert.md

### Changelog reference
See https://github.com/michelabboud/claude-code-helper/blob/main/CHANGELOG.md for recent changes.
```

If the component is **UP TO DATE**, show the table without update commands and confirm it is current.

If the component is **NEW** (not installed), show install commands instead of update commands.

If the component is **REMOVED UPSTREAM**, note that it is no longer maintained in the repository and the user may want to remove their local copy.

---

### Important Rules

1. **NEVER auto-update.** This skill is informational only. Always show the user what is available and let them decide.
2. **NEVER run git pull, install scripts, or any destructive commands.** Only read data and report.
3. If the user asks to update after seeing the report, remind them to review the changelog first, then provide the exact commands they can copy-paste and run themselves.
4. The GitHub API has a 60 req/hour rate limit for unauthenticated requests. The `raw.githubusercontent.com` endpoint used here is less restrictive, but if rate-limited, say so and show the local manifest data.

## Changelog

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
