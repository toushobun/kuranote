/**
 * 未认领的账本占位成员摘要。id 是独立的占位标识，永远不是 userId，
 * 不能用于查询 app_user、头像或邮箱，也不计入成员数。
 */
export type LedgerPlaceholderMemberSummary = {
  displayName: string;
  id: string;
};

/** 占位名字与 Service / 表单校验共用的最大长度。 */
export const ledgerPlaceholderMemberNameMaxLength = 100;
