export const settingsComingSoonMessage = "正在准备中";

export const settingsPreferencesPageMessages = {
  title: "App 偏好设置",
  backToSettings: "返回设置",
  subtitle: "调整主题外观、收支颜色与语言",
  entriesLabel: "偏好设置项",
  loading: "App 偏好设置加载中",
} as const;

export const settingsPreferencesEntryMessages = {
  theme: "主题换装",
  transactionColors: "收支颜色",
  language: "语言设置",
  currentLanguage: "简体中文",
} as const;

export const settingsProfilePageMessages = {
  title: "个人主页",
  backToSettings: "返回设置",
  subtitle: "管理头像、昵称与账号安全",
  loading: "个人主页加载中",
  summaryLabel: "账号信息",
  profileGroupLabel: "个人资料",
  securityGroupLabel: "账号安全",
  accountActionsGroupLabel: "账号操作",
} as const;

export const settingsProfileEntryMessages = {
  nickname: "修改昵称",
  password: "修改密码",
  accountBinding: "账号绑定",
  logout: "退出登录",
} as const;

export const profileNicknameDialogMessages = {
  title: "修改昵称",
  label: "昵称",
  helperText: "1–100 个字符，首尾空白会被去除",
  cancel: "取消",
  save: "保存",
  successTitle: "昵称已保存",
  failureTitle: "昵称保存失败",
} as const;

export const ledgerNicknameSyncDialogMessages = {
  title: "是否同步修改以下账本中的昵称？",
  description: (displayName: string) =>
    `勾选的账本中的昵称会改为「${displayName}」，未勾选的账本保持当前昵称。`,
  currentNickname: (displayName: string) => `当前昵称：${displayName}`,
  listLabel: "同步昵称的账本",
  selectAll: "全选",
  selectNone: "全不选",
  onlyPersonal: "仅修改个人昵称",
  confirm: "确定",
} as const;
