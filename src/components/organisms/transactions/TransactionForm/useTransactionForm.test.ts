import { act, renderHook, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

import type {
  TransactionAccountOption,
  TransactionCategoryOption,
  TransactionMerchantOption,
  TransactionRefundCandidate,
} from "types/transactions";

import { useTransactionForm } from "./useTransactionForm";

const mocks = vi.hoisted(() => ({ markEditDirty: vi.fn() }));

vi.mock(
  "organisms/transactions/EditTransactionDirtyContext/EditTransactionDirtyContext",
  () => ({ useEditTransactionDirty: () => mocks.markEditDirty }),
);

const accountOptions: TransactionAccountOption[] = [
  { currency: "JPY", id: "account-1", name: "现金" },
  { currency: "JPY", id: "account-2", name: "银行卡" },
];
const categoryOptions: TransactionCategoryOption[] = [
  {
    id: "expense-parent",
    name: "餐饮",
    parentId: null,
    parentName: null,
    type: "expense",
  },
  {
    id: "expense-child",
    name: "午餐",
    parentId: "expense-parent",
    parentName: "餐饮",
    type: "expense",
  },
  {
    id: "income-category",
    name: "工资",
    parentId: null,
    parentName: null,
    type: "income",
  },
];
const merchantOptions: TransactionMerchantOption[] = [
  { icon_url: null, id: "merchant-1", name: "便利店" },
];

const refundCandidate: TransactionRefundCandidate = {
  accountCurrency: "JPY",
  accountId: "account-1",
  amount: "1200",
  categoryName: "午餐",
  id: "refund-item-1",
  parentCategoryName: "餐饮",
  refundedAmount: "0",
  remainingRefundableAmount: "1200",
  transactionAt: "2026-07-20T01:30:00.000Z",
  transactionRecordId: "refund-record-1",
};

function renderTransactionFormHook(
  overrides: Partial<Parameters<typeof useTransactionForm>[0]> = {},
) {
  return renderHook(() =>
    useTransactionForm({
      accountOptions,
      categoryOptions,
      merchantOptions,
      ...overrides,
    }),
  );
}

function createInitialValues() {
  return {
    accountId: "account-1",
    items: [{ amount: "1200", categoryId: "income-category" }],
    merchantId: "merchant-1",
    note: "",
    transactionAt: "2026-07-20T01:30:00.000Z",
    type: "income" as const,
  };
}

describe("useTransactionForm", () => {
  beforeEach(() => vi.clearAllMocks());

  it("按分类类型初始化明细并计算收支净额", async () => {
    const { result } = renderTransactionFormHook({
      initialValues: {
        accountId: "account-1",
        items: [
          { amount: "1200", categoryId: "expense-child" },
          { amount: "500", categoryId: "income-category" },
        ],
        merchantId: "merchant-1",
        note: "混合收支",
        transactionAt: "2026-07-20T01:30:00.000Z",
        type: "expense",
      },
    });

    await waitFor(() => expect(result.current.transactionDate).not.toBe(""));
    expect(result.current.itemSummaries).toHaveLength(2);
    expect(
      result.current.itemSummaries.map((item) => item.category?.type),
    ).toEqual(["expense", "income"]);
    expect(result.current.signedTotalAmount).toBe("-700");
    expect(result.current.selectedAccount?.name).toBe("现金");
    expect(result.current.selectedMerchant?.name).toBe("便利店");
  });

  it("退款报销后的表单合计使用业务净额并保留原始合计", () => {
    const { result } = renderTransactionFormHook({
      initialValues: {
        accountId: "account-1",
        items: [
          {
            amount: "500",
            businessNetAmount: "300",
            categoryId: "expense-child",
          },
        ],
        merchantId: "merchant-1",
        note: "部分退款",
        transactionAt: "2026-07-20T01:30:00.000Z",
        type: "expense",
      },
    });

    expect(result.current.signedTotalAmount).toBe("-500");
    expect(result.current.businessTotalAmount).toBe("-300");
  });

  it("普通既有交易修改金额时不保留等额业务净额", () => {
    const { result } = renderTransactionFormHook({
      initialValues: {
        accountId: "account-1",
        items: [
          {
            amount: "500",
            businessNetAmount: "500",
            categoryId: "expense-child",
          },
        ],
        merchantId: "merchant-1",
        note: "普通支出",
        transactionAt: "2026-07-20T01:30:00.000Z",
        type: "expense",
      },
    });

    act(() => result.current.updateItem(1, { amount: "600" }));

    expect(result.current.itemSummaries[0]).toMatchObject({ amount: "600" });
    expect(result.current.itemSummaries[0]?.businessNetAmount).toBeUndefined();
    expect(result.current.businessTotalAmount).toBeNull();
  });

  it("明细选择器先返回校验错误，再追加有效明细", () => {
    const { result } = renderTransactionFormHook();

    act(() => result.current.openSheet());
    act(() => {
      expect(result.current.handlePickerAdd()).toBe(false);
    });
    expect(result.current.pickerErrors).toEqual({
      amount: expect.any(String),
      category: expect.any(String),
    });

    act(() => {
      result.current.handlePickerCategoryToggle("expense-child");
      result.current.handlePickerAmountChange("1200");
    });
    act(() => {
      expect(result.current.handlePickerAdd()).toBe(true);
    });

    expect(result.current.itemSummaries).toHaveLength(1);
    expect(result.current.itemSummaries[0]).toMatchObject({
      amount: "1200",
      categoryId: "expense-child",
    });
    expect(result.current.signedTotalAmount).toBe("-1200");
    expect(mocks.markEditDirty).toHaveBeenCalled();
  });

  it("提交缺少必填业务字段的表单时阻止提交并返回字段错误", async () => {
    const { result } = renderTransactionFormHook();
    const preventDefault = vi.fn();

    await waitFor(() => expect(result.current.transactionAtValue).not.toBe(""));
    act(() =>
      result.current.handleSubmit({
        preventDefault,
      } as unknown as Parameters<typeof result.current.handleSubmit>[0]),
    );

    expect(preventDefault).toHaveBeenCalledOnce();
    expect(result.current.fieldErrors).toMatchObject({
      account: expect.any(String),
      items: expect.any(String),
      merchant: expect.any(String),
    });
  });

  it("报销和退款候选保持互斥，后选项清空先选项", () => {
    const { result } = renderTransactionFormHook({
      initialValues: createInitialValues(),
    });

    act(() => result.current.setPickerReimbursementItemIds(["item-1"]));
    expect(result.current.pickerReimbursementItemIds).toEqual(["item-1"]);

    act(() => result.current.setPickerRefundCandidates([refundCandidate]));
    expect(result.current.pickerRefundCandidates).toEqual([refundCandidate]);
    expect(result.current.pickerReimbursementItemIds).toEqual([]);

    act(() => result.current.setPickerReimbursementItemIds(["item-2"]));
    expect(result.current.pickerRefundCandidates).toEqual([]);
    expect(result.current.pickerReimbursementItemIds).toEqual(["item-2"]);
  });

  it("首次选择跨账户退款候选时立即拒绝并提示重新选择", () => {
    const { result } = renderTransactionFormHook({
      initialValues: createInitialValues(),
    });

    act(() =>
      result.current.setPickerRefundCandidates([
        {
          ...refundCandidate,
          accountId: "account-2",
        },
      ]),
    );

    expect(result.current.pickerRefundCandidates).toEqual([]);
    expect(result.current.linkNotice).toContain("账户一致");
  });

  it("切换收款账户后清空不匹配的退款候选", () => {
    const { result } = renderTransactionFormHook({
      initialValues: createInitialValues(),
    });

    act(() => result.current.setPickerRefundCandidates([refundCandidate]));
    expect(result.current.pickerRefundCandidates).toEqual([refundCandidate]);

    act(() => result.current.handleAccountChange("account-2"));

    expect(result.current.selectedAccountId).toBe("account-2");
    expect(result.current.pickerRefundCandidates).toEqual([]);
    expect(result.current.linkNotice).toContain("账户已变更");
  });

  it("退款收入因账户变化解除关联时清理业务净额", () => {
    const { result } = renderTransactionFormHook({
      initialValues: {
        ...createInitialValues(),
        items: [
          {
            amount: "200",
            businessNetAmount: "0",
            businessStatus: "refund",
            categoryId: "income-category",
            refundCandidates: [refundCandidate],
          },
        ],
      },
    });

    expect(result.current.businessTotalAmount).toBe("0");
    act(() => result.current.handleAccountChange("account-2"));

    expect(result.current.itemSummaries[0]).toMatchObject({
      amount: "200",
      businessStatus: null,
      refundCandidates: [],
    });
    expect(result.current.itemSummaries[0]?.businessNetAmount).toBeUndefined();
    expect(result.current.businessTotalAmount).toBeNull();
  });
});
