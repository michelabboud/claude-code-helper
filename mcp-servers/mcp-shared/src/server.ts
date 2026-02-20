/**
 * MCP Server factory and lifecycle management.
 * Eliminates boilerplate from individual server implementations.
 */

import { Server } from "@modelcontextprotocol/sdk/server/index.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { CallToolRequestSchema } from "@modelcontextprotocol/sdk/types.js";
import type { Logger } from "./logger.js";
import { createLogger, generateRequestId } from "./logger.js";
import { measureDuration } from "./logger.js";
import { runStartupHealthChecks, type HealthCheck, type HealthCheckOptions } from "./health.js";
import type { MetricsCollector } from "./metrics.js";
import { createMetricsCollector } from "./metrics.js";
import type { ActivityTracker } from "./activity.js";
import { createActivityTracker } from "./activity.js";

export interface MCPServerOptions {
  name: string;
  version?: string;
  healthChecks?: HealthCheck[];
  healthCheckOptions?: HealthCheckOptions;
  logger?: Logger;
}

export interface MCPServerInstance {
  server: Server;
  logger: Logger;
  metrics: MetricsCollector;
  activity: ActivityTracker;
  start: () => Promise<void>;
}

/**
 * Create an MCP server with standardized setup, logging, and health checks.
 */
export function createMCPServer(options: MCPServerOptions): MCPServerInstance {
  const logger = options.logger ?? createLogger(options.name);
  const metrics = createMetricsCollector();
  const activity = createActivityTracker(options.name);

  const server = new Server(
    {
      name: options.name,
      version: options.version ?? "1.0.0",
    },
    {
      capabilities: {
        tools: {},
      },
    }
  );

  const serverStartTime = performance.now();

  async function start(): Promise<void> {
    // Run health checks before connecting
    if (options.healthChecks && options.healthChecks.length > 0) {
      const healthy = await runStartupHealthChecks(
        options.healthChecks,
        logger,
        options.healthCheckOptions
      );
      if (!healthy) {
        logger.warn("Starting server despite failed health checks - some tools may not work");
      }
    }

    const transport = new StdioServerTransport();
    await server.connect(transport);

    const startupMs = Math.round(performance.now() - serverStartTime);
    logger.info("Server started", { transport: "stdio", startupMs });
  }

  return { server, logger, metrics, activity, start };
}

/**
 * Register a CallToolRequestSchema handler with automatic activity tracking.
 *
 * Wraps the handler so that every tool call is automatically logged to
 * ~/.claude/mcp-activity.jsonl with started/completed/failed status.
 * Individual servers don't need to manually call activity.toolStarted() etc.
 *
 * Usage:
 *   registerTrackedToolHandler(instance, async (request) => { ... });
 *
 * This replaces:
 *   server.setRequestHandler(CallToolRequestSchema, async (request) => { ... });
 */
export function registerTrackedToolHandler(
  instance: MCPServerInstance,
  handler: (request: { params: { name: string; arguments?: Record<string, unknown> } }) => Promise<{ content: Array<{ type: string; text: string }>; isError?: boolean }>,
): void {
  instance.server.setRequestHandler(CallToolRequestSchema, async (request) => {
    const { name, arguments: args } = request.params;
    const requestId = generateRequestId();
    const startTime = performance.now();

    instance.activity.toolStarted(requestId, name, args);

    try {
      const result = await handler(request);

      const durationMs = measureDuration(startTime);
      const isError = result.isError === true;

      instance.metrics.recordCall(name, durationMs, isError);

      if (isError) {
        instance.activity.toolFailed(requestId, name, durationMs, "Tool returned error response");
      } else {
        instance.activity.toolCompleted(requestId, name, durationMs);
      }

      return result;
    } catch (error) {
      const durationMs = measureDuration(startTime);
      instance.metrics.recordCall(name, durationMs, true);
      instance.activity.toolFailed(
        requestId,
        name,
        durationMs,
        error instanceof Error ? error.message : String(error),
      );
      throw error;
    }
  });
}

/**
 * Standard entry point wrapper with error handling.
 */
export function runServer(options: MCPServerOptions, setup: (instance: MCPServerInstance) => void | Promise<void>): void {
  const instance = createMCPServer(options);

  (async () => {
    await setup(instance);
    await instance.start();
  })().catch((error) => {
    instance.logger.error("Fatal error", { error: error instanceof Error ? error.message : String(error) });
    process.exit(1);
  });
}
