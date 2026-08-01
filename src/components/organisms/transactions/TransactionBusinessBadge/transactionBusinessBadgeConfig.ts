export type TransactionBusinessBadgeStatus =
  | "pendingReimbursement"
  | "pendingRefund"
  | "reimbursed"
  | "refunded"
  | "excluded";

export type TransactionSpecialStatusValue =
  TransactionBusinessBadgeStatus | null;

type TransactionBusinessBadgeConfig = {
  backgroundColor: string;
  color: string;
  description: string;
  label: string;
};

export const transactionBusinessBadgeStatuses = [
  "pendingReimbursement",
  "pendingRefund",
  "reimbursed",
  "refunded",
  "excluded",
] as const satisfies readonly TransactionBusinessBadgeStatus[];

export const transactionBusinessBadgeConfig = {
  pendingReimbursement: {
    backgroundColor: "var(--user-theme-business-pending-bg)",
    color: "var(--user-theme-business-pending-text)",
    description: "这笔支出之后需要申请报销",
    label: "待报销",
  },
  pendingRefund: {
    backgroundColor: "var(--user-theme-business-refund-bg)",
    color: "var(--user-theme-business-refund-text)",
    description: "这笔支出正在等待商家退款",
    label: "待退款",
  },
  reimbursed: {
    backgroundColor: "var(--user-theme-business-completed-bg)",
    color: "var(--user-theme-business-completed-text)",
    description: "这笔支出已经完成报销",
    label: "已报销",
  },
  refunded: {
    backgroundColor: "var(--user-theme-business-completed-bg)",
    color: "var(--user-theme-business-completed-text)",
    description: "这笔支出已经完成退款",
    label: "已退款",
  },
  excluded: {
    backgroundColor: "var(--user-theme-business-excluded-bg)",
    color: "var(--user-theme-business-excluded-text)",
    description: "保留记录，但从支出统计中排除",
    label: "不计入支出",
  },
} as const satisfies Record<
  TransactionBusinessBadgeStatus,
  TransactionBusinessBadgeConfig
>;
