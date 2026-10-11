export const ledgerDeletionMessages = {
  section: "危险操作",
  title: "删除账本",
  description: "永久删除此账本及其中的全部明细、账户、商家和成员，无法恢复。",
  delete: "删除",
  impactTitle: (name: string) => `删除「${name}」？`,
  counts: (parts: string[]) => `将永久删除 ${parts.join("、")}`,
  items: (count: number) => `${count.toLocaleString()} 条明细`,
  accounts: (count: number) => `${count.toLocaleString()} 个账户`,
  merchants: (count: number) => `${count.toLocaleString()} 个商家`,
  members: (names: (string | null)[]) =>
    `${names.length} 位成员（${names.map((name) => name ?? "未命名用户").join("、")}）将被移出，并失去此账本的全部数据`,
  placeholders: (names: string[]) =>
    `${names.length} 位待邀请成员（${names.join("、")}）将一并删除`,
  impactLoading: "正在读取删除影响…",
  // 网络中断等无法拿到 Action 结果时的界面兜底；业务失败文案由服务端返回。
  impactUnavailable: "删除影响读取失败，请稍后重试。",
  invitations: "未接受的邀请链接将失效",
  irreversible: "此操作无法撤销",
  backup: "删除前建议先导出数据备份",
  export: "去导出",
  switchBeforeExport:
    "导出功能仅支持当前账本，请先切换到此账本，再前往设置中的数据导出。",
  continue: "继续删除",
  cancel: "取消",
  confirmationTitle: "请输入账本名确认删除",
  // 账本名单独加粗，因此拆成前缀、账本名、后缀三段。
  confirmationDescription: {
    before: "输入",
    ledgerName: (name: string) => `「${name}」`,
    after: "以确认永久删除此账本。",
  },
  nameLabel: "账本名",
  matched: "账本名已匹配",
  permanentDelete: "永久删除",
  back: "返回",
  pending: "正在删除…",
  pendingHint: "正在删除账本，请稍候…",
  failure: "账本删除失败",
} as const;
