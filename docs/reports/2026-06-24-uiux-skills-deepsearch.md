# UI/UX Skills Deep Search

Generated: 2026-06-24

Scope: local-first UI/UX skills, agents, and plugins for Codex that improve interface design without depending on hosted design services such as Figma, Canva, Stitch, or proprietary cloud design tools.

## Outcome

Confirmed installed winner:

- Skill: `ui-ux-pro-max`
- Installed path: `/home/michel/.codex/skills/ui-ux-pro-max/SKILL.md`
- Provenance note: `/home/michel/.codex/skills/ui-ux-pro-max/CODEX_INSTALL.md`
- Source: `https://github.com/nextlevelbuilder/ui-ux-pro-max-skill`
- Source commit inspected: `1518fec29d19ce905cd0c689255137b9dcab7ccc`
- License: MIT

Decision: keep `ui-ux-pro-max` as the default installed UI/UX skill. It remains the best blend of adoption, breadth, local execution, and low friction for Codex.

## Search Method

I did a fresh live search and inspection instead of relying on the previous snapshot:

- Web search for Codex UI/UX skills, `SKILL.md` packages, design plugins, and recent community recommendations.
- GitHub REST API checks for adoption and maintenance signals.
- Shallow local clones of the strongest candidates.
- Local structure inspection for `SKILL.md`, plugin manifests, scripts, data, references, and licenses.
- Lightweight validation where available.
- Installed-copy verification from `/home/michel/.codex/skills/ui-ux-pro-max`.

## Constraint

Allowed:

- Local `SKILL.md` packages.
- Local scripts and CSV/JSON/reference data.
- Local plugins or MCP servers when their core value works without hosted services.
- Optional references to websites or docs.

Excluded or downgraded:

- Workflows whose main value requires Figma, Canva, Stitch, paid image APIs, cloud design workspaces, or proprietary hosted auth.
- Heavy design platforms when the user asked for the best default skill rather than a full design studio.
- Skills with broad triggers that would interrupt normal Codex frontend work too often.

## Live Candidate Metrics

Checked with the GitHub REST API on 2026-06-24.

| Candidate | Stars | Forks | License | Updated/Pushed Signal | Local-first | Shape | Verdict |
|---|---:|---:|---|---|---|---|---|
| `nextlevelbuilder/ui-ux-pro-max-skill` | 95,552 | 10,031 | MIT | pushed 2026-06-23 | Yes | standalone skill plus local data/scripts | **Installed winner** |
| `nexu-io/open-design` | 69,998 | 7,898 | Apache-2.0 | pushed 2026-06-23 | Mostly | full local design platform, app, MCP, many skills | Best full platform, not default skill |
| `Yeachan-Heo/oh-my-codex` | 31,267 | 2,446 | none declared | pushed 2026-06-23 | Mixed | Codex framework with frontend shim | Popular, but not UI/UX-specific enough |
| `Nutlope/hallmark` | 3,355 | 207 | MIT | pushed 2026-06-04 | Yes | single anti-AI-slop design skill | Best complementary visual taste skill |
| `Owl-Listener/designer-skills` | 1,640 | 287 | MIT | updated 2026-06-23 | Yes | Claude plugin suite, 96 skills found | Best design-process suite, not Codex-native default |
| `Owl-Listener/designpowers` | 209 | 49 | MIT | pushed 2026-06-23 | Yes | 36 skills plus agent-team workflow | Strong process tool, not broad default |
| `oil-oil/ui-ux-guide` | 72 | 8 | Apache-2.0 | updated 2026-06-18 | Yes | Codex skill | Good small guide |
| `Ilm-Alan/frontend-design` | 63 | 12 | MIT | updated 2026-06-23 | Yes | single skill | Good lightweight aesthetic anchor |
| `saifyxpro/ui-ux-design-pro-skill` | 38 | 9 | MIT | updated 2026-06-20 | Mostly | skill plus Bun/CLI stack | Less adoption, extra runtime |
| `f0d010c/stark` | 13 | 0 | Apache-2.0 | updated 2026-06-22 | Yes | Codex plugin with 8 skills | Best Codex-native plugin architecture |
| `hursh-shah/codex-design-skill` | 9 | 1 | none declared | updated 2026-06-17 | Yes | Codex skill | Too small to beat alternatives |
| `mdrmuhaimin/agentic-skills` | 1 | 0 | none declared | updated 2026-05-20 | Yes | mobile UI/UX skill | Too little adoption |

