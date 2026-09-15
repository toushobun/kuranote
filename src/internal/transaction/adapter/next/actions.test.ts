// @vitest-environment node
import { beforeEach, describe, expect, it, vi } from "vitest";
import { getTransactionActionModuleMocks } from "internal/transaction/adapter/next/actions.testUtils";
import {
  createTransaction,
  saveEditTransaction,
  updateTransaction,
  voidTransaction,
} from "internal/transaction/adapter/next/actions";
import {
  ConflictError,
  ValidationError,
} from "internal/shared/errors/appError";
import { transactionErrorCodes } from "internal/transaction/errors";

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
  it("Service 返回应用错误时留在当前页面且不刷新缓存", async () => {
    mocks.updateNormal.mockRejectedValueOnce(
      new ValidationError("account_invalid", "账户信息不正确。"),
    );
    await expect(
      updateTransaction({}, createNormalFormData()),
    ).resolves.toEqual({
      error: "账户信息不正确。",
      errorKey: "account_invalid",
    });
    expect(
      transactionActionModuleMocks.revalidateTransactionMutation,
    ).not.toHaveBeenCalled();
    expect(transactionActionModuleMocks.redirect).not.toHaveBeenCalled();
  });
  it("同步确认冲突通过稳定 errorKey 返回给后续确认弹层", async () => {
    mocks.updateNormal.mockRejectedValueOnce(
      new ConflictError(
        transactionErrorCodes.linkedSyncConfirmationRequired,
        "该交易包含退款 / 报销关联，请确认同步修改关联数据后再保存。",
      ),
    );

    await expect(
      updateTransaction({}, createNormalFormData()),
    ).resolves.toEqual({
      error: "该交易包含退款 / 报销关联，请确认同步修改关联数据后再保存。",
      errorKey: transactionErrorCodes.linkedSyncConfirmationRequired,
    });
    expect(
      transactionActionModuleMocks.revalidateTransactionMutation,
    ).not.toHaveBeenCalled();
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
      error: "交易类型指定不正确，请刷新页面后重试。",
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
