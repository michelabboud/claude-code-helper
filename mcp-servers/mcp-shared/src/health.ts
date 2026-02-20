/**
 * Health check framework for MCP servers.
 * Supports startup checks with retry and periodic background checks.
 */

import type { Logger } from "./logger.js";

export interface HealthCheck {
  name: string;
  check: () => Promise<boolean>;
}

export interface HealthCheckOptions {
  maxRetries?: number;
  retryDelayMs?: number;
  timeoutMs?: number;
}

const DEFAULT_OPTIONS: Required<HealthCheckOptions> = {
  maxRetries: 3,
  retryDelayMs: 1000,
  timeoutMs: 5000,
};

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function withTimeout<T>(promise: Promise<T>, ms: number): Promise<T> {
  const timeout = new Promise<never>((_, reject) =>
    setTimeout(() => reject(new Error(`Health check timed out after ${ms}ms`)), ms)
  );
  return Promise.race([promise, timeout]);
}

/**
 * Run health checks at startup with retry logic.
 * Returns true if all checks pass, false otherwise.
 */
export async function runStartupHealthChecks(
  checks: HealthCheck[],
  logger: Logger,
  options?: HealthCheckOptions
): Promise<boolean> {
  const opts = { ...DEFAULT_OPTIONS, ...options };

  if (checks.length === 0) {
    logger.debug("No health checks registered");
    return true;
  }

  logger.info("Running startup health checks", { checkCount: checks.length });

  for (const hc of checks) {
    let passed = false;

    for (let attempt = 1; attempt <= opts.maxRetries; attempt++) {
      try {
        const result = await withTimeout(hc.check(), opts.timeoutMs);
        if (result) {
          logger.info("Health check passed", { check: hc.name, attempt });
          passed = true;
          break;
        }
        logger.warn("Health check returned false", { check: hc.name, attempt });
      } catch (err: unknown) {
        const message = err instanceof Error ? err.message : String(err);
        logger.warn("Health check failed", { check: hc.name, attempt, error: message });
      }

      if (attempt < opts.maxRetries) {
        const delay = opts.retryDelayMs * attempt;
        logger.info("Retrying health check", { check: hc.name, nextAttempt: attempt + 1, delayMs: delay });
        await sleep(delay);
      }
    }

    if (!passed) {
      logger.error("Health check failed after all retries", {
        check: hc.name,
        maxRetries: opts.maxRetries,
      });
      return false;
    }
  }

  logger.info("All startup health checks passed");
  return true;
}
