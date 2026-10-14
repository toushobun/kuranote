export const transactionFormValidationMessages = {
  accountRequired: "请选择账户。",
  amountInvalid: "请输入有效金额。",
  categoryRequired: "请选择一个小分类。",
  itemsRequired: "请至少添加一条明细。",
  merchantRequired: "请选择商家。",
} as const;

export const transactionAmountMessages = {
  netAmount: "净额",
  originalAmount: "原金额",
  partiallyNotIncludedInExpense: "部分不计入支出",
  partiallyNotIncludedInIncome: "部分不计入收入",
  partiallyNotIncludedInStatistics: "部分不计入收支",
  partiallyOffset: "部分已核销",
} as const;

export const transactionListPageErrorMessages = {
  initialLoadFailed: "明细读取失败，请稍后重新读取。",
} as const;

export const transactionSearchPageErrorMessages = {
  initialLoadFailed: "搜索结果读取失败，请稍后重新读取。",
  loadMoreFailed: "更多搜索结果读取失败。",
} as const;

export const transactionItemsSectionMessages = {
  title: "收支明细",
} as const;

const transactionLinkKindLabels = {
  refund: "退款",
  reimbursement: "报销",
} as const;

export type TransactionLinkKind = keyof typeof transactionLinkKindLabels;

export const transactionLinkMessages = {
  accountCurrencyChanged: (kinds: readonly TransactionLinkKind[]) =>
    `账户币种已变更，已清除币种不一致的${kinds
      .map((kind) => transactionLinkKindLabels[kind])
      .join("、")}关联，请重新选择。`,
  candidateCurrencyMismatch: (kind: TransactionLinkKind) =>
    `${transactionLinkKindLabels[kind]}明细必须与收款账户币种一致，请重新选择。`,
  candidateCurrencyMismatchReason: (currency: string) =>
    `与收款账户币种（${currency}）不一致，不可选择`,
} as const;
