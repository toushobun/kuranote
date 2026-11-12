import { merchantRecentTransactionLimit } from "@/constants/recentUsage";

export const flowMessages = {
  creationClose: "关闭",
  merchantCreated: (name: string) => `已新增商家「${name}」并选中`,
  accountCreated: (name: string) => `已新增账户「${name}」并选中`,
  title: "从商家记账",
  transferTitle: "账户周转",
  switchMethod: "切换方式",
  methodTitle: "切换记账方式",
  close: "关闭记账",
  closeDrawer: "关闭方式选择",
  methods: [
    { id: "merchant", label: "从商家记账" },
    { id: "transfer", label: "账户周转" },
    { id: "template", label: "从模板记账", disabled: true },
    { id: "photo", label: "从拍照记账", disabled: true },
    { id: "scheduled", label: "定时记账", disabled: true },
  ],
  soon: "即将推出",
  search: "搜索商家",
  all: "全部",
  frequent: "常用商家",
  merchants: "全部商家",
  results: "搜索结果",
  notFound: (keyword: string) => `没有找到“${keyword}”`,
  addSearch: (keyword: string) => `新增商家“${keyword}”`,
  noMerchants: "还没有商家",
  merchantHint: "先添加常去的商家，记账时点一下就能选",
  presets: "从预设添加",
  addMerchant: "新增商家",
  loadingItems: "正在按习惯准备明细…",
  loadingPayments: "正在读取常用账户…",
  accounts: "收支账户",
  holder: (names: string[]) => `持有人：${names.join("、") || "未指定"}`,
  recommended: "推荐账户",
  recommendationHint: `按这家商家最近 ${merchantRecentTransactionLimit} 笔记录`,
  otherAccounts: "其他账户",
  allAccounts: "全部账户",
  noAccounts: "还没有收支账户",
  accountHint: "添加一个账户，记录这笔钱从哪里出、到哪里去",
  addAccount: "新增账户",
  addItem: "添加明细",
  automaticNotice: "已按照你的习惯自动添加部分内容",
  total: "合计",
  // 合计下方的小字，各项之间用「 · 」分隔。
  totalBreakdown: {
    expense: "支出",
    income: "收入",
    refunded: "已退款",
    reimbursed: "已报销",
  },
  amountTitle: (category: string) => `${category} 的金额`,
  missingCategory: "未选择分类",
  pendingAmount: "待输入",
  lastAmount: (amount: string) => `上次 ${amount}`,
  quickAmounts: "快捷金额",
  confirmAmount: "确定",
  closeAmount: "关闭金额键盘",
  editItem: (index: number) => `编辑明细 ${index}`,
  editAmount: (index: number, amount: string) =>
    `修改明细 ${index} 金额：${amount}`,
  removeItem: (index: number) => `删除明细 ${index}`,
  chooseAccount: "选择收支账户",
  // 只读小票里不在可选账户中的付款账户（已归档）。
  archivedAccount: "已归档账户",
  changePaymentAccount: (index: number, income: boolean) =>
    `更换${income ? "收款" : "支付"}账户 ${index}`,
  editPaymentAmount: (index: number, amount: string, income: boolean) =>
    `修改${income ? "收款" : "支付"}账户 ${index} 金额：${amount}`,
  removePayment: (index: number, income: boolean) =>
    `删除${income ? "收款" : "支付"}账户 ${index}`,
  merchant: "商家",
  note: "备注",
  time: "时间",
  addNote: "添加备注",
  payment: (income: boolean) => (income ? "收款" : "支付"),
  editReceiptRow: (label: string, value: string) => `修改${label}：${value}`,
  noteLimit: 2000,
  noteCount: (count: number) => `${count} / 2000`,
  save: "保存记账",
  saveEdit: "保存修改",
  editTitle: "编辑记账",
  delete: "删除",
  saving: "保存中…",
  selectMerchant: "请选择商家",
  selectAccount: (income: boolean) =>
    income ? "请添加收款账户" : "请添加付款账户",
  missingItems: "请添加明细",
  invalidItems: "请完善明细分类和金额",
  missingAmounts: (count: number) =>
    `还有 ${count} 条明细没填金额，点一下去填写`,
  excessDecimals: (count: number) =>
    `${count} 条明细金额的小数位超出当前币种，点一下重新输入`,
  excessDecimalsHint: "新币种不支持这么多位小数，请重新输入",
  unbalanced: (income: boolean) =>
    income ? "收款账户未对上，点一下去调整" : "付款账户未对上，点一下去调整",
  checkAccount: "请完善收支账户，点一下去填写",
  invalidTime: "请选择有效时间",

  cancel: "取消",
  switch: "切换",
  currencyTitle: (name: string) => `切换为 ${name} 账户？`,
  currencyDescription: (from: string, to: string) =>
    `币种将从 ${from} 变为 ${to}，已填写的金额不会换算，数字保持不变。已关联的退款 / 报销会被取消。`,
} as const;

