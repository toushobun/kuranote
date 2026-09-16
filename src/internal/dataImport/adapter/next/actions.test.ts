// @vitest-environment node

import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  checkFile: vi.fn(),
  createRequestContainer: vi.fn(),
  createServerRequestDependencies: vi.fn(),
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

import { checkDataImportFormat } from "internal/dataImport/adapter/next/actions";

const ledgerId = "00000000-0000-4000-8000-000000000032";
const userId = "00000000-0000-4000-8000-000000000031";

function createFormData(file: File | null) {
  const formData = new FormData();
  if (file) {
    formData.set("file", file);
  }
  return formData;
}

beforeEach(() => {
  vi.resetAllMocks();
  mocks.requireCurrentUserAndLedger.mockResolvedValue({
    currentLedger: { id: ledgerId },
    userId,
  });
  mocks.createServerRequestDependencies.mockResolvedValue({});
  mocks.createRequestContainer.mockReturnValue({
    dataImport: {
      service: { checkFile: mocks.checkFile },
    },
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
    const file = new File(["a,b\n1,2"], "data.csv", { type: "text/csv" });
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
      fileName: "data.csv",
    });
  });

  it("校验失败时也原样返回 issues 结果（不是错误状态）", async () => {
    const file = new File(["a,b"], "data.csv", { type: "text/csv" });
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
    const consoleError = vi
      .spyOn(console, "error")
      .mockImplementation(() => {});
    const file = new File(["a,b"], "data.csv", { type: "text/csv" });
    mocks.checkFile.mockRejectedValue(new Error("unexpected"));

    const state = await checkDataImportFormat({}, createFormData(file));

    expect(state).toEqual({
      error: "文件检查失败，请稍后重试。",
      errorKey: expect.any(String),
    });
    expect(consoleError).toHaveBeenCalledWith(
      "[dataImport] check format action failed unexpectedly",
      { errorName: "Error" },
    );
    consoleError.mockRestore();
  });
});
