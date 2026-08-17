import type { ReactElement } from "react";
import { beforeEach, describe, expect, it, vi } from "vitest";

const transactionRecordId = "00000000-0000-4000-8000-000000009001";

const mocks = vi.hoisted(() => ({
  EditTransactionTemplate: vi.fn(() => null),
  EditTransferTransactionTemplate: vi.fn(() => null),
  getEditTransactionErrorMessage: vi.fn((error?: string) =>
    error ? `编辑错误:${error}` : null,
  ),
  loadEditTransactionView: vi.fn(),
  loadRefundPickerGroupItems: vi.fn(),
  loadRefundPickerGroupPage: vi.fn(),
  loadRefundPickerSearchPage: vi.fn(),
  loadReimbursementPickerGroupItems: vi.fn(),
  loadReimbursementPickerGroupPage: vi.fn(),
  loadReimbursementPickerSearchPage: vi.fn(),
  NewTransactionVisualFrame: vi.fn(() => null),
  TransactionPermissionDenied: vi.fn(() => null),
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

vi.mock("templates/transactions/TransactionFormPage", () => ({
  EditTransactionTemplate: mocks.EditTransactionTemplate,
  EditTransferTransactionTemplate: mocks.EditTransferTransactionTemplate,
  TransactionPermissionDenied: mocks.TransactionPermissionDenied,
}));

vi.mock("utils/pageErrors", () => ({
  getEditTransactionErrorMessage: mocks.getEditTransactionErrorMessage,
}));

vi.mock("templates/transactions/NewTransactionVisualFrame", () => ({
  NewTransactionVisualFrame: mocks.NewTransactionVisualFrame,
}));

import TransactionEditPage from "./page";

function createEditView() {
  return {
    accountOptions: [],
    categoryOptions: [],
    initialValues: {
      accountId: "00000000-0000-4000-8000-000000000041",
      items: [
        {
          amount: "1200",
          categoryId: "00000000-0000-4000-8000-000000005072",
        },
      ],
      merchantId: "00000000-0000-4000-8000-000000001001",
      note: "晚餐",
      transactionAt: "2026-06-04T10:30:05.000Z",
      transactionRecordId,
      type: "expense" as const,
    },
    ledgerName: "家庭账本",
    merchantOptions: [],
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

describe("TransactionEditPage", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("无修改权限时在当前页面显示权限提示", async () => {
    mocks.loadEditTransactionView.mockResolvedValue({
      ...createEditView(),
      canEdit: false,
    });

    const result = await TransactionEditPage({
      params: Promise.resolve({ transactionRecordId }),
    });
    const element = result as ReactElement<Record<string, unknown>>;
    const child = element.props.children as ReactElement<
      Record<string, unknown>
    >;

    expect(child.type).toBe(mocks.TransactionPermissionDenied);
    expect(child.props).toMatchObject({ operation: "edit" });
  });

  it("使用 URL 参数中的 transactionRecordId 显示编辑画面", async () => {
    const view = createEditView();
    mocks.loadEditTransactionView.mockResolvedValue(view);

    const result = await TransactionEditPage({
      params: Promise.resolve({ transactionRecordId }),
    });
    const element = result as ReactElement<Record<string, unknown>>;
    const provider = element.props.children as ReactElement<
      Record<string, unknown>
    >;
    const child = provider.props.children as ReactElement<
      Record<string, unknown>
    >;

    expect(mocks.loadEditTransactionView).toHaveBeenCalledWith(
      transactionRecordId,
    );
    expect(mocks.getEditTransactionErrorMessage).not.toHaveBeenCalled();
    expect(element.type).toBe(mocks.NewTransactionVisualFrame);
    expect(child.type).toBe(mocks.EditTransactionTemplate);
    expect(child.props).toMatchObject({
      ...view,
      action: mocks.saveEditTransaction,
      deleteAction: mocks.voidTransaction,
      errorMessage: null,
    });
    expect(child.props).not.toHaveProperty("reimbursementCandidates");
    expect(child.props).not.toHaveProperty("refundPickerView");
  });

  it("没有 error 参数时正常显示编辑画面", async () => {
    const view = createEditView();
    mocks.loadEditTransactionView.mockResolvedValue(view);

    const result = await TransactionEditPage({
      params: Promise.resolve({ transactionRecordId }),
    });
    const element = result as ReactElement<Record<string, unknown>>;
    const provider = element.props.children as ReactElement<
      Record<string, unknown>
    >;
    const child = provider.props.children as ReactElement<
      Record<string, unknown>
    >;

    expect(mocks.loadEditTransactionView).toHaveBeenCalledWith(
      transactionRecordId,
    );
    expect(mocks.getEditTransactionErrorMessage).not.toHaveBeenCalled();
    expect(element.type).toBe(mocks.NewTransactionVisualFrame);
    expect(child.type).toBe(mocks.EditTransactionTemplate);
    expect(child.props).toMatchObject({
      ...view,
      action: mocks.saveEditTransaction,
      deleteAction: mocks.voidTransaction,
      errorMessage: null,
    });
  });

  it("转账类型编辑页向转账模板传递删除动作", async () => {
    const view = createTransferEditView();
    mocks.loadEditTransactionView.mockResolvedValue(view);

    const result = await TransactionEditPage({
      params: Promise.resolve({ transactionRecordId }),
    });
    const element = result as ReactElement<Record<string, unknown>>;
    const provider = element.props.children as ReactElement<
      Record<string, unknown>
    >;
    const child = provider.props.children as ReactElement<
      Record<string, unknown>
    >;

    expect(element.type).toBe(mocks.NewTransactionVisualFrame);
    expect(child.type).toBe(mocks.EditTransferTransactionTemplate);
    expect(child.props).toMatchObject({
      ...view,
      action: mocks.saveEditTransaction,
      deleteAction: mocks.voidTransaction,
      errorMessage: null,
    });
  });
});
