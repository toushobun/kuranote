// @vitest-environment node

import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  checkFile: vi.fn(),
  createExecutionService: vi.fn(),
  createRequestContainer: vi.fn(),
  createServerRequestDependencies: vi.fn(),
  executeBatch: vi.fn(),
  loggerError: vi.fn(),
  requireCurrentUserAndLedger: vi.fn(),
}));

vi.mock("internal/ledger/adapter/next/currentLedger", () => ({
  requireCurrentUserAndLedger: mocks.requireCurrentUserAndLedger,
}));
vi.mock("internal/shared/context/createServerRequestDependencies", () => ({
  createServerRequestDependencies: mocks.createServerRequestDependencies,
}));
vi.mock("internal/container", () => ({
  createRequestContainer: mocks.createRequestContainer,
}));

import {
  checkDataImportFormat,
  executeDataImportBatch,
} from "internal/dataImport/adapter/next/actions";
import { ValidationError } from "internal/shared/errors/appError";

const ledgerId = "00000000-0000-4000-8000-000000000032";
const userId = "00000000-0000-4000-8000-000000000031";
const currentLedger = {
  baseCurrency: "JPY",
  id: ledgerId,
  name: "家庭账本",
  role: "owner" as const,
};

function createFormData(
  file: File | null,
  offset?: string,
  timeZoneOffsetMinutes = "-540",
) {
  const formData = new FormData();
  if (file) {
    formData.set("file", file);
  }
  if (offset !== undefined) {
    formData.set("offset", offset);
    formData.set("timeZoneOffsetMinutes", timeZoneOffsetMinutes);
  }
  return formData;
}

beforeEach(() => {
  vi.resetAllMocks();
  mocks.requireCurrentUserAndLedger.mockResolvedValue({
    currentLedger,
    userId,
  });
  mocks.createServerRequestDependencies.mockResolvedValue({
    logger: { error: mocks.loggerError, info: vi.fn(), warn: vi.fn() },
  });
  mocks.createRequestContainer.mockReturnValue({
    dataImport: {
      createExecutionService: mocks.createExecutionService,
      service: { checkFile: mocks.checkFile },
    },
  });
  mocks.createExecutionService.mockReturnValue({
    executeBatch: mocks.executeBatch,
  });
});

describe("checkDataImportFormat", () => {
  it("未选择文件时返回安全错误状态，且不调用 Service", async () => {
    const state = await checkDataImportFormat({}, createFormData(null));

    expect(state).toEqual({
      error: "请选择要导入的文件。",
      errorKey: expect.any(String),
    });
    expect(mocks.checkFile).not.toHaveBeenCalled();
  });

  it("先校验登录状态与账本成员身份，再解析表单", async () => {
    mocks.requireCurrentUserAndLedger.mockRejectedValueOnce(
      new Error("NEXT_REDIRECT:/login"),
    );

    await expect(
      checkDataImportFormat({}, createFormData(null)),
    ).rejects.toThrow("NEXT_REDIRECT:/login");
    expect(mocks.checkFile).not.toHaveBeenCalled();
  });

  it("校验通过时返回 Service 结果", async () => {
    const file = new File(["binary"], "data.xlsx");
    mocks.checkFile.mockResolvedValue({
      ok: true,
      summary: {
        balanceAdjustmentDetected: false,
        incomeExpenseCount: 1,
        transferCount: 0,
      },
    });

    const state = await checkDataImportFormat({}, createFormData(file));

    expect(state).toEqual({
      result: {
        ok: true,
        summary: {
          balanceAdjustmentDetected: false,
          incomeExpenseCount: 1,
          transferCount: 0,
        },
      },
    });
    expect(mocks.checkFile).toHaveBeenCalledWith({
      fileBuffer: expect.any(ArrayBuffer),
      fileName: "data.xlsx",
    });
  });

  it("校验失败时也原样返回 issues 结果（不是错误状态）", async () => {
    const file = new File(["binary"], "data.xlsx");
    mocks.checkFile.mockResolvedValue({
      issues: [{ kind: "structural", message: "无法识别的表格类型。" }],
      ok: false,
    });

    const state = await checkDataImportFormat({}, createFormData(file));

    expect(state.error).toBeUndefined();
    expect(state.result).toEqual({
      issues: [{ kind: "structural", message: "无法识别的表格类型。" }],
      ok: false,
    });
  });

  it("Service 抛出未知异常时返回安全兜底提示", async () => {
    const file = new File(["binary"], "data.xlsx");
    mocks.checkFile.mockRejectedValue(new Error("unexpected"));

    const state = await checkDataImportFormat({}, createFormData(file));

    expect(state).toEqual({
      error: "文件检查失败，请稍后重试。",
      errorKey: expect.any(String),
    });
    expect(mocks.loggerError).toHaveBeenCalledWith(
      "[dataImport] check format action failed unexpectedly",
      { errorName: "Error" },
    );
  });
});

describe("executeDataImportBatch", () => {
  it("每批重新确认当前账本，并将当前用户与 offset 交给执行 Service", async () => {
    const file = new File(["binary"], "data.xlsx");
    mocks.executeBatch.mockResolvedValue({
      details: [],
      done: true,
      duplicateCount: 0,
      failureCount: 0,
      nextOffset: 1,
      processedCount: 1,
      rowResults: [],
      successCount: 1,
      totalCount: 1,
    });

    const state = await executeDataImportBatch({}, createFormData(file, "0"));

    expect(mocks.requireCurrentUserAndLedger).toHaveBeenCalledOnce();
    expect(mocks.createExecutionService).toHaveBeenCalledWith(currentLedger);
    expect(mocks.executeBatch).toHaveBeenCalledWith({
      fileBuffer: expect.any(ArrayBuffer),
      fileName: "data.xlsx",
      ledgerId,
      offset: 0,
      timeZoneOffsetMinutes: -540,
      userId,
    });
    expect(state.batch).toMatchObject({ done: true, successCount: 1 });
  });

  it("非法 offset 在调用执行 Service 前返回安全错误", async () => {
    const file = new File(["binary"], "data.xlsx");
    const state = await executeDataImportBatch({}, createFormData(file, "-1"));

    expect(state).toEqual({
      error: "导入文件或进度信息已变化，请重新检查格式后再导入。",
      errorKey: expect.any(String),
    });
    expect(mocks.executeBatch).not.toHaveBeenCalled();
  });

  it("执行 Service 的应用错误安全返回给客户端", async () => {
    const file = new File(["binary"], "data.xlsx");
    mocks.executeBatch.mockRejectedValue(
      new ValidationError("reference_invalid", "账户持有人不存在。"),
    );

    const state = await executeDataImportBatch({}, createFormData(file, "0"));

    expect(state).toEqual({
      error: "账户持有人不存在。",
      errorKey: expect.any(String),
    });
  });

  it("未知异常只记录安全日志并返回统一兜底提示", async () => {
    const file = new File(["binary"], "data.xlsx");
    mocks.executeBatch.mockRejectedValue(new Error("database secret"));

    const state = await executeDataImportBatch({}, createFormData(file, "0"));

    expect(state).toEqual({
      error: "数据导入失败，请稍后重试。",
      errorKey: expect.any(String),
    });
    expect(mocks.loggerError).toHaveBeenCalledWith(
      "[dataImport] execute batch action failed unexpectedly",
      expect.objectContaining({ errorName: "Error", ledgerId, offset: 0 }),
    );
  });
});
