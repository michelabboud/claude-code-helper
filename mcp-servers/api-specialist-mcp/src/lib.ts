/**
 * Pure helper functions for api-specialist-mcp.
 *
 * Split out from index.ts so they can be unit tested directly without
 * importing index.ts (which has a module-level side effect: it starts the
 * MCP server over stdio via `runServer(...)` as soon as it's loaded).
 */

import * as yaml from "js-yaml";

/**
 * Parses an OpenAPI/Swagger (or any JSON/YAML) spec's raw text content into an
 * object. Tries JSON first (the strict, fast path — most OpenAPI JSON files
 * parse here), then falls back to YAML via js-yaml. This makes every
 * spec-loading call site format-agnostic instead of requiring callers to
 * branch on file extension.
 *
 * @param content Raw file content (JSON or YAML text)
 * @param sourceLabel Optional label (e.g. file path) included in error messages
 * @throws Error with a clear message if the content is neither valid JSON nor valid YAML
 */
export function loadSpec(content: string, sourceLabel?: string): Record<string, unknown> {
  const label = sourceLabel ? ` (${sourceLabel})` : "";

  if (content.trim().length === 0) {
    throw new Error(`Spec file${label} is empty`);
  }

  const isUsableObject = (value: unknown): value is Record<string, unknown> =>
    value !== null && typeof value === "object" && !Array.isArray(value);

  let jsonError: unknown;
  try {
    const parsed = JSON.parse(content) as unknown;
    if (!isUsableObject(parsed)) {
      throw new Error("JSON content did not parse to an object");
    }
    return parsed;
  } catch (err) {
    jsonError = err;
  }

  try {
    const parsed = yaml.load(content);
    if (!isUsableObject(parsed)) {
      throw new Error("YAML content did not parse to an object");
    }
    return parsed;
  } catch (yamlError) {
    const jsonMessage = jsonError instanceof Error ? jsonError.message : String(jsonError);
    const yamlMessage = yamlError instanceof Error ? yamlError.message : String(yamlError);
    throw new Error(
      `Failed to parse spec${label} as JSON or YAML. JSON error: ${jsonMessage}. YAML error: ${yamlMessage}`
    );
  }
}

export interface LoadTestResponseTimeStats {
  min: number;
  max: number;
  avg: string;
  p50: number;
  p95: number;
  p99: number;
}

export interface LoadTestNoDataStats {
  note: string;
}

/**
 * Computes min/max/avg/p50/p95/p99 from a load test's captured response times.
 *
 * Guards the all-requests-failed case: when every request throws before a
 * response is received (e.g. connection refused for the whole test window),
 * `responseTimes` is empty. Dividing by zero and calling `Math.min()`/
 * `Math.max()` on an empty array produce NaN/Infinity respectively — this
 * returns an explicit "no data" note instead so callers never see NaN/Infinity
 * in the result.
 */
export function computeResponseTimeStats(
  rawResponseTimes: number[]
): LoadTestResponseTimeStats | LoadTestNoDataStats {
  if (rawResponseTimes.length === 0) {
    return {
      note: "All requests failed before a response was received — no response time data available.",
    };
  }

  const responseTimes = [...rawResponseTimes].sort((a, b) => a - b);
  const avgResponseTime = responseTimes.reduce((a, b) => a + b, 0) / responseTimes.length;

  return {
    min: Math.min(...responseTimes),
    max: Math.max(...responseTimes),
    avg: avgResponseTime.toFixed(2),
    p50: responseTimes[Math.floor(responseTimes.length * 0.5)],
    p95: responseTimes[Math.floor(responseTimes.length * 0.95)],
    p99: responseTimes[Math.floor(responseTimes.length * 0.99)],
  };
}
