import { act, renderHook, waitFor } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import type { ChangeEvent } from "react";

import {
  dataImportErrorCodes,
  dataImportErrorMessages,
  importBatchSize,
} from "internal/dataImport";
import {
  makeAnalyzeImportFileResult,
  makeIncomeExpenseUnit,
} from "test/mocks/dataImport";
import {
  computeDisplayProcessed,
  toProgressPercentage,
} from "utils/simulatedImportProgress";
import type {
  DataImportBatchActionState,
  DataImportBatchStateAction,
} from "types/dataImport";

import { useDataImportForm } from "./useDataImportForm";

const analyzeImportFileMock = vi.hoisted(() => vi.fn());
const buildResultWorkbookMock = vi.hoisted(() => vi.fn());
const uploadReceiptPhotoMock = vi.hoisted(() => vi.fn());

vi.mock("utils/transactionPhotoUpload", () => ({
  uploadReceiptPhoto: uploadReceiptPhotoMock,
}));

vi.mock("utils/dataImportResultWorkbook", async (importOriginal) => ({
  ...(await importOriginal<typeof import("utils/dataImportResultWorkbook")>()),
  buildDataImportResultWorkbook: buildResultWorkbookMock,
}));

vi.mock("internal/dataImport", async (importOriginal) => ({
  ...(await importOriginal<typeof import("internal/dataImport")>()),
  analyzeImportFile: analyzeImportFileMock,
}));

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

function mockAnalyzeImportFile(totalCount: number) {
  analyzeImportFileMock.mockResolvedValue(
    makeAnalyzeImportFileResult(totalCount),
  );
}

