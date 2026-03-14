# Release v2.4.1 - Security & CI Hardening

**CORS fix, npm audit enforcement, MetricsCollector wired for latency tracking, and dashboard redesign.**

---

## Security & CI Hardening

- **CORS fix** -- Replaced `Access-Control-Allow-Origin: *` with localhost-only origin in project-oversight-mcp `serve.ts`
- **npm audit enforced** -- `npm audit --audit-level=high` now fails CI instead of warning only
- **CI matrices updated** -- project-oversight-mcp added to both build and test matrices (11/11 servers covered)

## MetricsCollector Wired

- `registerTrackedToolHandler()` now calls `metrics.recordCall()` on every tool call
- p50/p95/p99 latency tracking is active across all 11 MCP servers

## Dashboard Redesign

Complete rewrite of `multi-project.html` with professional monitoring-grade design:

- **SVG radial score gauges** for project health at a glance
- **Grouped domain bars** organized by category: Quality, Security, Engineering, Infrastructure, Product
- **Summary stats cards** -- projects, average score, critical risks, active tools
- **Tabbed bottom panel** -- Comparison (heatmap) / Risks / Tools / Logs
- **Visual polish** -- animated transitions, responsive layout, improved dark/light themes
- Upload zone hidden in HTTP mode (auto-discovers from API)

## Documentation

- Updated TOOLS-INDEX.md Quick Stats: 11 MCP servers, 47 agents, 19 skills
- Fixed broken TOC anchor link
- PM dashboard SKILL.md updated to write directly to central store

---

## Version History

| Version | Date | Focus |
|---------|------|-------|
| v2.3.1 | 2026-02-20 | CI & Infrastructure Improvements |
| v2.4.0 | 2026-02-20 | Project Oversight MCP Server |
| v2.4.1 | 2026-02-20 | **Security & CI Hardening** |

---

## Credits

**Author:** [Michel Abboud](https://github.com/michelabboud)
**AI Assistance:** Claude (Anthropic)
**License:** Apache-2.0

---

**"Hardened CI, locked-down CORS, latency percentiles on every call"**
