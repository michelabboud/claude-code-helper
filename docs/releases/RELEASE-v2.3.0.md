# Release v2.3.0 - Per-Component Versioning & npm Workspaces

**86 independently versioned components, npm workspaces monorepo, and Architecture Decision Records.**

---

## Per-Component Versioning

Every distributable component now has `version: 1.0.0`, `author`, `license`, `repository`, and `issues` fields in frontmatter, plus a `## Changelog` section.

- `component-versions.json` central index tracking **86 components**: 46 agents, 19 skills, 10 MCP servers, 3 hooks, 6 plugins, 2 integrations
- `scripts/generate-version-index.mjs` generates the index from source files
- CI job `validate-version-index` ensures the index stays in sync

## Manifest v2

Rewritten `manifest-helper.sh` with new functions for per-component tracking:

- `register_component()` -- register a single component with version
- `register_all_installed()` -- batch registration of all installed components
- `ensure_manifest_v2()` -- upgrade legacy manifest format
- Manifest format: `manifestVersion: 2`, per-component `installed` map, `_legacyComponents` for backward compatibility

## `/update-check` Skill v2.0.0

Complete rewrite for per-component checking:

- Two modes: all-components table and single-component detail view with changelog
- Fuzzy name matching for component lookup
- Fetches `component-versions.json` from GitHub (single request, no API rate limit)
- Four status outcomes: **UPDATE AVAILABLE**, **UP TO DATE**, **REMOVED UPSTREAM**, **NEW**

## npm Workspaces Monorepo

- Root `package.json` declares 12 workspaces (mcp-shared + 10 MCP servers + trigger-matcher)
- Single `npm install` replaces 12 separate installs; common dependencies hoisted
- `mcp-shared` referenced as `"*"` workspace dependency (replaces `file:../mcp-shared`)
- `mcp-servers/tsconfig.base.json` shared TypeScript config; 11 `tsconfig.json` files now extend it
- New aggregate scripts: `build:mcp`, `test:all`, `test:scripts`

## Architecture Decision Records

5 ADRs in `docs/decisions/`:

1. **ADR-001** -- mcp-shared extraction
2. **ADR-002** -- Per-component versioning
3. **ADR-003** -- Manifest v2 design
4. **ADR-004** -- npm workspaces
5. **ADR-005** -- CI pipeline design

Standard format: Status, Context, Decision, Consequences.

## Script Tests

56 tests across 3 test files:

| Test suite | Assertions | Scope |
|-----------|------------|-------|
| `generate-version-index.test.mjs` | 31 | Output schema, component counts, field presence, version format |
| `manifest-helper.test.sh` | 19 | v2 manifest functions, component registration, idempotency |
| `update-component.test.sh` | 6 | CLI contract, error handling |

Run all with `npm run test:scripts`.

---

## Version History

| Version | Date | Focus |
|---------|------|-------|
| v2.1.0 | 2026-02-20 | PM Expert Expansion & Monitoring Dashboard |
| v2.2.0 | 2026-02-20 | Versioning & Self-Update |
| v2.3.0 | 2026-02-20 | **Per-Component Versioning & npm Workspaces** |

---

## Credits

**Author:** [Michel Abboud](https://github.com/michelabboud)
**AI Assistance:** Claude (Anthropic)
**License:** Apache-2.0

---

**"86 components, each with its own version and story"**
