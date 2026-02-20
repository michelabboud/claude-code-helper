# Architecture Decision Records

This directory contains Architecture Decision Records (ADRs) for the claude-code-helper project.

An ADR documents a significant architectural decision: the context that motivated it, the decision itself, and its consequences.

## Index

| ADR | Title | Status | Date |
|-----|-------|--------|------|
| [001](001-mcp-shared-library.md) | MCP Shared Library Extraction | Accepted | 2026-02-20 |
| [002](002-per-component-versioning.md) | Per-Component Versioning System | Accepted | 2026-02-20 |
| [003](003-manifest-v2-design.md) | Manifest v2 Structure | Accepted | 2026-02-20 |
| [004](004-npm-workspaces.md) | npm Workspaces Monorepo | Accepted | 2026-02-20 |
| [005](005-ci-pipeline-design.md) | CI Pipeline Architecture | Accepted | 2026-02-20 |

## Format

Each ADR follows this structure:

- **Status**: Proposed / Accepted / Deprecated / Superseded
- **Context**: The situation and forces at play that prompted the decision
- **Decision**: The change being made and the rationale
- **Consequences**: Positive and negative outcomes of the decision

## Adding a New ADR

1. Copy the next available number in sequence
2. Use the filename format: `NNN-short-title.md`
3. Fill in all four sections
4. Add a row to the index table above

## References

- [ADR GitHub Organization](https://adr.github.io/)
- [Documenting Architecture Decisions - Michael Nygard](https://cognitect.com/blog/2011/11/15/documenting-architecture-decisions)
