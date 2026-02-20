#!/usr/bin/env node

/**
 * Project Oversight MCP - Standalone HTTP Server
 *
 * Provides a web dashboard for multi-project health oversight and live log
 * streaming. Spawned as a detached process by the `open_dashboard` MCP tool.
 *
 * Routes:
 *   GET /                           → Multi-project HTML dashboard
 *   GET /api/projects               → JSON array of all discovered project dashboards
 *   GET /api/logs/stream            → SSE stream of new log + activity entries
 *   GET /api/logs/history?limit&search → Recent history.jsonl entries
 *   GET /api/logs/debug/:sessionId?limit → Parsed debug log entries
 *   GET /api/tools/activity?limit&server&tool&status → Recent tool activity entries
 *   GET /api/tools/active?server&staleMs → Currently running tools
 *
 * Security:
 *   - Binds to 127.0.0.1 only (localhost)
 *   - Path traversal prevention on all user-supplied params
 *   - Auto-shutdown after configurable inactivity timeout
 *
 * Usage:
 *   node serve.js [--port=3120] [--timeout=120]
 */

import http from "node:http";
import { homedir } from "node:os";
import path from "node:path";
import { readdir, readFile, stat } from "node:fs/promises";
import { createReadStream } from "node:fs";
import { URL } from "node:url";

// ---------------------------------------------------------------------------
// Constants & Config
// ---------------------------------------------------------------------------

const HOME = homedir();
const CLAUDE_DIR = path.join(HOME, ".claude");
const CENTRAL_STORE = path.join(CLAUDE_DIR, "pm-dashboard");
const HISTORY_FILE = path.join(CLAUDE_DIR, "history.jsonl");
const ACTIVITY_FILE = path.join(CLAUDE_DIR, "mcp-activity.jsonl");
const SESSION_ID_REGEX = /^[a-zA-Z0-9._-]+$/;

// Parse CLI args
const args = process.argv.slice(2);
function getArg(name: string, defaultValue: number): number {
  const found = args.find((a) => a.startsWith(`--${name}=`));
  if (found) {
    const val = parseInt(found.split("=")[1], 10);
    return isNaN(val) ? defaultValue : val;
  }
  return defaultValue;
}

const PORT = getArg("port", 3120);
const TIMEOUT_MINUTES = getArg("timeout", 120);

// ---------------------------------------------------------------------------
// Idle timer
// ---------------------------------------------------------------------------

let lastActivity = Date.now();
let shutdownTimer: ReturnType<typeof setInterval>;

function resetActivity(): void {
  lastActivity = Date.now();
}

