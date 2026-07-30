// @vitest-environment node

import { beforeEach, describe, expect, it, vi } from "vitest";

import {
  loadStep4TransactionGroupView,
  loadTransactionSearchPage,
} from "internal/transaction/adapter/next/loadTransactionViews";

const mocks = vi.hoisted(() => ({
  createRequestContainer: vi.fn(),
  createServerRequestDependencies: vi.fn(),
  getCurrentLedgerOrRedirect: vi.fn(),
  getGroupView: vi.fn(),
  search: vi.fn(),
}));

vi.mock("internal/ledger/adapter/next/currentLedger", () => ({
  getCurrentLedgerOrRedirect: mocks.getCurrentLedgerOrRedirect,
}));
vi.mock("internal/container", () => ({
  createRequestContainer: mocks.createRequestContainer,
}));
vi.mock("internal/shared/context/createServerRequestDependencies", () => ({
  createServerRequestDependencies: mocks.createServerRequestDependencies,
}));

const currentLedger = {
  baseCurrency: "JPY",
  currentUserRole: "member" as const,
  id: "00000000-0000-4000-8000-000000000032",
  name: "家庭账本",
};

describe("Transaction SSR adapter", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.getCurrentLedgerOrRedirect.mockResolvedValue(currentLedger);
    mocks.createServerRequestDependencies.mockResolvedValue({});
    mocks.createRequestContainer.mockReturnValue({
      transaction: {
        service: {
          getGroupView: mocks.getGroupView,
          search: mocks.search,
        },
      },
    });
  });

  it("SSR 分组读取直接调用 Service", async () => {
    mocks.getGroupView.mockResolvedValue({ groups: [] });
    await loadStep4TransactionGroupView("month");
    expect(mocks.getGroupView).toHaveBeenCalledWith(currentLedger, "month", {
      recordType: "all",
    });
  });

  it("搜索读取不请求自身 API", async () => {
    const fetchMock = vi.fn();
    vi.stubGlobal("fetch", fetchMock);
    mocks.search.mockResolvedValue({
      items: [],
      nextOffset: null,
      totalCount: 0,
    });
    await loadTransactionSearchPage("咖啡", 20);
    expect(mocks.search).toHaveBeenCalledWith(currentLedger, "咖啡", 20);
    expect(fetchMock).not.toHaveBeenCalled();
    vi.unstubAllGlobals();
  });
});
