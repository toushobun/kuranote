// @vitest-environment node
import { beforeEach, describe, expect, it, vi } from "vitest";
import { getTransactionActionModuleMocks } from "internal/transaction/adapter/next/actions.testUtils";
import {
  createTransaction,
  saveEditTransaction,
  updateBalanceAdjustmentTransaction,
  updateTransaction,
  voidTransaction,
} from "internal/transaction/adapter/next/actions";
import {
  ConflictError,
  ValidationError,
} from "internal/shared/errors/appError";
import {
  balanceAdjustmentErrorMessages,
  transactionActionErrorMessages,
  transactionErrorCodes,
  transactionLinkedEditErrorMessages,
} from "internal/transaction/errors";

const transactionActionModuleMocks = getTransactionActionModuleMocks();

const mocks = vi.hoisted(() => ({
  canModify: vi.fn(),
  convert: vi.fn(),
  createNormal: vi.fn(),
  createTransfer: vi.fn(),
  getEditView: vi.fn(),
  linkedGetEditSnapshot: vi.fn(),
  linkedUpdate: vi.fn(),
  linkedUpdateEdit: vi.fn(),
  updateNormal: vi.fn(),
  updateBalanceAdjustment: vi.fn(),
  updateTransfer: vi.fn(),
  void: vi.fn(),
}));
describe("Transaction Actions", () => {
  const ledgerId = "00000000-0000-4000-8000-000000000032";
  function createFormData(amount = "1200") {
    const formData = new FormData();
    formData.set("ledgerId", "00000000-0000-4000-8000-000000000099");
    formData.set("type", "expense");
    formData.set("transactionAt", "2026-06-04T10:30:05");
    formData.set("timeZoneOffsetMinutes", "-540");
    formData.set("accountId", "00000000-0000-4000-8000-000000000045");
    formData.append("itemCategoryId", "00000000-0000-4000-8000-000000005072");
    formData.append("itemAmount", amount);
    formData.set("merchantId", "00000000-0000-4000-8000-000000001001");
    return formData;
  }
  beforeEach(() => {
    vi.clearAllMocks();
    transactionActionModuleMocks.requireCurrentUserAndLedger.mockResolvedValue({
      currentLedger: {
        baseCurrency: "JPY",
        currentUserRole: "owner",
        id: ledgerId,
        name: "家庭账本",
      },
      userId: "00000000-0000-4000-8000-000000000031",
    });
    transactionActionModuleMocks.createServerRequestDependencies.mockResolvedValue(
      {},
    );
    transactionActionModuleMocks.createRequestContainer.mockReturnValue({
      transaction: { service: { createNormal: mocks.createNormal } },
    });
  });
  it("校验失败在当前页面返回错误状态", async () => {
    const state = await createTransaction({}, createFormData("-1"));
    expect(state.error).toBeTruthy();
    expect(mocks.createNormal).not.toHaveBeenCalled();
    expect(transactionActionModuleMocks.redirect).not.toHaveBeenCalled();
  });
  it("忽略客户端伪造账本并在成功后刷新缓存", async () => {
    await expect(createTransaction({}, createFormData())).rejects.toThrow(
      "NEXT_REDIRECT:/transactions?month=2026-06&result=created",
    );
    expect(mocks.createNormal).toHaveBeenCalledWith(
      expect.objectContaining({ ledgerId }),
    );
    expect(
      transactionActionModuleMocks.revalidateTransactionMutation,
    ).toHaveBeenCalledOnce();
  });
});
describe("Transaction Action 写入流程", () => {
  const ledgerId = "00000000-0000-4000-8000-000000000032";
  const transactionRecordId = "00000000-0000-4000-8000-000000009999";
  const accountId = "00000000-0000-4000-8000-000000000045";
  const targetAccountId = "00000000-0000-4000-8000-000000000046";
  const categoryId = "00000000-0000-4000-8000-000000005072";
  const merchantId = "00000000-0000-4000-8000-000000001001";
  function createNormalFormData({
    sourceType,
    type = "expense",
  }: {
    sourceType?: string;
    type?: string;
  } = {}) {
    const formData = new FormData();
    if (sourceType) formData.set("sourceType", sourceType);
    formData.set("type", type);
    formData.set("transactionRecordId", transactionRecordId);
    formData.set("transactionAt", "2026-06-04T10:30:05");
    formData.set("timeZoneOffsetMinutes", "-540");
    formData.set("accountId", accountId);
    formData.append("itemCategoryId", categoryId);
    formData.append("itemAmount", "1200");
    formData.set("merchantId", merchantId);
    formData.set("note", "编辑备注");
    return formData;
  }
  function createTransferFormData(sourceType?: string) {
    const formData = new FormData();
    if (sourceType) formData.set("sourceType", sourceType);
    formData.set("type", "transfer");
    formData.set("transactionRecordId", transactionRecordId);
    formData.set("transactionAt", "2026-06-04T10:30:05");
    formData.set("timeZoneOffsetMinutes", "-540");
    formData.set("accountId", accountId);
    formData.set("transferTargetAccountId", targetAccountId);
    formData.set("transferAmount", "5000");
    formData.set("note", "转账备注");
    return formData;
  }
  function createVoidFormData() {
    const formData = new FormData();
    formData.set("transactionRecordId", transactionRecordId);
    return formData;
  }
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.canModify.mockResolvedValue(true);
    mocks.getEditView.mockResolvedValue(null);
    transactionActionModuleMocks.requireCurrentUserAndLedger.mockResolvedValue({
      currentLedger: {
        baseCurrency: "JPY",
        currentUserRole: "owner",
        id: ledgerId,
        name: "家庭账本",
      },
      userId: "00000000-0000-4000-8000-000000000031",
    });
    transactionActionModuleMocks.createServerRequestDependencies.mockResolvedValue(
      {},
    );
    transactionActionModuleMocks.createRequestContainer.mockReturnValue({
      transaction: {
        linkedTransactionEditService: {
          updateNormal: mocks.updateNormal,
          void: mocks.void,
        },
        linkedTransactionItemService: {
          getEditSnapshot: mocks.linkedGetEditSnapshot,
          update: mocks.linkedUpdate,
          updateEdit: mocks.linkedUpdateEdit,
        },
        service: {
          canModify: mocks.canModify,
          convert: mocks.convert,
          createNormal: mocks.createNormal,
          createTransfer: mocks.createTransfer,
          getEditView: mocks.getEditView,
          updateBalanceAdjustment: mocks.updateBalanceAdjustment,
          updateNormal: mocks.updateNormal,
          updateTransfer: mocks.updateTransfer,
          void: mocks.void,
        },
      },
    });
  });
  it("创建转账成功后刷新缓存并跳转到发生月份", async () => {
    await expect(
      createTransaction({}, createTransferFormData()),
    ).rejects.toThrow(
      "NEXT_REDIRECT:/transactions?month=2026-06&result=created",
    );
    expect(mocks.createTransfer).toHaveBeenCalledWith({
      accountId,
      ledgerId,
      note: "转账备注",
      transactionAt: "2026-06-04T01:30:05.000Z",
      transferAmount: 5000,
      transferTargetAccountId: targetAccountId,
    });
    expect(
      transactionActionModuleMocks.revalidateTransactionMutation,
    ).toHaveBeenCalledOnce();
  });
  it("更新普通交易成功后刷新缓存并跳转", async () => {
    const formData = createNormalFormData();
    formData.append("itemSpecialStatus", "pendingReimbursement");
    await expect(updateTransaction({}, formData)).rejects.toThrow(
      "NEXT_REDIRECT:/transactions?month=2026-06&result=updated",
    );
    expect(mocks.updateNormal).toHaveBeenCalledWith(
      expect.objectContaining({ id: ledgerId }),
      expect.objectContaining({
        accountId,
        ledgerId,
        items: [
          {
            amount: 1200,
            categoryId,
            specialStatus: "pendingReimbursement",
          },
        ],
        transactionRecordId,
        type: "expense",
      }),
    );
    expect(
      transactionActionModuleMocks.revalidateTransactionMutation,
    ).toHaveBeenCalledOnce();
  });
  function createBalanceAdjustmentFormData() {
    const formData = new FormData();
    formData.set("transactionRecordId", transactionRecordId);
    formData.set("transactionAt", "2026-06-04T10:30:05");
    formData.set("timeZoneOffsetMinutes", "-540");
    return formData;
  }
  // errorKey 是每次失败生成的随机值，不得等于任何业务错误码。
  function expectRandomErrorKey(errorKey: string | undefined) {
    expect(errorKey).toEqual(expect.any(String));
    expect(Object.values(transactionErrorCodes)).not.toContain(errorKey);
  }
  it("Service 返回无需前端分支的应用错误时只返回文案与随机 errorKey", async () => {
    mocks.updateNormal.mockRejectedValueOnce(
      new ValidationError("account_invalid", "账户信息不正确。"),
    );
    const state = await updateTransaction({}, createNormalFormData());

    expect(state).toEqual({
      error: "账户信息不正确。",
      errorKey: expect.any(String),
    });
    expect(state).not.toHaveProperty("errorCode");
    expectRandomErrorKey(state.errorKey);
    expect(
      transactionActionModuleMocks.revalidateTransactionMutation,
    ).not.toHaveBeenCalled();
    expect(transactionActionModuleMocks.redirect).not.toHaveBeenCalled();
  });
  it("同步确认冲突通过 errorCode 返回，且连续两次失败的 errorKey 不同", async () => {
    const conflict = new ConflictError(
      transactionErrorCodes.linkedSyncConfirmationRequired,
      transactionLinkedEditErrorMessages.confirmationRequired,
    );
    mocks.updateNormal
      .mockRejectedValueOnce(conflict)
      .mockRejectedValueOnce(conflict);

    const first = await updateTransaction({}, createNormalFormData());
    const second = await updateTransaction(first, createNormalFormData());

    for (const state of [first, second]) {
      expect(state).toEqual({
        error: transactionLinkedEditErrorMessages.confirmationRequired,
        errorCode: transactionErrorCodes.linkedSyncConfirmationRequired,
        errorKey: expect.any(String),
      });
      expectRandomErrorKey(state.errorKey);
    }
    expect(second.errorKey).not.toBe(first.errorKey);
    expect(
      transactionActionModuleMocks.revalidateTransactionMutation,
    ).not.toHaveBeenCalled();
  });
  it("删除仍被关联的交易时通过 errorCode 返回禁止删除", async () => {
    mocks.void.mockRejectedValueOnce(
      new ValidationError(
        transactionErrorCodes.linkedDeleteForbidden,
        transactionLinkedEditErrorMessages.deleteForbidden,
      ),
    );
    const state = await voidTransaction({}, createVoidFormData());

    expect(state).toEqual({
      error: transactionLinkedEditErrorMessages.deleteForbidden,
      errorCode: transactionErrorCodes.linkedDeleteForbidden,
      errorKey: expect.any(String),
    });
    expectRandomErrorKey(state.errorKey);
    expect(transactionActionModuleMocks.redirect).not.toHaveBeenCalled();
  });
  it("余额调整更新失败时返回业务文案与随机 errorKey，不暴露 errorCode", async () => {
    mocks.updateBalanceAdjustment.mockRejectedValueOnce(
      new ValidationError(
        transactionErrorCodes.balanceAdjustmentAccountArchived,
        balanceAdjustmentErrorMessages.archivedAccount,
      ),
    );
    const state = await updateBalanceAdjustmentTransaction(
      {},
      createBalanceAdjustmentFormData(),
    );

    expect(state).toEqual({
      error: balanceAdjustmentErrorMessages.archivedAccount,
      errorKey: expect.any(String),
    });
    expectRandomErrorKey(state.errorKey);
  });
  it("余额调整更新出现未知异常时返回兜底文案与随机 errorKey", async () => {
    const consoleError = vi
      .spyOn(console, "error")
      .mockImplementation(() => undefined);
    mocks.updateBalanceAdjustment.mockRejectedValueOnce(new Error("boom"));
    const state = await updateBalanceAdjustmentTransaction(
      {},
      createBalanceAdjustmentFormData(),
    );

    expect(state).toEqual({
      error: balanceAdjustmentErrorMessages.updateFailed,
      errorKey: expect.any(String),
    });
    expectRandomErrorKey(state.errorKey);
    consoleError.mockRestore();
  });
  it("普通交易转换为转账时由 saveEditTransaction 调用 convert", async () => {
    await expect(
      saveEditTransaction({}, createTransferFormData("expense")),
    ).rejects.toThrow(
      "NEXT_REDIRECT:/transactions?month=2026-06&result=updated",
    );
    expect(mocks.convert).toHaveBeenCalledWith(
      expect.objectContaining({
        accountId,
        ledgerId,
        targetType: "transfer",
        transactionRecordId,
        transferTargetAccountId: targetAccountId,
      }),
    );
    expect(mocks.updateTransfer).not.toHaveBeenCalled();
  });
  it("转账保持转账类型时由 saveEditTransaction 调用 updateTransfer", async () => {
    await expect(
      saveEditTransaction({}, createTransferFormData("transfer")),
    ).rejects.toThrow(
      "NEXT_REDIRECT:/transactions?month=2026-06&result=updated",
    );
    expect(mocks.updateTransfer).toHaveBeenCalledWith(
      expect.objectContaining({ ledgerId, transactionRecordId }),
    );
    expect(mocks.convert).not.toHaveBeenCalled();
  });
  it("作废成功后刷新缓存并返回交易列表", async () => {
    await expect(voidTransaction({}, createVoidFormData())).rejects.toThrow(
      "NEXT_REDIRECT:/transactions?result=deleted",
    );
    expect(mocks.void).toHaveBeenCalledWith(
      expect.objectContaining({ id: ledgerId }),
      { ledgerId, transactionRecordId },
    );
    expect(
      transactionActionModuleMocks.revalidateTransactionMutation,
    ).toHaveBeenCalledOnce();
  });
  it("编辑类型非法时不读取上下文也不调用 Service", async () => {
    const formData = createNormalFormData({
      sourceType: "invalid",
      type: "expense",
    });
    await expect(saveEditTransaction({}, formData)).resolves.toEqual({
      error: transactionActionErrorMessages.typeInvalid,
      errorKey: expect.any(String),
    });
    expect(
      transactionActionModuleMocks.requireCurrentUserAndLedger,
    ).not.toHaveBeenCalled();
    expect(
      transactionActionModuleMocks.createRequestContainer,
    ).not.toHaveBeenCalled();
    expect(
      transactionActionModuleMocks.revalidateTransactionMutation,
    ).not.toHaveBeenCalled();
  });
});
