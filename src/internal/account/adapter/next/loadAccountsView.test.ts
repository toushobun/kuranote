// @vitest-environment node

import { beforeEach, describe, expect, it, vi } from "vitest";

import { loadAccountsView } from "internal/account/adapter/next/loadAccountsView";

const mocks = vi.hoisted(() => ({
  createRequestContainer: vi.fn(),
  createServerRequestDependencies: vi.fn(),
  getCurrentLedgerContext: vi.fn(),
  getView: vi.fn(),
  redirect: vi.fn((path: string) => {
    throw new Error(`NEXT_REDIRECT:${path}`);
  }),
}));

vi.mock("next/navigation", () => ({ redirect: mocks.redirect }));
vi.mock("lib/ledger/current-ledger", () => ({
  getCurrentLedgerContext: mocks.getCurrentLedgerContext,
}));
vi.mock("internal/shared/context/createServerRequestDependencies", () => ({
  createServerRequestDependencies: mocks.createServerRequestDependencies,
}));
vi.mock("internal/container", () => ({
  createRequestContainer: mocks.createRequestContainer,
}));

const ledgerId = "00000000-0000-4000-8000-000000000032";
const userId = "00000000-0000-4000-8000-000000000031";

describe("loadAccountsView", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.getCurrentLedgerContext.mockResolvedValue({
      currentLedger: {
        baseCurrency: "JPY",
        currentUserRole: "owner",
        id: ledgerId,
        name: "家庭账本",
      },
      userId,
    });
    mocks.createServerRequestDependencies.mockResolvedValue({});
    mocks.createRequestContainer.mockReturnValue({
      account: { service: { getView: mocks.getView } },
    });
  });

  it("SSR 直接复用 Account Service 且不请求内部 API", async () => {
    const view = {
      accounts: [],
      baseCurrency: "JPY",
      canManageAccounts: true,
      canWriteTransactions: true,
      holderOptions: [],
      ledgerName: "家庭账本",
    };
    mocks.getView.mockResolvedValue(view);
    const fetchSpy = vi.spyOn(globalThis, "fetch");

    await expect(loadAccountsView()).resolves.toEqual(view);

    expect(mocks.createServerRequestDependencies).toHaveBeenCalledTimes(1);
    expect(mocks.createRequestContainer).toHaveBeenCalledTimes(1);
    expect(mocks.getView).toHaveBeenCalledWith({ ledgerId, userId });
    expect(fetchSpy).not.toHaveBeenCalled();
    fetchSpy.mockRestore();
  });

  it("没有 current ledger 时由页面边界跳回 Dashboard", async () => {
    mocks.getCurrentLedgerContext.mockResolvedValue({
      currentLedger: null,
      userId,
    });

    await expect(loadAccountsView()).rejects.toThrow("NEXT_REDIRECT:/");
    expect(mocks.createServerRequestDependencies).not.toHaveBeenCalled();
    expect(mocks.getView).not.toHaveBeenCalled();
  });
});
