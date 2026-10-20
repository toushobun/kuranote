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

// 多账户记录（#834 / #914）：列表账户位置与「共同支付」标识。金额参数为已格式化的「币种符号 + 金额」。
export const transactionSharedPaymentMessages = {
  accountShareAndRecordTotal: (accountShare: string, recordTotal: string) =>
    `共同支付 · 本账户 ${accountShare} / 整笔 ${recordTotal}`,
  groupSummary: (count: number, accountShare: string, recordTotal: string) =>
    `含共同支付 ${count} 笔 · 本账户 ${accountShare} / 整笔 ${recordTotal}`,
  multipleAccounts: (firstAccountName: string, accountCount: number) =>
    `${firstAccountName} 等 ${accountCount} 个账户`,
  recordTotal: (recordTotal: string) => `共同支付 · 整笔 ${recordTotal}`,
} as const;

// 编辑页「不能编辑」提示（权限不足的提示随操作变化，在页面内生成）。
export const transactionEditRestrictionMessages = {
  archivedAccount: "该交易引用的账户已被删除，请先恢复该账户后再编辑。",
  linked: "该交易已关联报销或退款，不能编辑。",
  title: "该交易不能编辑",
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

export const transactionAccountSectionMessages = {
  accountLabel: "账户",
  accountPlaceholder: "选择账户",
  accountRequiredOption: "请选择账户",
  emptyAccountHelper: "请先新增账户。",
  title: "账户",
} as const;

// 多账户付款（#834 / #915）。金额参数为已格式化的「币种符号 + 金额」。
export const transactionPaymentFieldsMessages = {
  addPayment: "添加付款账户",
  difference: (difference: string) => `差额 ${difference}`,
  paymentAccountLabel: (index: number) => `付款账户 ${index}`,
  paymentAmountLabel: (index: number) => `付款金额 ${index}`,
  reconciliation: (paymentTotal: string, itemTotal: string) =>
    `付款合计 ${paymentTotal} / 明细合计 ${itemTotal}`,
  removePayment: (index: number) => `删除付款账户 ${index}`,
} as const;

const transactionLinkKindLabels = {
  refund: "退款",
  reimbursement: "报销",
} as const;

export type TransactionLinkKind = keyof typeof transactionLinkKindLabels;

function formatLinkKindLabels(kinds: readonly TransactionLinkKind[]) {
  return kinds.map((kind) => transactionLinkKindLabels[kind]).join("、");
}

export const transactionLinkMessages = {
  accountCurrencyChanged: (kinds: readonly TransactionLinkKind[]) =>
    `账户币种已变更，已清除币种不一致的${formatLinkKindLabels(kinds)}关联，请重新选择。`,
  // 已保存的关联不能在普通保存中解除（#574），切换到其他币种账户前需先解除关联。
  savedLinkCurrencyLocked: (kinds: readonly TransactionLinkKind[]) =>
    `该明细已关联${formatLinkKindLabels(kinds)}，账户需与关联明细的币种一致；如需更换为其他币种的账户，请先解除关联。`,
  candidateAccountRequired: (kind: TransactionLinkKind) =>
    `请先选择账户，再选择${transactionLinkKindLabels[kind]}明细。`,
  candidateCurrencyMismatch: (kind: TransactionLinkKind) =>
    `${transactionLinkKindLabels[kind]}明细必须与收款账户币种一致，请重新选择。`,
  candidateCurrencyMismatchReason: (currency: string) =>
    `与收款账户币种（${currency}）不一致，不可选择`,
} as const;
