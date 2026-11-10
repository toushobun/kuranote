export const accountPageMessages = {
  title: "账户管理",
  subtitle: "整理家里的现金、银行卡、电子钱包和信用卡",
  backToSettings: "返回设置",
  create: "新增账户",
  loading: "账户数据加载中",
} as const;

/** 新增 / 编辑账户页面的文案。 */
export const accountFormMessages = {
  back: "返回",
  backToAccounts: "返回账户管理",
  createTitle: "新增账户",
  createSubtitle: (ledgerName: string) =>
    `账户管理 〉 新增账户 · ${ledgerName}`,
  createErrorTitle: "新增账户失败",
  loading: "新增账户页面加载中",
  editTitle: "编辑账户",
  editSubtitle: (ledgerName: string) => `账户管理 〉 编辑账户 · ${ledgerName}`,
  editErrorTitle: "保存账户失败",
  editLoading: "编辑账户页面加载中",
  archive: "删除",
  archiveErrorTitle: "删除账户失败",
  basicSection: "基本信息",
  nameLabel: "账户名称",
  namePlaceholder: "例如：钱包现金",
  typeLabel: "账户类型",
  amountSection: "金额",
  currencyLabel: "货币",
  initialBalanceLabel: "初始金额",
  initialBalanceHelper: "信用卡欠款请填负数，之后可用余额调整修改",
  currentBalanceLabel: "当前余额",
  currentBalanceHelper: "修改后会自动记一笔余额调整，可附上备注",
  holderSection: "持有人",
  holderHelper: "用于标识该账户的主要使用者，最多选择 1 位，可不选",
  noHolderOptions: "当前账本没有可选持有人。",
  preservedHolderLabel: (name: string) => `${name}（非活跃）`,
  preservedHolderHelper:
    "非活跃成员持有人不能在这里选择；不选新持有人时保存会保留，选了新持有人则会被替换",
  cancel: "取消",
  save: "保存账户",
  saveChanges: "保存修改",
  saving: "保存中",
} as const;

export const accountIconMessages = {
  websiteLabel: "网址（可选）",
  websiteHelper: "填写银行、钱包或卡的官网，可获取网站图标。",
  fetch: "获取图标",
  clear: "改用文字图标",
  idle: "默认显示账户名的文字图标。",
  loading: "正在获取网站图标…",
  success: "已获取图标",
  successHelper: "保存后，账户列表和记账界面会显示这个图标。",
  error: "没有获取到图标",
  errorHelper: "请检查网址，或继续使用文字图标。",
} as const;
