# mcp-shared API Reference

Shared utilities for all claude-code-helper MCP servers. Provides standardized server lifecycle, logging, security, health checks, metrics, and response formatting.

## Installation

Used as a workspace package — reference it in your MCP server's `package.json`:

```json
{
  "dependencies": {
    "mcp-shared": "*"
  }
}
```

## Quick Start

```typescript
import { runServer, commandHealthCheck } from 'mcp-shared';

runServer(
  {
    name: 'my-server',
    version: '1.0.0',
    healthChecks: [commandHealthCheck('node')],
  },
  ({ server, logger, metrics }) => {
    server.setRequestHandler(ListToolsRequestSchema, async () => ({
      tools: [{ name: 'my_tool', description: 'Does something', inputSchema: { type: 'object', properties: {} } }],
    }));

    server.setRequestHandler(CallToolRequestSchema, async (request) => {
      const requestId = generateRequestId();
      const start = performance.now();
      logger.info('Tool called', { requestId, tool: request.params.name });

      try {
        // ... tool logic ...
        metrics.recordCall(request.params.name, measureDuration(start), false);
        return successResponse('Done!');
      } catch (error) {
        metrics.recordCall(request.params.name, measureDuration(start), true);
        return errorResponse(error, 'my_tool failed');
      }
    });
  }
);
```

---

## Server Lifecycle

### `runServer(options, setup)`

Standard entry point for MCP servers. Creates the server, runs health checks, executes your setup function, then starts listening on stdio.

```typescript
function runServer(
  options: MCPServerOptions,
  setup: (instance: MCPServerInstance) => void | Promise<void>
): void
```

**Parameters:**
- `options.name` — Server name (used in logging and MCP registration)
- `options.version` — Server version string (default: `'1.0.0'`)
- `options.healthChecks` — Array of `HealthCheck` objects to run at startup
- `options.healthCheckOptions` — Retry and timeout configuration
- `options.logger` — Custom logger (auto-created if omitted)

**Example:**
```typescript
runServer({ name: 'code-review-mcp', version: '1.0.0' }, ({ server, logger }) => {
  // Register tool handlers on `server`
});
```

### `createMCPServer(options)`

Lower-level factory if you need more control. Returns the server instance without starting it.

```typescript
function createMCPServer(options: MCPServerOptions): MCPServerInstance
```

**Returns:** `{ server, logger, metrics, start }`

---

## Logging

### `createLogger(serverName, minLevel?)`

Creates a structured JSON logger that outputs to stderr and optionally to a rotating log file.

```typescript
function createLogger(serverName: string, minLevel?: LogLevel): Logger
```

**Environment variables:**
- `MCP_LOG_LEVEL` — Override minimum level (`debug`, `info`, `warn`, `error`)
- `MCP_LOG_FILE` — Path to log file (enables file logging)
- `MCP_LOG_MAX_SIZE_MB` — Max log file size before rotation (default: `10`)

**Logger methods:**
```typescript
interface Logger {
  debug(message: string, meta?: Record<string, unknown>): void;
  info(message: string, meta?: Record<string, unknown>): void;
  warn(message: string, meta?: Record<string, unknown>): void;
  error(message: string, meta?: Record<string, unknown>): void;
  child(meta: Record<string, unknown>): Logger;
}
```

**Example:**
```typescript
const logger = createLogger('my-server');
logger.info('Tool called', { requestId: 'abc123', tool: 'lint_file' });
// Output: {"timestamp":"...","level":"info","server":"my-server","message":"Tool called","requestId":"abc123","tool":"lint_file"}
```

### `generateRequestId()`

Returns an 8-character unique ID for request tracing.

```typescript
function generateRequestId(): string  // e.g., "a1b2c3d4"
```

### `measureDuration(startTime)`

Calculates elapsed milliseconds from a `performance.now()` start value.

```typescript
function measureDuration(startTime: number): number
```

---

## Input Validation

### `sanitizePath(inputPath, basePath?)`

Resolves and validates file paths. Prevents directory traversal attacks.

```typescript
function sanitizePath(inputPath: string, basePath?: string): string
```

**Throws** `SanitizationError` if the resolved path escapes `basePath`.

**Example:**
```typescript
const safe = sanitizePath(userInput, process.cwd());
// Throws if userInput resolves outside cwd
```

### `sanitizeUrl(inputUrl)`

Validates URLs against SSRF attacks. Only allows `http`/`https` protocols, blocks private IP ranges.

```typescript
function sanitizeUrl(inputUrl: string): string
```

### `sanitizeString(input, maxLength?)`

Strips null bytes and enforces maximum string length.

```typescript
function sanitizeString(input: string, maxLength?: number): string  // default: 10000
```

### `SanitizationError`

Custom error thrown by sanitization functions.

```typescript
class SanitizationError extends Error {
  field: string;
  value: string;
}
```

---

## Health Checks

### `commandHealthCheck(command)`

Factory that creates a health check verifying a CLI tool is available via `which`.

```typescript
function commandHealthCheck(command: string): HealthCheck
```

**Example:**
```typescript
runServer({
  name: 'code-review-mcp',
  healthChecks: [commandHealthCheck('eslint'), commandHealthCheck('semgrep')],
}, setup);
```

### `checkCommand(command)`

Low-level check for command availability.

```typescript
function checkCommand(command: string): Promise<boolean>
```

### `runStartupHealthChecks(checks, logger, options?)`

Executes an array of health checks with retry logic.

```typescript
function runStartupHealthChecks(
  checks: HealthCheck[],
  logger: Logger,
  options?: HealthCheckOptions
): Promise<boolean>
```

**Options:**
```typescript
interface HealthCheckOptions {
  maxRetries?: number;    // default: 2
  retryDelayMs?: number;  // default: 1000
  timeoutMs?: number;     // default: 5000
}
```

---

## Response Helpers

Standard response formatters for MCP tool handlers.

### `successResponse(text)`

```typescript
function successResponse(text: string): ToolResponse
// Returns: { content: [{ type: 'text', text }] }
```

### `jsonResponse(label, data)`

```typescript
function jsonResponse(label: string, data: unknown): ToolResponse
// Returns: { content: [{ type: 'text', text: `${label}:\n${JSON.stringify(data, null, 2)}` }] }
```

### `errorResponse(error, context?)`

```typescript
function errorResponse(error: unknown, context?: string): ToolResponse
// Returns: { content: [{ type: 'text', text: '...' }], isError: true }
```

---

## Metrics

### `createMetricsCollector()`

Creates an in-memory metrics collector that tracks per-tool call counts, error rates, and latency percentiles.

```typescript
function createMetricsCollector(): MetricsCollector
```

**Interface:**
```typescript
interface MetricsCollector {
  recordCall(tool: string, durationMs: number, isError: boolean): void;
  getSummary(): MetricsSummary;
  reset(): void;
}

interface MetricsSummary {
  toolCalls: Record<string, ToolMetrics>;
  uptime: number;       // seconds
  totalCalls: number;
  totalErrors: number;
}

interface ToolMetrics {
  count: number;
  errors: number;
  p50Ms: number;
  p95Ms: number;
  p99Ms: number;
}
```

**Example:**
```typescript
const { metrics } = createMCPServer({ name: 'my-server' });

// In tool handler:
const start = performance.now();
// ... do work ...
metrics.recordCall('lint_file', measureDuration(start), false);

// Later:
const summary = metrics.getSummary();
// { totalCalls: 42, totalErrors: 1, toolCalls: { lint_file: { count: 42, p50Ms: 120, ... } } }
```
