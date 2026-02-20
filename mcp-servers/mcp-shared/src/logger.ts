/**
 * Structured logger for MCP servers.
 * Outputs JSON to stderr (MCP uses stdout for protocol messages).
 * Optionally also appends to a log file when MCP_LOG_FILE is set.
 * Supports log rotation via MCP_LOG_MAX_SIZE_MB (default: 10 MB).
 */

import { randomUUID } from "crypto";
import fs from "fs";

export type LogLevel = "debug" | "info" | "warn" | "error";

const LOG_LEVELS: Record<LogLevel, number> = {
  debug: 0,
  info: 1,
  warn: 2,
  error: 3,
};

/** Default max log file size in megabytes before rotation. */
const DEFAULT_MAX_SIZE_MB = 10;

/** Check file size every N writes to avoid I/O overhead. */
const ROTATION_CHECK_INTERVAL = 100;

export interface LogEntry {
  timestamp: string;
  level: LogLevel;
  server: string;
  message: string;
  requestId?: string;
  tool?: string;
  durationMs?: number;
  [key: string]: unknown;
}

export interface Logger {
  debug(message: string, meta?: Record<string, unknown>): void;
  info(message: string, meta?: Record<string, unknown>): void;
  warn(message: string, meta?: Record<string, unknown>): void;
  error(message: string, meta?: Record<string, unknown>): void;
  child(meta: Record<string, unknown>): Logger;
}

export function createLogger(serverName: string, minLevel?: LogLevel): Logger {
  const level = minLevel ?? (process.env.MCP_LOG_LEVEL as LogLevel) ?? "info";
  const minLevelNum = LOG_LEVELS[level] ?? LOG_LEVELS.info;

  const logFilePath = process.env.MCP_LOG_FILE || undefined;

  const maxSizeMb = parseFloat(process.env.MCP_LOG_MAX_SIZE_MB ?? "") || DEFAULT_MAX_SIZE_MB;
  const maxSizeBytes = maxSizeMb * 1024 * 1024;

  let writeCount = 0;

  /**
   * Rotate the log file if it exceeds the configured max size.
   * Renames current log to `${path}.1` and lets the next write start a fresh file.
   */
  function rotateIfNeeded(): void {
    if (!logFilePath) return;

    writeCount++;
    if (writeCount % ROTATION_CHECK_INTERVAL !== 0) return;

    try {
      const stats = fs.statSync(logFilePath);
      if (stats.size >= maxSizeBytes) {
        fs.renameSync(logFilePath, `${logFilePath}.1`);
      }
    } catch {
      // File may not exist yet or stat/rename failed — ignore and continue.
    }
  }

  function write(logLevel: LogLevel, message: string, meta?: Record<string, unknown>): void {
    if (LOG_LEVELS[logLevel] < minLevelNum) return;

    const entry: LogEntry = {
      timestamp: new Date().toISOString(),
      level: logLevel,
      server: serverName,
      message,
      ...meta,
    };

    const line = JSON.stringify(entry) + "\n";

    process.stderr.write(line);

    if (logFilePath) {
      rotateIfNeeded();
      try {
        fs.appendFileSync(logFilePath, line);
      } catch (err) {
        process.stderr.write(
          JSON.stringify({
            timestamp: new Date().toISOString(),
            level: "error",
            server: serverName,
            message: `Failed to write to log file: ${logFilePath}`,
            error: err instanceof Error ? err.message : String(err),
          }) + "\n"
        );
      }
    }
  }

  function createChildLogger(baseMeta: Record<string, unknown>): Logger {
    return {
      debug: (msg, meta) => write("debug", msg, { ...baseMeta, ...meta }),
      info: (msg, meta) => write("info", msg, { ...baseMeta, ...meta }),
      warn: (msg, meta) => write("warn", msg, { ...baseMeta, ...meta }),
      error: (msg, meta) => write("error", msg, { ...baseMeta, ...meta }),
      child: (childMeta) => createChildLogger({ ...baseMeta, ...childMeta }),
    };
  }

  return {
    debug: (msg, meta) => write("debug", msg, meta),
    info: (msg, meta) => write("info", msg, meta),
    warn: (msg, meta) => write("warn", msg, meta),
    error: (msg, meta) => write("error", msg, meta),
    child: (childMeta) => createChildLogger(childMeta),
  };
}

/**
 * Generate a short unique request ID for tracing tool calls.
 * Uses the first 8 characters of a UUID v4 for brevity.
 */
export function generateRequestId(): string {
  return randomUUID().slice(0, 8);
}

/**
 * Measure elapsed duration in milliseconds from a start time.
 * Use with `performance.now()` for high-resolution timing.
 *
 * @param startTime - Value from `performance.now()` at the start of the operation
 * @returns Elapsed time in whole milliseconds
 */
export function measureDuration(startTime: number): number {
  return Math.round(performance.now() - startTime);
}
