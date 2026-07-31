export const transactionFormValidationMessages = {
  accountRequired: "请选择账户。",
  amountInvalid: "请输入有效金额。",
  categoryRequired: "请选择一个小分类。",
  itemsRequired: "请至少添加一条明细。",
  merchantRequired: "请选择商家。",
} as const;

export const transactionListPageErrorMessages = {
  permissionDenied: "当前角色没有删除这条记账的权限。",
  voidFailed: "记录删除失败。请稍后重试。",
  voidInvalid: "删除对象不正确。",
} as const;

export const transactionSearchPageErrorMessages = {
  initialLoadFailed: "搜索结果读取失败，请稍后重新读取。",
  loadMoreFailed: "更多搜索结果读取失败。",
} as const;
