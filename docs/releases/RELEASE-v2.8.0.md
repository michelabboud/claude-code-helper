# Release v2.8.0 - Agent & Skill Auto-Update System

**Date:** 2026-02-21

---

## `references` Frontmatter Field

All 37 domain-expert agents and 12 MCP-integrated agents now include a `references` field with 2-4 official documentation URLs each, enabling automated knowledge refresh.

## New Skill: `/refresh`

Refresh agent knowledge from reference URLs:

- `/refresh status` — Show refresh status for all agents
- `/refresh <agent-name>` — Fetch latest docs and propose updates for a single agent
- `/refresh all` — Refresh all agents with references
- Always asks for user confirmation before modifying files
- Skill count: 22 -> 23

## `/update-check update` Command (v3.0.0)

- `/update-check update` — Update all outdated components
- `/update-check update <name>` — Update a specific component
- Automatic backup to `~/.claude/backups/components/` (keeps last 3)
- Downloads from GitHub without requiring a local clone
- MCP servers show manual build instructions (never auto-built)

## Weekly Auto-Refresh GitHub Action

- `.github/workflows/refresh-agents.yml` — Runs every Monday at 6 AM UTC (+ manual trigger)
- Fetches reference URLs, updates `## Latest Updates` sections
- Auto-creates PR via `peter-evans/create-pull-request`
- Conservative mode: only adds timestamped entries, no major rewrites

## CI Scripts

| Script | Purpose |
|--------|---------|
| `scripts/refresh-agent.mjs` | Fetch and structure reference URL findings |
| `scripts/refresh-agents-ci.mjs` | Conservative CI-mode refresh for automated PRs |
| `scripts/validate-references.mjs` | URL reachability validator for CI |
| `scripts/download-component.sh` | Download components from GitHub without a local clone |

## Schema Update

- **`component-versions.json` schema v2** — Now includes `references` array per component
- **Frontmatter validation** — `validate-frontmatter.mjs` validates `references` arrays (url, label, type) for both .md and .json agents

---

**Author:** [Michel Abboud](https://github.com/michelabboud)
**AI Assistance:** Claude (Anthropic)
**License:** Apache-2.0
