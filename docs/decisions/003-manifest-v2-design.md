# ADR 003: Manifest v2 Structure

- **Status**: Accepted
- **Date**: 2026-02-20
- **Author**: Michel Abboud

## Context

Install scripts write a local manifest (`~/.claude/claude-code-helper-manifest.json`) to record what the user has installed. The original v1 format tracked installed categories as blobs:

```json
{
  "installedCategories": ["agents", "skills"],
  "repoVersion": "2.1.0",
  "installedAt": "2025-01-01T00:00:00Z"
}
```

This design had critical limitations:

- No per-component version tracking; impossible to know which version of a specific agent was installed
- Category-level granularity made selective updates impossible
- Parsing required `jq`, which is not universally available on user systems
- No migration path; old manifests were silently ignored or caused errors

## Decision

Define manifest version 2 with the following structure:

```json
{
  "manifestVersion": 2,
  "repoVersion": "2.2.0",
  "updatedAt": "2026-02-20T00:00:00Z",
  "installed": {
    "agents/domain-experts/backend-engineer.md": "1.2.0",
    "skills/commit/SKILL.md": "1.0.3"
  },
  "_legacyComponents": ["agents", "skills"]
}
```

Key design choices:

- **`installed` map keyed by repo-relative paths** - Each installed file has an entry with its component version at install time. The key is the path as it appears in `component-versions.json`, enabling direct lookup.
- **`_legacyComponents` for backward compatibility** - When migrating from v1, the old `installedCategories` array is preserved under this key so tooling can reason about what categories were previously installed, even without per-file data.
- **jq-free JSON via `node -e`** - All manifest read/write operations use inline Node.js (`node -e "..."`) rather than `jq`, avoiding a dependency that many users lack. The scripts include a minimal JSON merge/update utility implemented in Node.js.
- **`manifestVersion` field** - Enables future migration logic; install scripts check this field and run the appropriate migration path.

## Consequences

**Positive:**
- Users can track exactly which version of every component they have installed
- Install scripts register individual components, enabling precise diff against `component-versions.json`
- Old manifests are auto-migrated: v1 manifests are detected by absence of `manifestVersion` and upgraded in place, preserving `_legacyComponents` data
- No `jq` dependency; works on any system with Node.js (already required for MCP servers)

**Negative:**
- The `installed` map can grow large for users who install all 86 components; the file may reach 10-15 KB
- Repo-relative path keys are brittle if files are renamed or moved between releases; a rename breaks the version lookup silently
- Migration from v1 produces incomplete data (no per-component versions for previously installed items) that persists until the user reinstalls each component
