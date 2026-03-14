# Release v2.6.0 - Universal Hello Protocol

**Date:** 2026-02-21

---

Every tool in the repository now responds to a `hello` message, enabling availability checks and self-describing discovery.

## MCP Servers (11)

- `hello {}` — Colored greeting with server name and version
- `hello {"verbose": true}` — Full tool catalog, usage examples, author info
- Added `SERVER_NAME`, `SERVER_VERSION`, `SERVER_COLOR_EMOJI` constants and `buildHelloVerbose()` to all 11 servers

## Skills (20)

- `/skill-name hello` — Brief greeting with version and description
- `/skill-name hello ID` — Full profile: all arguments, usage, author
- Updated `argument-hint` frontmatter and added hello/hello ID cases to all 20 skills

## Agents (49)

- `hello agent-name` — Greeting with one-line specialty
- `hello agent-name ID` — Full profile: specialty, tools, model, when to use, author
- Added `## Hello Protocol` section to 37 markdown agents and 12 JSON agents

## Color-Coded Emoji Prefixes

All hello greetings use a colored square emoji matching the tool's category:

| Emoji | Category | Examples |
|-------|----------|----------|
| Red | Quality / Defense | code-review, testing, security |
| Blue | Data / Infrastructure | database-operations, python-backend |
| Purple | Creative / AI / Design | design-system, rag, uiux-review |
| Green | Runtime / API | api-specialist, android-dev, nodejs |
| Orange | Build / Automation | cicd-pipeline, n8n-automation |
| Yellow | Analysis / Performance | performance-optimizer |
| Cyan | Interfaces / Observability | api-expert, react-nextjs, css-tailwind |

## Documentation

- Added `docs/reference/hello-protocol.md` — Full protocol spec with copy-paste code patterns
- Added `## Hello Protocol` section to `CLAUDE.md` — Mandatory for all new tools

---

**Author:** [Michel Abboud](https://github.com/michelabboud)
**AI Assistance:** Claude (Anthropic)
**License:** Apache-2.0
