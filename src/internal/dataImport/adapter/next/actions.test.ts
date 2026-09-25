// @vitest-environment node

import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  createExecutionService: vi.fn(),
  createRequestContainer: vi.fn(),
  createServerRequestDependencies: vi.fn(),
  executeBatch: vi.fn(),
  loggerError: vi.fn(),
  requireCurrentUserAndLedger: vi.fn(),
  revalidatePath: vi.fn(),
}));

vi.mock("next/cache", () => ({ revalidatePath: mocks.revalidatePath }));

vi.mock("internal/ledger/adapter/next/currentLedger", () => ({
  requireCurrentUserAndLedger: mocks.requireCurrentUserAndLedger,
}));
vi.mock("internal/shared/context/createServerRequestDependencies", () => ({
  createServerRequestDependencies: mocks.createServerRequestDependencies,
}));
vi.mock("internal/container", () => ({
  createRequestContainer: mocks.createRequestContainer,
}));

import { executeDataImportBatch } from "internal/dataImport/adapter/next/actions";
import { dataImportExecutionErrorMessages } from "internal/dataImport/errors";
import {
  ConflictError,
  ValidationError,
} from "internal/shared/errors/appError";

const ledgerId = "00000000-0000-4000-8000-000000000032";
const userId = "00000000-0000-4000-8000-000000000031";
const currentLedger = {
  baseCurrency: "JPY",
  id: ledgerId,
  name: "家庭账本",
  currentUserRole: "owner" as const,
};

const transferUnit = {
  kind: "transfer",
  row: {
    amount: 100,
    fromAccountCurrency: "JPY",
    fromAccountHolder: null,
    fromAccountName: "钱包",
    fromAccountType: "cash",
    note: null,
    rowNumber: 2,
    toAccountCurrency: "JPY",
    toAccountHolder: null,
    toAccountName: "银行卡",
    toAccountType: "bank",
    transactionAt: "2026-09-17 10:00:00",
  },
};

const mappedUserId = "00000000-0000-4000-8000-000000000033";
const placeholderId = "00000000-0000-4000-8000-000000000051";

function createFormData(
  units: unknown = [transferUnit],
  holderMapping: unknown = { 小明: { kind: "member", userId: mappedUserId } },
) {
  const formData = new FormData();
  formData.set("units", JSON.stringify(units));
  formData.set("holderMapping", JSON.stringify(holderMapping));
  formData.set("timeZoneOffsetMinutes", "-540");
  return formData;
}

function createBatchOutput() {
  return {
    createdPlaceholderCount: 0,
    details: [],
    duplicateCount: 0,
    failureCount: 0,
    holderMissingCount: 0,
    processedCount: 1,
    resolvedHolderMapping: {},
    rowResults: [],
    successCount: 1,
  };
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
    },
  });
  mocks.createExecutionService.mockReturnValue({
    executeBatch: mocks.executeBatch,
  });
});

