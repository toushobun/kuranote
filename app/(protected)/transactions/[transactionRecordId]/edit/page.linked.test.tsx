import type { ReactElement } from "react";
import { beforeEach, describe, expect, it, vi } from "vitest";

const transactionRecordId = "00000000-0000-4000-8000-000000009001";

const mocks = vi.hoisted(() => ({
  EditTransactionTemplate: vi.fn(() => null),
  EditTransferTransactionTemplate: vi.fn(() => null),
  loadEditTransactionView: vi.fn(),
  NewTransactionVisualFrame: vi.fn(() => null),
  TransactionPermissionDenied: vi.fn(() => null),
}));

vi.mock("internal/transaction/adapter/next/actions", () => ({
  saveEditTransaction: vi.fn(),
  voidTransaction: vi.fn(),
}));

vi.mock("internal/transaction/adapter/next/loadTransactionViews", () => ({
  loadEditTransactionView: mocks.loadEditTransactionView,
}));

vi.mock("templates/transactions/TransactionFormPage", () => ({
  EditTransactionTemplate: mocks.EditTransactionTemplate,
  EditTransferTransactionTemplate: mocks.EditTransferTransactionTemplate,
  TransactionPermissionDenied: mocks.TransactionPermissionDenied,
}));

vi.mock("templates/transactions/NewTransactionVisualFrame", () => ({
  NewTransactionVisualFrame: mocks.NewTransactionVisualFrame,
}));

import TransactionEditPage from "./page";

describe("TransactionEditPage linked restriction", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("关联报销或退款的交易不渲染编辑表单和保存动作", async () => {
    mocks.loadEditTransactionView.mockResolvedValue({
      accountOptions: [],
      canEdit: false,
      categoryOptions: [],
      editRestriction: "linked",
      initialValues: {
        accountId: "00000000-0000-4000-8000-000000000041",
        items: [],
        merchantId: "",
        note: "",
        transactionAt: "2026-08-03T01:00:00.000Z",
        transactionRecordId,
        type: "expense",
      },
      ledgerName: "家庭账本",
      merchantOptions: [],
      transactionItemSpecialStatusEnabled: true,
    });

    const result = await TransactionEditPage({
      params: Promise.resolve({ transactionRecordId }),
    });
    const frame = result as ReactElement<Record<string, unknown>>;
    const child = frame.props.children as ReactElement<
      Record<string, unknown>
    >;

    expect(child.type).toBe(mocks.TransactionPermissionDenied);
    expect(child.props).toEqual({ operation: "edit", reason: "linked" });
    expect(mocks.EditTransactionTemplate).not.toHaveBeenCalled();
    expect(mocks.EditTransferTransactionTemplate).not.toHaveBeenCalled();
  });
});
