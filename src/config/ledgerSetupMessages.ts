/** 创建账本向导（#395）的界面文案。错误文案以 internal/ledger 的错误定义为准，不在此重复。 */
export const ledgerSetupWizardMessages = {
  close: "关闭创建账本向导",
  closeConfirm: {
    continue: "继续创建",
    description:
      "目前的进度已保存。账本会显示为「创建中」，你可以随时回来继续完成。",
    later: "稍后再说",
    title: "稍后再继续？",
  },
  dismissNotice: "关闭提示",
  next: "下一步",
  placeholder: "该步骤将在后续版本实现",
  previous: "上一步",
  progressLabel: "创建进度",
  skip: "跳过此步",
  stepStatus: {
    completed: "已完成",
    upcoming: "未开始",
  },
  steps: {
    accounts: "账户",
    basicInfo: "基本信息",
    confirm: "确认",
    features: "功能",
    invite: "邀请",
    merchants: "商家",
  },
  saveErrorTitle: "创建进度保存失败",
  submitting: "保存中",
  /** 保存草稿时预设模板已更新或默认货币已变更，向导已按最新进度刷新。 */
  templateUpdatedNotice: "预设内容已更新，请重新确认",
  title: "创建账本",
} as const;

export const ledgerSetupBasicInfoMessages = {
  currencyChangeConfirm: {
    confirm: "确定修改",
    description: "修改默认货币会清空已选的账户和商家，确定继续吗？",
    title: "修改默认货币",
  },
  description: "这些信息之后都可以在账本设置中修改",
  errorTitle: "账本保存失败",
  title: "先给账本起个名字吧",
} as const;

/** 第 2 步「账户」与添加账户底部弹层。账户类型名取自 accountTypeOptions，不在此重复。 */
export const ledgerSetupAccountsMessages = {
  add: "添加",
  addSheet: {
    added: "已添加",
    candidatesTitle: (typeLabel: string) => `常用${typeLabel}`,
    close: "关闭",
    nameDuplicate: "已有同名账户，请修改名称",
    nameLabel: "账户名称",
    namePlaceholder: "输入名称或从下方选择",
    nameRequired: "请输入名称",
    nameTooLong: (maxLength: number) => `名称不能超过 ${maxLength} 个字`,
    submit: "添加",
    title: (typeLabel: string) => `添加${typeLabel}`,
  },
  addTypeLabel: (typeLabel: string) => `添加${typeLabel}`,
  description: "勾选或添加你的账户，之后也可以在账户管理中修改",
  limitReached: (maxAccounts: number) =>
    `账户最多 ${maxAccounts} 个，已达到上限`,
  nextWithCount: (count: number) => `下一步 · 已选 ${count} 个`,
  title: "你平时用哪些方式付钱？",
} as const;

/** 第 3 步「商家」。商家标签名与商家名取自预设模板，不在此重复。 */
export const ledgerSetupMerchantsMessages = {
  checklist: {
    groupCheckboxLabel: (tagName: string) => `选择「${tagName}」的全部商家`,
    groupSelectedCount: (selected: number, total: number) =>
      `已选 ${selected} / ${total} 家`,
    selectAll: "全选",
    selectNone: "全不选",
  },
  description: "为你准备了常用商家，按分类勾选即可，展开可逐个调整",
  nextWithCount: (count: number) => `下一步 · 已选 ${count} 家`,
  noTemplate: {
    description: "可以跳过此步，之后在商家管理中添加",
    title: "暂无该币种的预设商家",
  },
  selectAll: "全部选择",
  selectNone: "全不选",
  title: "挑选常去的商家",
} as const;

/** 仅非生产环境可访问的向导预览页（#395 实施拆分第 8 项移除）。 */
export const ledgerSetupPreviewPageMessages = {
  description:
    "仅供验收创建账本向导，正式入口切换后移除。关闭向导后可以重新打开。",
  loading: "创建账本向导预览加载中",
  open: "打开创建账本向导",
  title: "创建账本向导预览",
} as const;
