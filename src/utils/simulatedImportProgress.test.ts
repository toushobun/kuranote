import { describe, expect, it } from "vitest";

import {
  computeBatchProgressRatio,
  computeDisplayProcessed,
  simulatedImportProgressCap,
  toProgressPercentage,
  updateEstimatedBatchDuration,
} from "./simulatedImportProgress";

describe("computeBatchProgressRatio", () => {
  it("elapsed 为 0 时等于起点 0", () => {
    expect(computeBatchProgressRatio(0, 3000)).toBe(0);
  });

  it("elapsed 增大时单调递增", () => {
    const early = computeBatchProgressRatio(200, 3000);
    const later = computeBatchProgressRatio(2000, 3000);
    const evenLater = computeBatchProgressRatio(10000, 3000);
    expect(later).toBeGreaterThan(early);
    expect(evenLater).toBeGreaterThan(later);
  });

  it("不超过封顶 CAP，即使 elapsed 远超预估耗时", () => {
    const ratio = computeBatchProgressRatio(1_000_000, 3000);
    expect(ratio).toBeLessThanOrEqual(simulatedImportProgressCap);
    expect(ratio).toBeCloseTo(simulatedImportProgressCap, 5);
  });

  it("预估耗时为 0 时不产生 NaN 或 Infinity", () => {
    expect(Number.isFinite(computeBatchProgressRatio(500, 0))).toBe(true);
  });
});

describe("computeDisplayProcessed", () => {
  it("elapsed 为 0 时等于 confirmedProcessed", () => {
    const value = computeDisplayProcessed({
      confirmedProcessed: 10,
      elapsedMs: 0,
      estimatedDurationMs: 3000,
      pendingBatchSize: 25,
    });
    expect(value).toBe(10);
  });

  it("elapsed 增大时单调递增，且不超过批次终点", () => {
    const confirmedProcessed = 10;
    const pendingBatchSize = 25;
    const estimatedDurationMs = 3000;
    const early = computeDisplayProcessed({
      confirmedProcessed,
      elapsedMs: 200,
      estimatedDurationMs,
      pendingBatchSize,
    });
    const later = computeDisplayProcessed({
      confirmedProcessed,
      elapsedMs: 2000,
      estimatedDurationMs,
      pendingBatchSize,
    });
    expect(later).toBeGreaterThan(early);
    expect(later).toBeLessThan(confirmedProcessed + pendingBatchSize);
  });
});

describe("updateEstimatedBatchDuration", () => {
  it("按 0.5/0.5 权重计算滚动平均", () => {
    expect(updateEstimatedBatchDuration(3000, 1000)).toBe(2000);
  });
});

describe("toProgressPercentage", () => {
  it("totalCount 为 0 时返回 0", () => {
    expect(toProgressPercentage(5, 0)).toBe(0);
  });

  it("按比例换算为百分数，且不超过 100", () => {
    expect(toProgressPercentage(5, 10)).toBe(50);
    expect(toProgressPercentage(15, 10)).toBe(100);
  });
});
