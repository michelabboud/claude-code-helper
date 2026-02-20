# ADR 002: Per-Component Versioning System

- **Status**: Accepted
- **Date**: 2026-02-20
- **Author**: Michel Abboud

## Context

The repository started with a single monolithic version number (e.g., `2.2.0`) tracked in the root `package.json` and `CHANGELOG.md`. This created several problems for users:

- A version bump for a single agent change would appear as a whole-repo update, making it impossible to know which components actually changed
- Users who only installed a subset of components (e.g., only agents, not MCP servers) could not determine whether their installed components were current
- The `/update-check` mechanism would compare only the monolithic version, leading to false positives (reported update available when only unrelated components changed) and false negatives (no mechanism to know a specific component was patched)
- Selective updates were not possible; users had to re-run the full install to pick up any change

## Decision

Implement a per-component versioning system with three parts:

1. **`component-versions.json`** - A central index file at the repo root listing every distributable component (agents, skills, hooks, plugins, MCP servers) with its individual semantic version. This file is the authoritative source of component versions and is updated manually when a component changes.

2. **`/update-check` skill** - A Claude Code skill that fetches `component-versions.json` from the upstream repo and compares it against the user's installed manifest. Reports which specific components have updates available, their current vs. available versions, and provides the install command for each.

3. **`update-component.sh`** - A shell script that installs or updates a single named component by path, updating the local manifest on completion.

The manifest v2 format (see ADR 003) stores per-component version metadata, enabling this comparison.

## Consequences

**Positive:**
- 86 components are independently versioned; a patch to one agent does not imply a version bump for unrelated components
- A single HTTP request to fetch `component-versions.json` reveals the complete update picture
- Users can update individual components without re-running the full install suite
- Release notes can reference specific component version bumps, giving users precise change visibility

**Negative:**
- Manual version bump is required in `component-versions.json` whenever a component changes; forgetting this means users see no update notification
- 86 version numbers to maintain introduces non-trivial overhead during releases
- The `/update-check` skill requires network access; offline environments cannot use it
- Component versions are decoupled from git tags, so the repo tag and component versions may diverge
