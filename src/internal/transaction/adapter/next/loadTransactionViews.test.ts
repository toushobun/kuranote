// @vitest-environment node
import { beforeEach, describe, expect, it, vi } from "vitest";
import {
  loadStep4TransactionGroupView,
  loadTransactionSearchPage,
  loadEditTransactionView,
} from "internal/transaction/adapter/next/loadTransactionViews";
const mocks = vi.hoisted(() => ({
  createRequestContainer: vi.fn(),
  createServerRequestDependencies: vi.fn(),
  getCurrentLedgerOrRedirect: vi.fn(),
  getEditView: vi.fn(),
  getGroupView: vi.fn(),
  notFound: vi.fn(() => {
    throw new Error("NEXT_NOT_FOUND");
  }),
  search: vi.fn(),
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
describe("Transaction SSR adapter", () => {
  const currentLedger = {
    baseCurrency: "JPY",
    currentUserRole: "member" as const,
    id: "00000000-0000-4000-8000-000000000032",
    name: "家庭账本",
  };
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
describe("Transaction \u7F16\u8F91 SSR \u8FB9\u754C", () => {
  const transactionRecordId = "00000000-0000-4000-8000-000000009999";
  const currentLedger = {
    baseCurrency: "JPY",
    currentUserRole: "member" as const,
    id: "00000000-0000-4000-8000-000000000032",
    name: "家庭账本",
  };
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.getCurrentLedgerOrRedirect.mockResolvedValue(currentLedger);
    mocks.createServerRequestDependencies.mockResolvedValue({});
    mocks.createRequestContainer.mockReturnValue({
      transaction: {
        service: {
          getEditView: mocks.getEditView,
          getGroupView: mocks.getGroupView,
        },
      },
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
