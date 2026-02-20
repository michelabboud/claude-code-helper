/**
 * MCP Server factory and lifecycle management.
 * Eliminates boilerplate from individual server implementations.
 */

import { Server } from "@modelcontextprotocol/sdk/server/index.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import type { Logger } from "./logger.js";
import { createLogger } from "./logger.js";
import { runStartupHealthChecks, type HealthCheck, type HealthCheckOptions } from "./health.js";
import type { MetricsCollector } from "./metrics.js";
import { createMetricsCollector } from "./metrics.js";

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
  start: () => Promise<void>;
}

/**
 * Create an MCP server with standardized setup, logging, and health checks.
 */
export function createMCPServer(options: MCPServerOptions): MCPServerInstance {
  const logger = options.logger ?? createLogger(options.name);
  const metrics = createMetricsCollector();

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

  return { server, logger, metrics, start };
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
