# Release v2.5.0 - Configurable Model Switching & Dashboard Enhancements

**Date:** 2026-02-21

---

## Configurable Model Switching

- **`MODEL_MODE` config variable** in `~/.claude/CLAUDE.md` with five modes:
  - `default` — Auto-switch: Opus for planning, Sonnet for coding, Haiku for quick tasks
  - `opus-only` — Always Claude Opus 4.6 (MAX plan users)
  - `sonnet-only` — Always Claude Sonnet 4.6 (Pro plan)
  - `haiku-only` — Always Claude Haiku (fastest, cheapest)
  - `custom` — Fine-grained control via `PLAN_MODEL`, `CODE_MODEL`, `QUICK_MODEL`
- Detection rules are conditional on `MODEL_MODE`; original auto-switching preserved in `default` mode

## New Skill: `/model-mode`

- `/model-mode status` — Show current mode and custom model settings
- `/model-mode opus-only` / `sonnet-only` / `haiku-only` / `default` / `custom` — Switch modes instantly
- Reads and rewrites the `MODEL_MODE:` line in `~/.claude/CLAUDE.md`
- Skills count: 19 -> 20

## Dashboard Enhancements

- **Sparkline trend charts** — SVG mini trend lines per project card with gradient fill and hover tooltips
- **Score delta badges** — Up/down indicators showing score change since last assessment
- **Expert detail expand panels** — Click any domain bar to see topFinding, recommendation, riskIfIgnored
- **Trend History tab** — Full per-project score matrix across all historical dates and expert domains
- **Visual polish** — Animated gauge glow, pulse-ring on active tool dots, gradient borders

## Agent Semantic Colors

All **49 agents** now include a `color` field for visual identification:

| Color | Category | Examples |
|-------|----------|----------|
| `green` | Runtime / Backend | Node.js, Android, Vue/Nuxt, API |
| `blue` | Data / Infrastructure | Database, Python, iOS, Full-stack |
| `orange` | Build / Automation | DevOps, Git, Automation |
| `red` | Defense / Quality | QA, Security, Testing |
| `purple` | Creative / AI / ML | ML/AI, Design System, RAG |
| `yellow` | Analysis / Performance | Performance Optimizer |
| `cyan` | Interfaces / Observability | React/Next.js, CSS/Tailwind, CI/CD |

---

**Author:** [Michel Abboud](https://github.com/michelabboud)
**AI Assistance:** Claude (Anthropic)
**License:** Apache-2.0
