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

type FormHookResult = { current: ReturnType<typeof useTransactionForm> };

function changePrimaryAccount(result: FormHookResult, accountId: string) {
  result.current.handlePaymentAccountChange(
    result.current.payments[0]!.key,
    accountId,
  );
}

function clearPrimaryPayment(result: FormHookResult) {
  act(() =>
    result.current.handleRemovePayment(result.current.payments[0]!.key),
  );
  act(() => expect(result.current.addPayment()).toBe(true));
}

// 与小票一致：明细先以空金额加入，再用金额键盘写入。
function enterAddedItemAmount(result: FormHookResult, amount: string) {
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

function addOriginal(
  result: FormHookResult,
  kind: "refund" | "reimbursement",
  candidate: TransactionRefundCandidate,
) {
  act(() => result.current.openSheet());
  act(() => result.current.handlePickerModeChange(kind));
  act(() =>
    kind === "refund"
      ? result.current.setPickerRefundCandidate(candidate)
      : result.current.setPickerReimbursementCandidate(candidate),
  );
  act(() => expect(result.current.handlePickerAdd()).toBe(true));
  return result.current.itemSummaries[0]!.id;
}

function retargetOriginal(
  result: FormHookResult,
  id: number,
  kind: "refund" | "reimbursement",
  candidate: TransactionRefundCandidate,
  confirm = true,
) {
  act(() => result.current.openItemSheet(id));
  act(() =>
    kind === "refund"
      ? result.current.setPickerRefundCandidate(candidate)
      : result.current.setPickerReimbursementCandidate(candidate),
  );
  act(() =>
    confirm
      ? expect(result.current.handlePickerAdd()).toBe(true)
      : result.current.closeSheet(),
  );
}

const allLinkCategories: TransactionCategoryOption[] = [
  ...categoryOptions,
  {
    id: "system-refund",
    name: "退款",
    parentId: "income-category",
    parentName: "收入",
    type: "income",
    systemKey: "refund",
  },
  {
    id: "system-reimbursement",
    name: "报销",
    parentId: "income-category",
    parentName: "收入",
    type: "income",
    systemKey: "reimbursement",
  },
];

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

  it("添加时锁定已关联候选并显示改后的金额，编辑自己时解锁", () => {
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
    expect(result.current.lockedLinkAmounts.get(refundCandidate.id)).toBe(
      "200",
    );
    act(() => result.current.openItemSheet(1));
    expect(result.current.lockedLinkAmounts.has(refundCandidate.id)).toBe(
      false,
    );
    expect(result.current.pickerAmount).toBe("200");
  });

  it("新增超额退款时只将超过剩余额度的部分计入收入", () => {
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
      businessNetAmount: "500",
    });
  });

  it.each([
    ["600", "0"],
    ["1000", "0"],
    ["1500", "500"],
  ])(
    "报销收入金额为 %s 时只将超出额计入收入",
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

  it("修改已结清的支出金额时净额最低为零", () => {
    const { result } = renderTransactionFormHook({
      initialValues: {
        payments: [{ accountId: "account-1", amount: null }],
        items: [
          {
            amount: "4000",
            businessNetAmount: "0",
            categoryId: "expense-child",
            refundedAmount: "2000",
            reimbursementAmount: "3000",
            specialStatus: "reimbursed",
          },
        ],
        merchantId: "merchant-1",
        note: "退款与报销组合核销",
        transactionAt: "2026-07-20T01:30:00.000Z",
        type: "expense",
      },
    });

    act(() => result.current.updateItem(1, { amount: "3500" }));

    expect(result.current.itemSummaries[0]?.businessNetAmount).toBe("0");
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

  it("跨币种退款候选也允许选择，切换收款账户时保留关联", () => {
    const { result } = renderTransactionFormHook({
      initialValues: createInitialValues(),
    });
    const candidate = { ...refundCandidate, accountCurrency: "USD" };
    act(() => result.current.setPickerRefundCandidate(candidate));
    expect(result.current.pickerRefundCandidate).toEqual(candidate);
    act(() => changePrimaryAccount(result, "account-3"));
    expect(result.current.pickerRefundCandidate).toEqual(candidate);
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
    expect(result.current.pickerRefundCandidate).toEqual(refundCandidate);
  });

  it("切换账户后保留不同币种的报销候选", () => {
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
    expect(result.current.pickerReimbursementCandidate).toEqual(reimbursementCandidate);
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

  it("新增和编辑已保存的退款或报销，切换账户后继续保留原支出", () => {
    for (const saved of [false, true]) {
      for (const [field, candidate] of [
        ["refundCandidate", refundCandidate],
        ["reimbursementCandidate", reimbursementCandidate],
      ] as const) {
        const { result } = renderTransactionFormHook({
          initialValues: {
            ...createInitialValues(),
            items: [{
              amount: "200",
              categoryId: "income-category",
              ...(saved ? { id: "persisted-item-1" } : {}),
              [field]: candidate,
            }],
            ...(saved ? { transactionRecordId: "record-1" } : {}),
          },
        });
        act(() => changePrimaryAccount(result, "account-3"));
        expect(result.current.selectedAccount?.currency).toBe("USD");
        expect(result.current.itemSummaries[0]?.[field]).toEqual(candidate);
      }
    }
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
  it("初始加载与新增明细分别应用首次换原支出规则", () => {
    const { result } = renderTransactionFormHook({
      categoryOptions: allLinkCategories,
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
    const initialItemId = result.current.itemSummaries[0]!.id;
    expect(initialItemId).toBe(1);

    // 编辑页初始明细首次改选原支出，即使无追踪记录也允许补全空字段。
    retargetOriginal(result, initialItemId, "refund", {
      ...refundCandidate,
      id: "initial-item-retarget",
      merchantId: "merchant-2",
      accountId: "account-2",
    });
    expect(result.current.selectedMerchantId).toBe("merchant-2");
    expect(result.current.selectedAccount?.id).toBe("account-2");

    // 新增明细从 N+1 编号；首次加入时字段已非空，不能取得跟随资格。
    act(() => result.current.openSheet());
    act(() => result.current.handlePickerModeChange("refund"));
    act(() => result.current.setPickerRefundCandidate(refundCandidate));
    act(() => expect(result.current.handlePickerAdd()).toBe(true));
    const addedItemId = result.current.itemSummaries[1]!.id;
    expect(addedItemId).toBe(2);
    retargetOriginal(result, addedItemId, "refund", {
      ...refundCandidate,
      id: "added-item-retarget",
      merchantId: "merchant-1",
      accountId: "account-1",
    });
    expect(result.current.selectedMerchantId).toBe("merchant-2");
    expect(result.current.selectedAccount?.id).toBe("account-2");
  });

  it.each(["refund", "reimbursement"] as const)(
    "已自动带出的%s明细换原支出并确定后商家和账户一起跟随",
    (kind) => {
      const { result } = renderTransactionFormHook({
        categoryOptions: allLinkCategories,
      });
      const original =
        kind === "refund" ? refundCandidate : reimbursementCandidate;
      const id = addOriginal(result, kind, original);
      expect(result.current.selectedMerchantId).toBe("merchant-1");
      expect(result.current.selectedAccount?.id).toBe("account-1");
      const changed = {
        ...original,
        id: `${original.id}-other`,
        merchantId: "merchant-2",
        accountId: "account-2",
      };
      retargetOriginal(result, id, kind, changed);
      expect(
        result.current.itemSummaries[0]?.refundCandidate?.id ??
          result.current.itemSummaries[0]?.reimbursementCandidate?.id,
      ).toBe(changed.id);
      expect(result.current.selectedMerchantId).toBe("merchant-2");
      expect(result.current.selectedAccount?.id).toBe("account-2");
    },
  );

  it("手动改过自动带出的商家后，换原支出时商家和账户都跟随", () => {
    const { result } = renderTransactionFormHook({
      categoryOptions: allLinkCategories,
    });
    const id = addOriginal(result, "refund", refundCandidate);
    act(() => result.current.handleMerchantChange("merchant-2"));
    retargetOriginal(result, id, "refund", {
      ...refundCandidate,
      id: "new-original",
      merchantId: "merchant-1",
      accountId: "account-2",
    });
    expect(result.current.selectedMerchantId).toBe("merchant-1");
    expect(result.current.selectedAccount?.id).toBe("account-2");
  });

  it("手动清空自动带出的商家后，改选原支出仍跟随新商家", () => {
    const { result } = renderTransactionFormHook({
      categoryOptions: allLinkCategories,
    });
    const id = addOriginal(result, "refund", refundCandidate);
    act(() => result.current.handleMerchantChange(""));
    retargetOriginal(result, id, "refund", {
      ...refundCandidate,
      id: "changed-original-after-merchant-clear",
      merchantId: "merchant-2",
      accountId: "account-2",
    });
    expect(result.current.selectedMerchantId).toBe("merchant-2");
    expect(result.current.selectedAccount?.id).toBe("account-2");
  });

  it("编辑自己时不计入锁定，但其他明细引用同一原支出仍锁定且金额累加", () => {
    const { result } = renderTransactionFormHook({
      categoryOptions: allLinkCategories,
      initialValues: {
        ...newFormInitialValues,
        items: [
          {
            amount: "100",
            categoryId: "system-refund",
            refundCandidate,
          },
          {
            amount: "200",
            categoryId: "system-refund",
            refundCandidate,
          },
          {
            amount: "300",
            categoryId: "system-refund",
            refundCandidate,
          },
        ],
      },
    });
    expect(result.current.lockedLinkAmounts.get(refundCandidate.id)).toBe(
      "600",
    );
    act(() => result.current.openItemSheet(1));
    expect(result.current.lockedLinkAmounts.get(refundCandidate.id)).toBe(
      "500",
    );
    act(() => result.current.openItemSheet(2));
    expect(result.current.lockedLinkAmounts.get(refundCandidate.id)).toBe(
      "400",
    );
  });

  it("每次新建或编辑打开抽屉时递增会话，关闭不重复增加", () => {
    const { result } = renderTransactionFormHook({
      categoryOptions: allLinkCategories,
    });
    expect(result.current.pickerSessionKey).toBe(0);
    act(() => result.current.openSheet());
    expect(result.current.pickerSessionKey).toBe(1);
    act(() => result.current.closeSheet());
    expect(result.current.pickerSessionKey).toBe(1);
    const id = addOriginal(result, "refund", refundCandidate);
    expect(result.current.pickerSessionKey).toBe(2);
    act(() => result.current.openItemSheet(id));
    expect(result.current.pickerSessionKey).toBe(3);
  });

  it("只重新确定同一原支出时，不覆盖手动清空的商家", () => {
    const { result } = renderTransactionFormHook({
      categoryOptions: allLinkCategories,
    });
    const id = addOriginal(result, "refund", refundCandidate);
    act(() => result.current.handleMerchantChange(""));
    act(() => result.current.openItemSheet(id));
    act(() => expect(result.current.handlePickerAdd()).toBe(true));
    expect(result.current.selectedMerchantId).toBe("");
    expect(result.current.selectedAccount?.id).toBe("account-1");
  });

  it("关联明细改成普通明细再改回关联后不能沿用旧的自动带出资格", () => {
    const { result } = renderTransactionFormHook({
      categoryOptions: allLinkCategories,
    });
    const id = addOriginal(result, "refund", refundCandidate);
    act(() => result.current.openItemSheet(id));
    act(() => result.current.handlePickerModeChange("expense"));
    act(() => expect(result.current.handlePickerAdd()).toBe(true));
    expect(result.current.itemSummaries[0]?.refundCandidate).toBeNull();

    act(() => result.current.openItemSheet(id));
    act(() => result.current.handlePickerModeChange("refund"));
    act(() =>
      result.current.setPickerRefundCandidate({
        ...refundCandidate,
        id: "brand-new-associated-original",
      }),
    );
    act(() => expect(result.current.handlePickerAdd()).toBe(true));

    retargetOriginal(result, id, "refund", {
      ...refundCandidate,
      id: "retarget-after-normal-item",
      merchantId: "merchant-2",
      accountId: "account-2",
    });
    expect(result.current.selectedMerchantId).toBe("merchant-1");
    expect(result.current.selectedAccount?.id).toBe("account-1");
  });

  it("手动改过自动带出的账户后，换原支出时商家和账户都跟随", () => {
    const { result } = renderTransactionFormHook({
      categoryOptions: allLinkCategories,
    });
    const id = addOriginal(result, "refund", refundCandidate);
    act(() => changePrimaryAccount(result, "account-2"));
    retargetOriginal(result, id, "refund", {
      ...refundCandidate,
      id: "new-original",
      merchantId: "merchant-2",
      accountId: "account-1",
    });
    expect(result.current.selectedMerchantId).toBe("merchant-2");
    expect(result.current.selectedAccount?.id).toBe("account-1");
  });

  it("删掉自动带出的收款账户并重新添加后，换原支出仍会跟随", () => {
    const { result } = renderTransactionFormHook({
      categoryOptions: allLinkCategories,
    });
    const id = addOriginal(result, "refund", refundCandidate);
    act(() =>
      result.current.handleRemovePayment(result.current.payments[0]!.key),
    );
    expect(result.current.payments).toHaveLength(0);
    act(() => expect(result.current.addPayment("account-2")).toBe(true));
    expect(result.current.selectedAccount?.id).toBe("account-2");

    retargetOriginal(result, id, "refund", {
      ...refundCandidate,
      id: "new-original-after-readding-account",
      merchantId: "merchant-2",
      accountId: "account-1",
    });
    expect(result.current.selectedMerchantId).toBe("merchant-2");
    expect(result.current.selectedAccount?.id).toBe("account-1");
  });

  it("先选商家和账户再加退款，未自动带出的字段不会随原支出改选", () => {
    const { result } = renderTransactionFormHook({
      categoryOptions: allLinkCategories,
      initialValues: {
        ...newFormInitialValues,
        merchantId: "merchant-2",
        payments: [{ accountId: "account-2", amount: null }],
      },
    });
    const id = addOriginal(result, "refund", refundCandidate);
    retargetOriginal(result, id, "refund", {
      ...refundCandidate,
      id: "another-original-without-auto-fill",
      merchantId: "merchant-1",
      accountId: "account-1",
    });
    expect(result.current.selectedMerchantId).toBe("merchant-2");
    expect(result.current.selectedAccount?.id).toBe("account-2");
  });

  it("先选商家和账户再加退款，清空后换原支出也不补填", () => {
    const { result } = renderTransactionFormHook({
      categoryOptions: allLinkCategories,
      initialValues: {
        ...newFormInitialValues,
        merchantId: "merchant-2",
        payments: [{ accountId: "account-2", amount: null }],
      },
    });
    const id = addOriginal(result, "refund", refundCandidate);
    act(() => result.current.handleMerchantChange(""));
    clearPrimaryPayment(result);
    expect(result.current.selectedMerchantId).toBe("");
    expect(result.current.selectedAccount?.id).toBeUndefined();

    retargetOriginal(result, id, "refund", {
      ...refundCandidate,
      id: "another-original-after-empty-manual-fields",
      merchantId: "merchant-1",
      accountId: "account-1",
    });
    expect(result.current.selectedMerchantId).toBe("");
    expect(result.current.selectedAccount?.id).toBeUndefined();
  });

  it("未带出商家但自动带出了账户时，换原支出只跟随账户", () => {
    const { result } = renderTransactionFormHook({
      categoryOptions: allLinkCategories,
      initialValues: {
        ...newFormInitialValues,
        merchantId: "merchant-2",
      },
    });
    const id = addOriginal(result, "reimbursement", reimbursementCandidate);
    expect(result.current.selectedAccount?.id).toBe("account-1");
    act(() => result.current.handleMerchantChange(""));

    retargetOriginal(result, id, "reimbursement", {
      ...reimbursementCandidate,
      id: "another-reimbursement-original",
      merchantId: "merchant-1",
      accountId: "account-2",
    });
    expect(result.current.selectedMerchantId).toBe("");
    expect(result.current.selectedAccount?.id).toBe("account-2");
  });

  it("未自动带出字段的关联只改金额也不会重新补填", () => {
    const { result } = renderTransactionFormHook({
      categoryOptions: allLinkCategories,
      initialValues: {
        ...newFormInitialValues,
        merchantId: "merchant-2",
        payments: [{ accountId: "account-2", amount: null }],
      },
    });
    const id = addOriginal(result, "refund", refundCandidate);
    act(() => result.current.handleMerchantChange(""));
    clearPrimaryPayment(result);

    act(() => result.current.openItemSheet(id));
    act(() => result.current.setPickerAmount("500"));
    act(() => expect(result.current.handlePickerAdd()).toBe(true));
    expect(result.current.itemSummaries[0]?.amount).toBe("500");
    expect(result.current.selectedMerchantId).toBe("");
    expect(result.current.selectedAccount?.id).toBeUndefined();
  });

  it("仅修改金额而未换原支出时，保持手动修改的商家和账户", () => {
    const { result } = renderTransactionFormHook({
      categoryOptions: allLinkCategories,
    });
    const id = addOriginal(result, "refund", refundCandidate);
    act(() => result.current.handleMerchantChange("merchant-2"));
    act(() => changePrimaryAccount(result, "account-2"));
    act(() => result.current.openItemSheet(id));
    act(() => result.current.setPickerAmount("500"));
    act(() => expect(result.current.handlePickerAdd()).toBe(true));
    expect(result.current.itemSummaries[0]?.amount).toBe("500");
    expect(result.current.itemSummaries[0]?.refundCandidate?.id).toBe(
      refundCandidate.id,
    );
    expect(result.current.selectedMerchantId).toBe("merchant-2");
    expect(result.current.selectedAccount?.id).toBe("account-2");
  });

  it("编辑原支出后取消不改商家、账户和小票，删除明细也不回退", () => {
    const { result } = renderTransactionFormHook({
      categoryOptions: allLinkCategories,
    });
    const id = addOriginal(result, "reimbursement", reimbursementCandidate);
    act(() => result.current.handleMerchantChange("merchant-2"));
    act(() => changePrimaryAccount(result, "account-2"));
    const changed = {
      ...reimbursementCandidate,
      id: "reimbursement-another",
      merchantId: "merchant-2",
      accountId: "account-2",
    };
    retargetOriginal(result, id, "reimbursement", changed, false);
    expect(result.current.itemSummaries[0]?.reimbursementCandidate?.id).toBe(
      reimbursementCandidate.id,
    );
    expect(result.current.selectedMerchantId).toBe("merchant-2");
    expect(result.current.selectedAccount?.id).toBe("account-2");
    act(() => result.current.removeItem(id));
    expect(result.current.itemSummaries).toHaveLength(0);
    expect(result.current.selectedMerchantId).toBe("merchant-2");
    expect(result.current.selectedAccount?.id).toBe("account-2");
  });

  it("改选无效商家或归档账户时不覆盖之前自动带出的值", () => {
    const { result } = renderTransactionFormHook({
      categoryOptions: allLinkCategories,
    });
    const id = addOriginal(result, "refund", refundCandidate);
    retargetOriginal(result, id, "refund", {
      ...refundCandidate,
      id: "another-invalid-original",
      merchantId: "archived-merchant",
      accountId: "archived-account",
    });
    expect(result.current.selectedMerchantId).toBe("merchant-1");
    expect(result.current.selectedAccount?.id).toBe("account-1");
  });
});
