import { createLogger, generateRequestId, measureDuration } from "./logger.js";
import fs from "fs";
import os from "os";
import path from "path";

describe("createLogger", () => {
  let stderrOutput: string[];
  const originalWrite = process.stderr.write;

  beforeEach(() => {
    stderrOutput = [];
    process.stderr.write = ((chunk: string) => {
      stderrOutput.push(chunk);
      return true;
    }) as typeof process.stderr.write;
  });

  afterEach(() => {
    process.stderr.write = originalWrite;
    delete process.env.MCP_LOG_FILE;
  });

  it("should output JSON log entries to stderr", () => {
    const logger = createLogger("test-server", "info");
    logger.info("Hello world");

    expect(stderrOutput).toHaveLength(1);
    const entry = JSON.parse(stderrOutput[0]);
    expect(entry.level).toBe("info");
    expect(entry.server).toBe("test-server");
    expect(entry.message).toBe("Hello world");
    expect(entry.timestamp).toBeDefined();
  });

  it("should include extra metadata", () => {
    const logger = createLogger("test-server", "info");
    logger.info("Request received", { tool: "analyze", requestId: "abc-123" });

    const entry = JSON.parse(stderrOutput[0]);
    expect(entry.tool).toBe("analyze");
    expect(entry.requestId).toBe("abc-123");
  });

  it("should respect log level filtering", () => {
    const logger = createLogger("test-server", "warn");
    logger.debug("Should not appear");
    logger.info("Should not appear");
    logger.warn("Should appear");
    logger.error("Should appear");

    expect(stderrOutput).toHaveLength(2);
    expect(JSON.parse(stderrOutput[0]).level).toBe("warn");
    expect(JSON.parse(stderrOutput[1]).level).toBe("error");
  });

  it("should create child loggers with inherited metadata", () => {
    const logger = createLogger("test-server", "info");
    const child = logger.child({ requestId: "req-1", tool: "search" });
    child.info("Processing");

    const entry = JSON.parse(stderrOutput[0]);
    expect(entry.requestId).toBe("req-1");
    expect(entry.tool).toBe("search");
    expect(entry.message).toBe("Processing");
  });

  it("should allow child metadata to be overridden", () => {
    const logger = createLogger("test-server", "info");
    const child = logger.child({ requestId: "req-1" });
    child.info("Override", { requestId: "req-2" });

    const entry = JSON.parse(stderrOutput[0]);
    expect(entry.requestId).toBe("req-2");
  });
});

describe("log file output (MCP_LOG_FILE)", () => {
  let stderrOutput: string[];
  const originalWrite = process.stderr.write;
  let tmpDir: string;

  beforeEach(() => {
    stderrOutput = [];
    process.stderr.write = ((chunk: string) => {
      stderrOutput.push(chunk);
      return true;
    }) as typeof process.stderr.write;
    tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), "mcp-logger-test-"));
  });

  afterEach(() => {
    process.stderr.write = originalWrite;
    delete process.env.MCP_LOG_FILE;
    try {
      fs.rmSync(tmpDir, { recursive: true, force: true });
    } catch {
      // ignore cleanup errors
    }
  });

  it("should write to file when MCP_LOG_FILE is set", () => {
    const logFile = path.join(tmpDir, "test.log");
    process.env.MCP_LOG_FILE = logFile;

    const logger = createLogger("test-server", "info");
    logger.info("file log entry");
    logger.warn("second entry");

    // Verify file was created and contains both entries
    const content = fs.readFileSync(logFile, "utf-8");
    const lines = content.trim().split("\n");
    expect(lines).toHaveLength(2);

    const first = JSON.parse(lines[0]);
    expect(first).toMatchObject({
      level: "info",
      server: "test-server",
      message: "file log entry",
    });

    const second = JSON.parse(lines[1]);
    expect(second).toMatchObject({
      level: "warn",
      server: "test-server",
      message: "second entry",
    });

    // stderr should also have received both entries
    expect(stderrOutput).toHaveLength(2);
  });

  it("should not write to file when MCP_LOG_FILE is not set", () => {
    delete process.env.MCP_LOG_FILE;

    const logger = createLogger("test-server", "info");
    logger.info("stderr only");

    // stderr should receive the entry
    expect(stderrOutput).toHaveLength(1);

    // No files should have been created in tmpDir
    const files = fs.readdirSync(tmpDir);
    expect(files).toHaveLength(0);
  });

  it("should continue working if file write fails (invalid path)", () => {
    // Use a path that cannot be written to
    process.env.MCP_LOG_FILE = "/nonexistent-dir/deeply/nested/impossible.log";

    const logger = createLogger("test-server", "info");

    // Should not throw
    expect(() => logger.info("this should not crash")).not.toThrow();

    // stderr should have the original log entry plus the error about failed write
    expect(stderrOutput.length).toBeGreaterThanOrEqual(2);

    // First call: the original log entry
    const originalEntry = JSON.parse(stderrOutput[0]);
    expect(originalEntry.message).toBe("this should not crash");

    // Second call: the error about failed file write
    const errorEntry = JSON.parse(stderrOutput[1]);
    expect(errorEntry.level).toBe("error");
    expect(errorEntry.message).toContain("Failed to write to log file");
  });

  it("should write to file from child loggers", () => {
    const logFile = path.join(tmpDir, "child.log");
    process.env.MCP_LOG_FILE = logFile;

    const logger = createLogger("test-server", "info");
    const child = logger.child({ requestId: "req-42" });
    child.info("child file entry");

    const content = fs.readFileSync(logFile, "utf-8");
    const parsed = JSON.parse(content.trim());
    expect(parsed).toMatchObject({
      level: "info",
      server: "test-server",
      message: "child file entry",
      requestId: "req-42",
    });
  });
});

