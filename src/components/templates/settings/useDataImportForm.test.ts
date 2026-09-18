import { act, renderHook } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import type { ChangeEvent } from "react";

import type {
  DataImportActionState,
  DataImportBatchActionState,
  DataImportBatchStateAction,
} from "types/dataImport";
import {
  computeDisplayProcessed,
  toProgressPercentage,
} from "utils/simulatedImportProgress";

import { useDataImportForm } from "./useDataImportForm";

function deferred<T>() {
  let resolve!: (value: T) => void;
  let reject!: (reason?: unknown) => void;
  const promise = new Promise<T>((res, rej) => {
    resolve = res;
    reject = rej;
  });
  return { promise, reject, resolve };
}

async function flushMicrotasks(times = 5) {
  for (let i = 0; i < times; i += 1) {
    await Promise.resolve();
  }
}

function makeCheckFormatAction(totalCount: number) {
  return vi.fn(
    async (): Promise<DataImportActionState> => ({
      result: {
        ok: true,
        summary: {
          balanceAdjustmentDetected: false,
          incomeExpenseCount: totalCount,
          transferCount: 0,
        },
      },
    }),
  );
}

function makeDoneBatch(
  totalCount: number,
): DataImportBatchActionState["batch"] {
  return {
    details: [],
    done: true,
    duplicateCount: 0,
    failureCount: 0,
    holderMissingCount: 0,
    nextOffset: totalCount,
    processedCount: totalCount,
    rowResults: [],
    successCount: totalCount,
    totalCount,
  };
}

async function selectFileAndCheckFormat(
  result: { current: ReturnType<typeof useDataImportForm> },
  fileName = "data.xlsx",
) {
  const file = new File(["binary"], fileName);
  act(() => {
    result.current.handleFileChange({
      target: { files: [file] },
    } as unknown as ChangeEvent<HTMLInputElement>);
  });
  await act(async () => {
    await result.current.handleCheckFormat();
  });
}

