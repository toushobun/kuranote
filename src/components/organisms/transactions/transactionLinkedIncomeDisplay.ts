import type { TransactionItemSummary } from "./TransactionForm/TransactionForm.types";

type LinkedIncomeDisplayItem = Pick<
  TransactionItemSummary,
  "amount" | "businessNetAmount" | "businessStatus"
> & {
  refundCandidate?: { id: string } | null;
  reimbursementCandidate?: { id: string } | null;
};

/** 小票与合计共用：原支出只能抵到零，剩余金额属于本次退款 / 报销收入。 */
export function getLinkedIncomeDisplayAmounts(item: LinkedIncomeDisplayItem) {
  const kind =
    item.refundCandidate || item.businessStatus?.incomeLinkRole === "refund"
      ? ("refund" as const)
      : item.reimbursementCandidate ||
          item.businessStatus?.incomeLinkRole === "reimbursement"
        ? ("reimbursement" as const)
        : null;
  const amount = Number(item.amount);
  if (!kind || !Number.isFinite(amount) || amount < 0) {
    return { kind: null, offsetAmount: 0, surplusAmount: 0 };
  }
  const businessAmount = Number(
    item.businessNetAmount ?? item.businessStatus?.surplusAmount ?? "0",
  );
  const surplusAmount = Number.isFinite(businessAmount)
    ? Math.min(amount, Math.max(businessAmount, 0))
    : 0;
  return {
    kind,
    offsetAmount: Math.max(0, amount - surplusAmount),
    surplusAmount,
  };
}
