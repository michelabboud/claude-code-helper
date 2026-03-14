# Release v2.4.0 - Project Oversight MCP Server

**New MCP server for multi-project health oversight with cross-server activity tracking.**

---

## New MCP Server: project-oversight-mcp

9 tools for multi-project health monitoring:

| Tool | Description |
|------|-------------|
| `list_project_dashboards` | Auto-discover all projects from `~/.claude/pm-dashboard/` |
| `get_project_dashboard` | Read a project's full dashboard or section |
| `compare_projects` | Cross-project health score comparison matrix |
| `sync_project_dashboard` | Copy dashboards to central store for aggregation |
| `get_logs` | Read Claude Code logs (history, debug, session) |
| `tail_logs` | Tail last N lines from a log source with file metadata |
| `open_dashboard` | Launch HTTP dashboard server with auto-discovery |
| `get_tool_activity` | Query recent MCP tool call activity across all servers |
| `get_active_tools` | Show currently running MCP tools in real time |

Standalone HTTP server with 7 API routes including SSE live streaming.

## Cross-Server Activity Tracking

- **`ActivityTracker`** added to mcp-shared -- writes structured JSONL to `~/.claude/mcp-activity.jsonl`
- **`registerTrackedToolHandler()`** -- auto-wraps tool handlers with activity logging
- All 10 MCP servers now automatically log every tool call (started/completed/failed)
- Activity log auto-rotates at 5MB, sanitizes sensitive args, never throws

## Dashboard

- Updated `multi-project.html` with live **Tool Activity** panel
- SSE stream broadcasts both history and activity entries
- 3-second auto-refresh for real-time monitoring
- HTTP routes: `/api/tools/activity` and `/api/tools/active`

---

## Version History

| Version | Date | Focus |
|---------|------|-------|
| v2.3.0 | 2026-02-20 | Per-Component Versioning & npm Workspaces |
| v2.3.1 | 2026-02-20 | CI & Infrastructure Improvements |
| v2.4.0 | 2026-02-20 | **Project Oversight MCP Server** |

---

## Credits

**Author:** [Michel Abboud](https://github.com/michelabboud)
**AI Assistance:** Claude (Anthropic)
**License:** Apache-2.0

---

**"See every project, every tool call, in real time"**
