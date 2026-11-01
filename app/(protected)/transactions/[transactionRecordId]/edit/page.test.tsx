import type { ReactElement } from "react";
import { beforeEach, describe, expect, it, vi } from "vitest";

const transactionRecordId = "00000000-0000-4000-8000-000000009001";

const mocks = vi.hoisted(() => ({
  EditTransactionReceiptTemplate: vi.fn(() => null),
  EditTransferTransactionTemplate: vi.fn(() => null),
  loadEditTransactionView: vi.fn(),
  loadRefundPickerGroupItems: vi.fn(),
  loadRefundPickerGroupPage: vi.fn(),
  loadRefundPickerSearchPage: vi.fn(),
  loadReimbursementPickerGroupItems: vi.fn(),
  loadReimbursementPickerGroupPage: vi.fn(),
  loadReimbursementPickerSearchPage: vi.fn(),
  NewTransactionVisualFrame: vi.fn(() => null),
  saveEditTransaction: vi.fn(),
  updateTransaction: vi.fn(),
  voidTransaction: vi.fn(),
}));

vi.mock("internal/transaction/adapter/next/actions", () => ({
  saveEditTransaction: mocks.saveEditTransaction,
  updateTransaction: mocks.updateTransaction,
  voidTransaction: mocks.voidTransaction,
}));

vi.mock("internal/transaction/adapter/next/loadTransactionViews", () => ({
  loadEditTransactionView: mocks.loadEditTransactionView,
  loadRefundPickerGroupItems: mocks.loadRefundPickerGroupItems,
  loadRefundPickerGroupPage: mocks.loadRefundPickerGroupPage,
  loadRefundPickerSearchPage: mocks.loadRefundPickerSearchPage,
  loadReimbursementPickerGroupItems: mocks.loadReimbursementPickerGroupItems,
  loadReimbursementPickerGroupPage: mocks.loadReimbursementPickerGroupPage,
  loadReimbursementPickerSearchPage: mocks.loadReimbursementPickerSearchPage,
}));

vi.mock("templates/transactions/EditTransactionReceipt", () => ({
  EditTransactionReceiptTemplate: mocks.EditTransactionReceiptTemplate,
}));

vi.mock("templates/transactions/TransactionFormPage", () => ({
  EditTransferTransactionTemplate: mocks.EditTransferTransactionTemplate,
}));

vi.mock("templates/transactions/NewTransactionVisualFrame", () => ({
  NewTransactionVisualFrame: mocks.NewTransactionVisualFrame,
}));

vi.mock("internal/transaction/adapter/next/loadReceiptCreationView", () => ({
  loadReceiptCreationView: vi.fn(async () => null),
}));

import TransactionEditPage from "./page";

function createEditView() {
  return {
    accountOptions: [],
    canDelete: true,
    categoryOptions: [],
    editRestriction: null,
    frequentMerchants: [],
    initialValues: {
      expectedRecordUpdatedAt: "2026-06-04T10:31:00.000Z",
      items: [
        {
          amount: "1200",
          categoryId: "00000000-0000-4000-8000-000000005072",
        },
      ],
      merchantId: "00000000-0000-4000-8000-000000001001",
      note: "晚餐",
      payments: [
        { accountId: "00000000-0000-4000-8000-000000000041", amount: null },
      ],
      transactionAt: "2026-06-04T10:30:05.000Z",
      transactionRecordId,
      type: "expense" as const,
    },
    ledgerId: "00000000-0000-4000-8000-000000000032",
    ledgerName: "家庭账本",
    merchantOptions: [],
    merchantTags: [],
    multiAccountPaymentEnabled: false,
    transactionItemSpecialStatusEnabled: false,
  };
}

function createTransferEditView() {
  return {
    ...createEditView(),
    initialValues: {
      accountId: "00000000-0000-4000-8000-000000000041",
      note: "账户间转账",
      transactionAt: "2026-06-04T10:30:05.000Z",
      transactionRecordId,
      transferAmount: "1200",
      transferTargetAccountId: "00000000-0000-4000-8000-000000000042",
      type: "transfer" as const,
    },
  };
}

// 页面外层是 NewTransactionVisualFrame；普通记录另包一层退款 / 报销选择器的 Provider。
async function renderTemplateElement() {
  const result = await TransactionEditPage({
    params: Promise.resolve({ transactionRecordId }),
  });
  const element = result as ReactElement<{ children: ReactElement }>;
  expect(element.type).toBe(mocks.NewTransactionVisualFrame);
  const child = element.props.children as ReactElement<Record<string, unknown>>;
  return child.type === mocks.EditTransferTransactionTemplate
    ? child
    : (
        child.props.children as ReactElement<{
          children: ReactElement<Record<string, unknown>>;
        }>
      ).props.children;
}

describe("TransactionEditPage", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it.each([
    ["普通记录", createEditView, mocks.EditTransactionReceiptTemplate],
    ["转账", createTransferEditView, mocks.EditTransferTransactionTemplate],
  ] as const)(
    "%s无修改权限时仍渲染模板并传入限制原因（只读详情）",
    async (_label, createView, template) => {
      mocks.loadEditTransactionView.mockResolvedValue({
        ...createView(),
        canDelete: false,
        editRestriction: "permission",
      });

      const child = await renderTemplateElement();

      expect(child.type).toBe(template);
      expect(child.props).toMatchObject({
        action: mocks.saveEditTransaction,
        canDelete: false,
        deleteAction: mocks.voidTransaction,
        editRestriction: "permission",
      });
    },
  );

  it("普通记录使用 URL 参数中的 transactionRecordId 显示小票编辑画面", async () => {
    const view = createEditView();
    mocks.loadEditTransactionView.mockResolvedValue(view);

    const child = await renderTemplateElement();

    expect(mocks.loadEditTransactionView).toHaveBeenCalledWith(
      transactionRecordId,
    );
    expect(child.type).toBe(mocks.EditTransactionReceiptTemplate);
    expect(child.props).toEqual({
      accountOptions: view.accountOptions,
      action: mocks.saveEditTransaction,
      canDelete: true,
      categoryOptions: view.categoryOptions,
      deleteAction: mocks.voidTransaction,
      editRestriction: null,
      frequentMerchants: view.frequentMerchants,
      initialValues: view.initialValues,
      ledgerId: view.ledgerId,
      merchantOptions: view.merchantOptions,
      merchantTags: view.merchantTags,
      multiAccountPaymentEnabled: false,
      transactionItemSpecialStatusEnabled: false,
    });
  });

  it("转账只传转账表单需要的数据，不再提供与收支互相转换的选项", async () => {
    const view = createTransferEditView();
    mocks.loadEditTransactionView.mockResolvedValue(view);

    const child = await renderTemplateElement();

    expect(child.type).toBe(mocks.EditTransferTransactionTemplate);
    expect(child.props).toEqual({
      accountOptions: view.accountOptions,
      action: mocks.saveEditTransaction,
      canDelete: true,
      deleteAction: mocks.voidTransaction,
      editRestriction: null,
      initialValues: view.initialValues,
    });
  });
});
