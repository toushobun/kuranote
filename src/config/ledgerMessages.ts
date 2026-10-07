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
