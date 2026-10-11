export type LedgerDeletionImpact = {
  itemCount: number;
  accountCount: number;
  merchantCount: number;
  pendingInviteCount: number;
  /** 除 owner 外的 active 成员；null 表示没有显示名，由界面回退。 */
  memberNames: (string | null)[];
  /** 未认领的待邀请成员（占位成员），不计入成员数。 */
  placeholderNames: string[];
};
