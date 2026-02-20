import { runStartupHealthChecks, type HealthCheck } from "./health.js";
import { createLogger } from "./logger.js";

describe("runStartupHealthChecks", () => {
  const logger = createLogger("test", "error"); // suppress log output in tests

  it("should return true when all checks pass", async () => {
    const checks: HealthCheck[] = [
      { name: "db", check: async () => true },
      { name: "cache", check: async () => true },
    ];

    const result = await runStartupHealthChecks(checks, logger);
    expect(result).toBe(true);
  });

  it("should return false when a check fails all retries", async () => {
    const checks: HealthCheck[] = [
      { name: "db", check: async () => false },
    ];

    const result = await runStartupHealthChecks(checks, logger, {
      maxRetries: 2,
      retryDelayMs: 10,
      timeoutMs: 1000,
    });
    expect(result).toBe(false);
  });

  it("should retry and succeed on later attempts", async () => {
    let attempt = 0;
    const checks: HealthCheck[] = [
      {
        name: "db",
        check: async () => {
          attempt++;
          return attempt >= 2;
        },
      },
    ];

    const result = await runStartupHealthChecks(checks, logger, {
      maxRetries: 3,
      retryDelayMs: 10,
      timeoutMs: 1000,
    });
    expect(result).toBe(true);
    expect(attempt).toBe(2);
  });

  it("should handle checks that throw errors", async () => {
    const checks: HealthCheck[] = [
      {
        name: "db",
        check: async () => {
          throw new Error("Connection refused");
        },
      },
    ];

    const result = await runStartupHealthChecks(checks, logger, {
      maxRetries: 2,
      retryDelayMs: 10,
      timeoutMs: 1000,
    });
    expect(result).toBe(false);
  });

  it("should return true with no checks", async () => {
    const result = await runStartupHealthChecks([], logger);
    expect(result).toBe(true);
  });

  it("should timeout slow checks", async () => {
    const checks: HealthCheck[] = [
      {
        name: "slow",
        check: () => new Promise((resolve) => setTimeout(() => resolve(true), 5000)),
      },
    ];

    const result = await runStartupHealthChecks(checks, logger, {
      maxRetries: 1,
      retryDelayMs: 10,
      timeoutMs: 50,
    });
    expect(result).toBe(false);
  }, 10000);
});
