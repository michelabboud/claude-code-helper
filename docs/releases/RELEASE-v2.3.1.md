# Release v2.3.1 - CI & Infrastructure Improvements

**CI hardening, API documentation for mcp-shared, and component browser.**

---

## CI

- **Dedicated `test-scripts` job** for versioning infrastructure tests (31 + 19 + 6 assertions)
- **Benchmark trend detection** with >20% regression warnings -- CI downloads previous run's artifact and compares per-server build times
- **Branch protection on `main`** with 9 required status checks (strict mode, force push blocked)

## Documentation

- **`mcp-servers/mcp-shared/API.md`** -- Complete API reference with usage examples for all mcp-shared exports
- **`CONTRIBUTING.md`** -- Contributor guide covering dev workflow, conventions, and submission process

## New

- **`docs/component-browser.html`** -- Web-based searchable and filterable browser of all 86 components with dark/light theme, keyboard shortcuts, and responsive layout

---

## Version History

| Version | Date | Focus |
|---------|------|-------|
| v2.2.0 | 2026-02-20 | Versioning & Self-Update |
| v2.3.0 | 2026-02-20 | Per-Component Versioning & npm Workspaces |
| v2.3.1 | 2026-02-20 | **CI & Infrastructure Improvements** |

---

## Credits

**Author:** [Michel Abboud](https://github.com/michelabboud)
**AI Assistance:** Claude (Anthropic)
**License:** Apache-2.0

---

**"Guarding main with 9 checks and trend-aware benchmarks"**