function makeDoneBatch(
  totalCount: number,
): DataImportBatchActionState["batch"] {
  return {
    createdPlaceholderCount: 0,
    details: [],
    duplicateCount: 0,
    failureCount: 0,
    holderMissingCount: 0,
    processedCount: totalCount,
    rowResults: [],
    successCount: totalCount,
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

describe("useDataImportForm 虚拟进度条", () => {
  let clock = 0;

  beforeEach(() => {
    analyzeImportFileMock.mockReset();
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

  it("批次等待期间平滑推进 displayProgress 且不到 100，返回后对齐真实进度", async () => {
    const totalCount = 10;
    const batchDeferred = deferred<DataImportBatchActionState>();
    const executeBatchAction: DataImportBatchStateAction = vi.fn(
      async () => batchDeferred.promise,
    );
    mockAnalyzeImportFile(totalCount);
    const { result } = renderHook(() => useDataImportForm(executeBatchAction));
    await selectFileAndCheckFormat(result);

    act(() => {
      void result.current.handleStartImport();
    });
    expect(result.current.displayProgress).toBe(0);

    await advance(200);
    const first = result.current.displayProgress ?? 0;
    expect(first).toBeGreaterThan(0);
    expect(first).toBeLessThan(100);

    await advance(2000);
    const second = result.current.displayProgress ?? 0;
    expect(second).toBeGreaterThan(first);
    expect(second).toBeLessThan(100);

    await act(async () => {
      batchDeferred.resolve({ batch: makeDoneBatch(totalCount) });
      await flushMicrotasks();
    });

    expect(result.current.executionStatus).toBe("completed");
    expect(result.current.displayProgress).toBe(100);
  });

  it("多批导入时每批返回后进度对齐真实值，不会倒退", async () => {
    const totalCount = importBatchSize * 2;
    const batchDeferreds = [
      deferred<DataImportBatchActionState>(),
      deferred<DataImportBatchActionState>(),
    ];
    const executeBatchAction = vi
      .fn<DataImportBatchStateAction>()
      .mockImplementationOnce(async () => batchDeferreds[0].promise)
      .mockImplementationOnce(async () => batchDeferreds[1].promise);
    mockAnalyzeImportFile(totalCount);
    const { result } = renderHook(() => useDataImportForm(executeBatchAction));
    await selectFileAndCheckFormat(result);

    act(() => {
      void result.current.handleStartImport();
    });
    await advance(5000);
    const beforeFirstBatchReturns = result.current.displayProgress ?? 0;
    expect(beforeFirstBatchReturns).toBeLessThan(50);

    await act(async () => {
      batchDeferreds[0].resolve({ batch: makeDoneBatch(importBatchSize) });
      await flushMicrotasks();
    });
    expect(result.current.displayProgress).toBe(50);

    await advance(200);
    expect(result.current.displayProgress ?? 0).toBeGreaterThanOrEqual(50);
    expect(result.current.displayProgress ?? 0).toBeLessThan(100);

    await act(async () => {
      batchDeferreds[1].resolve({ batch: makeDoneBatch(importBatchSize) });
      await flushMicrotasks();
    });
    expect(result.current.displayProgress).toBe(100);
  });

  it("批次抛出异常时清理计时器，进度不再变化", async () => {
    const totalCount = 10;
    const batchDeferred = deferred<DataImportBatchActionState>();
    const executeBatchAction: DataImportBatchStateAction = vi.fn(
      async () => batchDeferred.promise,
    );
    mockAnalyzeImportFile(totalCount);
    const { result } = renderHook(() => useDataImportForm(executeBatchAction));
    await selectFileAndCheckFormat(result);

    let importPromise!: Promise<void>;
    act(() => {
      importPromise = result.current.handleStartImport().catch(() => undefined);
    });
    await advance(200);

    const clearIntervalSpy = vi.spyOn(globalThis, "clearInterval");
    await act(async () => {
      batchDeferred.reject(new Error("network error"));
      await flushMicrotasks();
    });
    await importPromise;
    expect(clearIntervalSpy).toHaveBeenCalled();

    const progressAfterThrow = result.current.displayProgress;
    await advance(1000);
    expect(result.current.displayProgress).toBe(progressAfterThrow);
  });

  it("连续两次导入之间预估耗时被重置，不互相污染", async () => {
    const totalCount = 10;
    const first = deferred<DataImportBatchActionState>();
    const second = deferred<DataImportBatchActionState>();
    const executeBatchAction = vi
      .fn<DataImportBatchStateAction>()
      .mockImplementationOnce(async () => first.promise)
      .mockImplementationOnce(async () => second.promise);
    mockAnalyzeImportFile(totalCount);
    const { result } = renderHook(() => useDataImportForm(executeBatchAction));

    await selectFileAndCheckFormat(result, "first.xlsx");
    act(() => {
      void result.current.handleStartImport();
    });
    // 第一批耗时远超初始预估，拉高预估耗时。
    await advance(60000);
    await act(async () => {
      first.resolve({ batch: makeDoneBatch(totalCount) });
      await flushMicrotasks();
    });

    await selectFileAndCheckFormat(result, "second.xlsx");
    act(() => {
      void result.current.handleStartImport();
    });
    await advance(200);

    expect(result.current.displayProgress).toBeCloseTo(
      toProgressPercentage(
        computeDisplayProcessed({
          confirmedProcessed: 0,
          elapsedMs: 200,
          estimatedDurationMs: 10000,
          pendingBatchSize: totalCount,
        }),
        totalCount,
      ),
      5,
    );
  });

  it("更换文件会清空进度展示值", async () => {
    mockAnalyzeImportFile(10);
    const { result } = renderHook(() =>
      useDataImportForm(vi.fn(async () => new Promise<never>(() => undefined))),
    );
    await selectFileAndCheckFormat(result);
    act(() => {
      void result.current.handleStartImport();
    });
    await advance(200);
    expect(result.current.displayProgress).toBeGreaterThan(0);

    act(() => {
      result.current.handleFileChange({
        target: { files: [new File(["binary"], "other.xlsx")] },
      } as unknown as ChangeEvent<HTMLInputElement>);
    });
    expect(result.current.displayProgress).toBeNull();
  });
});

describe("useDataImportForm 浏览器端解析与分批发送", () => {
  beforeEach(() => {
    analyzeImportFileMock.mockReset();
    uploadReceiptPhotoMock.mockReset();
  });

  it("照片上传期间离开页面不会在上传完成后再写入交易", async () => {
    const uploading = deferred<{
      attachmentId: string;
      height: number;
      width: number;
    }>();
    uploadReceiptPhotoMock.mockReturnValue(uploading.promise);
    analyzeImportFileMock.mockResolvedValue({
      result: {
        ok: true,
        summary: {
          balanceAdjustmentCount: 0,
          incomeExpenseCount: 1,
          transferCount: 0,
        },
      },
      units: [makeIncomeExpenseUnit()],
      photosByRow: new Map([
        [
          2,
          [
            {
              rowNumber: 2,
              columnName: "照片1",
              mimeType: "image/jpeg",
              bytes: new Uint8Array([0xff, 0xd8, 0xff, 0xd9]),
            },
          ],
        ],
      ]),
    });
    const executeBatchAction = vi.fn<DataImportBatchStateAction>();
    const { result, unmount } = renderHook(() =>
      useDataImportForm(executeBatchAction, [], "ledger"),
    );
    await selectFileAndCheckFormat(result);

    let importPromise!: Promise<void>;
    act(() => {
      importPromise = result.current.handleStartImport();
    });
    await waitFor(() => expect(uploadReceiptPhotoMock).toHaveBeenCalledOnce());
    unmount();

    await act(async () => {
      uploading.resolve({
        attachmentId: "00000000-0000-4000-8000-000000000091",
        height: 400,
        width: 400,
      });
      await importPromise;
    });
    expect(executeBatchAction).not.toHaveBeenCalled();
  });

  it("更换文件后忽略旧解析结果，且允许新文件立即重新检查", async () => {
    const oldCheck = deferred<ReturnType<typeof makeAnalyzeImportFileResult>>();
    const newCheck = deferred<ReturnType<typeof makeAnalyzeImportFileResult>>();
    analyzeImportFileMock
      .mockImplementationOnce(() => oldCheck.promise)
      .mockImplementationOnce(() => newCheck.promise);
    const { result } = renderHook(() => useDataImportForm(vi.fn()));
    const pick = (name: string) => {
      result.current.handleFileChange({
        target: { files: [new File(["bytes"], name)] },
      } as unknown as ChangeEvent<HTMLInputElement>);
    };
    act(() => pick("old.xlsx"));
    let oldPromise!: Promise<void>;
    act(() => {
      oldPromise = result.current.handleCheckFormat();
    });
    act(() => pick("new.xlsx"));
    expect(result.current.isChecking).toBe(false);
    let newPromise!: Promise<void>;
    act(() => {
      newPromise = result.current.handleCheckFormat();
    });
    await act(async () => {
      newCheck.resolve(makeAnalyzeImportFileResult(2));
      await newPromise;
    });
    expect(result.current.validationState.result).toMatchObject({
      ok: true,
      summary: { transferCount: 2 },
    });
    await act(async () => {
      oldCheck.resolve(makeAnalyzeImportFileResult(1));
      await oldPromise;
    });
    expect(result.current.selectedFileName).toBe("new.xlsx");
    expect(result.current.validationState.result).toMatchObject({
      ok: true,
      summary: { transferCount: 2 },
    });
  });

  it("检查格式在浏览器端解析文件，解析结果写入校验状态", async () => {
    mockAnalyzeImportFile(3);
    const { result } = renderHook(() => useDataImportForm(vi.fn()));

    await selectFileAndCheckFormat(result);

    expect(analyzeImportFileMock).toHaveBeenCalledOnce();
    expect(analyzeImportFileMock.mock.calls[0][0]).toBeInstanceOf(File);
    expect(result.current.validationState.result?.ok).toBe(true);
  });

  it("浏览器端解析抛出异常时展示错误提示而不是一直卡在检查中", async () => {
    analyzeImportFileMock.mockRejectedValue(new Error("out of memory"));
    const { result } = renderHook(() => useDataImportForm(vi.fn()));

    await selectFileAndCheckFormat(result);

    expect(result.current.validationState.error).toBe(
      dataImportErrorMessages[dataImportErrorCodes.validationFailed],
    );
    expect(result.current.isChecking).toBe(false);
  });

  it("开始导入按批切片，每批只发送这一批的行数据而不带文件", async () => {
    const totalCount = importBatchSize + 3;
    mockAnalyzeImportFile(totalCount);
    const executeBatchAction = vi.fn<DataImportBatchStateAction>(
      async (_previousState, formData) => {
        const units = JSON.parse(String(formData.get("units"))) as unknown[];
        return { batch: makeDoneBatch(units.length) };
      },
    );
    const { result } = renderHook(() => useDataImportForm(executeBatchAction));
    await selectFileAndCheckFormat(result);

    await act(async () => {
      await result.current.handleStartImport();
    });

    const sentBatches = executeBatchAction.mock.calls.map(([, formData]) => ({
      hasFile: formData.has("file"),
      units: JSON.parse(String(formData.get("units"))) as {
        row: { rowNumber: number };
      }[],
    }));
    expect(sentBatches.map((batch) => batch.units.length)).toEqual([
      importBatchSize,
      3,
    ]);
    expect(sentBatches.some((batch) => batch.hasFile)).toBe(false);
    // 每批都是原始行序中连续的一段，且不重叠。
    expect(sentBatches[0].units[0].row.rowNumber).toBe(2);
    expect(sentBatches[1].units[0].row.rowNumber).toBe(importBatchSize + 2);
    expect(result.current.executionStatus).toBe("completed");
    expect(result.current.executionResult?.processedCount).toBe(totalCount);
    expect(result.current.executionResult?.totalCount).toBe(totalCount);
  });

  it.each([
    ["第一批请求直接抛出", 0],
    ["第二批请求直接抛出", 1],
  ])("%s时退出导入中状态并给出错误提示", async (_name, failingBatchIndex) => {
    mockAnalyzeImportFile(importBatchSize * 2);
    const executeBatchAction = vi.fn<DataImportBatchStateAction>(async () => {
      if (executeBatchAction.mock.calls.length - 1 === failingBatchIndex) {
        throw new Error("network error");
      }
      return { batch: makeDoneBatch(importBatchSize) };
    });
    const { result } = renderHook(() => useDataImportForm(executeBatchAction));
    await selectFileAndCheckFormat(result);

    await act(async () => {
      await result.current.handleStartImport();
    });

    expect(result.current.executionStatus).toBeNull();
    expect(result.current.executionError).toBe(
      dataImportErrorMessages[dataImportErrorCodes.executionFailed],
    );
    expect(result.current.isImporting).toBe(false);
    expect(executeBatchAction).toHaveBeenCalledTimes(failingBatchIndex + 1);
  });

  it("只有表头没有数据行时开始导入直接完成，不请求服务端", async () => {
    mockAnalyzeImportFile(0);
    const executeBatchAction = vi.fn<DataImportBatchStateAction>();
    const { result } = renderHook(() => useDataImportForm(executeBatchAction));
    await selectFileAndCheckFormat(result);

    await act(async () => {
      await result.current.handleStartImport();
    });

    expect(executeBatchAction).not.toHaveBeenCalled();
    expect(result.current.executionStatus).toBe("completed");
    expect(result.current.executionError).toBeNull();
    expect(result.current.executionResult?.totalCount).toBe(0);
    expect(result.current.isImporting).toBe(false);
  });
});

describe("useDataImportForm 导入结果下载", () => {
  beforeEach(() => {
    analyzeImportFileMock.mockReset();
    buildResultWorkbookMock.mockReset();
  });

  it("将链接挂载到文档并延迟释放 Blob URL，避免 Safari 下载中断", async () => {
    vi.useFakeTimers();
    try {
      const createUrl = vi.fn(() => "blob:import-result");
      const revokeUrl = vi.fn();
      vi.stubGlobal(
        "URL",
        class extends URL {
          static createObjectURL = createUrl;
          static revokeObjectURL = revokeUrl;
        },
      );
      const click = vi
        .spyOn(HTMLAnchorElement.prototype, "click")
        .mockImplementation(function (this: HTMLAnchorElement) {
          expect(document.body.contains(this)).toBe(true);
          expect(this.href).toBe("blob:import-result");
          expect(this.download).toBe("data_导入结果.xlsx");
        });
      buildResultWorkbookMock.mockResolvedValue(new ArrayBuffer(8));
      mockAnalyzeImportFile(1);
      const executeBatchAction = vi.fn<DataImportBatchStateAction>(
        async () => ({ batch: makeDoneBatch(1) }),
      );
      const { result } = renderHook(() =>
        useDataImportForm(executeBatchAction),
      );
      await selectFileAndCheckFormat(result);

      await act(async () => {
        await result.current.handleStartImport();
      });
      await act(async () => {
        await result.current.handleDownloadResult();
      });

      expect(click).toHaveBeenCalledOnce();
      expect(createUrl).toHaveBeenCalledOnce();
      expect(revokeUrl).not.toHaveBeenCalled();
      await act(async () => {
        await vi.advanceTimersByTimeAsync(1000);
      });
      expect(revokeUrl).toHaveBeenCalledWith("blob:import-result");
      expect(document.querySelector('a[href="blob:import-result"]')).toBeNull();
    } finally {
      vi.useRealTimers();
      vi.unstubAllGlobals();
      vi.restoreAllMocks();
    }
  });
});

describe("useDataImportForm 持有人映射", () => {
  const holderMembers = [{ displayName: "张三", userId: "user-1" }];

  beforeEach(() => {
    analyzeImportFileMock.mockReset();
  });

  function setup(fromAccountHolder: string | null) {
    analyzeImportFileMock.mockResolvedValue(
      makeAnalyzeImportFileResult(2, fromAccountHolder),
    );
    const executeBatchAction = vi.fn<DataImportBatchStateAction>(async () => ({
      batch: makeDoneBatch(2),
    }));
    const { result } = renderHook(() =>
      useDataImportForm(executeBatchAction, holderMembers),
    );
    return { executeBatchAction, result };
  }

  it("存在未匹配持有人时汇总待映射姓名", async () => {
    const { result } = setup("小明");

    await selectFileAndCheckFormat(result);

    expect(result.current.holderMappingCandidates).toEqual([
      { name: "小明", recordCount: 2, reason: "unmatched" },
    ]);
  });

  it("持有人都能唯一匹配时没有待映射姓名", async () => {
    const { result } = setup("张三");

    await selectFileAndCheckFormat(result);

    expect(result.current.holderMappingCandidates).toEqual([]);
  });

  it("继续导入时每一批都带上持有人映射", async () => {
    const { executeBatchAction, result } = setup("小明");
    await selectFileAndCheckFormat(result);

    await act(async () => {
      await result.current.handleConfirmHolderMapping({
        小明: { kind: "member", userId: "user-1" },
      });
    });

    expect(
      executeBatchAction.mock.calls.map(([, formData]) =>
        formData.get("holderMapping"),
      ),
    ).toEqual([JSON.stringify({ 小明: { kind: "member", userId: "user-1" } })]);
    expect(result.current.executionStatus).toBe("completed");
  });

  it("没有映射步骤时开始导入发送空映射", async () => {
    const { executeBatchAction, result } = setup("张三");
    await selectFileAndCheckFormat(result);

    await act(async () => {
      await result.current.handleStartImport();
    });

    expect(executeBatchAction.mock.calls[0][1].get("holderMapping")).toBe("{}");
  });

  it("取消映射放弃本次导入，保留文件、清空解析结果且不请求服务端", async () => {
    const { executeBatchAction, result } = setup("小明");
    await selectFileAndCheckFormat(result);

    act(() => {
      result.current.handleCancelHolderMapping();
    });

    expect(executeBatchAction).not.toHaveBeenCalled();
    expect(result.current.holderMappingCandidates).toEqual([]);
    expect(result.current.validationState).toEqual({});
    expect(result.current.executionStatus).toBeNull();
    expect(result.current.selectedFileName).toBe("data.xlsx");
  });

  describe("新建待邀请成员", () => {
    const placeholderId = "00000000-0000-4000-8000-000000000051";
    const newPlaceholderMapping = {
      小明: { displayName: "小明", kind: "newPlaceholder" },
    } as const;
    const resolvedHolderMapping = {
      小明: { kind: "placeholder", placeholderId },
    } as const;

    function setupMultiBatch(
      firstBatch: Awaited<ReturnType<DataImportBatchStateAction>>,
    ) {
      const totalCount = importBatchSize + 1;
      analyzeImportFileMock.mockResolvedValue(
        makeAnalyzeImportFileResult(totalCount, "小明"),
      );
      const executeBatchAction = vi
        .fn<DataImportBatchStateAction>()
        .mockResolvedValueOnce(firstBatch)
        .mockResolvedValueOnce({ batch: makeDoneBatch(1) });
      const { result } = renderHook(() =>
        useDataImportForm(executeBatchAction, holderMembers),
      );
      return { executeBatchAction, result };
    }

    function submittedMappings(
      executeBatchAction: ReturnType<typeof vi.fn<DataImportBatchStateAction>>,
    ) {
      return executeBatchAction.mock.calls.map(([, formData]) =>
        JSON.parse(String(formData.get("holderMapping"))),
      );
    }

    it("首批提交新建意图，之后改用服务端返回的已解析映射，并汇总新建人数", async () => {
      const { executeBatchAction, result } = setupMultiBatch({
        batch: {
          ...makeDoneBatch(importBatchSize)!,
          createdPlaceholderCount: 1,
        },
        resolvedHolderMapping,
      });
      await selectFileAndCheckFormat(result);

      await act(async () => {
        await result.current.handleConfirmHolderMapping(newPlaceholderMapping);
      });

      expect(submittedMappings(executeBatchAction)).toEqual([
        newPlaceholderMapping,
        resolvedHolderMapping,
      ]);
      expect(result.current.executionStatus).toBe("completed");
      expect(result.current.executionResult?.createdPlaceholderCount).toBe(1);
    });

    it("首批失败时停止导入，不自动重试新建", async () => {
      const { executeBatchAction, result } = setupMultiBatch({
        error: "账本里已有同名的待邀请成员。",
      });
      await selectFileAndCheckFormat(result);

      await act(async () => {
        await result.current.handleConfirmHolderMapping(newPlaceholderMapping);
      });

      expect(executeBatchAction).toHaveBeenCalledTimes(1);
      expect(result.current.executionError).toBe(
        "账本里已有同名的待邀请成员。",
      );
      expect(result.current.executionStatus).toBeNull();
    });
  });
});
