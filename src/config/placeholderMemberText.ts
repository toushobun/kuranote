/** 待邀请成员（占位）相关的界面文案，成员管理页、邀请落地页与账户表单共用。 */
export const placeholderMemberText = {
  // 成员列表中的状态。只有管理者能看到链接状态，其他成员只看到「待邀请」。
  pendingLabel: "待邀请",
  statusLinkPending: "等待加入",
  statusNoLink: "未生成链接",
  nameLabel: "名字",
  namePlaceholder: "例如：奶奶",
  cancel: "取消",
  close: "关闭",
  detailDialogTitle: "待邀请成员",
  renameLabel: "修改名字",
  renameSave: "保存名字",
  rowSubtitleNoInvite: "点开可生成专属邀请链接",
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
    "生成后把链接发给 TA。TA 通过链接加入账本后，记在该名字下的账户与记录会归到 TA 名下。",
  inviteRoleLabel: "加入后的权限",
  revokeInvite: "撤销邀请",
  copyLink: "复制链接",
  deleteAction: "删除待邀请成员",
  deleteConfirmTitle: "删除待邀请成员？",
  deleteConfirmDescription: (name: string) =>
    `确定删除「${name}」吗？绑定的邀请链接也会同时失效，且无法恢复。若仍是账户持有人，请先把相关账户的持有人改为其他人或无持有人。`,
  deleteConfirmLabel: "删除",
  renamedTitle: "名字已更新",
  deletedTitle: "已删除待邀请成员",
  failureTitles: {
    delete: "删除待邀请成员失败",
    rename: "修改名字失败",
  },
  // 「邀请成员」入口与弹框（#809：邀请成员 = 待邀请成员 + 专属链接）。
  inviteEntryTitle: "邀请成员",
  inviteEntrySubtitle: "填写名字，生成 TA 的专属邀请链接",
  inviteEntryReadOnlySubtitle: "仅管理员或所有者可以邀请成员",
  inviteDialogTitle: "邀请成员",
  inviteDialogDescription:
    "填写对方的名字和加入后的权限，生成专属邀请链接后发给 TA。TA 加入前会显示为待邀请成员，也可以先作为账户持有人。",
  inviteSubmit: "生成邀请链接",
  inviteFailureTitles: {
    create: "生成邀请链接失败",
    invite: "邀请成员失败",
    revoke: "撤销邀请失败",
  },
  /**
   * 以某人身份加入的说明：复制区域与邀请落地页共用同一份文案。
   * 名字必须实时读取；措辞不暗示一定存在历史账户。
   */
  identityNotice: (name: string) =>
    `邀请你以「${name}」的身份加入账本。加入后，记在「${name}」名下的账户与记录会归到你名下。`,
  accountHolderGroupLabel: "待邀请成员",
  accountHolderOptionLabel: (name: string) => `${name}（待邀请）`,
  accountHolderHelper:
    "持有人用于标识该账户的主要使用者，可选择一位成员或一位待邀请成员，最多 1 个。",
} as const;
