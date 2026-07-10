<!-- Produced by the Fabulous orchestration session (fable@fabulous), 2026-07-10, under Michel's
ultracode authorization. Method: 20 read-only reviewers (skill-by-skill, plugin-by-plugin,
mcp-by-mcp, + a repo-level pass) → synthesis. 120 findings. The claude-code-helper tree was
NOT modified — this is a plan, not a patch.

FOX-REVIEW (fable, before commit): I independently confirmed the load-bearing structural claims:
- Agent count: 60 on disk (43 domain-experts .md + 14 mcp-integrated .json + 3 top-level core .md:
  code-reviewer, rag-coder, test-writer) vs 57 in component-versions.json — the 3 core agents are
  genuinely unscanned by scripts/generate-version-index.mjs. CONFIRMED.
- The corrupted greeting row (SKILL.md:46 points at a Vercel tool + "skip"). CONFIRMED (seen directly).
- The 4 in-repo missing-allowed-tools skills (greeting, model-mode, refresh, update-check). CONFIRMED.
Line numbers are as-of 2026-07-10 HEAD f704b03; re-anchor by symbol before applying.
One item explicitly needs a harness check before acting: §5.2 route-language-task's per-invocation
Agent({model}) claim (flagged PLAUSIBLE) — the Task tool takes no per-call model arg; verify.
Full raw findings (all 120, per-unit) preserved in the companion -raw-appendix.md. -->

# Implementation Plan — claude-code-helper v2.11.4 Remediation

_Source: skill-by-skill / plugin-by-plugin / mcp-by-mcp review. 120 findings across 20 units. Every claim below is tied to a finding; structural claims spot-verified against the working tree on 2026-07-10 (branch `main`, HEAD `f704b03`)._

---

## 1. Executive summary

**Overall health.** The repo's *version spine* is sound — `VERSION`, `package.json`, and `component-versions.json` all read `2.11.4` (repo-level verdict) — and the MCP layer has a genuinely good shared foundation (`mcp-shared` path/URL sanitization + tracked handlers; `rag-mcp` and `project-oversight-mcp` path-traversal guards). But that solid core is wrapped in three systemic failure classes that make large parts of the repo **inaccurate or non-installable as documented**, plus two outright **NO-FAKES violations** shipping fabricated output behind "Production Ready" badges.

**The biggest themes:**

1. **Missing `allowed-tools` (the missing-tools class).** Verified on disk: of the 9 subdirectory skills, `greeting`, `model-mode`, `refresh`, and `update-check` declare **no** `allowed-tools` despite driving Bash/curl/git/WebFetch/Read/Write — while their siblings `testing`, `documentation`, `project-scaffolding`, `rag` all declare it. `rag` declares tools but omits `AskUserQuestion` which it drives in 5 places. The two flat CLI-heavy docs `release-management.md` / `ci-best-practices.md` also omit it. This is a same-day, near-zero-risk fix class.
2. **Plugins and standalone-skill docs advertise components that do not exist.** Verified: there is **no `commands/` directory anywhere in the repo**, yet 4 plugins document runnable `/`-commands and `cp commands/*.md` install steps. Four plugins (`cloud-native`, `code-quality-suite`, `modern-web-stack`, `python-data-stack`) list skills/MCPs/hooks that aren't on disk; every plugin's manual `cp` recipe has at least one wrong path. The 5 flat `skills/*.md` files are **not runtime-loadable** (they must be `skills/<name>/SKILL.md`), and `component-versions.json` ships them to a non-loadable flat `installPath`.
3. **The update-check scanner has permanent blind spots.** Verified: `scripts/generate-version-index.mjs` has no scanner for the 3 top-level core agents (`agents/code-reviewer.md`, `rag-coder.md`, `test-writer.md`) — manifest shows `"type": "agent"` = **57**, disk has **60** — and `scanHooks` reads `.md` only, so the 4 JSON hook configs are never versioned. `/update-check`'s entire job is diffing the manifest against GitHub, so these components can **never** be detected or updated. This is the known recurring miscount bug (commits `52e316bb`, `735df44`).
4. **License drift (MIT vs Apache-2.0).** The repo is Apache-2.0, but `plugins/README.md:288` says MIT (poisoning all 6 plugin entries), and every MCP server's `hello` handshake + several source `@license` headers emit `License: MIT`. This is legally meaningful — it's the license users see at runtime.
5. **Fabricated MCP analysis (NO-FAKES violations).** `uiux-review-mcp` reads the image only to confirm it exists, then returns hardcoded scores/verdicts for every tool; `compare_designs` picks an A/B winner from `Math.random()`. `dependency-management` invents sizes/versions/duplicates via `Math.random()` and defaults unknown licenses to MIT; `design-system`'s "WCAG contrast ratio" parses the hex as one integer (white/black → ~3.35e8:1, not 21:1). All are marketed as "Production Ready".
6. **Count/version drift in top-level docs.** `README.md` says 13 skills (actual/manifest 14); `TOOLS-INDEX.md:47` says 54 agents (actual 60); `CLAUDE.md:29` says 57 agents. `project-oversight-mcp` reports `v1.0.0` while its package/manifest are `v1.2.0`.

