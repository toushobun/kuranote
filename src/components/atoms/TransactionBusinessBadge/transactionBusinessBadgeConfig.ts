import type { TransactionIncomeLinkRole } from "internal/transaction";

export type TransactionBusinessBadgeKind =
  | "pendingReimbursement"
  | "refunded"
  | "reimbursed"
  | "settled"
  | "refundOffset"
  | "reimbursementOffset"
  | "refundIncome"
  | "reimbursementIncome";

type TransactionBusinessBadgeConfig = {
  backgroundColor: string;
  color: string;
  description: string;
  label: string;
};

export const transactionBusinessBadgeConfig = {
  pendingReimbursement: {
    backgroundColor: "var(--user-theme-business-pending-bg)",
    color: "var(--user-theme-business-pending-text)",
    description: "这笔支出已进入报销流程，尚有未核销余额",
    label: "待报销",
  },
  reimbursed: {
    backgroundColor: "var(--user-theme-business-completed-bg)",
    color: "var(--user-theme-business-completed-text)",
    description: "这笔支出已由报销收入完成核销",
    label: "已报销",
  },
  refunded: {
    backgroundColor: "var(--user-theme-income-bg)",
    color: "var(--user-theme-income-amount)",
    description: "这笔支出已由退款收入完成核销",
    label: "已退款",
  },
  settled: {
    backgroundColor: "var(--user-theme-business-completed-bg)",
    color: "var(--user-theme-business-completed-text)",
    description: "这笔支出已由退款和报销收入共同完成核销",
    label: "已结清",
  },
  refundOffset: {
    backgroundColor: "var(--user-theme-income-bg)",
    color: "var(--user-theme-income-amount)",
    description: "这笔支出中由退款收入核销的金额",
    label: "退款核销",
  },
  reimbursementOffset: {
    backgroundColor: "var(--user-theme-business-completed-bg)",
    color: "var(--user-theme-business-completed-text)",
    description: "这笔支出中由报销收入核销的金额",
    label: "报销核销",
  },
  refundIncome: {
    backgroundColor: "var(--user-theme-income-bg)",
    color: "var(--user-theme-income-amount)",
    description: "这笔收入是退款核销来源",
    label: "退款收入",
  },
  reimbursementIncome: {
    backgroundColor: "var(--user-theme-business-completed-bg)",
    color: "var(--user-theme-business-completed-text)",
    description: "这笔收入是报销核销来源",
    label: "报销收入",
  },
} as const satisfies Record<
  TransactionBusinessBadgeKind,
  TransactionBusinessBadgeConfig
>;

export function getIncomeLinkRoleBadgeKind(
  role: TransactionIncomeLinkRole,
): "refundIncome" | "reimbursementIncome" {
  return role === "refund" ? "refundIncome" : "reimbursementIncome";
}
