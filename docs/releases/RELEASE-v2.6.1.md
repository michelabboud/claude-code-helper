# Release v2.6.1 - /greeting Skill

**Date:** 2026-02-21

---

## New Skill: `/greeting`

Surveys all installed tools and generates a health report.

- `/greeting` — Sends `hello {}` to all 11 MCP servers, lists installed agents and skills, outputs a summary report with online/offline counts
- `/greeting ID` — Sends `hello {"verbose": true}` for full profiles from every server plus a complete catalog
- Implements the Hello Protocol (`hello` / `hello ID` arguments)
- Installed to `~/.claude/skills/greeting/`

---

**Author:** [Michel Abboud](https://github.com/michelabboud)
**AI Assistance:** Claude (Anthropic)
**License:** Apache-2.0