**Headline counts.**

| Severity | Count |
|---|---|
| High | 22 |
| Medium | 44 |
| Low | 54 |
| **Total** | **120** |

By dominant category (approximate, findings span categories): correctness/bug ≈ 34 · docs ≈ 24 · consistency ≈ 30 · missing-tools ≈ 8 · version/license-drift ≈ 20 · quality/dead-code ≈ 6. The most concentrated single class is **plugin/skill-doc non-installability** (~30 findings across the 6 plugins + 5 flat docs) and **license/count drift** (~20), both largely mechanical; the most *severe* is the **NO-FAKES MCP fabrication** (4 findings, but each ships misleading verdicts).

---

## 2. Prioritized fix sequence

Phases are ordered by **risk-reduction per unit of effort**. Phase 0 items are same-day one-liners; effort climbs after. Within each phase, items are `what — where — fix — effort — severity`.

### Phase 0 — Same-day one-liners (S, high value, near-zero risk)

| # | What | Where (file:line) | Fix | Eff | Sev |
|---|---|---|---|---|---|
| 0.1 | Corrupted greeting row references a Vercel doc tool and skips the real server | `skills/greeting/SKILL.md:46` | Replace with `\| project-oversight-mcp \| `mcp__project-oversight__hello` with `{}` \|` to match the other 10 rows and the registered config key | S | **High** |
| 0.2 | `update-check` drives curl/git/download-component.sh, writes files, no `allowed-tools` | `skills/update-check/SKILL.md:1` | Add `allowed-tools: Read, Write, Edit, Bash` | S | **High** |
| 0.3 | `refresh` drives WebFetch/WebSearch/Read/Edit, no `allowed-tools` | `skills/refresh/SKILL.md:2` | Add `allowed-tools: Read, Edit, Glob, WebFetch, WebSearch` | S | **High** |
| 0.4 | `greeting` drives 11 MCP hello tools + Glob + Read, no `allowed-tools` | `skills/greeting/SKILL.md:1` | Add `allowed-tools:` listing Glob, Read, and the 11 `mcp__<server>__hello` tools | S | **High** |
| 0.5 | `model-mode` reads/rewrites `~/.claude/CLAUDE.md`, no `allowed-tools` | `skills/model-mode/SKILL.md:1` | Add `allowed-tools: Read, Edit, Write` | S | Med |
| 0.6 | `rag` drives `AskUserQuestion` (5 sites) but it's not in `allowed-tools` | `skills/rag/SKILL.md:9` | Append `"AskUserQuestion"` to the array | S | Med |
| 0.7 | `release-management` / `ci-best-practices` shell out heavily, no `allowed-tools` | `skills/release-management.md:5`, `skills/ci-best-practices.md:5` | Add `allowed-tools: Read, Write, Edit, Grep, Glob, Bash` (mirror `refactoring-strategy`) | S | Med |
| 0.8 | `plugins/README.md` credits license as MIT; repo + all plugin frontmatter are Apache-2.0 (resolves 5 findings) | `plugins/README.md:288` | Change `MIT` → `Apache-2.0` | S | Med |
| 0.9 | `greeting` reports `X / 10 online` but table lists 11 servers | `skills/greeting/SKILL.md:97` | Change denominator to 11, or make it dynamic (`X / N`) | S | Med |
| 0.10 | `rag` ChromaDB heartbeat uses removed `/api/v1` (HTTP 410 on current image) | `skills/rag/SKILL.md:407` | Change to `/api/v2/heartbeat` | S | Med |
| 0.11 | README undercounts skills as 13 (actual/manifest 14) | `README.md:30,42,268`; `CLAUDE.md:49` | Change to 14 | S | Med |
| 0.12 | `TOOLS-INDEX` says 54 agents (actual 60); TOC text 13 vs anchor 14 | `TOOLS-INDEX.md:47,23` | Set to 60 agents; TOC text → "14 Workflow Skills" | S | Med |
| 0.13 | `CLAUDE.md` agent count omits the 3 core agents | `CLAUDE.md:29` | `60 agent files (43 domain-experts + 14 MCP-integrated + 3 core)` | S | Med |

_Phase 0 alone clears the two High-sev greeting/skill bugs, the entire in-repo missing-tools class, the plugin license theme, and all top-level count drift._

### Phase 1 — Scanner + manifest correctness (S–M; makes `/update-check` honest)

