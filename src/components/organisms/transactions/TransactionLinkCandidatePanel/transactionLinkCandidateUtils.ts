import type { TransactionRefundCandidate } from "types/transactions";

export function matchesLinkCandidateScope(
  candidate: TransactionRefundCandidate,
  currency: string | undefined,
  query: string,
) {
  if (currency && candidate.accountCurrency !== currency) return false;
  const term = query.trim().toLocaleLowerCase();
  if (!term) return true;
  return [
    candidate.categoryName,
    candidate.parentCategoryName,
    candidate.note,
    candidate.merchantName,
    candidate.accountName,
    candidate.amount,
    candidate.transactionAt,
  ].some((value) => value?.toLocaleLowerCase().includes(term));
}

export function sortLinkCandidates(
  candidates: readonly TransactionRefundCandidate[],
  options: {
    kind: "refund" | "reimbursement";
    merchantId?: string;
    historyMerchantIds?: readonly string[];
    lockedAmounts?: ReadonlyMap<string, string>;
    settled: boolean;
  },
) {
  const historical = new Set(options.historyMerchantIds);
  function rank(candidate: TransactionRefundCandidate) {
    if (options.settled) {
      return options.kind === "refund" &&
        options.merchantId &&
        candidate.merchantId === options.merchantId
        ? 1
        : 2;
    }
    if (options.lockedAmounts?.has(candidate.id)) return 0;
    if (historical.has(candidate.merchantId ?? "")) return 1;
    if (
      options.kind === "refund" &&
      options.merchantId &&
      candidate.merchantId === options.merchantId
    )
      return 2;
    return 3;
  }
  return [...candidates].sort(
    (a, b) =>
      rank(a) - rank(b) ||
      new Date(b.transactionAt).getTime() - new Date(a.transactionAt).getTime(),
  );
}
