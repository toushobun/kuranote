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

export const transactionSearchPageErrorMessages = {
  initialLoadFailed: "搜索结果读取失败，请稍后重新读取。",
  loadMoreFailed: "更多搜索结果读取失败。",
} as const;
