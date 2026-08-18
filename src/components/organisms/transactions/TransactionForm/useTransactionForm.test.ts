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
  { currency: "USD", id: "account-3", name: "美元账户" },
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
const reimbursementCandidate: TransactionRefundCandidate = {
  ...refundCandidate,
  accountId: "account-2",
  id: "reimbursement-item-1",
  remainingRefundableAmount: "1000",
  transactionRecordId: "reimbursement-record-1",
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

  it("新增部分核销退款收入时按单目标剩余额度计算业务净额", () => {
    const { result } = renderTransactionFormHook({ initialType: "income" });

    act(() => {
      result.current.handleAccountChange("account-1");
      result.current.openSheet();
      result.current.handlePickerCategoryToggle("income-category");
      result.current.handlePickerAmountChange("1500");
    });
    act(() =>
      result.current.setPickerRefundCandidate({
        ...refundCandidate,
        remainingRefundableAmount: "1000",
      }),
    );
    act(() => {
      expect(result.current.handlePickerAdd()).toBe(true);
    });

    expect(result.current.itemSummaries[0]).toMatchObject({
      amount: "1500",
      businessNetAmount: "500",
    });
    expect(result.current.signedTotalAmount).toBe("+1500");
    expect(result.current.businessTotalAmount).toBe("+500");
  });

  it.each([
    ["600", "0"],
    ["1000", "0"],
    ["1500", "500"],
  ])(
    "报销收入金额为 %s 时按剩余可核销额度计算业务净额",
    (incomeAmount, expectedBusinessNetAmount) => {
      const { result } = renderTransactionFormHook({ initialType: "income" });

      act(() => {
        result.current.handleAccountChange("account-1");
        result.current.openSheet();
        result.current.handlePickerCategoryToggle("income-category");
        result.current.handlePickerAmountChange(incomeAmount);
      });
      act(() =>
        result.current.setPickerReimbursementCandidate(reimbursementCandidate),
      );
      act(() => {
        expect(result.current.handlePickerAdd()).toBe(true);
      });

      expect(result.current.itemSummaries[0]).toMatchObject({
        amount: incomeAmount,
        businessNetAmount: expectedBusinessNetAmount,
      });
    },
  );

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

  it("行内修改部分退款支出金额时重新计算业务净额", () => {
    const { result } = renderTransactionFormHook({
      initialValues: {
        accountId: "account-1",
        items: [
          {
            amount: "500",
            businessNetAmount: "300",
            categoryId: "expense-child",
            refundedAmount: "200",
          },
        ],
        merchantId: "merchant-1",
        note: "部分退款",
        transactionAt: "2026-07-20T01:30:00.000Z",
        type: "expense",
      },
    });

    act(() => result.current.updateItem(1, { amount: "600" }));

    expect(result.current.itemSummaries[0]).toMatchObject({
      amount: "600",
      businessNetAmount: "400",
    });
    expect(result.current.businessTotalAmount).toBe("-400");
  });

  it("通过明细选择器保存部分退款支出时保留业务净额", () => {
    const { result } = renderTransactionFormHook({
      initialValues: {
        accountId: "account-1",
        items: [
          {
            amount: "500",
            businessNetAmount: "300",
            categoryId: "expense-child",
            refundedAmount: "200",
          },
        ],
        merchantId: "merchant-1",
        note: "部分退款",
        transactionAt: "2026-07-20T01:30:00.000Z",
        type: "expense",
      },
    });

    act(() => result.current.openItemSheet(1));
    act(() => {
      expect(result.current.handlePickerAdd()).toBe(true);
    });

    expect(result.current.itemSummaries[0]).toMatchObject({
      amount: "500",
      businessNetAmount: "300",
    });
    expect(result.current.businessTotalAmount).toBe("-300");
  });

  it("通过明细选择器保存已报销支出时保留零业务净额", () => {
    const { result } = renderTransactionFormHook({
      initialValues: {
        accountId: "account-1",
        items: [
          {
            amount: "500",
            businessNetAmount: "0",
            categoryId: "expense-child",
            specialStatus: "reimbursed",
          },
        ],
        merchantId: "merchant-1",
        note: "已报销",
        transactionAt: "2026-07-20T01:30:00.000Z",
        type: "expense",
      },
    });

    act(() => result.current.openItemSheet(1));
    act(() => {
      expect(result.current.handlePickerAdd()).toBe(true);
    });

    expect(result.current.itemSummaries[0]?.businessNetAmount).toBe("0");
    expect(result.current.businessTotalAmount).toBe("0");
  });

  it("通过明细选择器新增待报销支出时仍保留原始业务金额", () => {
    const { result } = renderTransactionFormHook();

    act(() => {
      result.current.openSheet();
      result.current.handlePickerCategoryToggle("expense-child");
      result.current.handlePickerAmountChange("500");
      result.current.setPickerSpecialStatus("pendingReimbursement");
    });
    act(() => {
      expect(result.current.handlePickerAdd()).toBe(true);
    });

    expect(result.current.itemSummaries[0]).toMatchObject({
      amount: "500",
      specialStatus: "pendingReimbursement",
    });
    expect(result.current.itemSummaries[0]?.businessNetAmount).toBeUndefined();
    expect(result.current.businessTotalAmount).toBeNull();
  });

  it("修改待报销支出金额时恢复为当前原始业务金额", () => {
    const { result } = renderTransactionFormHook({
      initialValues: {
        accountId: "account-1",
        items: [
          {
            amount: "500",
            businessNetAmount: "0",
            categoryId: "expense-child",
            specialStatus: "pendingReimbursement",
          },
        ],
        merchantId: "merchant-1",
        note: "待报销",
        transactionAt: "2026-07-20T01:30:00.000Z",
        type: "expense",
      },
    });

    act(() => result.current.updateItem(1, { amount: "600" }));

    expect(result.current.itemSummaries[0]).toMatchObject({
      amount: "600",
    });
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

  it("首次选择跨账户退款候选时立即拒绝并提示重新选择", () => {
    const { result } = renderTransactionFormHook({
      initialValues: createInitialValues(),
    });

    act(() =>
      result.current.setPickerRefundCandidate({
        ...refundCandidate,
        accountId: "account-2",
      }),
    );

    expect(result.current.pickerRefundCandidate).toBeNull();
    expect(result.current.linkNotice).toContain("账户一致");
  });

  it("切换收款账户后清空不匹配的退款候选", () => {
    const { result } = renderTransactionFormHook({
      initialValues: createInitialValues(),
    });

    act(() => result.current.setPickerRefundCandidate(refundCandidate));
    expect(result.current.pickerRefundCandidate).toEqual(refundCandidate);

    act(() => result.current.handleAccountChange("account-2"));

    expect(result.current.selectedAccountId).toBe("account-2");
    expect(result.current.pickerRefundCandidate).toBeNull();
    expect(result.current.linkNotice).toContain("账户已变更");
  });

  it("切换付款账户后清空币种不匹配的报销候选", () => {
    const { result } = renderTransactionFormHook({
      initialValues: createInitialValues(),
    });

    act(() =>
      result.current.setPickerReimbursementCandidate(reimbursementCandidate),
    );
    expect(result.current.pickerReimbursementCandidate).toEqual(
      reimbursementCandidate,
    );

    act(() => result.current.handleAccountChange("account-3"));

    expect(result.current.selectedAccountId).toBe("account-3");
    expect(result.current.pickerReimbursementCandidate).toBeNull();
    expect(result.current.linkNotice).toContain("币种已变更");
  });

  it("退款与报销候选互斥选择时清空另一侧候选", () => {
    const { result } = renderTransactionFormHook({
      initialValues: createInitialValues(),
    });

    act(() => result.current.setPickerRefundCandidate(refundCandidate));
    expect(result.current.pickerRefundCandidate).toEqual(refundCandidate);

    act(() =>
      result.current.setPickerReimbursementCandidate(reimbursementCandidate),
    );
    expect(result.current.pickerRefundCandidate).toBeNull();
    expect(result.current.pickerReimbursementCandidate).toEqual(
      reimbursementCandidate,
    );

    act(() => result.current.setPickerRefundCandidate(refundCandidate));
    expect(result.current.pickerRefundCandidate).toEqual(refundCandidate);
    expect(result.current.pickerReimbursementCandidate).toBeNull();
  });

  it("退款收入因账户变化解除关联时清理业务净额", () => {
    const { result } = renderTransactionFormHook({
      initialValues: {
        ...createInitialValues(),
        items: [
          {
            amount: "200",
            businessNetAmount: "0",
            businessStatus: {
              incomeLinkRole: "refund",
              offsetComposition: {
                refundAmount: "0",
                reimbursementAmount: "0",
              },
              settlementStatus: null,
            },
            categoryId: "income-category",
            refundCandidate,
          },
        ],
      },
    });

    expect(result.current.businessTotalAmount).toBe("0");
    act(() => result.current.handleAccountChange("account-2"));

    expect(result.current.itemSummaries[0]).toMatchObject({
      amount: "200",
      businessStatus: null,
      refundCandidate: null,
    });
    expect(result.current.itemSummaries[0]?.businessNetAmount).toBeUndefined();
    expect(result.current.businessTotalAmount).toBeNull();
  });
});