## Local Inspection

### `ui-ux-pro-max`

Inspected source commit:

```text
1518fec29d19ce905cd0c689255137b9dcab7ccc
```

Observed contents:

- `SKILL.md` source under `.claude/skills/ui-ux-pro-max/SKILL.md`.
- Codex platform template under `cli/assets/templates/platforms/codex.json`.
- Local scripts: `core.py`, `design_system.py`, `search.py`.
- Local datasets: products, styles, colors, typography, charts, UX guidelines, landing patterns, app interfaces, React performance, and stack-specific guidance.
- `skill.json` reports version `2.5.0` and Codex platform support.
- README describes 67 UI styles, 161 palettes, 57 font pairings, 99 UX guidelines, 25 chart types, and 16 tech stacks.

Installed-copy verification:

- `data/` matches the inspected source copy.
- `scripts/` matches the inspected source copy, ignoring generated `__pycache__`.
- The installed script generated a real design-system recommendation for `SaaS analytics dashboard`.
- The skill is copied into `~/.codex/skills`; it is not symlinked to the cloned repo.

Why it wins:

- It has the strongest public adoption signal by a large margin.
- It is a single default skill, not a full app or multi-plugin suite.
- It has local searchable design intelligence rather than only prose.
- It covers both UI appearance and UX checks across common frontend stacks.
- It is broad enough to help with landing pages, dashboards, SaaS/admin UI, mobile UI, charts, typography, colors, accessibility, and reviews.

### `open-design`

Inspected source commit:

```text
295e541085635d7062a470503e2bd229eb0da7c7
```

Observed contents:

- Large local-first design platform, approximately 364 MB in the shallow clone.
- 156 `skills/*/SKILL.md` files plus 109 `design-templates/*/SKILL.md` files.
- Native desktop/web apps, daemon, MCP/platform packages, design systems, templates, export tooling, and agent integration docs.
- README and website describe installation into Codex via Open Design tooling.

Why it did not become the default skill:

- It is the best full local design platform found, but the ask was for the best UI/UX skill.
- Installing the whole platform would add a large design workspace and many optional services/skills.
- The repository includes many skills whose best path depends on optional external services such as Figma, image/video providers, or web-connected workflows.

Recommended later if the goal becomes a local design studio, artifact preview system, or MCP-backed design workspace.

### `hallmark`

Inspected source commit:

```text
aeb42fb354ff4efa36ab475773a082315a3af2ce
```

Observed contents:

- `skills/hallmark/SKILL.md`
- 23 local reference files under `skills/hallmark/references/`
- Worked examples and local site examples.
- Strong focused mission: anti-generic, anti-AI-slop design.
- Public adoption is now significant: 3,355 stars and 207 forks.

Why it was not installed as the default:

- It is an excellent complementary skill, but it is intentionally opinionated.
- Its trigger covers new apps and landing pages broadly, and its default flow says it should always ask for design context before designing.
- That could conflict with Codex's normal implementation flow when the user expects direct execution.

Recommendation: install later as `hallmark` if the priority is maximum visual distinctiveness and anti-template redesign work. Do not make it the default broad UI/UX skill yet.

### `designer-skills`

Inspected source commit:

```text
acc3e574b36ef2895268a176dbae886e1b845ae0
```

Observed contents:

- 96 `SKILL.md` files found.
- Multiple Claude plugin manifests under `.claude-plugin/plugin.json`.
- Covers research, strategy, systems, UI, interaction, prototyping/testing, design ops, toolkit, and visual critique.
- Good ecosystem signal and external recommendations.

Why it was not installed as the default:

