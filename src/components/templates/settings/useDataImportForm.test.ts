import { act, renderHook } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import type { ChangeEvent } from "react";

import { importBatchSize } from "internal/dataImport";
import { makeAnalyzeImportFileResult } from "test/mocks/dataImport";
import type {
  DataImportBatchActionState,
  DataImportBatchStateAction,
} from "types/dataImport";

import { useDataImportForm } from "./useDataImportForm";

const analyzeImportFileMock = vi.hoisted(() => vi.fn());

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

describe("useDataImportForm 浏览器端解析与分批发送", () => {
  beforeEach(() => {
    analyzeImportFileMock.mockReset();
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
      "文件检查失败，请稍后重试。",
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