function startIdleTimer(): void {
  shutdownTimer = setInterval(() => {
    const idleMs = Date.now() - lastActivity;
    if (idleMs > TIMEOUT_MINUTES * 60 * 1000) {
      console.log(`[project-oversight-mcp] Auto-shutdown after ${TIMEOUT_MINUTES}min idle`);
      process.exit(0);
    }
  }, 60_000); // Check every minute
  shutdownTimer.unref();
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function validateSessionId(id: string): boolean {
  return SESSION_ID_REGEX.test(id) && id.length <= 200;
}

function corsHeaders(): Record<string, string> {
  return {
    "Access-Control-Allow-Origin": `http://127.0.0.1:${PORT}`,
    "Access-Control-Allow-Methods": "GET, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type",
    "Vary": "Origin",
  };
}

function jsonRes(res: http.ServerResponse, data: unknown, status = 200): void {
  const body = JSON.stringify(data);
  res.writeHead(status, {
    "Content-Type": "application/json",
    ...corsHeaders(),
  });
  res.end(body);
}

function errorRes(res: http.ServerResponse, message: string, status = 400): void {
  jsonRes(res, { error: message }, status);
}

/** Discover all project dashboards */
async function discoverProjects(): Promise<Array<Record<string, unknown>>> {
  const projects: Array<Record<string, unknown>> = [];
  const seen = new Set<string>();

  // 1. Scan central store (~/.claude/pm-dashboard/*)
  try {
    const entries = await readdir(CENTRAL_STORE, { withFileTypes: true });
    for (const entry of entries) {
      if (!entry.isDirectory()) continue;
      const dashPath = path.join(CENTRAL_STORE, entry.name, "pm-dashboard.json");
      try {
        const content = await readFile(dashPath, "utf-8");
        const data = JSON.parse(content) as Record<string, unknown>;
        if (!data.projectName) data.projectName = entry.name;
        seen.add(String(data.projectName));
        projects.push(data);
      } catch {
        // Skip invalid files
      }
    }
  } catch {
    // Central store doesn't exist yet
  }

  // 2. Auto-detect cwd project (.claude/pm-dashboard.json)
  try {
    const cwdDash = path.join(process.cwd(), ".claude", "pm-dashboard.json");
    const content = await readFile(cwdDash, "utf-8");
    const data = JSON.parse(content) as Record<string, unknown>;
    const name = String(data.projectName || path.basename(process.cwd()));
    if (!data.projectName) data.projectName = name;
    if (!seen.has(name)) {
      (data as Record<string, unknown>)._source = "local";
      projects.push(data);
    }
  } catch {
    // No dashboard in cwd
  }

  return projects;
}

/** Read and filter log lines */
async function readLogLines(
  filePath: string,
  limit: number,
  search?: string
): Promise<string[]> {
  try {
    const content = await readFile(filePath, "utf-8");
    let lines = content.split("\n").filter((l) => l.trim() !== "");

    if (search) {
      const s = search.toLowerCase();
      lines = lines.filter((l) => l.toLowerCase().includes(s));
    }

    return lines.slice(-limit);
  } catch {
    return [];
  }
}

// ---------------------------------------------------------------------------
// Activity log helpers
// ---------------------------------------------------------------------------

interface ActivityEntry {
  id: string;
  timestamp: string;
  server: string;
  tool: string;
  status: "started" | "completed" | "failed";
  durationMs?: number;
  projectDir: string;
  args?: Record<string, unknown>;
  error?: string;
}

/** Read activity entries from the JSONL log (and rotated .1 backup). */
async function readActivityEntries(limit: number): Promise<ActivityEntry[]> {
  const entries: ActivityEntry[] = [];

  // Read rotated file first (older entries), then current file
  for (const filePath of [`${ACTIVITY_FILE}.1`, ACTIVITY_FILE]) {
    try {
      const content = await readFile(filePath, "utf-8");
      const lines = content.split("\n").filter((l) => l.trim() !== "");
      for (const line of lines) {
        try {
          entries.push(JSON.parse(line) as ActivityEntry);
        } catch {
          // Skip malformed lines
        }
      }
    } catch {
      // File doesn't exist
    }
  }

  // Sort by timestamp descending (most recent first) and limit
  entries.sort((a, b) => b.timestamp.localeCompare(a.timestamp));
  return entries.slice(0, limit);
}

/** Find tools that are "started" but not yet "completed" or "failed". */
async function findActiveTools(staleThresholdMs: number): Promise<ActivityEntry[]> {
  const entries = await readActivityEntries(2000);

  // Build a set of completed/failed IDs
  const doneIds = new Set<string>();
  for (const e of entries) {
    if (e.status === "completed" || e.status === "failed") {
      doneIds.add(e.id);
    }
  }

  const now = Date.now();
  return entries.filter((e) => {
    if (e.status !== "started") return false;
    if (doneIds.has(e.id)) return false;
    // Filter out stale entries
    const age = now - new Date(e.timestamp).getTime();
    return age < staleThresholdMs;
  });
}

// ---------------------------------------------------------------------------
// Dashboard HTML
// ---------------------------------------------------------------------------

async function getDashboardHtml(): Promise<string> {
  // Try to read from installed skills location first, then from repo
  const candidates = [
    path.join(CLAUDE_DIR, "skills", "pm-dashboard", "multi-project.html"),
    path.join(process.cwd(), "skills", "pm-dashboard", "multi-project.html"),
  ];

  for (const candidate of candidates) {
    try {
      return await readFile(candidate, "utf-8");
    } catch {
      // Try next
    }
  }

  // Fallback: minimal redirect page
  return `<!DOCTYPE html>
<html><head><meta charset="UTF-8"><title>Monitoring Dashboard</title></head>
<body style="font-family:sans-serif;background:#0d1117;color:#e6edf3;display:flex;align-items:center;justify-content:center;height:100vh">
<div style="text-align:center">
<h1>Monitoring MCP Dashboard</h1>
<p>multi-project.html not found. Install the pm-dashboard skill first.</p>
<p>API available at <a href="/api/projects" style="color:#58a6ff">/api/projects</a></p>
</div></body></html>`;
}

// ---------------------------------------------------------------------------
// SSE log streaming
// ---------------------------------------------------------------------------

const sseClients = new Set<http.ServerResponse>();

/** Watch a JSONL file and broadcast new lines to SSE clients. */
function watchJsonlFile(filePath: string, source: string): void {
  let lastSize = 0;

  // Initialize with current size
  stat(filePath)
    .then((info) => { lastSize = info.size; })
    .catch(() => { /* File doesn't exist yet */ });

  const pollInterval = setInterval(async () => {
    try {
      const currentInfo = await stat(filePath);
      if (currentInfo.size > lastSize) {
        const stream = createReadStream(filePath, {
          start: lastSize,
          encoding: "utf-8",
        });

        let newData = "";
        for await (const chunk of stream) {
          newData += chunk;
        }

        const newLines = newData.split("\n").filter((l) => l.trim() !== "");
        for (const line of newLines) {
          const event = `data: ${JSON.stringify({ source, line, timestamp: new Date().toISOString() })}\n\n`;
          for (const client of sseClients) {
            try {
              client.write(event);
            } catch {
              sseClients.delete(client);
            }
          }
        }

        lastSize = currentInfo.size;
      } else if (currentInfo.size < lastSize) {
        // File was rotated/truncated — reset
        lastSize = 0;
      }
    } catch {
      // File might not exist yet
    }
  }, 2000);

  pollInterval.unref();
}

async function startLogWatcher(): Promise<void> {
  watchJsonlFile(HISTORY_FILE, "history");
  watchJsonlFile(ACTIVITY_FILE, "activity");
}

// ---------------------------------------------------------------------------
// Request Router
// ---------------------------------------------------------------------------

async function handleRequest(
  req: http.IncomingMessage,
  res: http.ServerResponse
): Promise<void> {
  resetActivity();

  const parsedUrl = new URL(req.url ?? "/", `http://127.0.0.1:${PORT}`);
  const pathname = parsedUrl.pathname;

  // CORS preflight
  if (req.method === "OPTIONS") {
    res.writeHead(204, corsHeaders());
    res.end();
    return;
  }

  if (req.method !== "GET") {
    errorRes(res, "Method not allowed", 405);
    return;
  }

  try {
    // GET / — Dashboard HTML
    if (pathname === "/" || pathname === "/index.html") {
      const html = await getDashboardHtml();
      res.writeHead(200, {
        "Content-Type": "text/html; charset=utf-8",
        ...corsHeaders(),
      });
      res.end(html);
      return;
    }

    // GET /api/projects — All discovered project dashboards
    if (pathname === "/api/projects") {
      const projects = await discoverProjects();
      jsonRes(res, projects);
      return;
    }

    // GET /api/logs/stream — SSE
    if (pathname === "/api/logs/stream") {
      res.writeHead(200, {
        "Content-Type": "text/event-stream",
        "Cache-Control": "no-cache",
        Connection: "keep-alive",
        ...corsHeaders(),
      });
      res.write(":ok\n\n");

      sseClients.add(res);

      req.on("close", () => {
        sseClients.delete(res);
      });

      return; // Keep connection open
    }

    // GET /api/logs/history?limit=N&search=TERM
    if (pathname === "/api/logs/history") {
      const limit = Math.min(
        Math.max(parseInt(parsedUrl.searchParams.get("limit") ?? "100", 10) || 100, 1),
        5000
      );
      const search = parsedUrl.searchParams.get("search") ?? undefined;

      const lines = await readLogLines(HISTORY_FILE, limit, search);
      jsonRes(res, { source: "history", count: lines.length, lines });
      return;
    }

    // GET /api/tools/activity?limit=N&server=NAME&tool=NAME&status=STATUS
    if (pathname === "/api/tools/activity") {
      const limit = Math.min(
        Math.max(parseInt(parsedUrl.searchParams.get("limit") ?? "50", 10) || 50, 1),
        500
      );
      const serverFilter = parsedUrl.searchParams.get("server") ?? undefined;
      const toolFilter = parsedUrl.searchParams.get("tool") ?? undefined;
      const statusFilter = parsedUrl.searchParams.get("status") ?? undefined;

      let entries = await readActivityEntries(limit * 5);

      if (serverFilter) entries = entries.filter((e) => e.server === serverFilter);
      if (toolFilter) entries = entries.filter((e) => e.tool === toolFilter);
      if (statusFilter) entries = entries.filter((e) => e.status === statusFilter);

      entries = entries.slice(0, limit);

      const servers = [...new Set(entries.map((e) => e.server))];
      const tools = [...new Set(entries.map((e) => e.tool))];

      jsonRes(res, {
        totalEntries: entries.length,
        uniqueServers: servers,
        uniqueTools: tools,
        entries,
      });
      return;
    }

    // GET /api/tools/active?server=NAME&staleMs=N
    if (pathname === "/api/tools/active") {
      const staleMs = Math.min(
        Math.max(parseInt(parsedUrl.searchParams.get("staleMs") ?? "300000", 10) || 300000, 1000),
        600000
      );
      const serverFilter = parsedUrl.searchParams.get("server") ?? undefined;

      let active = await findActiveTools(staleMs);

      if (serverFilter) active = active.filter((e) => e.server === serverFilter);

      const byServer: Record<string, string[]> = {};
      for (const entry of active) {
        if (!byServer[entry.server]) byServer[entry.server] = [];
        byServer[entry.server].push(entry.tool);
      }

      jsonRes(res, {
        activeCount: active.length,
        byServer,
        tools: active,
      });
      return;
    }

    // GET /api/logs/debug/:sessionId?limit=N
    const debugMatch = pathname.match(/^\/api\/logs\/debug\/([^/]+)$/);
    if (debugMatch) {
      const sessionId = debugMatch[1];

      if (!validateSessionId(sessionId)) {
        errorRes(res, "Invalid session ID");
        return;
      }

      const limit = Math.min(
        Math.max(parseInt(parsedUrl.searchParams.get("limit") ?? "100", 10) || 100, 1),
        5000
      );

      const debugDir = path.join(CLAUDE_DIR, "debug");
      const logPath = path.join(debugDir, `${sessionId}.log`);

      // Verify path stays within debug directory
      const resolved = path.resolve(logPath);
      if (!resolved.startsWith(path.resolve(debugDir) + path.sep)) {
        errorRes(res, "Path traversal blocked", 403);
        return;
      }

      const lines = await readLogLines(logPath, limit);
      jsonRes(res, { source: "debug", sessionId, count: lines.length, lines });
      return;
    }

    // 404
    errorRes(res, "Not found", 404);
  } catch (error: unknown) {
    console.error("[project-oversight-mcp] Request error:", error);
    errorRes(res, "Internal server error", 500);
  }
}

// ---------------------------------------------------------------------------
// Start Server
// ---------------------------------------------------------------------------

const server = http.createServer(handleRequest);

server.listen(PORT, "127.0.0.1", () => {
  console.log(`[project-oversight-mcp] Dashboard server started at http://127.0.0.1:${PORT}`);
  console.log(`[project-oversight-mcp] Auto-shutdown after ${TIMEOUT_MINUTES} minutes of inactivity`);
  console.log(`[project-oversight-mcp] Central store: ${CENTRAL_STORE}`);

  startIdleTimer();
  startLogWatcher();
});

server.on("error", (err: NodeJS.ErrnoException) => {
  if (err.code === "EADDRINUSE") {
    console.log(`[project-oversight-mcp] Port ${PORT} already in use — dashboard may already be running`);
    console.log(`[project-oversight-mcp] Open http://127.0.0.1:${PORT} in your browser`);
    process.exit(0);
  }
  console.error("[project-oversight-mcp] Server error:", err);
  process.exit(1);
});

// Graceful shutdown
process.on("SIGINT", () => {
  console.log("\n[project-oversight-mcp] Shutting down...");
  server.close();
  process.exit(0);
});

process.on("SIGTERM", () => {
  server.close();
  process.exit(0);
});