| # | What | Where | Fix | Eff | Sev |
|---|---|---|---|---|---|
| 1.1 | Manifest generator never scans the 3 core agents → invisible to `/update-check` forever | `scripts/generate-version-index.mjs:349-366` (verified: no `scanCoreAgents`) | Add `scanCoreAgents()` mirroring `scanDomainExperts()` but reading `agents/*.md` top-level only (skip README + subdirs); add to `Promise.all` + merge; add regression test asserting every `agents/**` file has a manifest entry | S | **High** |
| 1.2 | `scanHooks` reads `.md` only; 4 JSON hook configs never versioned | `scripts/generate-version-index.mjs:229` | Decide: version them (extend to `.json`, exclude `package.json`) or document the exclusion in `hooks/README.md` and reconcile README's "Hooks (8 files)" claim | M | Med |
| 1.3 | 5 flat `skills/*.md` are not runtime-loadable; `installPath` ships them flat, contradicting each doc's own install step | `skills/{release-management,api-design-patterns,database-design-patterns,refactoring-strategy,ci-best-practices}.md`; `component-versions.json`; `skills/README.md:82` | Relocate each to `skills/<name>/SKILL.md`; fix `installPath` to `skills/<name>/SKILL.md`; correct README "Format 1: Standalone Markdown" and the `cp -r *.md` bulk snippet (loader only reads `<name>/SKILL.md` dirs) | M | **High** |
| 1.4 | Regenerate manifest via tool, not by hand (`generatedAt` stale `2026-06-23` vs mtime `2026-07-09`) | `component-versions.json:4` | After 1.1–1.3, run `npm run generate:versions`; consider a husky pre-commit that regenerates + diffs on agents/skills/hooks changes | S | Low |

### Phase 2 — License / version / metadata drift sweep (S, mechanical, many files)

| # | What | Where | Fix | Eff | Sev |
|---|---|---|---|---|---|
| 2.1 | `hello` output + source `@license` say MIT across all MCP servers | `buildHelloVerbose` in every server (e.g. `database-operations:429`, `code-review-mcp:186`, `cicd-pipeline:670`, `api-specialist:1143`, `dependency-management:543`, `design-system:597`, `n8n-automation:818`, `project-oversight:447`, `rag-mcp:10,151`, `testing-mcp:10,449`, `uiux-review:10,1494`) | Replace `License: MIT` / `@license MIT` → `Apache-2.0`; fix `design-system` header tag and the `database-operations/README.md "## License"` section | S | Med |
| 2.2 | `project-oversight` reports `v1.0.0`; package/manifest are `v1.2.0` | `mcp-servers/project-oversight-mcp/src/index.ts:38,458,1134,410` | Single-source the version (import from package.json / read VERSION) or bump the three literals to `1.2.0` | S | Med |
| 2.3 | Stale "9 MCP servers" in shared README footer (11 exist) | all server READMEs (e.g. `database-operations/README.md` footer) | Update count to 11 | S | Low |
| 2.4 | Inconsistent/empty `author` fields | `api-specialist-mcp/package.json`, `code-review-mcp/package.json` (empty) vs cicd/database ("Claude Code Helper") | Set one consistent author across all | S | Low |
| 2.5 | `mcp-shared/package.json` missing `license`/`author` | `mcp-servers/mcp-shared/package.json` | Add `"license": "Apache-2.0"`, `"author"` | S | Low |

### Phase 3 — Plugin honesty pass (M per plugin; all 6 are non-installable as written)

For each plugin: (a) delete/replace every `/`-command reference (no `commands/` dir exists), (b) reconcile the Components list to what's on disk, (c) fix the manual-install `cp` paths, (d) align the matching `plugins/README.md` entry + summary table. Details in §3.

| # | Plugin | Headline breakage | Where | Eff | Sev |
|---|---|---|---|---|---|
| 3.1 | `cloud-native` | 6 bundled components don't exist; `claude-code install` + `cp -r plugins/cloud-native` are fictional | `plugins/cloud-native-plugin.md:22,41` | M | **High** |
| 3.2 | `code-quality-suite` | Lists 2 nonexistent skills; `/test-generate` `/refactor` don't exist; README install paths wrong (`cp -r` on a file, wrong agent dir) | `plugins/code-quality-suite-plugin.md:20,36,39`; `plugins/README.md:43` | M | **High** |
| 3.3 | `modern-web-stack` | 3 advertised commands absent; every `cp` path wrong (bad agent filename, `.md` treated as dir, nonexistent plugin dir); license stated 3 ways | `plugins/modern-web-stack-plugin.md:74,150,156,137,775` | M | **High** |
| 3.4 | `python-data-stack` | ~half the components (3 commands, 3 hooks, 1 skill, 1 MCP) don't exist; `plugins.json` snippet dangles; README describes a different plugin | `plugins/python-data-stack-plugin.md:130,310,305`; `plugins/README.md:194` | L | **High** |
| 3.5 | `security-hardening` | Nonexistent "Vulnerability Remediation Skill"; `/security-audit` unbuilt (per `docs/TODO.md:959`); README omits the MCP | `plugins/security-hardening-plugin.md:21,35`; `plugins/README.md:120` | M | **High** |
| 3.6 | `cicd-automation` | `/generate-pipeline` `/release` don't exist; Components contradict README; on-topic `ci-best-practices` skill not bundled | `plugins/cicd-automation-plugin.md:36,18,21` | M | **High** |

### Phase 4 — MCP correctness & NO-FAKES (L; real engineering, highest severity-per-finding)

