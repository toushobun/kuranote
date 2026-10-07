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

/** 第 4 步「功能」。功能开关本身的文案由 LedgerSpecialStatusSetting 提供。 */
export const ledgerSetupFeaturesMessages = {
  description: "可以随时在账本设置中开启或关闭",
  title: "需要这些功能吗？",
} as const;

/** 第 5 步「确认一览」。账户名、商家标签与分类名取自草稿、模板与默认分类，不在此重复。 */
export const ledgerSetupConfirmMessages = {
  accounts: {
    skippedDescription: "记账前需要先添加账户",
    title: "账户",
    titleWithCount: (count: number) => `账户（${count}）`,
  },
  basicInfo: {
    colorLabel: (colorLabel: string) => `个性色：${colorLabel}`,
    title: "基本信息",
  },
  categories: {
    description: "按默认创建，之后可在分类管理中调整",
    more: (count: number) => `等 ${count} 个`,
    showAllLabel: (count: number) => `展开全部 ${count} 个分类`,
    title: "分类（自动创建）",
  },
  complete: "完成创建",
  completeErrorTitle: "账本创建失败",
  completing: "创建中",
  description: (ledgerName: string) => `以下内容将添加到「${ledgerName}」`,
  edit: "修改",
  editLabel: (sectionTitle: string) => `修改${sectionTitle}`,
  features: {
    disabled: "未开启",
    enabled: "已开启",
    specialStatus: "报销与退款状态",
    title: "功能",
  },
  merchants: {
    skippedDescription: "记账前需要先添加商家",
    tagCountLabel: (tagName: string, count: number) => `${tagName} ${count} 家`,
    title: "商家",
    titleWithCount: (count: number) => `商家（${count} 家）`,
  },
  skipped: "已跳过",
  title: "确认一下，马上就好",
} as const;

/**
 * 第 6 步「邀请成员」。邀请入口、待邀请成员与邀请弹框的文案由 placeholderMemberText 提供，
 * 读取失败的文案以 internal/ledger 的错误定义为准，不在此重复。
 */
export const ledgerSetupInviteMessages = {
  createdNotice: "账本已创建，可以开始记账了",
  description: "为家人生成专属邀请链接，TA 加入后记录会实时同步",
  finish: "完成",
  loadErrorTitle: "邀请成员读取失败",
  loading: "正在读取邀请成员",
  retry: "重试",
  title: "邀请家人一起记账",
} as const;

/** 完成页（第 6 步之后，不计入进度条）。 */
export const ledgerSetupCompleteMessages = {
  description: (ledgerName: string) => `「${ledgerName}」已经准备好了`,
  goDashboard: "去首页看看",
  hint: "现在就开始记录第一笔吧",
  illustrationLabel: "账本已准备好的插画",
  startRecording: "开始记账",
  stats: {
    accounts: "账户",
    merchants: "商家",
    placeholderMembers: "待邀请成员",
  },
  summaryLabel: "已添加的内容",
  title: "一切就绪！",
} as const;

/** 仅非生产环境可访问的向导预览页（#395 实施拆分第 8 项移除）。 */
export const ledgerSetupPreviewPageMessages = {
  description:
    "仅供验收创建账本向导，正式入口切换后移除。关闭向导后可以重新打开。",
  loading: "创建账本向导预览加载中",
  open: "打开创建账本向导",
  title: "创建账本向导预览",
} as const;
