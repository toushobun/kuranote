export const ledgerPageMessages = {
  title: "账本管理",
  subtitle: "查看和管理你加入的账本",
  backToSettings: "返回设置",
  create: "新增账本",
  loading: "账本数据加载中",
} as const;

export const ledgerSettingsPageMessages = {
  title: "账本设置",
  subtitle: "管理账本信息与成员设置",
  backToLedgers: "返回账本管理",
  loading: "账本设置加载中",
} as const;

/** 账本基本信息字段（创建账本向导第 1 步）。 */
export const ledgerBasicInfoFieldMessages = {
  clearLedgerName: "清空账本名称",
  colorHelper: "将用于成员标识与记录展示",
  colorLabel: "我的个性色",
  currencyLabel: "默认货币",
  displayNameHelper: "这是你在当前账本中的显示昵称",
  displayNameLabel: "我的显示名",
  ledgerNameLabel: "账本名称",
} as const;

/** 账本功能开关卡片（账本设置页与创建账本向导第 4 步共用）。 */
export const ledgerFeatureSettingMessages = {
  canEditOnly: "只有管理员或所有者可以修改此设置。",
  loadFailed: "功能设置加载失败，请稍后重试。",
  loading: "正在加载功能设置…",
  multiAccountPayment: {
    description: "一笔支出可以由多个同币种账户共同支付，并分别填写金额。",
    disabledDescription: "关闭时每笔记录只能选择一个付款账户。",
    enabledDescription:
      "如果账本内已有使用多个付款账户的记录，将无法关闭；请先把这些记录改为单个付款账户。",
    sectionTitle: "多账户付款",
    switchLabel: "启用多账户付款",
  },
  retry: "重试",
} as const;