- It is a suite of design-process plugins, not one Codex-default UI/UX skill.
- The plugin shape is Claude-first and would need deliberate conversion or plugin packaging for Codex.
- It is stronger for design process and handoff than for a single low-friction frontend-quality default.

### `designpowers`

Inspected source commit:

```text
cb00757da9d554591fa78d27aa1854d60a05c4f7
```

Observed contents:

- 36 skills found under `skills/*/SKILL.md`.
- Agent-team style design workflow.
- Strong inclusive-design and design-process orientation.

Why it was not installed as the default:

- It is a design team/process system, not the simplest broad UI/UX enhancement skill.
- It is useful when directing multiple design roles, but too much ceremony for routine Codex UI implementation.

### `stark`

Inspected source commit:

```text
6e2e738efc30a2fdd767f065cfbf39eef6efc4e2
```

Observed contents:

- `.codex-plugin/plugin.json`
- Root `SKILL.md`
- 8 routed skills for UX, web, platform, cross-platform, and design tokens.
- 71 local reference files in prior inspection; current clone contains rich references, commands, token assets, screenshots, and helper scripts.
- Local tests passed:

```text
13 passed in 0.03s
```

Why it was not installed as the default:

- It is the best Codex-native plugin architecture found.
- Adoption is still tiny compared with `ui-ux-pro-max`, Hallmark, Open Design, and Designer Skills.
- It is better as a future plugin install when Codex-native routing matters more than public validation.

## Final Ranking

1. `ui-ux-pro-max` - best default UI/UX skill for Codex, installed.
2. `open-design` - best full local design platform, not installed as a default skill.
3. `hallmark` - best focused anti-generic visual-taste skill, install later if desired.
4. `designer-skills` - best broad design-process suite, not Codex-native enough for default install.
5. `stark` - best Codex-native UI/UX plugin architecture, low adoption but high quality.
6. `frontend-design` - good lightweight aesthetic skill, already covered by existing installed design guidance and `ui-ux-pro-max`.

## Installed State

Current installed default:

```text
/home/michel/.codex/skills/ui-ux-pro-max/
```

Important files:

- `SKILL.md`
- `CODEX_INSTALL.md`
- `data/*.csv`
- `scripts/core.py`
- `scripts/design_system.py`
- `scripts/search.py`
- `templates/`
- `LICENSE`

Verification command:

```bash
python3 /home/michel/.codex/skills/ui-ux-pro-max/scripts/search.py \
  "SaaS analytics dashboard" --design-system -p "Verification Dashboard" -f markdown
```

Result: generated a complete design-system recommendation with pattern, style, colors, typography, key effects, anti-patterns, and pre-delivery checklist.

## Sources

- `https://github.com/nextlevelbuilder/ui-ux-pro-max-skill`
- `https://github.com/nexu-io/open-design`
- `https://github.com/Nutlope/hallmark`
- `https://www.usehallmark.com/`
- `https://github.com/Owl-Listener/designer-skills`
- `https://github.com/Owl-Listener/designpowers`
- `https://github.com/f0d010c/stark`
- `https://github.com/Ilm-Alan/frontend-design`
- `https://github.com/saifyxpro/ui-ux-design-pro-skill`
- `https://github.com/oil-oil/ui-ux-guide`
- `https://github.com/Yeachan-Heo/oh-my-codex`
- `https://github.com/hursh-shah/codex-design-skill`
- `https://github.com/mdrmuhaimin/agentic-skills`
- `https://composio.dev/content/top-design-skills`
- `https://developers.openai.com/codex/skills`
- `https://developers.openai.com/codex/use-cases/frontend-designs`

## Recommendation

Keep `ui-ux-pro-max` installed as the default. It is the best current answer for a broadly useful, highly praised, local-first UI/UX Codex skill.

If a second UI/UX install is desired later, choose based on need:

- Install `hallmark` for high-craft anti-generic landing pages and redesigns.
- Install `stark` for Codex-native UI/UX plugin routing.
- Install `open-design` for a full local design workspace and MCP/platform workflow.

Restart Codex if `ui-ux-pro-max` is not visible in the available skills list.
