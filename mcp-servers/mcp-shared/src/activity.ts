/**
 * Activity tracker for MCP tool calls.
 *
 * Writes structured JSONL entries to ~/.claude/mcp-activity.jsonl so that
 * project-oversight-mcp (and the dashboard) can show which tools are running,
 * where, and what they're doing — in real time.
 *
 * Each tool call produces two entries:
 *   1. "started"   — written when the tool handler begins
 *   2. "completed" or "failed" — written when it finishes
 *
 * Entry format:
 * {
 *   "id": "abc12345",
 *   "timestamp": "2026-02-20T12:00:00.000Z",
 *   "server": "code-review-mcp",
 *   "tool": "lint_file",
 *   "status": "started" | "completed" | "failed",
 *   "durationMs": 142,
 *   "projectDir": "/home/user/my-project",
 *   "args": { "filePath": "/src/app.ts", "linter": "eslint" },
 *   "error": "..." // only when status=failed
 * }
 */

import fs from "node:fs";
import path from "node:path";
import { homedir } from "node:os";

/** Where all MCP servers write their activity log. */
const ACTIVITY_FILE = path.join(homedir(), ".claude", "mcp-activity.jsonl");

/** Max file size before rotation (5 MB). */
const MAX_SIZE_BYTES = 5 * 1024 * 1024;

/** Check size every N writes. */
const ROTATION_CHECK_INTERVAL = 50;

let writeCount = 0;

export interface ActivityEntry {
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

/**
 * Rotate the activity file if it exceeds MAX_SIZE_BYTES.
 * Keeps one backup (.1) — this is a rolling window, not an archive.
 */
function rotateIfNeeded(): void {
  writeCount++;
  if (writeCount % ROTATION_CHECK_INTERVAL !== 0) return;

  try {
    const stats = fs.statSync(ACTIVITY_FILE);
    if (stats.size >= MAX_SIZE_BYTES) {
      fs.renameSync(ACTIVITY_FILE, `${ACTIVITY_FILE}.1`);
    }
  } catch {
    // File doesn't exist yet or stat failed — fine
  }
}

/**
 * Append one activity entry to the shared JSONL log.
 * Non-throwing: swallows errors to avoid disrupting tool execution.
 */
function writeEntry(entry: ActivityEntry): void {
  try {
    // Ensure directory exists
    const dir = path.dirname(ACTIVITY_FILE);
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }

    rotateIfNeeded();
    fs.appendFileSync(ACTIVITY_FILE, JSON.stringify(entry) + "\n");
  } catch {
    // Activity logging is best-effort — never break the server
  }
}

/**
 * Sanitize tool arguments for logging.
 * Truncates long string values and removes potentially sensitive fields.
 */
function sanitizeArgs(args: unknown): Record<string, unknown> | undefined {
  if (!args || typeof args !== "object") return undefined;

  const result: Record<string, unknown> = {};
  const raw = args as Record<string, unknown>;

  for (const [key, value] of Object.entries(raw)) {
    // Skip fields that might contain secrets
    const lk = key.toLowerCase();
    if (lk.includes("password") || lk.includes("secret") || lk.includes("token") || lk.includes("key")) {
      result[key] = "[redacted]";
      continue;
    }

    if (typeof value === "string") {
      // Truncate long strings
      result[key] = value.length > 200 ? value.slice(0, 200) + "..." : value;
    } else {
      result[key] = value;
    }
  }

  return result;
}

export interface ActivityTracker {
  /** Record that a tool call has started. Returns the entry ID. */
  toolStarted(requestId: string, tool: string, args?: unknown): string;

  /** Record that a tool call completed successfully. */
  toolCompleted(requestId: string, tool: string, durationMs: number): void;

  /** Record that a tool call failed. */
  toolFailed(requestId: string, tool: string, durationMs: number, error: string): void;
}

/**
 * Create an activity tracker bound to a specific MCP server name.
 * Called once per server at startup.
 */
export function createActivityTracker(serverName: string): ActivityTracker {
  const projectDir = process.cwd();

  return {
    toolStarted(requestId: string, tool: string, args?: unknown): string {
      writeEntry({
        id: requestId,
        timestamp: new Date().toISOString(),
        server: serverName,
        tool,
        status: "started",
        projectDir,
        args: sanitizeArgs(args),
      });
      return requestId;
    },

    toolCompleted(requestId: string, tool: string, durationMs: number): void {
      writeEntry({
        id: requestId,
        timestamp: new Date().toISOString(),
        server: serverName,
        tool,
        status: "completed",
        durationMs,
        projectDir,
      });
    },

    toolFailed(requestId: string, tool: string, durationMs: number, error: string): void {
      writeEntry({
        id: requestId,
        timestamp: new Date().toISOString(),
        server: serverName,
        tool,
        status: "failed",
        durationMs,
        projectDir,
        error,
      });
    },
  };
}

/** Path to the shared activity log file (for readers like project-oversight-mcp). */
export const ACTIVITY_LOG_PATH = ACTIVITY_FILE;
