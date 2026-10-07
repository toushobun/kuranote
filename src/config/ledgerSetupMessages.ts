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
  submitting: "保存中",
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

/** 仅非生产环境可访问的向导预览页（#395 实施拆分第 8 项移除）。 */
export const ledgerSetupPreviewPageMessages = {
  description:
    "仅供验收创建账本向导，正式入口切换后移除。关闭向导后可以重新打开。",
  loading: "创建账本向导预览加载中",
  open: "打开创建账本向导",
  title: "创建账本向导预览",
} as const;
