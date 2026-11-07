/** 创建账本向导（#395）的界面文案。错误文案以 internal/ledger 的错误定义为准，不在此重复。 */
export const ledgerSetupWizardMessages = {
  close: "关闭创建账本向导",
  dismissNotice: "关闭提示",
  next: "下一步",
  previous: "上一步",
  progressLabel: "创建进度",
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
  /** 保存草稿时预设模板已更新或生活地区已变更，向导已按最新进度刷新。 */
  templateUpdatedNotice: "预设内容已更新，请重新确认",
  title: "创建账本",
} as const;

export const ledgerSetupBasicInfoMessages = {
  description: "这些信息之后都可以在账本设置中修改",
  errorTitle: "账本保存失败",
  title: "先给账本起个名字吧",
} as const;

/** 第 2 步「账户」。账户类型名取自 accountTypeOptions，账户名取自预设模板，不在此重复。 */
export const ledgerSetupAccountsMessages = {
  checklist: {
    groupCheckboxLabel: (name: string) => `选择「${name}」的全部账户`,
    groupSelectedCount: (selected: number, total: number) =>
      `${selected} / ${total}`,
  },
  description: "勾选常用的账户，没有的可以稍后在账户管理中添加",
  limitReached: (maxAccounts: number) =>
    `账户最多 ${maxAccounts} 个，请减少勾选`,
  nextWithCount: (count: number) => `下一步 · 已选 ${count} 个`,
  title: "你平时用哪些方式付钱？",
} as const;

/** 第 3 步「商家」。商家标签名与商家名取自预设模板，不在此重复。 */
export const ledgerSetupMerchantsMessages = {
  description: "没有的可以稍后在商家管理中添加，名称和别名也可以修改",
  nextWithCount: (count: number) => `下一步 · 已选 ${count} 家`,
  noTemplate: {
    description: "可以直接进入下一步，之后在商家管理中添加",
    title: "请先选择生活地区",
  },
  title: "挑选常去的商家",
} as const;

/** 第 4 步「功能」。功能开关本身的文案由各功能开关组件提供。 */
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
    multiAccountPayment: "多账户付款",
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

/** 打开向导的入口（首页「继续创建」、账本管理页「创建中」条目）。 */
export const ledgerSetupEntryMessages = {
  close: "关闭",
  continue: "继续创建",
  continueCardTitle: (ledgerName: string) => `「${ledgerName}」还没创建完`,
  continueLedger: (ledgerName: string) => `继续创建${ledgerName}`,
  dashboardSubtitle: "完成创建后，就可以开始记录家庭收支了",
  dashboardTitle: "你的账本还差一点",
  draftNotice: "你有一个账本草稿，请先完成创建。或",
  restart: "重新创建",
  inProgressLabel: "创建中",
  loadErrorTitle: "创建账本向导读取失败",
  loading: "正在打开创建账本向导",
  progress: (step: number, stepLabel: string) =>
    `进行到第 ${step} 步 · ${stepLabel}`,
  progressLabel: "创建进度",
  retry: "重试",
  stepCount: (step: number, stepCount: number) =>
    `第 ${step} / ${stepCount} 步`,
} as const;

export const ledgerSetupAbandonMessages = {
  abandon: "放弃创建",
  cancel: "取消",
  title: (name: string) => `放弃创建「${name}」？`,
  description: "已填写的内容将被删除，且无法恢复。",
  pending: "正在放弃创建",
  failed: "放弃创建失败",
} as const;
