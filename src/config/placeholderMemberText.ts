/** 待邀请成员（占位）相关的界面文案，成员管理页与账户表单共用。 */
export const placeholderMemberText = {
  pendingLabel: "待邀请",
  inviteMemberBadge: "待接受邀请",
  addEntryTitle: "添加待邀请成员",
  addEntrySubtitle: "为尚未加入的家人先记下名字，之后再邀请认领",
  addDialogTitle: "添加待邀请成员",
  addDialogDescription:
    "待邀请成员可以先作为账户持有人记账，之后生成专属邀请链接，由本人加入并接管。",
  nameLabel: "名字",
  namePlaceholder: "例如：奶奶",
  create: "添加",
  cancel: "取消",
  close: "关闭",
  detailDialogTitle: "待邀请成员",
  renameLabel: "修改名字",
  renameSave: "保存名字",
  rowSubtitleNoInvite: "尚未生成邀请链接",
  rowSubtitleReadOnly: "可作为账户持有人，不计入成员数",
  rowAriaLabel: (name: string, status: string) => `${name}，${status}`,
  readOnlyNote: "只有管理员或所有者可以管理待邀请成员。",
  notMemberNote:
    "待邀请成员不是账本成员，不能登录、记账，也不计入成员数；可以作为账户持有人。",
  generateInvite: "生成专属邀请链接",
  viewInvite: "查看邀请链接",
  inviteSectionTitle: "专属邀请",
  draftTitle: (name: string) => `邀请「${name}」加入`,
  generateInviteDescription:
    "生成后，对方通过链接加入账本，并接管该待邀请成员名下的历史账户与交易记录。",
  inviteRoleLabel: "加入后的权限",
  revokeInvite: "撤销邀请",
  copyLink: "复制链接",
  deleteAction: "删除待邀请成员",
  deleteConfirmTitle: "删除待邀请成员？",
  deleteConfirmDescription: (name: string) =>
    `确定删除「${name}」吗？绑定的邀请链接也会同时失效，且无法恢复。若仍是账户持有人，请先把相关账户的持有人改为其他人或无持有人。`,
  deleteConfirmLabel: "删除",
  createdTitle: "已添加待邀请成员",
  renamedTitle: "名字已更新",
  deletedTitle: "已删除待邀请成员",
  failureTitles: {
    create: "添加待邀请成员失败",
    delete: "删除待邀请成员失败",
    rename: "修改名字失败",
  },
  takeoverNotice: (name: string) =>
    `这是邀请你加入并接管「${name}」的历史账户与交易记录。`,
  accountHolderGroupLabel: "待邀请成员",
  accountHolderOptionLabel: (name: string) => `${name}（待邀请）`,
  accountHolderHelper:
    "持有人用于标识该账户的主要使用者，可选择一位成员或一位待邀请成员，最多 1 个。",
} as const;