| # | What | Where | Fix | Eff | Sev |
|---|---|---|---|---|---|
| 4.1 | `uiux-review-mcp` fabricates all analysis (reads image only to confirm existence, returns hardcoded scores) — NO-FAKES violation shipping misleading a11y/design verdicts | `mcp-servers/uiux-review-mcp/src/index.ts:263,273-274,287-392,...` | Either genuinely analyze (return the image as an MCP image content block for the calling model, or call a vision model) **or** explicitly return rubric+image and label scores as illustrative. Never emit fixed numbers that look measured | L | **High** |
| 4.2 | `compare_designs` returns a `Math.random()` A/B winner, never reads inputs | `uiux-review-mcp/src/index.ts:1027-1028,1058-1062` | Remove random scoring; read both images and feed a real comparison, or return both image blocks + rubric | M | **High** |
| 4.3 | `dependency-management` fabricates sizes/versions/duplicates via `Math.random`; defaults unknown licenses to MIT (compliance false-negative); marketed "Production-ready" | `dependency-management/src/index.ts:165-166,244,344,439,303,76-93` | Drive from real lockfile/OSV/npm-audit data, **or** make deterministic + label heuristic/demo; stop defaulting unknown licenses to MIT | L | **High** |
| 4.4 | `design-system` "WCAG contrast" parses hex as one int (white/black → ~3.35e8:1) — every contrast verdict unreliable | `design-system-mcp/src/index.ts:463-476` | Implement real relative-luminance (sRGB linearization, `L=0.2126R+0.7152G+0.0722B`, `(Lmax+.05)/(Lmin+.05)`); support 3- & 6-digit hex | M | **High** |
| 4.5 | `cicd-pipeline` README sells GitLab/Jenkins/CircleCI as "Production Ready"; only github-actions is implemented (else → stub note) | `cicd-pipeline/README.md:487,551`; `src/index.ts:941-968` | Implement the templates, or scope README to "GitHub Actions (full); others: scaffold only" and drop the badge | M | **High** |
| 4.6 | `database-operations` README claims production DB execution; `run_query`/`inspect_schema`/`backup_database` are stubs, no drivers | `database-operations/README.md:3`; `src/index.ts:705-722,732-745,925-938` | Add real drivers + implement, or rewrite README as advisory/generator-only, remove `.env`/scripts/error-code sections + badge, mark stubbed tools | L | **High** |
| 4.7 | `testing-mcp` invokes bare `jest`/`pytest`/… — won't resolve `node_modules/.bin` (the documented local-install norm); health check probes unused `npx` | `testing-mcp/src/index.ts:108-115,165-169,458` | Use `npx --no-install <fw>` or resolve `./node_modules/.bin`; set `cwd`; health-check the real frameworks | M | Med |
| 4.8 | `testing-mcp` `watch:true` blocks the tool call for the full 5-min timeout (can't stream over stdio) | `testing-mcp/src/index.ts:109` | Remove `watch`, or reject `watch:true` with a clear error; drop README claim | S | Med |
| 4.9 | `api-specialist` advertises YAML spec support but has no parser; JSON.parse throws on the most common format; `xss` check enum never implemented | `api-specialist-mcp/src/index.ts:184-189,522,760,886,480` | Add `js-yaml` (already a sibling dep) via a shared `loadSpec()`; implement or remove the `xss` branch | M | Med |
| 4.10 | `design-system` `component_api` check advertised (enum + README sample) but is a no-op | `design-system-mcp/src/index.ts:216-252,43-48` | Implement the branch or remove from enum/README | M | Med |
| 4.11 | `project-oversight` `source=session` logs resolve to a directory → EISDIR swallowed → always empty | `project-oversight-mcp/src/index.ts:228-234,265-267` | Resolve to the actual `<sessionId>.jsonl`; return explicit error on directory | M | Med |
| 4.12 | `project-oversight` `open_dashboard` uses `import.meta.url` pathname → breaks serve.js path on Windows | `project-oversight-mcp/src/index.ts:1008` | Use `fileURLToPath(import.meta.url)` | S | Low |
| 4.13 | Lower-sev MCP correctness cluster: `cicd` ignores `features` selection (`:936`) + reports semgrep while emitting CodeQL v2 (`:1124`); `n8n` ignores `workflow_type`, event-driven → trigger-less workflow (`:242`); `api-specialist` `load_test` emits NaN/Infinity on total failure (`:724`); `getCoverage` reads jest path for all frameworks (`:177`); `generate_test_report` PDF returns markdown (`:262`); `run_tests`/`get_coverage` mislabeled `readOnlyHint:true` (`:483`); `rag-mcp` restricts indexing to `cwd`, rejecting README's absolute paths (`:685`); dead `_licenseCompatibility`/`_readRequirementsTxt` (`dependency-management:96,119`) | see cells | Address per §3 | S–M | Low |

### Phase 5 — Content & doc polish (S; low-sev correctness/consistency)

| # | What | Where | Fix | Eff | Sev |
|---|---|---|---|---|---|
| 5.1 | `route-language-task` flagship example is arithmetically wrong (four +2 → "8/10"; double-counts Pin; cross-crate is +1) — mis-teaches every dispatcher | `skills/route-language-task/SKILL.md:32` | Recompute honestly; name each rubric modifier once; make Score = sum | S | Med |
| 5.2 | `route-language-task` claims per-invocation `Agent({model})` lock — **verify against the harness** (Task has no per-call model arg; subagent model is set by its own frontmatter) | `skills/route-language-task/SKILL.md:53` (verdict: PLAUSIBLE) | Confirm; if unsupported, reword to the real lever (model-mode / re-invoke) and use real tool name `Task`; if supported, fix `Agent`→`Task` | M | Med |
| 5.3 | Rubric modifiers overlap (Pin on lines 66 & 67 enable double-count); tie-break rule #2 "rounds" integers that can't be fractional | `route-language-task/SKILL.md:66,212` | Make modifiers mutually exclusive + "count each concept once"; reword rule #2 as band-ceiling escalation | S | Low |
| 5.4 | `documentation` description advertises ADRs + changelog generation the body never delivers; `hello ID` desc diverges from frontmatter; Usage omits hello | `skills/documentation/SKILL.md:3,251,22` | Add ADR/changelog templates **or** trim the description; quote frontmatter in `hello ID`; add hello lines to Usage | M | Med |
| 5.5 | `model-mode`: no fallback when `CLAUDE.md` lacks a `MODEL_MODE` line (silent no-op + false success); stale "Opus 4.6 / Sonnet 4.6" hardcoded (mirror in `docs/reference/hello-protocol.md:178`) | `skills/model-mode/SKILL.md:62,22-23` | Add insert-block step; drop version numbers ("Always use Claude Opus/Sonnet") | S | Med/Low |
| 5.6 | `project-scaffolding`: non-trigger-rich description; `crud/auth/api-route` + `--turborepo/--nx` used in examples but undocumented; `.scaffoldrc.json` + `{{var}}` described but never applied | `skills/project-scaffolding/SKILL.md:3,158,155,189` | Append triggers; document or remove the pattern generators/flags; add read/substitute instructions or reword as conventions | S–M | Med/Low |
| 5.7 | Skills 2.0 `name` normalization: 7 skills use `skill_name` only; `rag` uses upper-case `RAG`; `greeting` carries redundant `skill_name` | across `skills/**/SKILL.md` | Add lowercase `name:` matching the directory to each; drop redundant `greeting` `skill_name`; `rag` → `name: rag` | S | Low |
| 5.8 | Hardcoded version strings drift risk in hello bodies | `update-check/SKILL.md:313,317-318`; `testing/SKILL.md:426,430-431` | Reference frontmatter version or add a bump-checklist note | S | Low |
| 5.9 | Doc leftovers: `ci-best-practices` `codecov-action@v3` stale (`:185`); `standalone-skill-docs` inconsistent `context: fork`; plugin metadata "Last Updated" precedes changelog date (`modern-web-stack:773`, `python-data-stack:716`); `python-data-stack` omits `backup_database` tool; `greeting` table greets 4 servers absent from shipped config | see cells | Per §3 | S | Low |
| 5.10 | `rag-mcp` CHANGELOG stub drops in-tree v1.1.0 history | `mcp-servers/rag-mcp/CHANGELOG.md:1` | Fold `CHANGELOG-v1.1.0.md` back in | S | Low |
| 5.11 | `rag` embedding-provider choice offered for ChromaDB but has no effect; default config object omits `collections` | `skills/rag/SKILL.md:416,42` | Skip Step 5 for chromadb (or note built-in embeddings); add `"collections": []` to default | S | Low |

---

## 3. Findings by unit

Each subsection lists that unit's findings so a fixer can work unit-by-unit. Format: `severity — title — file:line — fix`.

### skills/update-check (verdict: complete + version-coherent; needs tools + name)
- **High** — No `allowed-tools` despite curl/download-script/writes — `SKILL.md:1` — add `Read, Write, Edit, Bash`.
- **Med** — No canonical `name` (only `skill_name`) — `SKILL.md:2` — add `name: update-check`.
- **Low** — Version hardcoded in hello / hello ID — `SKILL.md:313,317-318` — reference frontmatter or add bump note.

### skills/model-mode (functional; tools + fallback + stale versions)
- **Med** — No `allowed-tools` (reads/rewrites CLAUDE.md) — `SKILL.md:1` — add `Read, Edit, Write`.
- **Med** — No handling when CLAUDE.md lacks a `MODEL_MODE` line (false success) — `SKILL.md:62` — insert the block, mirroring `config-bundle/global-config/CLAUDE.md`.
- **Low** — Stale `Opus 4.6`/`Sonnet 4.6` (mirror in `docs/reference/hello-protocol.md:178`) — `SKILL.md:22-23` — drop version numbers.
- **Low** — `skill_name` instead of `name` — `SKILL.md:2`.

### skills/project-scaffolding (coherent; complete allowed-tools)
- **Med** — Description not trigger-rich (weak auto-invoke) — `SKILL.md:3` — append "Use when…/Triggers on…".
- **Low** — Missing `name` — `SKILL.md:2`.
- **Low** — `crud/auth/api-route` examples undocumented — `SKILL.md:158` — document or remove.
- **Low** — `--turborepo/--nx` used in examples, absent from Options — `SKILL.md:155`.
- **Low** — `.scaffoldrc.json` + `{{var}}` described, never applied — `SKILL.md:189` — instruct read/substitute or reword.

### skills/greeting (broken MCP row + off-by-one + missing tools)
- **High** — Corrupted `project-oversight-mcp` row → Vercel tool + "skip" — `SKILL.md:46` — replace with `mcp__project-oversight__hello`.
- **High** — Missing `allowed-tools` (11 hello tools + Glob + Read) — `SKILL.md:1`.
- **Med** — `X / 10 online` but 11 servers — `SKILL.md:97` — set 11 or dynamic.
- **Low** — Redundant `skill_name: greeting` — `SKILL.md:3` — remove.
- **Low** — Table greets 4 servers absent from `claude_desktop_config.json` (7 registered) — `SKILL.md:41` — reconcile config vs table.

### skills/testing (sound; full allowed-tools)
- **Med** — `skill_name` instead of `name` — `SKILL.md:2`.
- **Low** — Version hardcoded in handshake — `SKILL.md:426,430-431`.

### skills/refresh (accurate; missing tools)
- **High** — No `allowed-tools` despite WebFetch/WebSearch/Read/Edit — `SKILL.md:2` — add `Read, Edit, Glob, WebFetch, WebSearch`.
- **Low** — `skill_name` instead of `name` — `SKILL.md:2`.

### skills/rag (well-structured; one missing tool + stale endpoint)
- **Med** — `AskUserQuestion` driven but undeclared — `SKILL.md:9`.
- **Med** — ChromaDB `/api/v1/heartbeat` removed (410) — `SKILL.md:407` — use `/api/v2`.
- **Low** — Embedding-provider choice no-op for ChromaDB — `SKILL.md:416`.
- **Low** — Default config omits `collections` — `SKILL.md:42`.
- **Low** — `name: RAG` vs lowercase dir — `SKILL.md:2`.

### skills/documentation (solid; description over-promises)
- **Med** — Advertises ADRs + changelog gen not in body — `SKILL.md:3` — add sections or trim.
- **Low** — `skill_name` instead of `name` — `SKILL.md:2`.
- **Low** — `hello ID` desc diverges from frontmatter — `SKILL.md:251`.
- **Low** — Usage omits hello / hello ID — `SKILL.md:22`.

### skills/route-language-task (accurate reference; self-contradictory example)
- **Med** — Flagship Rust example arithmetically + rubric-inconsistent ("8/10") — `SKILL.md:32`.
- **Med** — Per-invocation `Agent({model})` may be unsupported (**verify**) — `SKILL.md:53`.
- **Low** — Rubric modifiers overlap (double-count) — `SKILL.md:66`.
- **Low** — Tie-break rule #2 "rounds" integers — `SKILL.md:212`.

### standalone-skill-docs (5 flat files — not invocable skills)
- **High** — Bare `skills/*.md` not loadable as skills (must be `<name>/SKILL.md`) — `skills/release-management.md:1` et al — relocate.
- **High** — `installPath` ships them flat, contradicting each doc's install step — `component-versions.json` — fix to `skills/<name>/SKILL.md`.
- **Med** — README "Format 1: Standalone Markdown" is false; `cp -r *.md` snippet wrong — `skills/README.md:82,42`.
- **Med** — `release-management` + `ci-best-practices` shell out, no `allowed-tools` — `:5`.
- **Low** — `release-management` description not trigger-rich — `:3`.
- **Low** — `skill_name` + inconsistent `context: fork` — `api-design-patterns.md:2`.
- **Low** — `codecov-action@v3` stale — `ci-best-practices.md:185` — bump to v5.

### plugins/cicd-automation
- **High** — `/generate-pipeline`, `/release` don't exist (no `commands/`) — `plugin.md:36` — replace with `Ask:` prompts / real components.
- **Med** — Component list contradicts `plugins/README.md:146-149,22` — `plugin.md:18`.
- **Low** — On-topic `ci-best-practices` skill not bundled — `plugin.md:21`.
- **Low** — Components not mapped to install paths — `plugin.md:16`.
- **Low** — README license MIT — `plugins/README.md:288`.

### plugins/cloud-native (broken — not installable)
- **High** — 6 bundled components absent (GitOps skill, 2 MCPs, 3 commands, 2 hooks) — `plugin.md:22` — trim to real (2 domain-experts + ci-best-practices + aws/azure/gcp architects).
- **High** — Fictional `claude-code install` + `cp -r plugins/cloud-native` — `plugin.md:41`.
- **Med** — Component list disagrees with README — `plugins/README.md:172`.
- **Low** — "CI/CD Best Practices" vs actual "CI Best Practices" — `plugin.md:24`.
- **Low** — README license MIT — `plugins/README.md:288`.

### plugins/code-quality-suite (not runnable as described)
- **High** — Lists nonexistent "Code Review Workflow" + "TDD Workflow" skills — `plugin.md:20`.
- **High** — README install paths broken (`cp -r` on a file; wrong agent dir; nonexistent commands) — `plugins/README.md:43`.
- **Med** — `/test-generate` doesn't exist (also `README.md:78`) — `plugin.md:36`.
- **Med** — `/refactor` doesn't exist (also `README.md:81`) — `plugin.md:39`.
- **Med** — Plugin/README inventory disagree — `plugin.md:18`.
- **Low** — No `.claude-plugin/plugin.json` manifest (by-design per repo convention) — `plugin.md:1`.

### plugins/modern-web-stack (not installable as written)
- **High** — 3 advertised commands (`/scaffold`, `/test-generate`, `/api-docs`) absent — `plugin.md:74`.
- **Med** — `cp -r` on `.md` skills as if dirs — `plugin.md:156`.
- **Med** — Agent path `nodejs-typescript-expert.md` wrong (actual `-backend-`) — `plugin.md:150`.
- **Med** — Fake `claude-code install` + nonexistent plugin dir — `plugin.md:137`.
- **Med** — License stated 3 ways (MIT vs Apache-2.0) — `plugin.md:775`.
- **Med** — README components differ from plugin — `plugins/README.md:93`.
- **Low** — "Last Updated" precedes changelog date — `plugin.md:773`.

### plugins/python-data-stack (~half fabricated)
- **High** — Commands/hooks/skill/MCP components don't exist — `plugin.md:130`.
- **High** — `plugins.json` snippet lists nonexistent components; omits `database-expert` — `plugin.md:310`.
- **Med** — `cp -r plugins/python-data-stack` (no such dir) — `plugin.md:305`.
- **Med** — README describes a different (ML/AI) plugin — `plugins/README.md:194`.
- **Low** — License mismatch — `plugins/README.md:288`.
- **Low** — "Last Updated" vs changelog date — `plugin.md:716`.
- **Low** — `backup_database` tool undocumented — `plugin.md:263`.

### plugins/security-hardening (mostly real; two phantom refs)
- **High** — Nonexistent "Vulnerability Remediation Skill" — `plugin.md:21`.
- **Med** — `/security-audit` unbuilt (`docs/TODO.md:959`) — `plugin.md:35`.
- **Med** — README contradicts plugin inventory (omits the MCP) — `plugins/README.md:120`.
- **Med** — README license MIT — `plugins/README.md:288`.
- **Low** — No MCP install guidance — `plugin.md:16`.
- **Low** — Reference-doc frontmatter, no `plugin.json` (by-design) — `plugin.md:1`.

### mcp-batch-1 (api-specialist, cicd-pipeline, code-review, database-operations)
- **High** — `cicd-pipeline` README sells GitLab/Jenkins/CircleCI "Production Ready"; only github-actions real — `README.md:487`; `src/index.ts:941-968`.
- **High** — `database-operations` README claims production DB exec; 3 tools are stubs, no drivers — `README.md:3`; `src/index.ts:705-745,925-938`.
- **Med** — `api-specialist` advertises YAML but has no parser; JSON.parse throws on YAML — `src/index.ts:184-189,522,760,886`.
- **Med** — `api-specialist` `xss` check advertised, never implemented — `src/index.ts:480`.
- **Med** — License drift MIT (hello + headers + README) — `database-operations/src/index.ts:429` et al.
- **Low** — `cicd` `generate_pipeline` ignores `features` selection — `src/index.ts:936`.
- **Low** — `cicd` `security_scan_pipeline` reports semgrep but emits CodeQL v2 — `src/index.ts:1124`.
- **Low** — Stale "9 MCP servers" footer — READMEs.
- **Low** — Inconsistent/empty `author` — `package.json` (api-specialist, code-review).
- **Low** — `load_test` NaN/Infinity on total failure — `api-specialist/src/index.ts:724`.

### mcp-batch-2 (dependency-management, design-system, n8n-automation, project-oversight)
- **High** — `dependency-management` returns `Math.random` mock data as real analysis; defaults unknown licenses to MIT — `src/index.ts:165,244,344,439,303,76-93`.
- **High** — `design-system` `calculateContrastRatio` not a WCAG ratio — `src/index.ts:463-476`.
- **Med** — `design-system` `component_api` advertised, no-op — `src/index.ts:216-252`.
- **Med** — `project-oversight` reports v1.0.0; package/manifest v1.2.0 — `src/index.ts:38,458,1134,410`.
- **Med** — All four hello outputs say MIT; package Apache-2.0 — `dependency-management/src/index.ts:543` et al.
- **Med** — `project-oversight` `source=session` → EISDIR → always empty — `src/index.ts:228-234`.
- **Low** — `open_dashboard` `import.meta.url` breaks on Windows — `src/index.ts:1008`.
- **Low** — `n8n` `generate_workflow` ignores `workflow_type`; event-driven → trigger-less — `src/index.ts:242`.
- **Low** — Dead `_licenseCompatibility`/`_readRequirementsTxt` — `dependency-management/src/index.ts:96,119`.

### mcp-batch-3 (rag-mcp, testing-mcp, uiux-review-mcp; mcp-shared clean)
- **High** — `uiux-review-mcp` fabricates all analysis; hardcoded scores regardless of input — `src/index.ts:263,273-274,287-392`.
- **High** — `compare_designs` random A/B winner, never reads images — `src/index.ts:1027-1028,1058-1062`.
- **Med** — License drift MIT (headers + hello) across all 3 — `rag-mcp:10,151`; `testing-mcp:10,449`; `uiux-review:10,1494`.
- **Med** — `testing-mcp` bare test binaries won't resolve local installs; health-checks unused `npx` — `src/index.ts:108-115,458`.
- **Med** — `testing-mcp` `watch:true` hangs to 5-min timeout — `src/index.ts:109`.
- **Low** — `getCoverage` reads jest path for all frameworks — `src/index.ts:177`.
- **Low** — `generate_test_report` PDF returns markdown — `src/index.ts:262`.
- **Low** — README overclaims framework auto-detection — `testing-mcp/README.md:316`.
- **Low** — `run_tests`/`get_coverage` mislabeled `readOnlyHint:true` — `src/index.ts:483`.
- **Low** — `mcp-shared/package.json` missing license/author — `package.json`.
- **Low** — `rag-mcp` CHANGELOG stub drops v1.1.0 history — `CHANGELOG.md:1`.
- **Low** — `rag-mcp` restricts indexing to `cwd`, rejecting README's absolute paths — `src/index.ts:685`.

### repo-level
- **High** — Manifest generator never scans the 3 core agents — `scripts/generate-version-index.mjs:359` (verified: manifest agents=57, disk=60).
- **Med** — `update-check` no `allowed-tools` — `skills/update-check/SKILL.md:1` (= Phase 0.2).
- **Med** — `refresh` no `allowed-tools` — `skills/refresh/SKILL.md:1` (= Phase 0.3).
- **Med** — README undercounts skills as 13 — `README.md:30,42,268`.
- **Med** — TOOLS-INDEX says 54 agents — `TOOLS-INDEX.md:47`.
- **Med** — CLAUDE.md omits 3 core agents (57) — `CLAUDE.md:29`.
- **Med** — `scanHooks` `.md`-only; JSON hook configs never in manifest — `scripts/generate-version-index.mjs:229`.
- **Low** — `model-mode` no `allowed-tools` — `skills/model-mode/SKILL.md:1` (= Phase 0.5).
- **Low** — `greeting` no `allowed-tools` — `skills/greeting/SKILL.md:2` (= Phase 0.4).
- **Low** — TOOLS-INDEX TOC text 13 vs anchor 14 — `TOOLS-INDEX.md:23`.
- **Low** — Most skills omit `name` field — `skills/**/SKILL.md`.
- **Low** — `generatedAt` stale vs mtime (hand-edited manifest) — `component-versions.json:4`.

---

## 4. What is healthy (honest scope)

No reviewed unit was entirely finding-free (every unit had n≥2), but several are **fundamentally sound with only cosmetic gaps**, and the foundations below are genuinely good:

- **Version spine is coherent.** `VERSION`, `package.json`, `component-versions.json` all `2.11.4` (verified). The drift is in *counts and licenses in prose*, not the semantic version.
- **`skills/testing`** — content-rich, full `allowed-tools` coverage; only `skill_name`→`name` and a hardcoded handshake version.
- **`skills/documentation`, `skills/project-scaffolding`, `skills/rag`** — all correctly declare `allowed-tools` (verified on disk); their gaps are description/consistency, not missing tools.
- **`skills/route-language-task`** — agent refs, Pattern A/C claims, and version all check out; issues are a doc-fixable example + one mechanism to verify.
- **`mcp-shared`** — clean, well-built: path/URL sanitization, tracked handlers, graceful error responses. The consistent `runServer` / tracked-handler / Zod pattern across all 11 servers is a real strength.
- **`rag-mcp`** — solid implementation; **`project-oversight-mcp`** — good path-traversal guards (the version literal + session-log bugs are localized).
- **The 7 "Production Ready" MCP READMEs are the problem, not most of the code** — the scaffolding is sound; the fixes are (a) implement the advertised behavior or (b) tell the truth in the README/tool descriptions.

The heavy tail — plugins and standalone-skill docs — is **documentation debt, not code debt**: the underlying agents/skills/MCPs mostly exist; the plugin files just point at the wrong (or nonexistent) names and paths.

---

## 5. Cross-repo note — FaBridge skill (sibling fix)

The **`fabridge` skill is the same missing-tools class as this repo's `greeting`/`update-check`/`refresh`, but it lives in a different repo** — flag it for a sibling fix, do not fold it into this plan's commits.

- **Source:** `~/projects/FaBridge/skill/SKILL.md` — **Installed:** `~/.claude/skills/fabridge/SKILL.md` (verified: byte-identical frontmatter).
- **Finding:** frontmatter declares `name` + a strong trigger-rich `description` but **no `allowed-tools`**, despite the skill being **entirely `bridge` CLI (Bash) driven** ("You reach it through the `bridge` command-line tool"). Confirmed: `grep -l allowed-tools` returns nothing for either copy.
- **Fix (in the FaBridge repo, per its own git identity/rules):** add `allowed-tools: Bash` (plus `Read` if it inspects inbox files) to `~/projects/FaBridge/skill/SKILL.md`, then re-vendor/reinstall to `~/.claude/skills/fabridge/SKILL.md` — never edit the installed copy in place. This closes the missing-tools gap across the fleet consistently with the Phase 0 skill fixes here.

_This is the only finding whose fix belongs outside claude-code-helper; every other item above is in-repo._