describe("executeDataImportBatch", () => {
  it("每批重新确认当前账本，并将当前用户与这一批行数据交给执行 Service", async () => {
    mocks.executeBatch.mockResolvedValue({
      ...createBatchOutput(),
      resolvedHolderMapping: { 小明: { kind: "member", userId: mappedUserId } },
    });

    const state = await executeDataImportBatch({}, createFormData());

    expect(mocks.requireCurrentUserAndLedger).toHaveBeenCalledOnce();
    expect(mocks.createExecutionService).toHaveBeenCalledWith(currentLedger);
    expect(mocks.executeBatch).toHaveBeenCalledWith({
      holderMapping: { 小明: { kind: "member", userId: mappedUserId } },
      ledgerId,
      timeZoneOffsetMinutes: -540,
      units: [transferUnit],
      userId,
    });
    expect(state.batch).toMatchObject({ successCount: 1 });
    expect(mocks.revalidatePath).not.toHaveBeenCalled();
  });

  it("返回已解析的持有人映射，并在新建待邀请成员后失效相关页面", async () => {
    const resolvedHolderMapping = {
      奶奶: { kind: "placeholder", placeholderId },
    };
    mocks.executeBatch.mockResolvedValue({
      ...createBatchOutput(),
      createdPlaceholderCount: 1,
      resolvedHolderMapping,
    });

    const state = await executeDataImportBatch(
      {},
      createFormData(undefined, {
        奶奶: { displayName: "奶奶", kind: "newPlaceholder" },
      }),
    );

    expect(mocks.executeBatch).toHaveBeenCalledWith(
      expect.objectContaining({
        holderMapping: {
          奶奶: { displayName: "奶奶", kind: "newPlaceholder" },
        },
      }),
    );
    expect(state.resolvedHolderMapping).toEqual(resolvedHolderMapping);
    expect(state.batch).toEqual(
      expect.objectContaining({ createdPlaceholderCount: 1 }),
    );
    expect(state.batch).not.toHaveProperty("resolvedHolderMapping");
    expect(mocks.revalidatePath).toHaveBeenCalledWith(
      `/ledgers/${ledgerId}/settings`,
    );
    expect(mocks.revalidatePath).toHaveBeenCalledWith("/accounts");
    expect(mocks.revalidatePath).toHaveBeenCalledWith("/settings/data/import");
  });

  it("非法持有人映射在调用执行 Service 前返回安全错误", async () => {
    const state = await executeDataImportBatch(
      {},
      createFormData(undefined, { 小明: mappedUserId }),
    );

    expect(state).toEqual({
      error: "导入文件或进度信息已变化，请重新检查格式后再导入。",
      errorKey: expect.any(String),
    });
    expect(mocks.executeBatch).not.toHaveBeenCalled();
  });

  it("新建待邀请成员失败时返回执行 Service 的安全文案，不失效页面", async () => {
    mocks.executeBatch.mockRejectedValue(
      new ConflictError(
        "holder_mapping_conflict",
        dataImportExecutionErrorMessages.newPlaceholderMemberConflict(["奶奶"]),
      ),
    );

    const state = await executeDataImportBatch(
      {},
      createFormData(undefined, {
        奶奶: { displayName: "奶奶", kind: "newPlaceholder" },
      }),
    );

    expect(state).toEqual({
      error: dataImportExecutionErrorMessages.newPlaceholderMemberConflict([
        "奶奶",
      ]),
      errorKey: expect.any(String),
    });
    expect(state.resolvedHolderMapping).toBeUndefined();
    expect(mocks.revalidatePath).not.toHaveBeenCalled();
  });

  it("先校验登录状态与账本成员身份，再解析表单", async () => {
    mocks.requireCurrentUserAndLedger.mockRejectedValueOnce(
      new Error("NEXT_REDIRECT:/login"),
    );

    await expect(executeDataImportBatch({}, createFormData())).rejects.toThrow(
      "NEXT_REDIRECT:/login",
    );
    expect(mocks.executeBatch).not.toHaveBeenCalled();
  });

  it("非法行数据在调用执行 Service 前返回安全错误", async () => {
    const state = await executeDataImportBatch({}, createFormData([]));

    expect(state).toEqual({
      error: "导入文件或进度信息已变化，请重新检查格式后再导入。",
      errorKey: expect.any(String),
    });
    expect(mocks.executeBatch).not.toHaveBeenCalled();
  });

  it("执行 Service 的应用错误安全返回给客户端", async () => {
    mocks.executeBatch.mockRejectedValue(
      new ValidationError("reference_invalid", "账户持有人不存在。"),
    );

    const state = await executeDataImportBatch({}, createFormData());

    expect(state).toEqual({
      error: "账户持有人不存在。",
      errorKey: expect.any(String),
    });
  });

  it("未知异常只记录安全日志并返回统一兜底提示", async () => {
    mocks.executeBatch.mockRejectedValue(new Error("database secret"));

    const state = await executeDataImportBatch({}, createFormData());

    expect(state).toEqual({
      error: "数据导入失败，请稍后重试。",
      errorKey: expect.any(String),
    });
    expect(mocks.loggerError).toHaveBeenCalledWith(
      "[dataImport] execute batch action failed unexpectedly",
      expect.objectContaining({ errorName: "Error", ledgerId }),
    );
  });

  it("依赖构造瞬时异常时返回安全兜底提示，而不是抛给客户端", async () => {
    mocks.createServerRequestDependencies.mockRejectedValue(
      new Error("connection reset"),
    );

    const state = await executeDataImportBatch({}, createFormData());

    expect(state).toEqual({
      error: "数据导入失败，请稍后重试。",
      errorKey: expect.any(String),
    });
    expect(mocks.executeBatch).not.toHaveBeenCalled();
  });
});
