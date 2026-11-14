// @vitest-environment node
import { beforeEach, describe, expect, it, vi } from "vitest";
import {
  loadEditTransactionView,
  loadNewTransactionView,
  loadRefundPickerPage,
  loadReimbursementPickerPage,
  loadStep4TransactionGroupView,
  loadTransactionSearchPage,
} from "internal/transaction/adapter/next/loadTransactionViews";
const mocks = vi.hoisted(() => ({
  createRequestContainer: vi.fn(),
  createServerRequestDependencies: vi.fn(),
  getCurrentLedgerOrRedirect: vi.fn(),
  getEditEntryView: vi.fn(),
  getFrequentMerchants: vi.fn(),
  getLinkCandidatePage: vi.fn(),
  getGroupItems: vi.fn(),
  getGroupPage: vi.fn(),
  getGroupView: vi.fn(),
  getNewView: vi.fn(),
  logError: vi.fn(),
  logInfo: vi.fn(),
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
    mocks.createServerRequestDependencies.mockResolvedValue({
      logger: { error: mocks.logError, info: mocks.logInfo },
    });
    mocks.getFrequentMerchants.mockResolvedValue([]);
    mocks.createRequestContainer.mockReturnValue({
      transaction: {
        merchantEntryQueryService: {
          getFrequentMerchants: mocks.getFrequentMerchants,
        },
        service: {
          getLinkCandidatePage: mocks.getLinkCandidatePage,
          getGroupItems: mocks.getGroupItems,
          getGroupPage: mocks.getGroupPage,
          getGroupView: mocks.getGroupView,
          getNewView: mocks.getNewView,
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
  it("关联候选首屏和后续页直接调用扁平分页 Service", async () => {
    const page = { items: [], nextOffset: null };
    mocks.getLinkCandidatePage.mockResolvedValue(page);
    const merchantId = "00000000-0000-4000-8000-000000001001";
    await expect(
      loadRefundPickerPage({ merchantId, currency: "JPY", offset: 0 }),
    ).resolves.toEqual(page);
    await loadRefundPickerPage({ query: "7930", currency: "JPY", offset: 20 });
    await loadReimbursementPickerPage({
      merchantId,
      currency: "JPY",
      offset: 20,
    });
    expect(mocks.getLinkCandidatePage).toHaveBeenNthCalledWith(
      1,
      currentLedger,
      "refund",
      { merchantId, currency: "JPY", offset: 0 },
      expect.any(Function),
    );
    expect(mocks.getLinkCandidatePage).toHaveBeenNthCalledWith(
      2,
      currentLedger,
      "refund",
      { query: "7930", currency: "JPY", offset: 20, merchantId: undefined },
      expect.any(Function),
    );
    expect(mocks.getLinkCandidatePage).toHaveBeenNthCalledWith(
      3,
      currentLedger,
      "reimbursement",
      { merchantId: undefined, currency: "JPY", offset: 20 },
      expect.any(Function),
    );
    expect(mocks.getGroupView).not.toHaveBeenCalled();
    expect(mocks.getGroupItems).not.toHaveBeenCalled();
  });

  it("退款与报销候选只向服务端日志记录分段耗时和条数", async () => {
    const page = { items: [{ id: "example" }], nextOffset: null };
    mocks.getLinkCandidatePage.mockImplementation(
      async (
        _ledger: unknown,
        _kind: unknown,
        _input: unknown,
        onTiming: (stage: string, elapsedMs: number) => void,
      ) => {
        onTiming("readPermission", 2.8);
        onTiming("pageRpc", 38.6);
        onTiming("itemsPayments", 10.2);
        return page;
      },
    );

    await expect(
      loadReimbursementPickerPage({
        query: "私人搜索词",
        merchantId: "not-uuid",
      }),
    ).resolves.toEqual(page);

    expect(mocks.logInfo).toHaveBeenCalledWith(
      "[transaction] link candidate page timing",
      expect.objectContaining({
        kind: "reimbursement",
        itemCount: 1,
        readPermissionMs: 3,
        pageRpcMs: 39,
        itemsPaymentsMs: 10,
        contextMs: expect.any(Number),
        totalMs: expect.any(Number),
      }),
    );
    const details = mocks.logInfo.mock.calls[0]?.[1];
    expect(JSON.stringify(details)).not.toContain("私人搜索词");
    expect(JSON.stringify(details)).not.toContain("not-uuid");
  });

  it("普通搜索仍直接调用 Service，新建页面不预读关联候选", async () => {
    await loadTransactionSearchPage("7930", 20);
    expect(mocks.search).toHaveBeenCalledWith(currentLedger, "7930", 20);
    mocks.getNewView.mockResolvedValue({ form: "new" });
    await loadNewTransactionView();
    expect(mocks.getLinkCandidatePage).not.toHaveBeenCalled();
  });

  it("新建视图与页面数据并行加载常用商家", async () => {
    const frequentMerchants = [{ merchantId: "seven", recordCount: 3 }];
    mocks.getNewView.mockResolvedValue({ form: "new" });
    mocks.getFrequentMerchants.mockResolvedValue(frequentMerchants);

    await expect(loadNewTransactionView()).resolves.toMatchObject({
      form: "new",
      frequentMerchants,
    });
    expect(mocks.getFrequentMerchants).toHaveBeenCalledWith({
      ledgerId: currentLedger.id,
    });
  });

  it("常用商家获取失败时按空列表处理并记录错误日志", async () => {
    mocks.getNewView.mockResolvedValue({ form: "new" });
    mocks.getFrequentMerchants.mockRejectedValue(
      new TypeError("raw database message"),
    );

    await expect(loadNewTransactionView()).resolves.toMatchObject({
      form: "new",
      frequentMerchants: [],
    });
    expect(mocks.logError).toHaveBeenCalledWith(
      "[transaction] failed to load frequent merchants",
      { errorName: "TypeError" },
    );
  });
});
describe("Transaction 编辑 SSR 边界", () => {
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
    mocks.createServerRequestDependencies.mockResolvedValue({
      logger: { error: mocks.logError, info: mocks.logInfo },
    });
    mocks.getFrequentMerchants.mockResolvedValue([]);
    mocks.createRequestContainer.mockReturnValue({
      transaction: {
        merchantEntryQueryService: {
          getFrequentMerchants: mocks.getFrequentMerchants,
        },
        service: {
          getEditEntryView: mocks.getEditEntryView,
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
    mocks.getEditEntryView.mockResolvedValue(null);
    await expect(loadEditTransactionView(transactionRecordId)).rejects.toThrow(
      "NEXT_NOT_FOUND",
    );
    expect(mocks.getEditEntryView).toHaveBeenCalledWith(
      currentLedger,
      transactionRecordId,
    );
    expect(mocks.getGroupView).not.toHaveBeenCalled();
    expect(mocks.notFound).toHaveBeenCalledOnce();
  });

  it("启用特殊状态时编辑视图不预读退款与报销候选", async () => {
    const enabledLedger = {
      ...currentLedger,
      transactionItemSpecialStatusEnabled: true,
    };
    mocks.getCurrentLedgerOrRedirect.mockResolvedValue(enabledLedger);
    mocks.getEditEntryView.mockResolvedValue({ form: "edit" });

    await expect(loadEditTransactionView(transactionRecordId)).resolves.toEqual(
      { form: "edit", frequentMerchants: [] },
    );
    expect(mocks.getEditEntryView).toHaveBeenCalledWith(
      enabledLedger,
      transactionRecordId,
    );
    expect(mocks.getGroupView).not.toHaveBeenCalled();
  });

  it("编辑视图带常用商家，供小票换商家使用（#962）", async () => {
    const frequentMerchants = [{ merchantId: "seven", recordCount: 3 }];
    mocks.getEditEntryView.mockResolvedValue({ form: "edit" });
    mocks.getFrequentMerchants.mockResolvedValue(frequentMerchants);

    await expect(loadEditTransactionView(transactionRecordId)).resolves.toEqual(
      {
        form: "edit",
        frequentMerchants,
      },
    );
    expect(mocks.getFrequentMerchants).toHaveBeenCalledWith({
      ledgerId: currentLedger.id,
    });
  });
});
