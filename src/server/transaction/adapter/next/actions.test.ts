// @vitest-environment node

import { beforeEach, describe, expect, it, vi } from "vitest";

import { createTransaction } from "server/transaction/adapter/next/actions";

const mocks = vi.hoisted(() => ({
  createNormal: vi.fn(),
  createRequestContainer: vi.fn(),
  createServerRequestDependencies: vi.fn(),
  redirect: vi.fn((path: string) => {
    throw new Error(`NEXT_REDIRECT:${path}`);
  }),
  requireCurrentUserAndLedger: vi.fn(),
  revalidateTransactionMutation: vi.fn(),
}));

vi.mock("next/navigation", () => ({ redirect: mocks.redirect }));
vi.mock("server/container", () => ({
  createRequestContainer: mocks.createRequestContainer,
}));
vi.mock("server/context/currentLedger", () => ({
  requireCurrentUserAndLedger: mocks.requireCurrentUserAndLedger,
}));
vi.mock("server/shared/context/createServerRequestDependencies", () => ({
  createServerRequestDependencies: mocks.createServerRequestDependencies,
}));
vi.mock("server/transaction/adapter/next/revalidate", () => ({
  revalidateTransactionMutation: mocks.revalidateTransactionMutation,
}));

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

describe("Transaction Actions", () => {
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
      transaction: { service: { createNormal: mocks.createNormal } },
    });
  });

  it("校验失败在当前页面返回错误状态", async () => {
    const state = await createTransaction({}, createFormData("-1"));
    expect(state.error).toBeTruthy();
    expect(state.errorKey).toBeTruthy();
    expect(mocks.createNormal).not.toHaveBeenCalled();
    expect(mocks.redirect).not.toHaveBeenCalled();
  });

  it("忽略客户端伪造账本并在成功后刷新缓存", async () => {
    await expect(createTransaction({}, createFormData())).rejects.toThrow(
      "NEXT_REDIRECT:/transactions?month=2026-06&result=created",
    );
    expect(mocks.createNormal).toHaveBeenCalledWith(
      expect.objectContaining({ ledgerId }),
    );
    expect(mocks.revalidateTransactionMutation).toHaveBeenCalledOnce();
  });
});
