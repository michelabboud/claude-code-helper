# Project Oversight MCP Server

Multi-project health oversight — dashboard aggregation, cross-project comparison, and log streaming through the Model Context Protocol.

## Features

- **Multi-project discovery** — Auto-scans `~/.claude/pm-dashboard/` for all projects with dashboard data
- **Cross-project comparison** — Compare health scores across projects by domain
- **Dashboard sync** — Copy project dashboards to a central store for aggregated views
- **Log access** — Read and search Claude Code history, debug, and session logs
- **Tool activity tracking** — See which MCP tools are running, where, and what they're doing
- **Live streaming** — SSE-based real-time log + tool activity viewer in the browser
- **HTTP dashboard** — Spawns a standalone web server with auto-discovery and live updates

## Tools (9)

| Tool | Description |
|------|-------------|
| `list_project_dashboards` | Discover all projects with PM dashboard data, with sorting and filtering |
| `get_project_dashboard` | Read a specific project's full dashboard or a section |
| `compare_projects` | Build a comparison matrix across projects with best/worst per domain |
| `sync_project_dashboard` | Copy a project's dashboard to the central store |
| `get_logs` | Read logs from history, debug, or session sources |
| `tail_logs` | Return last N lines from a log source with file metadata |
| `open_dashboard` | Launch HTTP dashboard server and open in browser |
| `get_tool_activity` | Query recent MCP tool call activity (filter by server/tool/status) |
| `get_active_tools` | Show currently running MCP tools across all servers |

## HTTP Server Routes

When launched via `open_dashboard`, the standalone HTTP server provides:

| Route | Description |
|-------|-------------|
| `GET /` | Multi-project HTML dashboard |
| `GET /api/projects` | JSON array of all discovered project dashboards |
| `GET /api/logs/stream` | SSE stream of new log + activity entries |
| `GET /api/logs/history?limit=N&search=TERM` | Recent history.jsonl entries |
| `GET /api/logs/debug/:sessionId?limit=N` | Parsed debug log entries |
| `GET /api/tools/activity?limit&server&tool&status` | Recent tool activity entries |
| `GET /api/tools/active?server&staleMs` | Currently running tools |

The server binds to `127.0.0.1` only and auto-shuts down after 2 hours of inactivity (configurable).

## Activity Tracking

All MCP servers in this repository automatically log tool calls to `~/.claude/mcp-activity.jsonl`. Each call produces:
- A `started` entry when the tool begins
- A `completed` or `failed` entry when it finishes

This enables real-time visibility into what tools are running across all servers. The activity log auto-rotates at 5MB.

## Central Store

Project dashboards are stored at:

```
~/.claude/pm-dashboard/
├── project-a/
│   └── pm-dashboard.json
├── project-b/
│   └── pm-dashboard.json
└── ...
```

Use `sync_project_dashboard` to populate this from any project's `.claude/pm-dashboard.json`.

## Installation

### Build

```bash
cd mcp-servers/project-oversight-mcp
npm install
npm run build
```

### Add to Claude Code

```bash
claude mcp add project-oversight -- node /path/to/project-oversight-mcp/build/index.js
```

### Add to Claude Desktop

Add to your `claude_desktop_config.json`:

```json
{
  "mcpServers": {
    "project-oversight": {
      "command": "node",
      "args": ["/path/to/project-oversight-mcp/build/index.js"]
    }
  }
}
```

## Usage Examples

### Discover all projects
```
Use the list_project_dashboards tool to see all monitored projects
```

### Compare projects
```
Use compare_projects with projects ["project-a", "project-b"] and domains ["security", "qa"]
```

### Sync current project
```
Use sync_project_dashboard with sourcePath "/path/to/my/project"
```

### Open dashboard
```
Use open_dashboard to launch the web dashboard
```

### Search logs
```
Use get_logs with source "history" and search "error"
```

## Development

```bash
# Build
npm run build

# Watch mode
npm run watch

# Run tests
npm test

# Inspect with MCP Inspector
npm run inspector
```

## License

Apache-2.0
