import type { TransactionRefundCandidate } from "./transactionReadModels";

/** 从旧记录发起核销时经服务端校验的草稿来源。 */
export type TransactionOffsetEntry = {
  kind: "refund" | "reimbursement";
  merchantId: string | null;
  accountId: string;
  candidates: TransactionRefundCandidate[];
};
