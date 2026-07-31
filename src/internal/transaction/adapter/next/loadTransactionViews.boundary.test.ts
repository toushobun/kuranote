// @vitest-environment node

import { beforeEach, describe, expect, it, vi } from "vitest";

import { loadEditTransactionView } from "internal/transaction/adapter/next/loadTransactionViews";

const mocks = vi.hoisted(() => ({
  createRequestContainer: vi.fn(),
  createServerRequestDependencies: vi.fn(),
  getCurrentLedgerOrRedirect: vi.fn(),
  getEditView: vi.fn(),
  notFound: vi.fn(() => {
    throw new Error("NEXT_NOT_FOUND");
  }),
}));

vi.mock("next/navigation", () => ({ notFound: mocks.notFound }));
vi.mock("internal/ledger/adapter/next/currentLedger", () => ({
  getCurrentLedgerOrRedirect: mocks.getCurrentLedgerOrRedirect,
}));
vi.mock("internal/container", () => ({
  createRequestContainer: mocks.createRequestContainer,
}));
vi.mock("internal/shared/context/createServerRequestDependencies", () => ({
  createServerRequestDependencies: mocks.createServerRequestDependencies,
}));

const transactionRecordId = "00000000-0000-4000-8000-000000009999";
const currentLedger = {
  baseCurrency: "JPY",
  currentUserRole: "member" as const,
  id: "00000000-0000-4000-8000-000000000032",
  name: "家庭账本",
};

describe("Transaction 编辑 SSR 边界", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.getCurrentLedgerOrRedirect.mockResolvedValue(currentLedger);
    mocks.createServerRequestDependencies.mockResolvedValue({});
    mocks.createRequestContainer.mockReturnValue({
      transaction: { service: { getEditView: mocks.getEditView } },
    });
  });

  it("交易 ID 不是 UUID 时直接 notFound", async () => {
    await expect(loadEditTransactionView("invalid-id")).rejects.toThrow(
      "NEXT_NOT_FOUND",
    );

    expect(mocks.notFound).toHaveBeenCalledOnce();
    expect(mocks.getCurrentLedgerOrRedirect).not.toHaveBeenCalled();
    expect(mocks.createServerRequestDependencies).not.toHaveBeenCalled();
  });

  it("Service 查不到当前账本内交易时 notFound", async () => {
    mocks.getEditView.mockResolvedValue(null);

    await expect(loadEditTransactionView(transactionRecordId)).rejects.toThrow(
      "NEXT_NOT_FOUND",
    );

    expect(mocks.getEditView).toHaveBeenCalledWith(
      currentLedger,
      transactionRecordId,
    );
    expect(mocks.notFound).toHaveBeenCalledOnce();
  });
});
