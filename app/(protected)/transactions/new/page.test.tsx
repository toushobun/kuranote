import type { ReactElement } from "react";
import { beforeEach, describe, expect, it, vi } from "vitest";

const transactionRecordId = "00000000-0000-4000-8000-000000009001";

const mocks = vi.hoisted(() => ({
  addMerchantPresets: vi.fn(),
  createTransaction: vi.fn(),
  loadMerchantPresets: vi.fn(),
  loadNewTransactionView: vi.fn(),
  loadRefundPickerGroupItems: vi.fn(),
  loadRefundPickerGroupPage: vi.fn(),
  loadRefundPickerSearchPage: vi.fn(),
  loadReimbursementPickerGroupItems: vi.fn(),
  loadReimbursementPickerGroupPage: vi.fn(),
  loadReimbursementPickerSearchPage: vi.fn(),
  NewTransactionStepFlow: vi.fn(() => null),
  TransactionPermissionDenied: vi.fn(() => null),
  NewTransactionVisualFrame: vi.fn(() => null),
  redirect: vi.fn((href: string) => {
    throw new Error(`NEXT_REDIRECT:${href}`);
  }),
}));

vi.mock("next/navigation", () => ({
  redirect: mocks.redirect,
}));

vi.mock("internal/transaction/adapter/next/actions", () => ({
  createTransaction: mocks.createTransaction,
}));

vi.mock("internal/merchant/adapter/next/actions", () => ({
  addMerchantPresets: mocks.addMerchantPresets,
  loadMerchantPresets: mocks.loadMerchantPresets,
}));

vi.mock("internal/transaction/adapter/next/loadTransactionViews", () => ({
  loadNewTransactionView: mocks.loadNewTransactionView,
  loadRefundPickerGroupItems: mocks.loadRefundPickerGroupItems,
  loadRefundPickerGroupPage: mocks.loadRefundPickerGroupPage,
  loadRefundPickerSearchPage: mocks.loadRefundPickerSearchPage,
  loadReimbursementPickerGroupItems: mocks.loadReimbursementPickerGroupItems,
  loadReimbursementPickerGroupPage: mocks.loadReimbursementPickerGroupPage,
  loadReimbursementPickerSearchPage: mocks.loadReimbursementPickerSearchPage,
}));

vi.mock("templates/transactions/TransactionFormPage", () => ({
  TransactionPermissionDenied: mocks.TransactionPermissionDenied,
}));

vi.mock("templates/transactions/NewTransactionStepFlow", () => ({
  NewTransactionStepFlow: mocks.NewTransactionStepFlow,
}));

vi.mock("templates/transactions/NewTransactionVisualFrame", () => ({
  NewTransactionVisualFrame: mocks.NewTransactionVisualFrame,
}));

vi.mock("../loadReceiptCreationView", () => ({
  loadReceiptCreationView: vi.fn(async () => null),
}));

import TransactionsNewPage from "./page";

const accountId = "00000000-0000-4000-8000-000000000101";
const merchantId = "00000000-0000-4000-8000-000000000201";
const merchantTag = {
  icon: "🛒",
  id: "tag-1",
  merchant_count: 1,
  name: "超市",
  sort_order: 0,
};
const baseView = {
  accountOptions: [
    {
      currency: "JPY",
      holders: [{ display_name: "我" }],
      id: accountId,
      name: "现金",
    },
  ],
  canWriteTransactions: true,
  categoryOptions: [],
  ledgerId: "ledger-1",
  ledgerName: "家庭账本",
  merchantOptions: [
    { icon_url: null, id: merchantId, name: "LIFE", tags: [merchantTag] },
  ],
  merchantTags: [merchantTag],
  multiAccountPaymentEnabled: true,
  refundPickerView: undefined,
  reimbursementPickerView: undefined,
  transactionItemSpecialStatusEnabled: false,
};

async function renderPage(params: Record<string, string> = {}) {
  const result = (await TransactionsNewPage({
    searchParams: Promise.resolve(params),
  })) as ReactElement<Record<string, unknown>>;
  const provider = result.props.children as ReactElement<
    Record<string, unknown>
  >;
  return {
    element: result,
    // 退款 / 报销 Provider → 小票新增 Provider → 记一笔。
    template: (
      provider.props.children as ReactElement<{ children: ReactElement }>
    ).props.children as ReactElement<Record<string, unknown>>,
  };
}

describe("TransactionsNewPage", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.loadNewTransactionView.mockResolvedValue(baseView);
  });

  it("带 editId 的旧 URL 会跳转到专用编辑路由", async () => {
    await expect(
      TransactionsNewPage({
        searchParams: Promise.resolve({ editId: transactionRecordId }),
      }),
    ).rejects.toThrow(
      `NEXT_REDIRECT:/transactions/${transactionRecordId}/edit`,
    );

    expect(mocks.loadNewTransactionView).not.toHaveBeenCalled();
  });

  it("只读成员访问新增页时在当前页面显示权限提示", async () => {
    mocks.loadNewTransactionView.mockResolvedValue({
      ...baseView,
      canWriteTransactions: false,
    });

    const result = (await TransactionsNewPage({
      searchParams: Promise.resolve({ method: "transfer" }),
    })) as ReactElement<Record<string, unknown>>;
    const child = result.props.children as ReactElement;

    expect(result.type).toBe(mocks.NewTransactionVisualFrame);
    expect(child.type).toBe(mocks.TransactionPermissionDenied);
  });

  it("默认显示从商家记账，传入持有人账户、商家分类与预设入口", async () => {
    const { element, template } = await renderPage();

    expect(element.type).toBe(mocks.NewTransactionVisualFrame);
    expect(template.type).toBe(mocks.NewTransactionStepFlow);
    expect(template.props).toMatchObject({
      accountOptions: baseView.accountOptions,
      action: mocks.createTransaction,
      addPresetsAction: mocks.addMerchantPresets,
      ledgerId: "ledger-1",
      loadPresetsAction: mocks.loadMerchantPresets,
      merchantOptions: baseView.merchantOptions,
      merchantTags: [merchantTag],
      multiAccountPaymentEnabled: true,
    });
  });

  it("用退款 / 报销选择器 Provider 包住新流程", async () => {
    const result = (await TransactionsNewPage({
      searchParams: Promise.resolve({}),
    })) as ReactElement<Record<string, unknown>>;
    const provider = result.props.children as ReactElement<{
      value: Record<string, unknown>;
    }>;

    expect(provider.props.value).toMatchObject({
      loadRefundGroupItemsAction: mocks.loadRefundPickerGroupItems,
      loadReimbursementSearchPageAction:
        mocks.loadReimbursementPickerSearchPage,
    });
  });

  it.each([
    [{ type: "expense" }, "merchant"],
    [{ type: "income" }, "merchant"],
    [{ type: "invalid" }, "merchant"],
    [{ type: "transfer" }, "transfer"],
    [{ method: "transfer" }, "transfer"],
    [{ method: "standard" }, "merchant"],
    [{ method: "standard", type: "income" }, "merchant"],
  ] as const)(
    "参数 %j 以 %s 打开记一笔（两种方式在浏览器端切换）",
    async (params, method) => {
      const { template } = await renderPage(params);

      expect(template.type).toBe(mocks.NewTransactionStepFlow);
      expect(template.props.initialMethod).toBe(method);
    },
  );
});