/** 账户周转小票（#1050）。 */
export const transferReceiptMessages = {
  source: "转出",
  target: "转入",
  selectAccount: "选择账户",
  accountTitle: (side: string) => `${side}账户`,
  changeAccount: (side: string, name: string) => `更换${side}账户：${name}`,
  amount: "转账金额",
  save: "保存转账",
  missingSource: "请选择转出账户",
  missingTarget: "请选择转入账户",
  missingAmount: "请输入转账金额",
  invalidAmount: "转账金额无效，点一下重新输入",
  currencyMismatch: "暂不支持不同币种之间的转账",
} as const;

/** 明细抽屉（含独立的退款 / 报销类型）。 */
export const transactionItemPickerMessages = {
  addTitle: "添加明细",
  editTitle: "编辑明细",
  close: "关闭",
  typeLabel: (label: string) => `明细类型${label}`,
  typeTitle: "明细类型",
  typeOptions: [
    { id: "expense", label: "支出" },
    { id: "income", label: "收入" },
    { id: "refund", label: "退款" },
    { id: "reimbursement", label: "报销" },
  ] as const,
  categorySection: { expense: "支出分类", income: "收入分类" },
  linkedHint: "退款 / 报销会抵消原支出，不计入收入。",
  searchCategory: "搜索小分类",
  clearSearch: "清空搜索",
  missingCategories: "请先新增分类。",
  noMatchingCategory: "没有匹配的小分类",
  cancel: "取消",
  remove: "删除明细",
  confirm: "确定",
  saveEdit: "保存修改",
} as const;

/** 退款 / 报销的原支出候选列表与金额输入。 */
export const transactionLinkCandidateMessages = {
  unassignedMerchant: "未指定商家",
  searchPlaceholder: "搜索原支出（全部商家）",
  searchAria: "搜索原支出",
  noSearchResults: "没有找到可关联的支出。",
  loading: "加载中…",
  loadMore: "加载更多",
  noCandidates: "没有可关联的原支出，试试搜索。",
  retry: "加载失败，点击重试",
  merchantExpenses: (name: string) => `${name} 的支出`,
  allExpenses: "全部支出",
  pending: "待报销",
  refundAmount: "退款金额",
  reimbursementAmount: "报销金额",
  selectFirst: (kind: "refund" | "reimbursement") =>
    kind === "refund" ? "先选择要退款的支出" : "先选择要报销的支出",
  remaining: (amount: string) => `剩余未核销 ${amount}`,
  unselectedAmount: "—",
  selectCandidate: (kind: "refund" | "reimbursement", name: string) =>
    `选择${kind === "refund" ? "退款" : "报销"}明细 ${name}`,
  offsetLabel: (kind: "refund" | "reimbursement", amount: string) =>
    `${kind === "refund" ? "已退" : "已报"} ${amount}`,
} as const;
