# Changelog

## 1.1.0 (2026-02-20)

### Added
- `get_tool_activity` - Query recent MCP tool call activity (filter by server/tool/status)
- `get_active_tools` - Show currently running MCP tools across all servers
- Cross-server activity tracking via `~/.claude/mcp-activity.jsonl`
- `registerTrackedToolHandler` in mcp-shared — all 10 MCP servers now auto-log tool activity
- HTTP API routes: `GET /api/tools/activity` and `GET /api/tools/active`
- SSE stream now includes activity entries (source: "activity") alongside history
- Tool Activity panel in multi-project.html with live-updating active tools and recent activity
- 15 new unit tests (97 total)

## 1.0.0 (2026-02-20)

### Added
- Initial release with 7 MCP tools
- `list_project_dashboards` - Discover all projects with PM dashboard data
- `get_project_dashboard` - Read a specific project's dashboard
- `compare_projects` - Compare health scores across projects
- `sync_project_dashboard` - Copy project dashboard to central store
- `get_logs` - Read Claude Code logs (history, debug, session)
- `tail_logs` - Tail last N lines from log sources
- `open_dashboard` - Launch HTTP dashboard server in browser
- Standalone HTTP server (`serve.ts`) with 5 API routes
- SSE-based live log streaming
- Auto-discovery of projects from `~/.claude/pm-dashboard/`
- Auto-shutdown after configurable inactivity timeout
