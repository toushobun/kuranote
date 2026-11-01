import { act, renderHook, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

import type {
  TransactionAccountOption,
  TransactionCategoryOption,
  TransactionMerchantOption,
  TransactionRefundCandidate,
} from "types/transactions";

import { transactionLinkMessages } from "utils/transactionMessages";

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
  { currency: "KWD", id: "account-4", name: "科威特第纳尔账户" },
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

function changePrimaryAccount(
  result: { current: ReturnType<typeof useTransactionForm> },
  accountId: string,
) {
  result.current.handlePaymentAccountChange(
    result.current.payments[0]!.key,
    accountId,
  );
}

function createInitialValues() {
  return {
    payments: [{ accountId: "account-1", amount: null }],
    items: [{ amount: "1200", categoryId: "income-category" }],
    merchantId: "merchant-1",
    note: "",
    transactionAt: "2026-07-20T01:30:00.000Z",
    type: "income" as const,
  };
}

describe("useTransactionForm", () => {
  it("修改再还原备注、商家和付款行后恢复未修改；选择器草稿不计入父表单", () => {
    const { result } = renderTransactionFormHook();
    expect(mocks.markEditDirty).toHaveBeenLastCalledWith(false);
    act(() =>
      result.current.handleNoteChange({
        target: { value: "临时备注" },
      } as Parameters<typeof result.current.handleNoteChange>[0]),
    );
    expect(mocks.markEditDirty).toHaveBeenLastCalledWith(true);
    act(() =>
      result.current.handleNoteChange({ target: { value: "" } } as Parameters<
        typeof result.current.handleNoteChange
      >[0]),
    );
    expect(mocks.markEditDirty).toHaveBeenLastCalledWith(false);
    act(() => result.current.handleMerchantChange("merchant-1"));
    expect(mocks.markEditDirty).toHaveBeenLastCalledWith(true);
    act(() => result.current.handleMerchantChange(""));
    expect(mocks.markEditDirty).toHaveBeenLastCalledWith(false);
    act(() => {
      result.current.openSheet();
      result.current.handlePickerCategoryToggle("expense-child");
      result.current.handlePickerAmountChange("1200");
    });
    expect(mocks.markEditDirty).toHaveBeenLastCalledWith(false);
    act(() => result.current.closeSheet());
    expect(mocks.markEditDirty).toHaveBeenLastCalledWith(false);
  });

  it("多账户付款实时输入立即算修改，还原金额后恢复干净", () => {
    const { result } = renderTransactionFormHook({
      initialValues: {
        items: [
          { categoryId: "expense-child", amount: "1200", specialStatus: null },
        ],
        merchantId: "merchant-1",
        note: "",
        payments: [
          { accountId: "account-1", amount: "800" },
          { accountId: "account-2", amount: "400" },
        ],
        transactionAt: "2026-10-29T03:20:10.000Z",
        type: "expense",
      },
    });
    expect(mocks.markEditDirty).toHaveBeenLastCalledWith(false);
    const first = result.current.payments[0]!.key;
    act(() => result.current.handlePaymentAmountChange(first, "900"));
    expect(mocks.markEditDirty).toHaveBeenLastCalledWith(true);
    act(() => result.current.handlePaymentAmountChange(first, "800"));
    expect(mocks.markEditDirty).toHaveBeenLastCalledWith(false);
  });
  beforeEach(() => vi.clearAllMocks());

  it("按分类类型初始化明细并计算收支净额", async () => {
    const { result } = renderTransactionFormHook({
      initialValues: {
        payments: [{ accountId: "account-1", amount: null }],
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
        payments: [{ accountId: "account-1", amount: null }],
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

  it("三位小数币种的收支净额和业务净额不截断", () => {
    const { result } = renderTransactionFormHook({
      initialValues: {
        payments: [{ accountId: "account-4", amount: null }],
        items: [
          {
            amount: "1.234",
            businessNetAmount: "1.123",
            categoryId: "expense-child",
          },
        ],
        merchantId: "merchant-1",
        note: "三位小数",
        transactionAt: "2026-07-20T01:30:00.000Z",
        type: "expense",
      },
    });

    expect(result.current.signedTotalAmount).toBe("-1.234");
    expect(result.current.businessTotalAmount).toBe("-1.123");
  });

  it("新增超额退款收入时完整核销且业务净额为零", () => {
    const { result } = renderTransactionFormHook({ initialType: "income" });

    act(() => {
      changePrimaryAccount(result, "account-1");
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
      businessNetAmount: "0",
    });
    expect(result.current.signedTotalAmount).toBe("+1500");
    expect(result.current.businessTotalAmount).toBe("0");
  });

  it.each([
    ["600", "0"],
    ["1000", "0"],
    ["1500", "0"],
  ])(
    "报销收入金额为 %s 时完整核销且业务净额为零",
    (incomeAmount, expectedBusinessNetAmount) => {
      const { result } = renderTransactionFormHook({ initialType: "income" });

      act(() => {
        changePrimaryAccount(result, "account-1");
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
        payments: [{ accountId: "account-1", amount: null }],
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
        payments: [{ accountId: "account-1", amount: null }],
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

  it("修改已倒赚支出金额时按带符号业务净额实时重算", () => {
    const { result } = renderTransactionFormHook({
      initialValues: {
        payments: [{ accountId: "account-1", amount: null }],
        items: [
          {
            amount: "4000",
            businessNetAmount: "-1000",
            categoryId: "expense-child",
            refundedAmount: "5000",
            specialStatus: "reimbursementSurplus",
          },
        ],
        merchantId: "merchant-1",
        note: "核销结余",
        transactionAt: "2026-07-20T01:30:00.000Z",
        type: "expense",
      },
    });

    act(() => result.current.updateItem(1, { amount: "5000" }));

    expect(result.current.itemSummaries[0]).toMatchObject({
      amount: "5000",
      businessNetAmount: "0",
    });
    expect(result.current.businessTotalAmount).toBe("0");
  });

  it("修改含退款和报销的支出金额时保留全部核销量", () => {
    const { result } = renderTransactionFormHook({
      initialValues: {
        payments: [{ accountId: "account-1", amount: null }],
        items: [
          {
            amount: "4000",
            businessNetAmount: "-1000",
            categoryId: "expense-child",
            refundedAmount: "2000",
            specialStatus: "reimbursementSurplus",
          },
        ],
        merchantId: "merchant-1",
        note: "退款与报销组合核销",
        transactionAt: "2026-07-20T01:30:00.000Z",
        type: "expense",
      },
    });

    act(() => result.current.updateItem(1, { amount: "4500" }));

    expect(result.current.itemSummaries[0]?.businessNetAmount).toBe("-500");
    expect(result.current.businessTotalAmount).toBe("+500");
  });

  it("通过明细选择器保存部分退款支出时保留业务净额", () => {
    const { result } = renderTransactionFormHook({
      initialValues: {
        payments: [{ accountId: "account-1", amount: null }],
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
        payments: [{ accountId: "account-1", amount: null }],
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

  it("修改已部分核销的待报销支出金额时增量更新业务净额", () => {
    const { result } = renderTransactionFormHook({
      initialValues: {
        payments: [{ accountId: "account-1", amount: null }],
        items: [
          {
            amount: "4000",
            businessNetAmount: "3000",
            categoryId: "expense-child",
            refundedAmount: "1000",
            specialStatus: "pendingReimbursement",
          },
        ],
        merchantId: "merchant-1",
        note: "待报销",
        transactionAt: "2026-07-20T01:30:00.000Z",
        type: "expense",
      },
    });

    act(() => result.current.updateItem(1, { amount: "5000" }));

    expect(result.current.itemSummaries[0]).toMatchObject({
      amount: "5000",
      businessNetAmount: "4000",
    });
    expect(result.current.businessTotalAmount).toBe("-4000");
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

  it("同币种跨账户退款候选可以选择且切换账户后保留", () => {
    const { result } = renderTransactionFormHook({
      initialValues: createInitialValues(),
    });
    const candidate = { ...refundCandidate, accountId: "account-2" };
    act(() => result.current.setPickerRefundCandidate(candidate));
    expect(result.current.pickerRefundCandidate).toEqual(candidate);
    act(() => changePrimaryAccount(result, "account-2"));
    expect(result.current.pickerRefundCandidate).toEqual(candidate);
    expect(result.current.linkNotice).toBeNull();
  });

  it("多账户时退款 / 报销候选的币种按首个付款账户判断", () => {
    const { result } = renderTransactionFormHook({
      initialValues: {
        ...createInitialValues(),
        payments: [
          { accountId: "account-3", amount: "600" },
          { accountId: "account-1", amount: "600" },
        ],
      },
    });

    act(() => result.current.setPickerRefundCandidate(refundCandidate));
    expect(result.current.pickerRefundCandidate).toBeNull();

    const usdCandidate = { ...refundCandidate, accountCurrency: "USD" };
    act(() => result.current.setPickerRefundCandidate(usdCandidate));
    expect(result.current.pickerRefundCandidate).toEqual(usdCandidate);
  });

  it("首次选择跨币种退款候选时立即拒绝并提示重新选择", () => {
    const { result } = renderTransactionFormHook({
      initialValues: createInitialValues(),
    });

    act(() =>
      result.current.setPickerRefundCandidate({
        ...refundCandidate,
        accountCurrency: "USD",
      }),
    );

    expect(result.current.pickerRefundCandidate).toBeNull();
    expect(result.current.linkNotice).toContain("币种一致");
  });

  it.each([
    { kind: "refund", label: "退款" },
    { kind: "reimbursement", label: "报销" },
  ] as const)("未选账户时选择$label候选提示先选择账户", ({ kind, label }) => {
    const { result } = renderTransactionFormHook();

    act(() =>
      kind === "refund"
        ? result.current.setPickerRefundCandidate(refundCandidate)
        : result.current.setPickerReimbursementCandidate(
            reimbursementCandidate,
          ),
    );

    expect(result.current.pickerRefundCandidate).toBeNull();
    expect(result.current.pickerReimbursementCandidate).toBeNull();
    expect(result.current.linkNotice).toBe(
      `请先选择账户，再选择${label}明细。`,
    );
  });

  it("切换收款账户后清空不匹配的退款候选", () => {
    const { result } = renderTransactionFormHook({
      initialValues: createInitialValues(),
    });

    act(() => result.current.setPickerRefundCandidate(refundCandidate));
    expect(result.current.pickerRefundCandidate).toEqual(refundCandidate);

    act(() => changePrimaryAccount(result, "account-3"));

    expect(result.current.selectedAccountId).toBe("account-3");
    expect(result.current.pickerRefundCandidate).toBeNull();
    expect(result.current.linkNotice).toContain("币种已变更");
  });

  it("切换账户后清空币种不匹配的报销候选", () => {
    const { result } = renderTransactionFormHook({
      initialValues: createInitialValues(),
    });

    act(() =>
      result.current.setPickerReimbursementCandidate(reimbursementCandidate),
    );
    expect(result.current.pickerReimbursementCandidate).toEqual(
      reimbursementCandidate,
    );

    act(() => changePrimaryAccount(result, "account-3"));

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

  it("退款收入因币种变化解除关联时清理业务净额", () => {
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
    act(() => changePrimaryAccount(result, "account-2"));
    expect(result.current.itemSummaries[0]?.refundCandidate).toEqual(
      refundCandidate,
    );
    expect(result.current.businessTotalAmount).toBe("0");
    act(() => changePrimaryAccount(result, "account-3"));

    expect(result.current.itemSummaries[0]).toMatchObject({
      amount: "200",
      businessStatus: null,
      refundCandidate: null,
    });
    expect(result.current.itemSummaries[0]?.businessNetAmount).toBeUndefined();
    expect(result.current.businessTotalAmount).toBeNull();
  });

  describe("明细中已加入的关联因币种切换", () => {
    const linkCases = [
      {
        candidate: refundCandidate,
        field: "refundCandidate",
        kind: "refund",
        label: "退款",
      },
      {
        candidate: reimbursementCandidate,
        field: "reimbursementCandidate",
        kind: "reimbursement",
        label: "报销",
      },
    ] as const;

    type LinkedIncomeItem = Partial<
      Record<(typeof linkCases)[number]["field"], TransactionRefundCandidate>
    >;

    function renderWithLinkedIncomeItems(items: LinkedIncomeItem[]) {
      return renderTransactionFormHook({
        initialValues: {
          ...createInitialValues(),
          items: items.map((links) => ({
            amount: "200",
            categoryId: "income-category",
            ...links,
          })),
        },
      });
    }

    // 编辑页：明细带持久化 id，关联由 transactionFormService 读入。
    function renderWithSavedLinkedIncomeItems(items: LinkedIncomeItem[]) {
      return renderTransactionFormHook({
        initialValues: {
          ...createInitialValues(),
          items: items.map((links, index) => ({
            amount: "200",
            categoryId: "income-category",
            expectedUpdatedAt: "2026-07-20T01:30:00.000Z",
            id: `persisted-item-${index + 1}`,
            ...links,
          })),
          transactionRecordId: "record-1",
        },
      });
    }

    it.each(linkCases)(
      "新建表单中$label关联因币种不一致被清除时显示提示",
      ({ candidate, field, kind }) => {
        const { result } = renderWithLinkedIncomeItems([
          { [field]: candidate },
        ]);

        act(() => changePrimaryAccount(result, "account-3"));

        expect(result.current.itemSummaries[0]?.[field]).toBeNull();
        expect(result.current.linkNotice).toBe(
          transactionLinkMessages.accountCurrencyChanged([kind]),
        );
      },
    );

    it.each(linkCases)(
      "编辑页中已保存的$label关联切换到不同币种时不清除并提示先解除关联",
      ({ candidate, field, kind, label }) => {
        const { result } = renderWithSavedLinkedIncomeItems([
          { [field]: candidate },
        ]);

        act(() => changePrimaryAccount(result, "account-3"));

        expect(result.current.itemSummaries[0]?.[field]).toEqual(candidate);
        expect(result.current.linkNotice).toBe(
          transactionLinkMessages.savedLinkCurrencyLocked([kind]),
        );
        expect(result.current.linkNotice).toBe(
          `该明细已关联${label}，账户需与关联明细的币种一致；如需更换为其他币种的账户，请先解除关联。`,
        );
      },
    );

    it("编辑页中已保存的退款和报销关联同时受影响时提示中列出两者", () => {
      const { result } = renderWithSavedLinkedIncomeItems([
        { refundCandidate },
        { reimbursementCandidate },
      ]);

      act(() => changePrimaryAccount(result, "account-3"));

      expect(result.current.itemSummaries[0]?.refundCandidate).toEqual(
        refundCandidate,
      );
      expect(result.current.itemSummaries[1]?.reimbursementCandidate).toEqual(
        reimbursementCandidate,
      );
      expect(result.current.linkNotice).toBe(
        transactionLinkMessages.savedLinkCurrencyLocked([
          "refund",
          "reimbursement",
        ]),
      );
    });

    it.each(linkCases)(
      "编辑页中本次新选的$label关联切换到不同币种时清除并提示重新选择",
      ({ candidate, field, kind }) => {
        const { result } = renderWithSavedLinkedIncomeItems([{}]);

        // 编辑页中新增一条带关联的收入明细（尚未保存）。
        act(() => result.current.openSheet());
        act(() => result.current.handlePickerCategoryToggle("income-category"));
        act(() => result.current.handlePickerAmountChange("100"));
        act(() =>
          kind === "refund"
            ? result.current.setPickerRefundCandidate(candidate)
            : result.current.setPickerReimbursementCandidate(candidate),
        );
        act(() => {
          result.current.handlePickerAdd();
        });
        expect(result.current.itemSummaries[1]?.[field]).toEqual(candidate);

        act(() => changePrimaryAccount(result, "account-3"));

        expect(result.current.itemSummaries[1]?.[field]).toBeNull();
        expect(result.current.linkNotice).toBe(
          transactionLinkMessages.accountCurrencyChanged([kind]),
        );
      },
    );

    it.each(linkCases)(
      "编辑页中已保存明细重新选择的$label关联切换到不同币种时清除并提示重新选择",
      ({ candidate, field, kind }) => {
        const { result } = renderWithSavedLinkedIncomeItems([
          { [field]: candidate },
        ]);
        const reselectedCandidate = { ...candidate, id: "reselected-item" };

        act(() =>
          result.current.updateItem(1, { [field]: reselectedCandidate }),
        );
        act(() => changePrimaryAccount(result, "account-3"));

        expect(result.current.itemSummaries[0]?.[field]).toBeNull();
        expect(result.current.linkNotice).toBe(
          transactionLinkMessages.accountCurrencyChanged([kind]),
        );
      },
    );

    it("编辑页中已保存关联与本次新选关联同时受影响时分别提示", () => {
      const { result } = renderWithSavedLinkedIncomeItems([
        { refundCandidate },
        {},
      ]);

      act(() => result.current.updateItem(2, { reimbursementCandidate }));
      act(() => changePrimaryAccount(result, "account-3"));

      expect(result.current.itemSummaries[0]?.refundCandidate).toEqual(
        refundCandidate,
      );
      expect(
        result.current.itemSummaries[1]?.reimbursementCandidate,
      ).toBeNull();
      expect(result.current.linkNotice).toBe(
        transactionLinkMessages.savedLinkCurrencyLocked(["refund"]) +
          transactionLinkMessages.accountCurrencyChanged(["reimbursement"]),
      );
    });

    it.each(linkCases)(
      "同币种切换账户时保留$label关联且不提示",
      ({ candidate, field }) => {
        const { result } = renderWithLinkedIncomeItems([
          { [field]: candidate },
        ]);

        act(() => changePrimaryAccount(result, "account-2"));

        expect(result.current.itemSummaries[0]?.[field]).toEqual(candidate);
        expect(result.current.linkNotice).toBeNull();
      },
    );

    it("退款和报销关联同时被清除时提示中列出两者", () => {
      const { result } = renderWithLinkedIncomeItems([
        { refundCandidate },
        { reimbursementCandidate },
      ]);

      act(() => changePrimaryAccount(result, "account-3"));

      expect(result.current.linkNotice).toBe(
        transactionLinkMessages.accountCurrencyChanged([
          "refund",
          "reimbursement",
        ]),
      );
      expect(result.current.linkNotice).toContain("退款、报销");
    });
  });
  it("延后金额模式允许空金额并通知新明细编号，默认模式仍校验金额", () => {
    const onPickerItemCommit = vi.fn();
    const { result } = renderTransactionFormHook({
      deferPickerAmount: true,
      onPickerItemCommit,
    });
    act(() => result.current.handlePickerCategoryToggle("expense-child"));
    act(() => {
      expect(result.current.handlePickerAdd()).toBe(true);
    });
    expect(result.current.itemSummaries[0]).toMatchObject({
      categoryId: "expense-child",
      amount: "",
    });
    expect(result.current.hasValidItems).toBe(false);
    expect(onPickerItemCommit).toHaveBeenCalledWith(
      result.current.itemSummaries[0].id,
    );
  });
});
