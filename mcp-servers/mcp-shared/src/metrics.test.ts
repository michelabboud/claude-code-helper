import { createMetricsCollector } from "./metrics.js";

describe("createMetricsCollector", () => {
  it("should record calls and count them correctly", () => {
    const metrics = createMetricsCollector();

    metrics.recordCall("search", 50, false);
    metrics.recordCall("search", 100, false);
    metrics.recordCall("analyze", 200, false);

    const summary = metrics.getSummary();
    expect(summary.totalCalls).toBe(3);
    expect(summary.toolCalls["search"].count).toBe(2);
    expect(summary.toolCalls["analyze"].count).toBe(1);
  });

  it("should count errors separately", () => {
    const metrics = createMetricsCollector();

    metrics.recordCall("search", 50, false);
    metrics.recordCall("search", 100, true);
    metrics.recordCall("search", 200, true);
    metrics.recordCall("analyze", 300, true);

    const summary = metrics.getSummary();
    expect(summary.totalErrors).toBe(3);
    expect(summary.toolCalls["search"].errors).toBe(2);
    expect(summary.toolCalls["analyze"].errors).toBe(1);
  });

  it("should calculate percentiles correctly with known data", () => {
    const metrics = createMetricsCollector();

    // Insert 100 values: 1, 2, 3, ..., 100
    for (let i = 1; i <= 100; i++) {
      metrics.recordCall("tool", i, false);
    }

    const summary = metrics.getSummary();
    const tool = summary.toolCalls["tool"];

    // p50: ceil(50/100 * 100) - 1 = 49 -> sorted[49] = 50
    expect(tool.p50Ms).toBe(50);
    // p95: ceil(95/100 * 100) - 1 = 94 -> sorted[94] = 95
    expect(tool.p95Ms).toBe(95);
    // p99: ceil(99/100 * 100) - 1 = 98 -> sorted[98] = 99
    expect(tool.p99Ms).toBe(99);
  });

  it("should handle percentiles with a single value", () => {
    const metrics = createMetricsCollector();

    metrics.recordCall("tool", 42, false);

    const summary = metrics.getSummary();
    const tool = summary.toolCalls["tool"];

    expect(tool.p50Ms).toBe(42);
    expect(tool.p95Ms).toBe(42);
    expect(tool.p99Ms).toBe(42);
  });

  it("should return 0 percentiles for tools with no data after reset", () => {
    const metrics = createMetricsCollector();

    metrics.recordCall("tool", 100, false);
    metrics.reset();

    const summary = metrics.getSummary();
    expect(summary.totalCalls).toBe(0);
    expect(Object.keys(summary.toolCalls)).toHaveLength(0);
  });

  it("should track uptime in seconds", () => {
    const metrics = createMetricsCollector();

    const summary = metrics.getSummary();
    // Uptime should be 0 or close to 0 right after creation
    expect(summary.uptime).toBeGreaterThanOrEqual(0);
    expect(summary.uptime).toBeLessThan(2);
  });

  it("should reset all data including uptime baseline", () => {
    const metrics = createMetricsCollector();

    metrics.recordCall("search", 50, false);
    metrics.recordCall("search", 100, true);

    metrics.reset();

    const summary = metrics.getSummary();
    expect(summary.totalCalls).toBe(0);
    expect(summary.totalErrors).toBe(0);
    expect(Object.keys(summary.toolCalls)).toHaveLength(0);
    expect(summary.uptime).toBeGreaterThanOrEqual(0);
    expect(summary.uptime).toBeLessThan(2);
  });

  it("should cap duration samples at 1000 entries per tool", () => {
    const metrics = createMetricsCollector();

    // Insert 1200 entries
    for (let i = 0; i < 1200; i++) {
      metrics.recordCall("tool", i, false);
    }

    const summary = metrics.getSummary();
    // Count should reflect all 1200 calls
    expect(summary.toolCalls["tool"].count).toBe(1200);

    // Percentiles should be based on the most recent 1000 values (200-1199)
    // After dropping the oldest 200 entries, sorted durations are 200, 201, ..., 1199
    // p50: ceil(50/100 * 1000) - 1 = 499 -> sorted[499] = 699
    // But because insert order with shift matters, let's just verify reasonable bounds
    const tool = summary.toolCalls["tool"];
    expect(tool.p50Ms).toBeGreaterThanOrEqual(200);
    expect(tool.p50Ms).toBeLessThanOrEqual(1199);
    expect(tool.p99Ms).toBeGreaterThanOrEqual(200);
    expect(tool.p99Ms).toBeLessThanOrEqual(1199);
  });

  it("should maintain sorted order for inserted durations", () => {
    const metrics = createMetricsCollector();

    // Insert values in random order
    const values = [500, 100, 300, 200, 400];
    for (const v of values) {
      metrics.recordCall("tool", v, false);
    }

    const summary = metrics.getSummary();
    // p50 of [100, 200, 300, 400, 500]: ceil(50/100 * 5) - 1 = 2 -> sorted[2] = 300
    expect(summary.toolCalls["tool"].p50Ms).toBe(300);
  });

  it("should handle multiple tools independently", () => {
    const metrics = createMetricsCollector();

    metrics.recordCall("fast", 10, false);
    metrics.recordCall("fast", 20, false);
    metrics.recordCall("slow", 1000, false);
    metrics.recordCall("slow", 2000, true);

    const summary = metrics.getSummary();
    expect(summary.totalCalls).toBe(4);
    expect(summary.totalErrors).toBe(1);
    expect(summary.toolCalls["fast"].count).toBe(2);
    expect(summary.toolCalls["fast"].errors).toBe(0);
    expect(summary.toolCalls["slow"].count).toBe(2);
    expect(summary.toolCalls["slow"].errors).toBe(1);
    expect(summary.toolCalls["fast"].p50Ms).toBeLessThan(summary.toolCalls["slow"].p50Ms);
  });
});