describe("useDataImportForm 预测式进度动画", () => {
  let clock = 0;

  beforeEach(() => {
    vi.useFakeTimers();
    clock = 0;
    vi.spyOn(performance, "now").mockImplementation(() => clock);
  });

  afterEach(() => {
    vi.useRealTimers();
    vi.restoreAllMocks();
  });

  async function advance(ms: number) {
    clock += ms;
    await act(async () => {
      await vi.advanceTimersByTimeAsync(ms);
    });
  }

  it("批次等待期间平滑推进 displayProgress，真实响应返回后立即快照为真值", async () => {
    const totalCount = 10;
    const batchDeferred = deferred<DataImportBatchActionState>();
    const executeBatchAction: DataImportBatchStateAction = vi.fn(
      async () => batchDeferred.promise,
    );
    const { result } = renderHook(() =>
      useDataImportForm(makeCheckFormatAction(totalCount), executeBatchAction),
    );
    await selectFileAndCheckFormat(result);

    act(() => {
      void result.current.handleStartImport();
    });

    expect(result.current.displayProgress).toBe(0);
    expect(result.current.displayProcessedCount).toBe(0);

    await advance(200);
    const firstTick = result.current.displayProgress ?? 0;
    const firstTickCount = result.current.displayProcessedCount ?? 0;
    expect(firstTick).toBeGreaterThan(0);
    expect(firstTick).toBeLessThan(100);
    expect(firstTickCount).toBeGreaterThan(0);
    expect(firstTickCount).toBeLessThan(totalCount);
    // 百分比与行数出自同一次计算。
    expect(firstTick).toBeCloseTo((firstTickCount / totalCount) * 100, 5);

    await advance(200);
    const secondTick = result.current.displayProgress ?? 0;
    const secondTickCount = result.current.displayProcessedCount ?? 0;
    expect(secondTick).toBeGreaterThan(firstTick);
    expect(secondTick).toBeLessThan(100);
    expect(secondTickCount).toBeGreaterThan(firstTickCount);
    expect(secondTickCount).toBeLessThan(totalCount);
    expect(secondTick).toBeCloseTo((secondTickCount / totalCount) * 100, 5);

    await act(async () => {
      batchDeferred.resolve({ batch: makeDoneBatch(totalCount) });
      await flushMicrotasks();
    });

    expect(result.current.executionStatus).toBe("completed");
    expect(result.current.displayProgress).toBe(100);
    expect(result.current.displayProcessedCount).toBe(totalCount);
    expect(result.current.displayProcessedCount).toBe(
      result.current.executionResult?.processedCount,
    );
  });

  it("批次直接 throw 时仍清理该批次计时器，不残留泄漏", async () => {
    const totalCount = 10;
    const batchDeferred = deferred<DataImportBatchActionState>();
    const executeBatchAction: DataImportBatchStateAction = vi.fn(
      async () => batchDeferred.promise,
    );
    const { result } = renderHook(() =>
      useDataImportForm(makeCheckFormatAction(totalCount), executeBatchAction),
    );
    await selectFileAndCheckFormat(result);

    let importPromise!: Promise<void>;
    act(() => {
      importPromise = result.current.handleStartImport().catch(() => undefined);
    });

    await advance(200);
    expect(result.current.displayProgress).toBeGreaterThan(0);
    expect(result.current.displayProcessedCount).toBeGreaterThan(0);

    const clearIntervalSpy = vi.spyOn(globalThis, "clearInterval");
    await act(async () => {
      batchDeferred.reject(new Error("network error"));
      await flushMicrotasks();
    });
    await importPromise;

    expect(clearIntervalSpy).toHaveBeenCalled();

    const progressAfterThrow = result.current.displayProgress;
    const countAfterThrow = result.current.displayProcessedCount;
    await advance(1000);
    expect(result.current.displayProgress).toBe(progressAfterThrow);
    expect(result.current.displayProcessedCount).toBe(countAfterThrow);
  });

  it("组件卸载后批次结算仍会清理计时器，且不再触发状态更新", async () => {
    const totalCount = 10;
    const batchDeferred = deferred<DataImportBatchActionState>();
    const executeBatchAction: DataImportBatchStateAction = vi.fn(
      async () => batchDeferred.promise,
    );
    const { result, unmount } = renderHook(() =>
      useDataImportForm(makeCheckFormatAction(totalCount), executeBatchAction),
    );
    await selectFileAndCheckFormat(result);

    act(() => {
      void result.current.handleStartImport();
    });
    await advance(200);

    unmount();

    const clearIntervalSpy = vi.spyOn(globalThis, "clearInterval");
    await act(async () => {
      batchDeferred.resolve({ batch: makeDoneBatch(totalCount) });
      await flushMicrotasks();
    });

    expect(clearIntervalSpy).toHaveBeenCalled();
  });

  it("连续两次导入之间 estimatedBatchDurationRef 被正确重置，不互相污染", async () => {
    const totalCount = 10;
    const firstBatchDeferred = deferred<DataImportBatchActionState>();
    const secondBatchDeferred = deferred<DataImportBatchActionState>();
    const executeBatchAction = vi
      .fn<DataImportBatchStateAction>()
      .mockImplementationOnce(async () => firstBatchDeferred.promise)
      .mockImplementationOnce(async () => secondBatchDeferred.promise);
    const checkFormatAction = makeCheckFormatAction(totalCount);
    const { result } = renderHook(() =>
      useDataImportForm(checkFormatAction, executeBatchAction),
    );

    await selectFileAndCheckFormat(result, "first.xlsx");
    act(() => {
      void result.current.handleStartImport();
    });

    // 第一批耗时远超初始估算值（3000ms），拉高 estimatedBatchDurationRef。
    await advance(9000);
    await act(async () => {
      firstBatchDeferred.resolve({ batch: makeDoneBatch(totalCount) });
      await flushMicrotasks();
    });
    expect(result.current.executionStatus).toBe("completed");

    await selectFileAndCheckFormat(result, "second.xlsx");
    act(() => {
      void result.current.handleStartImport();
    });

    await advance(200);

    const expectedRatioWithFreshEstimate = toProgressPercentage(
      computeDisplayProcessed({
        confirmedProcessed: 0,
        elapsedMs: 200,
        estimatedDurationMs: 3000,
        pendingBatchSize: totalCount,
      }),
      totalCount,
    );
    expect(result.current.displayProgress).toBeCloseTo(
      expectedRatioWithFreshEstimate,
      5,
    );
    expect(result.current.displayProcessedCount).toBeCloseTo(
      (expectedRatioWithFreshEstimate / 100) * totalCount,
      5,
    );
  });

  it("批次进行中被重置（runToken 变化）时，过期批次的计时器不再更新 displayProgress", async () => {
    const totalCount = 10;
    const batchDeferred = deferred<DataImportBatchActionState>();
    const executeBatchAction: DataImportBatchStateAction = vi.fn(
      async () => batchDeferred.promise,
    );
    const { result } = renderHook(() =>
      useDataImportForm(makeCheckFormatAction(totalCount), executeBatchAction),
    );
    await selectFileAndCheckFormat(result, "first.xlsx");

    act(() => {
      void result.current.handleStartImport();
    });
    await advance(200);
    expect(result.current.displayProgress).toBeGreaterThan(0);
    expect(result.current.displayProcessedCount).toBeGreaterThan(0);

    // 页面上文件 input 在导入中会被禁用，这里直接调用 handleFileChange
    // 复现「守卫被绕过」时的竞态：重置会让 runTokenRef 变化，但上一轮批次
    // 的 executeBatchAction 仍未结算，其 tick 计时器不应该再覆盖新一轮的
    // displayProgress。
    act(() => {
      result.current.handleFileChange({
        target: { files: [new File(["binary"], "second.xlsx")] },
      } as unknown as ChangeEvent<HTMLInputElement>);
    });
    expect(result.current.displayProgress).toBeNull();
    expect(result.current.displayProcessedCount).toBeNull();

    await advance(200);
    expect(result.current.displayProgress).toBeNull();
    expect(result.current.displayProcessedCount).toBeNull();

    await act(async () => {
      batchDeferred.resolve({ batch: makeDoneBatch(totalCount) });
      await flushMicrotasks();
    });
    expect(result.current.displayProgress).toBeNull();
    expect(result.current.displayProcessedCount).toBeNull();
    expect(result.current.executionStatus).toBeNull();
  });
});
