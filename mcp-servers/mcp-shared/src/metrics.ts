/**
 * Lightweight in-memory metrics collector for MCP servers.
 * Tracks tool call counts and latency percentiles.
 */

/** Maximum number of duration samples to keep per tool. */
const MAX_SAMPLES = 1000;

export interface ToolMetrics {
  count: number;
  errors: number;
  p50Ms: number;
  p95Ms: number;
  p99Ms: number;
}

export interface MetricsSummary {
  toolCalls: Record<string, ToolMetrics>;
  uptime: number; // seconds
  totalCalls: number;
  totalErrors: number;
}

export interface MetricsCollector {
  recordCall(tool: string, durationMs: number, isError: boolean): void;
  getSummary(): MetricsSummary;
  reset(): void;
}

interface ToolData {
  count: number;
  errors: number;
  durations: number[];
}

/**
 * Compute a percentile from a sorted array of numbers using index-based calculation.
 * Returns 0 for empty arrays.
 */
function percentile(sorted: number[], p: number): number {
  if (sorted.length === 0) return 0;
  const idx = Math.ceil((p / 100) * sorted.length) - 1;
  return sorted[Math.max(0, idx)];
}

/**
 * Insert a value into a sorted array while maintaining sort order.
 * Uses binary search for O(log n) lookup.
 */
function insertSorted(arr: number[], value: number): void {
  let lo = 0;
  let hi = arr.length;
  while (lo < hi) {
    const mid = (lo + hi) >>> 1;
    if (arr[mid] < value) {
      lo = mid + 1;
    } else {
      hi = mid;
    }
  }
  arr.splice(lo, 0, value);
}

/**
 * Create a new MetricsCollector instance.
 * Tracks per-tool call counts, error counts, and latency percentiles.
 */
export function createMetricsCollector(): MetricsCollector {
  let startedAt = Date.now();
  let tools = new Map<string, ToolData>();

  function getOrCreateTool(tool: string): ToolData {
    let data = tools.get(tool);
    if (!data) {
      data = { count: 0, errors: 0, durations: [] };
      tools.set(tool, data);
    }
    return data;
  }

  function recordCall(tool: string, durationMs: number, isError: boolean): void {
    const data = getOrCreateTool(tool);
    data.count++;
    if (isError) {
      data.errors++;
    }

    // Cap at MAX_SAMPLES — drop the oldest (first) entry when full
    if (data.durations.length >= MAX_SAMPLES) {
      data.durations.shift();
    }
    insertSorted(data.durations, durationMs);
  }

  function getSummary(): MetricsSummary {
    const toolCalls: Record<string, ToolMetrics> = {};
    let totalCalls = 0;
    let totalErrors = 0;

    for (const [name, data] of tools) {
      totalCalls += data.count;
      totalErrors += data.errors;
      toolCalls[name] = {
        count: data.count,
        errors: data.errors,
        p50Ms: percentile(data.durations, 50),
        p95Ms: percentile(data.durations, 95),
        p99Ms: percentile(data.durations, 99),
      };
    }

    return {
      toolCalls,
      uptime: Math.round((Date.now() - startedAt) / 1000),
      totalCalls,
      totalErrors,
    };
  }

  function reset(): void {
    startedAt = Date.now();
    tools = new Map();
  }

  return { recordCall, getSummary, reset };
}
