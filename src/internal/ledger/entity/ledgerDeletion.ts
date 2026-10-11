export type LedgerDeletionImpact = {
  itemCount: number;
  accountCount: number;
  merchantCount: number;
  pendingInviteCount: number;
  /** 除 owner 外的成员与未认领占位成员；null 表示没有显示名，由界面回退。 */
  memberNames: (string | null)[];
};
