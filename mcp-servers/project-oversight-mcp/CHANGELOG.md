# Changelog

## 1.2.1 - 2026-07-10

### Fixed
- `source=session` resolved to `~/.claude/projects/<sessionId>` (a directory), and
  `readLogLines` swallowed the resulting EISDIR, so session logs **always** returned
  empty. Session transcripts live under a per-project subdirectory; added
  `findSessionLog()` (testable `logs.ts`) which scans for the real
  `<sessionId>.jsonl` and throws a clear error if absent. `readLogLines` now
  surfaces non-ENOENT errors instead of silently returning empty.
- `open_dashboard` used `new URL(import.meta.url).pathname` (yields `/C:/...` on
  Windows); switched to `fileURLToPath`.

## 1.2.0 (2026-02-20)

### Security
- Fixed CORS wildcard: replaced `Access-Control-Allow-Origin: *` with localhost-only origin + `Vary: Origin` header

### Changed
- Complete dashboard HTML redesign: SVG radial gauges, tabbed panels, summary stats, heatmap comparison, animated transitions
- Upload zone hidden in HTTP mode (data comes from API auto-discovery)

### Infrastructure
- Added to CI build and test matrices

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
