import type { TransactionRowItem } from "types/transactions";

// 医院 12 万（治疗费 4 万 + 住院费 8 万；我的账户 5 万、妻子账户 7 万）的列表行，
// TransactionRow 的测试与 Storybook 共用。
export const sharedPaymentRowItem: TransactionRowItem = {
  account_currency: "JPY",
  account_name: "我的账户 等 2 个账户",
  amount: "120000",
  categoryItems: [
    {
      amount: "80000",
      categoryName: "住院费",
      categoryType: "expense",
      parentCategoryName: "医疗",
    },
    {
      amount: "40000",
      categoryName: "治疗费",
      categoryType: "expense",
      parentCategoryName: "医疗",
    },
  ],
  id: "00000000-0000-4000-8000-000000009140",
  merchant_icon_url: null,
  merchant_name: "妇产科医院",
  transaction_at: "2026-10-10T01:00:00.000Z",
  type: "expense",
};

/** 筛选我的账户，按月等记录级维度：主金额为本账户份额。 */
export const sharedPaymentAccountShareRowItem: TransactionRowItem = {
  ...sharedPaymentRowItem,
  amount: "50000",
  record_total_amount: "120000",
};

/** 筛选我的账户 + 分类住院费：主金额为命中明细全额。 */
export const sharedPaymentMatchedItemsRowItem: TransactionRowItem = {
  ...sharedPaymentRowItem,
  account_share_amount: "50000",
  amount: "80000",
  categoryItems: sharedPaymentRowItem.categoryItems.slice(0, 1),
  record_total_amount: "120000",
};

/** 命中明细全额且住院费退过 1 万：共同支付行与原金额同时出现。 */
export const sharedPaymentWithOriginalAmountRowItem: TransactionRowItem = {
  ...sharedPaymentMatchedItemsRowItem,
  amount: "70000",
  originalAmount: "80000",
};

/**
 * 筛选我的账户 + 按小分类：组内行金额为命中该组的明细全额，与组合计一致；
 * 下方显示「本账户 / 整笔」。
 */
export const sharedPaymentCategoryGroupRowItems = {
  inpatient: {
    ...sharedPaymentRowItem,
    account_share_amount: "50000",
    amount: "80000",
    record_total_amount: "120000",
  },
  treatment: {
    ...sharedPaymentRowItem,
    account_share_amount: "50000",
    amount: "40000",
    record_total_amount: "120000",
  },
} satisfies Record<string, TransactionRowItem>;

/** 按账户分组（有无筛选都一样）：各账户组内行金额为该账户的付款金额，下方显示整笔。 */
export const sharedPaymentAccountGroupRowItems = {
  mine: sharedPaymentAccountShareRowItem,
  wife: {
    ...sharedPaymentAccountShareRowItem,
    amount: "70000",
  },
} satisfies Record<string, TransactionRowItem>;
