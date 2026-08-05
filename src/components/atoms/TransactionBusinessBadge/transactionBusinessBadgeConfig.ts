import type { TransactionBusinessStatus } from "internal/transaction";

type TransactionBusinessBadgeConfig = {
  backgroundColor: string;
  color: string;
  description: string;
  label: string;
};

export const transactionBusinessBadgeStatuses = [
  "pendingReimbursement",
  "reimbursed",
  "refund",
  "reimbursement",
] as const satisfies readonly TransactionBusinessStatus[];

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
  refund: {
    backgroundColor: "var(--user-theme-income-bg)",
    color: "var(--user-theme-income-amount)",
    description: "这笔收入来自退款关联",
    label: "退款",
  },
  reimbursement: {
    backgroundColor: "var(--user-theme-business-completed-bg)",
    color: "var(--user-theme-business-completed-text)",
    description: "这笔收入来自报销关联",
    label: "报销",
  },
} as const satisfies Record<
  TransactionBusinessStatus,
  TransactionBusinessBadgeConfig
>;