describe("log rotation (MCP_LOG_MAX_SIZE_MB)", () => {
  let stderrOutput: string[];
  const originalWrite = process.stderr.write;
  let tmpDir: string;

  beforeEach(() => {
    stderrOutput = [];
    process.stderr.write = ((chunk: string) => {
      stderrOutput.push(chunk);
      return true;
    }) as typeof process.stderr.write;
    tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), "mcp-rotation-test-"));
  });

  afterEach(() => {
    process.stderr.write = originalWrite;
    delete process.env.MCP_LOG_FILE;
    delete process.env.MCP_LOG_MAX_SIZE_MB;
    try {
      fs.rmSync(tmpDir, { recursive: true, force: true });
    } catch {
      // ignore cleanup errors
    }
  });

  it("should rotate log file when size exceeds limit", () => {
    const logFile = path.join(tmpDir, "rotate.log");
    process.env.MCP_LOG_FILE = logFile;
    // Set a very small max size so rotation triggers quickly
    // Each JSON log line is roughly 100-150 bytes, so 100 lines ~ 10-15 KB
    // Use 0.001 MB = ~1 KB so rotation is nearly guaranteed after 100 writes
    process.env.MCP_LOG_MAX_SIZE_MB = "0.001";

    const logger = createLogger("test-server", "info");

    // Write 100 entries to trigger the rotation check (interval = 100)
    for (let i = 0; i < 100; i++) {
      logger.info(`entry ${i}`);
    }

    // At write #100, rotation check fires. The file should be large enough
    // to trigger rotation, so .1 backup should exist.
    const backupFile = `${logFile}.1`;
    expect(fs.existsSync(backupFile)).toBe(true);

    // The backup should contain the old log data
    const backupContent = fs.readFileSync(backupFile, "utf-8");
    expect(backupContent.length).toBeGreaterThan(0);

    // After rotation, write one more entry — it goes to a fresh file
    logger.info("after rotation");
    const freshContent = fs.readFileSync(logFile, "utf-8");
    expect(freshContent).toContain("after rotation");
  });

  it("should create .1 backup overwriting previous backup", () => {
    const logFile = path.join(tmpDir, "rotate2.log");
    const backupFile = `${logFile}.1`;
    process.env.MCP_LOG_FILE = logFile;
    process.env.MCP_LOG_MAX_SIZE_MB = "0.001";

    // Create a pre-existing backup file
    fs.writeFileSync(backupFile, "old backup content\n");

    const logger = createLogger("test-server", "info");

    // Trigger rotation
    for (let i = 0; i < 100; i++) {
      logger.info(`entry ${i}`);
    }

    // The old backup should be overwritten
    const backupContent = fs.readFileSync(backupFile, "utf-8");
    expect(backupContent).not.toContain("old backup content");
    expect(backupContent.length).toBeGreaterThan(0);
  });

  it("should handle rotation failure gracefully and continue writing", () => {
    const logFile = path.join(tmpDir, "rotate3.log");
    process.env.MCP_LOG_FILE = logFile;
    process.env.MCP_LOG_MAX_SIZE_MB = "0.001";

    const logger = createLogger("test-server", "info");

    // Spy on fs.renameSync to make it throw
    const originalRename = fs.renameSync;
    let renameCalled = false;

    // Write 99 entries first (no rotation check yet)
    for (let i = 0; i < 99; i++) {
      logger.info(`entry ${i}`);
    }

    // Make rename fail
    fs.renameSync = (() => {
      renameCalled = true;
      throw new Error("Permission denied");
    }) as typeof fs.renameSync;

    // The 100th write triggers the rotation check — rename will fail
    // but the logger should continue writing without throwing
    expect(() => logger.info("entry 99")).not.toThrow();
    expect(renameCalled).toBe(true);

    // Restore
    fs.renameSync = originalRename;

    // The log file should still contain all entries (rotation failed so no rename happened)
    const content = fs.readFileSync(logFile, "utf-8");
    expect(content).toContain("entry 99");
  });
});

describe("generateRequestId", () => {
  it("should return an 8-character string", () => {
    const id = generateRequestId();
    expect(id).toHaveLength(8);
  });

  it("should return unique values on successive calls", () => {
    const ids = new Set(Array.from({ length: 100 }, () => generateRequestId()));
    expect(ids.size).toBe(100);
  });
});

describe("measureDuration", () => {
  it("should return a non-negative integer", () => {
    const start = performance.now();
    const duration = measureDuration(start);
    expect(duration).toBeGreaterThanOrEqual(0);
    expect(Number.isInteger(duration)).toBe(true);
  });
});
