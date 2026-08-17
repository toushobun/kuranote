// @vitest-environment node
import { beforeEach, describe, expect, it, vi } from "vitest";
import {
  loadEditTransactionView,
  loadNewTransactionView,
  loadRefundPickerSearchPage,
  loadReimbursementPickerGroupItems,
  loadReimbursementPickerGroupPage,
  loadReimbursementPickerSearchPage,
  loadStep4TransactionGroupView,
  loadTransactionSearchPage,
} from "internal/transaction/adapter/next/loadTransactionViews";
const mocks = vi.hoisted(() => ({
  createRequestContainer: vi.fn(),
  createServerRequestDependencies: vi.fn(),
  getCurrentLedgerOrRedirect: vi.fn(),
  getEditView: vi.fn(),
  getGroupItems: vi.fn(),
  getGroupPage: vi.fn(),
  getGroupView: vi.fn(),
  getNewView: vi.fn(),
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
  it("普通、退款与报销搜索入口都用纯数字关键词直接调用 Service", async () => {
    const fetchMock = vi.fn();
    vi.stubGlobal("fetch", fetchMock);
    mocks.search.mockResolvedValue({
      items: [],
      nextOffset: null,
      totalCount: 0,
    });
    await loadTransactionSearchPage("7930", 20);
    await loadRefundPickerSearchPage("7930", 0);
    await loadReimbursementPickerSearchPage("7930", 10);
    expect(mocks.search).toHaveBeenNthCalledWith(1, currentLedger, "7930", 20);
    expect(mocks.search).toHaveBeenNthCalledWith(2, currentLedger, "7930", 0, {
      recordType: "refundableExpense",
    });
    expect(mocks.search).toHaveBeenNthCalledWith(3, currentLedger, "7930", 10, {
      recordType: "refundableExpense",
      specialStatuses: ["pendingReimbursement"],
    });
    expect(fetchMock).not.toHaveBeenCalled();
    vi.unstubAllGlobals();
  });

  it("报销 Picker 分组分页与分组明细固定使用待报销筛选", async () => {
    mocks.getGroupPage.mockResolvedValue({ groups: [], nextOffset: null });
    mocks.getGroupItems.mockResolvedValue({ items: [], nextOffset: null });

    await loadReimbursementPickerGroupPage(20);
    await loadReimbursementPickerGroupItems("2026-08", 40);

    const reimbursementFilters = {
      recordType: "refundableExpense",
      specialStatuses: ["pendingReimbursement"],
    };
    expect(mocks.getGroupPage).toHaveBeenCalledWith(
      currentLedger,
      "month",
      20,
      reimbursementFilters,
    );
    expect(mocks.getGroupItems).toHaveBeenCalledWith(
      currentLedger,
      "month",
      "2026-08",
      40,
      reimbursementFilters,
    );
  });

  it("启用特殊状态时新建视图分别加载退款与报销 Picker", async () => {
    const enabledLedger = {
      ...currentLedger,
      transactionItemSpecialStatusEnabled: true,
    };
    const refundPickerView = { groups: [{ key: "refund" }] };
    const reimbursementPickerView = { groups: [{ key: "reimbursement" }] };
    mocks.getCurrentLedgerOrRedirect.mockResolvedValue(enabledLedger);
    mocks.getNewView.mockResolvedValue({ form: "new" });
    mocks.getGroupView
      .mockResolvedValueOnce(refundPickerView)
      .mockResolvedValueOnce(reimbursementPickerView);

    await expect(loadNewTransactionView()).resolves.toEqual({
      form: "new",
      refundPickerView,
      reimbursementPickerView,
    });
    expect(mocks.getNewView).toHaveBeenCalledWith(enabledLedger);
    expect(mocks.getGroupView).toHaveBeenNthCalledWith(
      1,
      enabledLedger,
      "month",
      { recordType: "refundableExpense" },
    );
    expect(mocks.getGroupView).toHaveBeenNthCalledWith(
      2,
      enabledLedger,
      "month",
      {
        recordType: "refundableExpense",
        specialStatuses: ["pendingReimbursement"],
      },
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
    expect(mocks.getGroupView).not.toHaveBeenCalled();
    expect(mocks.notFound).toHaveBeenCalledOnce();
  });

  it("启用特殊状态时编辑视图分别加载退款与报销 Picker", async () => {
    const enabledLedger = {
      ...currentLedger,
      transactionItemSpecialStatusEnabled: true,
    };
    const refundPickerView = { groups: [{ key: "refund" }] };
    const reimbursementPickerView = { groups: [{ key: "reimbursement" }] };
    mocks.getCurrentLedgerOrRedirect.mockResolvedValue(enabledLedger);
    mocks.getEditView.mockResolvedValue({ form: "edit" });
    mocks.getGroupView
      .mockResolvedValueOnce(refundPickerView)
      .mockResolvedValueOnce(reimbursementPickerView);

    await expect(loadEditTransactionView(transactionRecordId)).resolves.toEqual({
      form: "edit",
      refundPickerView,
      reimbursementPickerView,
    });
    expect(mocks.getEditView).toHaveBeenCalledWith(
      enabledLedger,
      transactionRecordId,
    );
    expect(mocks.getGroupView).toHaveBeenNthCalledWith(
      1,
      enabledLedger,
      "month",
      { recordType: "refundableExpense" },
    );
    expect(mocks.getGroupView).toHaveBeenNthCalledWith(
      2,
      enabledLedger,
      "month",
      {
        recordType: "refundableExpense",
        specialStatuses: ["pendingReimbursement"],
      },
    );
  });
});
