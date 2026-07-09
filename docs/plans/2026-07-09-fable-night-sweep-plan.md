# Fable Night Sweep — claude-code-helper — 2026-07-09

Scope: fleet-wide health sweep, with a specific ask to check the
update-check/manifest machinery's coherence. Node repo, `node_modules`
present — ran the existing `npm run test:scripts` (no installs).

## Health Snapshot

- `VERSION` / `package.json` / `component-versions.json` all agree at
  `2.11.4`. Working tree clean except untracked local artifacts (see below).
- **`npm run test:scripts` actually run this pass: 31 + 19 + 6 = 56 tests, all
  green** — covers manifest-v2 migration, component registration, and the
  update-component CLI, across `scripts/__tests__/*.mjs` and two bash test
  files.
- README advertises "**60 Agents** (43 domain experts + 14 MCP-integrated + 3
  core)" in four places. Recent commit history shows this exact number has
  been fought over before: `735df44` ("reconcile agent counts to the actual
  census — 60 agents") on 2026-06-12, and `52e316bb` ("Fix repository version
  metadata drift") on 2026-06-23 — i.e. agent-count/manifest drift is a
  **repeat failure mode** for this repo, not a one-off.

## Working Tree State

Untracked-only, not suspicious: `.playwright-mcp/` and 18
`wsl-status-dashboard-*.png` screenshots at repo root (QA/demo artifacts from
a prior dashboard session, dated 2026-06-24). Not covered by `.gitignore`
(checked — no `*.png` or `.playwright-mcp/` pattern in `.gitignore`, unlike
`ai-boss-mcp`'s and `virtual-pod-apparel`'s equivalents which do ignore
these). Did not delete anything per sweep rules; flagged as a Small
improvement below.

## Defects Found — manifest/update-check coherence (the specific ask)

**Confirmed: the "60 agents" claim and the actual update-check manifest
disagree, and the root cause is a missing scanner.**

- `component-versions.json` currently has **57** `agents/*` entries (43 under
  `agents/domain-experts/`, 14 under `agents/mcp-integrated/`) — I verified
  every one of those 57 keys has a matching file on disk, so the 43+14 halves
  are *not* drifted.
- But there are **3 more real agent files** that the manifest doesn't know
  about at all: `agents/code-reviewer.md`, `agents/rag-coder.md`,
  `agents/test-writer.md` — these are exactly the "3 core" agents the README
  counts toward its "60 Agents" total (`README.md:28,41,66,251`).
- Root cause, `scripts/generate-version-index.mjs`: there are scanner
  functions for every component category —
  `scanDomainExperts()` (line 120, walks `agents/domain-experts/*.md`),
  `scanMcpAgents()` (line 149, walks `agents/mcp-integrated/*.json`),
  `scanSkills()` (line 179), `scanHooks()` (line 229), `scanPlugins()`
  (line 253), `scanIntegrations()` (line 277), `scanMcpServers()` (line 301)
  — and the combined list that actually runs, at
  `scripts/generate-version-index.mjs:359-365`:
  ```
  scanDomainExperts(),
  scanMcpAgents(),
  scanSkills(),
  scanHooks(),
  scanPlugins(),
  scanIntegrations(),
  scanMcpServers(),
  ```
  **There is no `scanCoreAgents()`** for the 3 flat `agents/*.md` files that
  live directly in `agents/` (not in a subdirectory). They were never
  scanned, so they've never been in `component-versions.json`, so:
  - `/update-check` (the skill whose whole job is "diff local manifest vs.
    GitHub's `component-versions.json`") can **never** detect or apply an
    update to `code-reviewer.md`, `rag-coder.md`, or `test-writer.md` — they
    are permanently invisible to the update pipeline described in
    `skills/update-check/SKILL.md`.
  - This is very likely *why* `735df44` and `52e316bb` had to happen at all:
    each "reconcile agent counts" pass probably fixed the domain-expert/MCP
    halves (which do have scanners and can drift on their own) without
    anyone noticing the 3 core agents were never wired into the scan in the
    first place.

## Ranked Improvements

### Small (S)
1. Add `scanCoreAgents()` to `scripts/generate-version-index.mjs` — mirror
   `scanDomainExperts()` (line 120) but read `agents/*.md` directly (not the
   `domain-experts/` or `mcp-integrated/` subdirectories, and excluding any
   `README.md`), producing keys like `agents/code-reviewer`. Wire it into the
   `Promise.all`-equivalent list at lines 359-365. Regenerate
   `component-versions.json` (`npm run generate:versions`) — expected result:
   57 → 60 agent entries, matching the README's own claim.
2. Add `.gitignore` entries for `.playwright-mcp/` and
   `wsl-status-dashboard-*.png` (both `ai-boss-mcp` and
   `virtual-pod-apparel` already ignore their equivalents) so these local QA
   artifacts stop showing up as untracked noise in every `git status`.

### Medium (M)
1. Add a regression test to `scripts/__tests__/version-metadata-consistency.test.mjs`
   (already exists and already runs — 31 passing tests per this sweep) that
   asserts the total agent-entry count in `component-versions.json` matches
   the count the README advertises (or, better, that every `.md`/`.json` file
   under `agents/**` — at any depth — has a corresponding manifest entry).
   This is the test that would have caught the exact gap found above, and
   would prevent a third recurrence after `735df44` and `52e316bb`.

### Large (L)
- Given this is the *third* time agent-count/manifest drift has surfaced
  (`735df44`, `52e316bb`, and now this), consider wiring
  `generate-version-index.mjs` into the existing `husky` pre-commit hook (the
  repo already has `.husky/` configured) so `component-versions.json` is
  regenerated and diffed automatically on every commit that touches
  `agents/`, `skills/`, or the other scanned directories — turning "reconcile
  the census" from a recurring manual fire-drill into something that can't
  go stale again.

## Skipped / Not Run
- Did not run `npm test` (workspace-wide, via `npm run test:all` /
  `test:trigger-matcher` / `test:mcp-shared`) — `test:scripts` was the
  directly relevant suite for the update-check ask and it's fully green;
  running the broader workspace suite didn't fit the time budget and wasn't
  needed to confirm the manifest defect.
- Did not investigate `dashboard/` or `project-oversight-mcp` build output.
