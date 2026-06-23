# UI/UX Skills Deep Search

Generated: 2026-06-23

Scope: local-first UI/UX skills, agents, and plugins that can help Codex produce better interface design without depending on hosted design services such as Figma, Canva, Stitch, or proprietary cloud design tools.

## Outcome

Installed winner:

- `ui-ux-pro-max`
- Installed path: `/home/michel/.codex/skills/ui-ux-pro-max/SKILL.md`
- Source inspected: `nextlevelbuilder/ui-ux-pro-max-skill`
- Source commit inspected: `1518fec29d19ce905cd0c689255137b9dcab7ccc`
- License: MIT

Why this was selected:

- Strongest public adoption signal found: about 95.5k GitHub stars and 10k forks at the time of the check.
- Standalone skill shape, not a hosted service workflow.
- Local data-backed design intelligence: 32 CSV/data files and 3 Python scripts.
- Covers UI styles, product types, color palettes, typography, UX rules, chart types, and stack-specific guidance.
- Works from `~/.codex/skills` after path patching.
- Verified locally from the installed copy.

## Constraint

The search excluded options whose primary value depends on a third-party service or hosted design workspace. Local package installs, local scripts, local MCP servers, and optional references were allowed. Anything requiring Figma/Canva/Stitch/cloud design auth to be useful was treated as disqualified or secondary.

## Search Sources

Primary web/GitHub sources:

- `https://github.com/nextlevelbuilder/ui-ux-pro-max-skill`
- `https://github.com/nexu-io/open-design`
- `https://github.com/f0d010c/stark`
- `https://github.com/Ilm-Alan/frontend-design`
- `https://github.com/vipulgupta2048/codex-skills`
- `https://github.com/saifyxpro/ui-ux-design-pro-skill`
- `https://github.com/fcakyon/claude-codex-settings`
- `https://github.com/oil-oil/ui-ux-guide`
- `https://github.com/Yeachan-Heo/oh-my-codex`
- `https://composio.dev/content/top-design-skills`
- `https://github.com/hashgraph-online/awesome-codex-plugins`

GitHub metrics were checked live with `gh repo view` and the GitHub REST API.

## Candidate Comparison

| Candidate | Adoption | Local-first | Codex shape | Strength | Concern | Verdict |
|---|---:|---|---|---|---|---|
| `nextlevelbuilder/ui-ux-pro-max-skill` | ~95.5k stars / 10k forks | Yes | Skill, Codex platform template | Most adopted standalone UI/UX skill; local searchable DB; broad UI/UX coverage | Source is Claude-oriented and needed Codex path patching | **Installed winner** |
| `nexu-io/open-design` | ~69.9k stars / 7.9k forks | Yes | Skills + MCP + app | Most complete local design workspace; 100+ skills and 150 design systems | Heavy system, daemon/app/MCP oriented; not just one skill | Best full platform, not best single skill |
| `f0d010c/stark` | 13 stars / 0 forks | Yes | Codex plugin | Best Codex-native design plugin architecture; 8 routed skills, 71 reference files, tests pass | Low adoption signal | Best Codex-native runner-up |
| `fcakyon/claude-codex-settings` | 753 stars / 66 forks | Yes | Personal skills/plugins/settings | Battle-tested personal setup; includes frontend design skills | Collection repo, not a single UI/UX winner | Useful source, not chosen |
| `Ilm-Alan/frontend-design` | 63 stars / 12 forks | Yes | Single Codex skill | Clean, compact, strong aesthetic anchors | Narrow visual-design scope compared with UI/UX Pro Max | Good lightweight alternative |
| `oil-oil/ui-ux-guide` | 72 stars / 8 forks | Yes | Codex skill | Structured UI/UX guide with design and review modes | Smaller adoption, primarily Chinese docs | Good niche option |
| `saifyxpro/ui-ux-design-pro-skill` | 38 stars / 9 forks | Mostly | Skill + CLI | Rich rules/styles/templates | Requires Bun/CLI stack for best path; less adoption | Not chosen |
| `Yeachan-Heo/oh-my-codex` | ~31.3k stars / 2.4k forks | Mixed | Codex framework with frontend UI/UX shim | Very popular Codex ecosystem repo | UI/UX skill is a shim, not the main value | Not chosen |

## Installed Skill Details

Copied into:

```text
/home/michel/.codex/skills/ui-ux-pro-max/
```

Installed files include:

- `SKILL.md`
- `data/*.csv`
- `scripts/core.py`
- `scripts/design_system.py`
- `scripts/search.py`
- `templates/`
- `LICENSE`

Codex-specific adjustments:

- Replaced the source skill's very long frontmatter description with a shorter Codex trigger description.
- Added install notes explaining this is a copied local Codex install.
- Rewrote script paths from `skills/ui-ux-pro-max/scripts/...` to `/home/michel/.codex/skills/ui-ux-pro-max/scripts/...`.
- Kept all source data/scripts local; no repo symlink is used.

## Verification

Frontmatter and copied-file validation:

```text
ui-ux-pro-max install ok
```

Design-system script check from the installed copy:

```bash
python3 /home/michel/.codex/skills/ui-ux-pro-max/scripts/search.py \
  "SaaS analytics dashboard" --design-system -p "Test Dashboard" -f markdown
```

Result: generated a full design-system recommendation with pattern, style, color tokens, typography, key effects, anti-patterns, and checklist.

Focused UX search check:

```bash
python3 /home/michel/.codex/skills/ui-ux-pro-max/scripts/search.py \
  "accessibility animation loading" --domain ux -n 3
```

Result: returned 3 UX rules from `ux-guidelines.csv`.

## Why Not Install Open Design First

`nexu-io/open-design` is the strongest full local design system found. It is local-first, open-source, agent-native, and can install into Codex with `od mcp install codex`.

It was not selected as the first install because the user asked for the best UI/UX skill, and Open Design is a heavier app/MCP/design-workspace platform. It is a good next install if the goal becomes a local design studio with preview artifacts, design systems, MCP tools, and a daemon.

## Why Stark Is The Runner-Up

`f0d010c/stark` is the best Codex-native UI/UX plugin found. It has:

- `.codex-plugin/plugin.json`
- 8 routed design skills
- 71 local reference files
- helper scripts for platform detection and token export
- passing tests: `13 passed in 0.03s`

It is lower on the final ranking only because the adoption signal is much smaller. If the priority changes from "most praised" to "best Codex-native architecture", Stark should be installed next.

## Recommendation

Use `ui-ux-pro-max` as the broad default UI/UX design intelligence skill. It is best for:

- landing pages
- dashboards
- SaaS/admin UI
- e-commerce
- mobile and web UI planning
- UI review
- accessibility and interaction checklists
- palette, typography, style, chart, and stack recommendations

Use the already-installed frontend/design skills or Stark later when you want stronger platform-native routing or a narrower aesthetic-control layer.

Restart Codex after this install so the new skill appears in the available skills list.
