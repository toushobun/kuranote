export type TransactionBusinessBadgeStatus =
  | "pendingReimbursement"
  | "reimbursed";

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
  "reimbursed",
] as const satisfies readonly TransactionBusinessBadgeStatus[];

export const transactionBusinessBadgeConfig = {
  pendingReimbursement: {
    backgroundColor: "var(--user-theme-business-pending-bg)",
    color: "var(--user-theme-business-pending-text)",
    description: "这笔支出之后需要申请报销",
    label: "待报销",
  },
  reimbursed: {
    backgroundColor: "var(--user-theme-business-completed-bg)",
    color: "var(--user-theme-business-completed-text)",
    description: "这笔支出已经完成报销",
    label: "已报销",
  },
} as const satisfies Record<
  TransactionBusinessBadgeStatus,
  TransactionBusinessBadgeConfig
>;
