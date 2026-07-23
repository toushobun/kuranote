// @vitest-environment node

import { beforeEach, describe, expect, it, vi } from "vitest";

import { ValidationError } from "internal/shared/errors/appError";
import {
  createTransaction,
  saveEditTransaction,
  updateTransaction,
  voidTransaction,
} from "internal/transaction/adapter/next/actions";

const mocks = vi.hoisted(() => ({
  convert: vi.fn(),
  createNormal: vi.fn(),
  createRequestContainer: vi.fn(),
  createServerRequestDependencies: vi.fn(),
  createTransfer: vi.fn(),
  redirect: vi.fn((path: string) => {
    throw new Error(`NEXT_REDIRECT:${path}`);
  }),
  requireCurrentUserAndLedger: vi.fn(),
  revalidateTransactionMutation: vi.fn(),
  updateNormal: vi.fn(),
  updateTransfer: vi.fn(),
  void: vi.fn(),
}));

vi.mock("next/navigation", () => ({ redirect: mocks.redirect }));
vi.mock("internal/container", () => ({
  createRequestContainer: mocks.createRequestContainer,
}));
vi.mock("internal/ledger/adapter/next/currentLedger", () => ({
  requireCurrentUserAndLedger: mocks.requireCurrentUserAndLedger,
}));
vi.mock("internal/shared/context/createServerRequestDependencies", () => ({
  createServerRequestDependencies: mocks.createServerRequestDependencies,
}));
vi.mock("internal/transaction/adapter/next/revalidate", () => ({
  revalidateTransactionMutation: mocks.revalidateTransactionMutation,
}));

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

describe("Transaction Action 写入流程", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.requireCurrentUserAndLedger.mockResolvedValue({
      currentLedger: {
        baseCurrency: "JPY",
        currentUserRole: "owner",
        id: ledgerId,
        name: "家庭账本",
      },
      userId: "00000000-0000-4000-8000-000000000031",
    });
    mocks.createServerRequestDependencies.mockResolvedValue({});
    mocks.createRequestContainer.mockReturnValue({
      transaction: {
        service: {
          convert: mocks.convert,
          createNormal: mocks.createNormal,
          createTransfer: mocks.createTransfer,
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
    expect(mocks.revalidateTransactionMutation).toHaveBeenCalledOnce();
  });

  it("更新普通交易成功后刷新缓存并跳转", async () => {
    await expect(updateTransaction({}, createNormalFormData())).rejects.toThrow(
      "NEXT_REDIRECT:/transactions?month=2026-06&result=updated",
    );

    expect(mocks.updateNormal).toHaveBeenCalledWith(
      expect.objectContaining({
        accountId,
        ledgerId,
        transactionRecordId,
        type: "expense",
      }),
    );
    expect(mocks.revalidateTransactionMutation).toHaveBeenCalledOnce();
  });

  it("Service 返回应用错误时留在当前页面且不刷新缓存", async () => {
    mocks.updateNormal.mockRejectedValueOnce(
      new ValidationError("account_invalid", "账户信息不正确。"),
    );

    await expect(
      updateTransaction({}, createNormalFormData()),
    ).resolves.toEqual({ error: "账户信息不正确。" });

    expect(mocks.revalidateTransactionMutation).not.toHaveBeenCalled();
    expect(mocks.redirect).not.toHaveBeenCalled();
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

    expect(mocks.void).toHaveBeenCalledWith({ ledgerId, transactionRecordId });
    expect(mocks.revalidateTransactionMutation).toHaveBeenCalledOnce();
  });

  it("编辑类型非法时不读取上下文也不调用 Service", async () => {
    const formData = createNormalFormData({
      sourceType: "invalid",
      type: "expense",
    });

    await expect(saveEditTransaction({}, formData)).resolves.toEqual({
      error: "交易类型指定不正确，请刷新页面后重试。",
    });

    expect(mocks.requireCurrentUserAndLedger).not.toHaveBeenCalled();
    expect(mocks.createRequestContainer).not.toHaveBeenCalled();
    expect(mocks.revalidateTransactionMutation).not.toHaveBeenCalled();
  });
});
