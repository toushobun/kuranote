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
  { icon_url: null, id: "merchant-2", name: "其他商家" },
];

const refundCandidate: TransactionRefundCandidate = {
  accountCurrency: "JPY",
  accountId: "account-1",
  amount: "1200",
  merchantId: "merchant-1",
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

// 与新增记账（useTransactionStepFlow）相同的空表单初始值。
const newFormInitialValues = {
  items: [],
  merchantId: "",
  note: "",
  payments: [{ accountId: "", amount: null }],
  transactionAt: "",
  type: "expense" as const,
};

function renderTransactionFormHook(
  overrides: Partial<Parameters<typeof useTransactionForm>[0]> = {},
) {
  return renderHook(() =>
    useTransactionForm({
      accountOptions,
      categoryOptions,
      initialValues: newFormInitialValues,
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

// 与小票一致：明细先以空金额加入，再用金额键盘写入。
function enterAddedItemAmount(
  result: { current: ReturnType<typeof useTransactionForm> },
  amount: string,
) {
  act(() =>
    result.current.updateItem(result.current.itemSummaries[0]!.id, { amount }),
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
    expect(result.current.selectedAccount?.name).toBe("现金");
    expect(result.current.selectedMerchant?.name).toBe("便利店");
  });

  it.each([
    ["refund", "0"],
    ["refund", "-500"],
    ["refund", "750"],
    ["reimbursement", "0"],
    ["reimbursement", "-500"],
    ["reimbursement", "750"],
  ] as const)("%s 候选剩余 %s 时仅正数自动填金额", (kind, remaining) => {
    const { result } = renderTransactionFormHook();
    act(() => {
      changePrimaryAccount(result, "account-1");
      result.current.openSheet();
    });
    act(() => result.current.handlePickerModeChange(kind));
    act(() => result.current.setPickerAmount("999"));
    act(() => {
      const candidate = {
        ...refundCandidate,
        remainingRefundableAmount: remaining,
      };
      if (kind === "refund") result.current.setPickerRefundCandidate(candidate);
      else result.current.setPickerReimbursementCandidate(candidate);
    });
    expect(result.current.pickerAmount).toBe(
      Number(remaining) > 0 ? remaining : "",
    );
    expect(
      kind === "refund"
        ? result.current.pickerRefundCandidate
        : result.current.pickerReimbursementCandidate,
    ).not.toBeNull();
  });

  const refundCategoryOptions: TransactionCategoryOption[] = [
    ...categoryOptions,
    {
      id: "system-refund",
      name: "退款",
      parentId: "income-category",
      parentName: "收入",
      type: "income",
      systemKey: "refund",
    },
  ];

  it("已经抵完的原支出可以直接确定为 0 元退款明细", () => {
    const { result } = renderTransactionFormHook({
      categoryOptions: refundCategoryOptions,
    });
    act(() => {
      changePrimaryAccount(result, "account-1");
      result.current.openSheet();
    });
    act(() => result.current.handlePickerModeChange("refund"));
    act(() =>
      result.current.setPickerRefundCandidate({
        ...refundCandidate,
        refundedAmount: "1200",
        remainingRefundableAmount: "0",
      }),
    );
    expect(result.current.pickerAmount).toBe("");
    act(() => {
      expect(result.current.handlePickerAdd()).toBe(true);
    });
    expect(result.current.itemSummaries).toMatchObject([
      {
        amount: "0",
        businessNetAmount: "0",
        refundCandidate: { id: refundCandidate.id },
      },
    ]);
  });

  it("编辑小票删除已保存关联后，重新选原支出会恢复自动填金额", () => {
    const persistedCandidate = {
      ...refundCandidate,
      refundedAmount: "600",
      remainingRefundableAmount: "600",
    };
    const { result } = renderTransactionFormHook({
      categoryOptions: refundCategoryOptions,
      initialValues: {
        ...createInitialValues(),
        items: [
          {
            id: "persisted-refund",
            amount: "600",
            categoryId: "system-refund",
            refundCandidate: persistedCandidate,
          },
        ],
      },
    });
    expect(
      result.current.resolveLinkCandidate(persistedCandidate)
        .remainingRefundableAmount,
    ).toBe("600");
    act(() => result.current.removeItem(1));
    expect(
      result.current.resolveLinkCandidate(persistedCandidate)
        .remainingRefundableAmount,
    ).toBe("1200");
    act(() => result.current.openSheet());
    act(() => result.current.handlePickerModeChange("refund"));
    act(() => result.current.setPickerRefundCandidate(persistedCandidate));
    expect(result.current.pickerAmount).toBe("1200");
  });

  it("新建小票给同一目标关联第二笔退款时扣除第一笔草稿", () => {
    const { result } = renderTransactionFormHook({
      categoryOptions: refundCategoryOptions,
    });
    act(() => {
      changePrimaryAccount(result, "account-1");
      result.current.openSheet();
    });
    act(() => result.current.handlePickerModeChange("refund"));
    act(() => result.current.setPickerRefundCandidate(refundCandidate));
    act(() => {
      expect(result.current.handlePickerAdd()).toBe(true);
    });
    act(() => result.current.updateItem(1, { amount: "200" }));
    act(() => result.current.openSheet());
    act(() => result.current.handlePickerModeChange("refund"));
    act(() => result.current.setPickerRefundCandidate(refundCandidate));
    expect(result.current.pickerAmount).toBe("1000");
    expect(
      result.current.resolveLinkCandidate(refundCandidate).refundedAmount,
    ).toBe("200");
  });

  it("新增超额退款收入时完整核销且业务净额为零", () => {
    const { result } = renderTransactionFormHook();

    act(() => {
      changePrimaryAccount(result, "account-1");
      result.current.openSheet();
      result.current.handlePickerCategoryToggle("income-category");
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
    enterAddedItemAmount(result, "1500");

    expect(result.current.itemSummaries[0]).toMatchObject({
      amount: "1500",
      businessNetAmount: "0",
    });
  });

  it.each([
    ["600", "0"],
    ["1000", "0"],
    ["1500", "0"],
  ])(
    "报销收入金额为 %s 时完整核销且业务净额为零",
    (incomeAmount, expectedBusinessNetAmount) => {
      const { result } = renderTransactionFormHook();

      act(() => {
        changePrimaryAccount(result, "account-1");
        result.current.openSheet();
        result.current.handlePickerCategoryToggle("income-category");
      });
      act(() =>
        result.current.setPickerReimbursementCandidate(reimbursementCandidate),
      );
      act(() => {
        expect(result.current.handlePickerAdd()).toBe(true);
      });
      enterAddedItemAmount(result, incomeAmount);

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
  });

  it("通过明细选择器新增待报销支出时仍保留原始业务金额", () => {
    const { result } = renderTransactionFormHook();

    act(() => {
      result.current.openSheet();
      result.current.handlePickerCategoryToggle("expense-child");
      result.current.setPickerSpecialStatus("pendingReimbursement");
    });
    act(() => {
      expect(result.current.handlePickerAdd()).toBe(true);
    });
    enterAddedItemAmount(result, "500");

    expect(result.current.itemSummaries[0]).toMatchObject({
      amount: "500",
      specialStatus: "pendingReimbursement",
    });
    expect(result.current.itemSummaries[0]?.businessNetAmount).toBeUndefined();
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
  });

  it("切换大分类时选中第一个可用小分类，并可指定小分类", () => {
    const { result } = renderTransactionFormHook();

    act(() => result.current.openSheet());
    act(() => result.current.handlePickerGroupSelect("expense-parent"));
    expect(result.current.pickerCategoryId).toBe("expense-child");
    // 没有父分类的分类同在 id 为 "" 的组里：指定 categoryId 时选中它，而不是组内第一个。
    act(() => result.current.handlePickerGroupSelect("", "income-category"));
    expect(result.current.pickerCategoryId).toBe("income-category");
  });

  it("取消选中小分类后校验小分类，选中后追加空金额明细", () => {
    const { result } = renderTransactionFormHook();

    act(() => result.current.openSheet());
    expect(result.current.pickerCategoryId).toBe("expense-parent");
    act(() => result.current.handlePickerCategoryToggle("expense-parent"));
    act(() => {
      expect(result.current.handlePickerAdd()).toBe(false);
    });
    expect(result.current.pickerErrors).toEqual({
      category: expect.any(String),
    });

    act(() => result.current.handlePickerCategoryToggle("expense-child"));
    act(() => {
      expect(result.current.handlePickerAdd()).toBe(true);
    });

    expect(result.current.itemSummaries).toHaveLength(1);
    expect(result.current.itemSummaries[0]).toMatchObject({
      amount: "",
      categoryId: "expense-child",
    });
    expect(mocks.markEditDirty).toHaveBeenCalled();
  });

  it("提交缺少必填业务字段的表单时阻止提交", async () => {
    const { result } = renderTransactionFormHook();
    const preventDefault = vi.fn();

    await waitFor(() => expect(result.current.transactionAtValue).not.toBe(""));
    act(() =>
      result.current.handleSubmit({
        preventDefault,
      } as unknown as Parameters<typeof result.current.handleSubmit>[0]),
    );

    expect(preventDefault).toHaveBeenCalledOnce();
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

  it("已有收款账户时不覆盖用户选择的同币种账户", () => {
    const { result } = renderTransactionFormHook({
      initialValues: {
        ...newFormInitialValues,
        payments: [{ accountId: "account-2", amount: null }],
      },
    });

    act(() => result.current.setPickerRefundCandidate(refundCandidate));

    expect(result.current.selectedAccount?.id).toBe("account-2");
    expect(result.current.pickerRefundCandidate).toEqual(refundCandidate);
    expect(result.current.linkNotice).toBeNull();
  });

  it("原付款账户已归档时确定关联后也不自动填账户", () => {
    const { result } = renderTransactionFormHook({
      categoryOptions: refundCategoryOptions,
    });
    const archivedCandidate = {
      ...refundCandidate,
      accountId: "archived-account",
    };
    act(() => result.current.openSheet());
    act(() => result.current.handlePickerModeChange("refund"));
    act(() => result.current.setPickerRefundCandidate(archivedCandidate));
    expect(result.current.payments[0]?.accountId).toBe("");
    act(() => {
      expect(result.current.handlePickerAdd()).toBe(true);
    });
    expect(result.current.itemSummaries[0]?.refundCandidate).toEqual(
      archivedCandidate,
    );
    expect(result.current.payments[0]?.accountId).toBe("");
    expect(result.current.selectedAccount).toBeUndefined();
  });

  it("切换收款账户后清空不匹配的退款候选", () => {
    const { result } = renderTransactionFormHook({
      initialValues: createInitialValues(),
    });

    act(() => result.current.setPickerRefundCandidate(refundCandidate));
    expect(result.current.pickerRefundCandidate).toEqual(refundCandidate);

    act(() => changePrimaryAccount(result, "account-3"));

    expect(result.current.selectedAccount?.id).toBe("account-3");
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

    expect(result.current.selectedAccount?.id).toBe("account-3");
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

    act(() => changePrimaryAccount(result, "account-2"));
    expect(result.current.itemSummaries[0]?.refundCandidate).toEqual(
      refundCandidate,
    );
    act(() => changePrimaryAccount(result, "account-3"));

    expect(result.current.itemSummaries[0]).toMatchObject({
      amount: "200",
      businessStatus: null,
      refundCandidate: null,
    });
    expect(result.current.itemSummaries[0]?.businessNetAmount).toBeUndefined();
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
  it("添加明细时允许空金额并通知新明细编号", () => {
    const onPickerItemCommit = vi.fn();
    const { result } = renderTransactionFormHook({ onPickerItemCommit });
    act(() => result.current.handlePickerCategoryToggle("expense-child"));
    act(() => {
      expect(result.current.handlePickerAdd()).toBe(true);
    });
    expect(result.current.itemSummaries[0]).toMatchObject({
      categoryId: "expense-child",
      amount: "",
    });
    expect(onPickerItemCommit).toHaveBeenCalledWith(
      result.current.itemSummaries[0].id,
    );
  });

  it.each(["refund", "reimbursement"] as const)(
    "选择%s原支出只改变抽屉草稿，确定后才填入商家和收款账户",
    (kind) => {
      const { result } = renderTransactionFormHook({
        categoryOptions: [
          ...refundCategoryOptions,
          {
            id: "system-reimbursement",
            name: "报销",
            parentId: "income-category",
            parentName: "收入",
            type: "income",
            systemKey: "reimbursement",
          },
        ],
      });
      act(() => result.current.openSheet());
      act(() => result.current.handlePickerModeChange(kind));
      act(() =>
        kind === "refund"
          ? result.current.setPickerRefundCandidate(refundCandidate)
          : result.current.setPickerReimbursementCandidate(
              reimbursementCandidate,
            ),
      );
      expect(result.current.selectedMerchantId).toBe("");
      expect(result.current.selectedAccount?.id).toBeUndefined();
      expect(result.current.linkMerchantTouched).toBe(false);
      expect(result.current.itemSummaries).toHaveLength(0);
      act(() => {
        expect(result.current.handlePickerAdd()).toBe(true);
      });
      expect(result.current.selectedMerchantId).toBe("merchant-1");
      expect(result.current.selectedAccount?.id).toBe("account-1");
      expect(result.current.linkMerchantTouched).toBe(true);
      expect(result.current.itemSummaries).toHaveLength(1);
    },
  );

  it.each(["refund", "reimbursement"] as const)(
    "选择%s原支出后取消或改为普通明细不带出商家和账户",
    (kind) => {
      const { result } = renderTransactionFormHook();
      act(() => result.current.openSheet());
      act(() => result.current.handlePickerModeChange(kind));
      act(() =>
        kind === "refund"
          ? result.current.setPickerRefundCandidate(refundCandidate)
          : result.current.setPickerReimbursementCandidate(
              reimbursementCandidate,
            ),
      );
      act(() => result.current.closeSheet());
      expect(result.current.selectedMerchantId).toBe("");
      expect(result.current.selectedAccount?.id).toBeUndefined();
      expect(result.current.linkMerchantTouched).toBe(false);
      expect(result.current.itemSummaries).toHaveLength(0);
    },
  );

  it("原支出在确认前改选时，仅使用最终候选补全商家和账户", () => {
    const { result } = renderTransactionFormHook({
      categoryOptions: refundCategoryOptions,
    });
    act(() => result.current.openSheet());
    act(() => result.current.handlePickerModeChange("refund"));
    act(() => result.current.setPickerRefundCandidate(refundCandidate));
    act(() =>
      result.current.setPickerRefundCandidate({
        ...refundCandidate,
        id: "refund-item-2",
        merchantId: "merchant-2",
        accountId: "account-2",
      }),
    );
    expect(result.current.selectedMerchantId).toBe("");
    expect(result.current.selectedAccount?.id).toBeUndefined();
    act(() => {
      expect(result.current.handlePickerAdd()).toBe(true);
    });
    expect(result.current.selectedMerchantId).toBe("merchant-2");
    expect(result.current.selectedAccount?.id).toBe("account-2");
  });

  it("原支出商家无效或未指定时不带出，账户仍在确认时自动填入", () => {
    const { result } = renderTransactionFormHook({
      categoryOptions: refundCategoryOptions,
    });
    act(() => result.current.openSheet());
    act(() => result.current.handlePickerModeChange("refund"));
    act(() =>
      result.current.setPickerRefundCandidate({
        ...refundCandidate,
        merchantId: "merchant-archived",
      }),
    );
    act(() => {
      expect(result.current.handlePickerAdd()).toBe(true);
    });
    expect(result.current.selectedMerchantId).toBe("");
    expect(result.current.selectedAccount?.id).toBe("account-1");
    expect(result.current.linkMerchantTouched).toBe(false);
  });

  it("小票已有商家和账户时确认新关联不会覆盖", () => {
    const { result } = renderTransactionFormHook({
      categoryOptions: refundCategoryOptions,
      initialValues: {
        ...newFormInitialValues,
        merchantId: "merchant-2",
        payments: [{ accountId: "account-2", amount: null }],
      },
    });
    act(() => result.current.openSheet());
    act(() => result.current.handlePickerModeChange("refund"));
    act(() => result.current.setPickerRefundCandidate(refundCandidate));
    act(() => {
      expect(result.current.handlePickerAdd()).toBe(true);
    });
    expect(result.current.selectedMerchantId).toBe("merchant-2");
    expect(result.current.selectedAccount?.id).toBe("account-2");
    expect(result.current.linkMerchantTouched).toBe(false);
  });

  it("编辑已有明细改选原支出，确认前不改小票，确认后才自动带出", () => {
    const { result } = renderTransactionFormHook({
      categoryOptions: refundCategoryOptions,
      initialValues: {
        ...newFormInitialValues,
        items: [
          {
            amount: "300",
            categoryId: "system-refund",
            refundCandidate,
          },
        ],
      },
    });
    act(() => result.current.openItemSheet(1));
    act(() =>
      result.current.setPickerRefundCandidate({
        ...refundCandidate,
        id: "refund-item-2",
        merchantId: "merchant-2",
        accountId: "account-2",
      }),
    );
    expect(result.current.selectedMerchantId).toBe("");
    expect(result.current.selectedAccount?.id).toBeUndefined();
    expect(result.current.itemSummaries[0]?.refundCandidate?.id).toBe(
      refundCandidate.id,
    );
    act(() => {
      expect(result.current.handlePickerAdd()).toBe(true);
    });
    expect(result.current.itemSummaries[0]?.refundCandidate?.id).toBe(
      "refund-item-2",
    );
    expect(result.current.selectedMerchantId).toBe("merchant-2");
    expect(result.current.selectedAccount?.id).toBe("account-2");
  });
});
