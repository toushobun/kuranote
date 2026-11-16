import {
  getLinkCandidateDefaultAmount,
  isLinkCandidateSettled,
  type TransactionOffsetEntry,
} from "internal/transaction";
import type { TransactionCategoryOption } from "types/transactions";
import type { TransactionFormInitialValues } from "../TransactionForm/TransactionForm.types";

export function offsetEntryCandidates(entry: TransactionOffsetEntry) {
  return entry.candidates.filter(
    (candidate) => !isLinkCandidateSettled(candidate),
  );
}

export function buildOffsetEntryDraft(
  entry: TransactionOffsetEntry,
  categories: TransactionCategoryOption[],
): TransactionFormInitialValues {
  const candidates = offsetEntryCandidates(entry);
  const category = categories.find((option) => option.systemKey === entry.kind);
  return {
    type: "expense",
    merchantId: entry.merchantId ?? "",
    note: "",
    transactionAt: "",
    payments: [{ accountId: entry.accountId, amount: null }],
    items:
      candidates.length === 1 && category
        ? [
            {
              categoryId: category.id,
              amount: getLinkCandidateDefaultAmount(candidates[0]),
              ...(entry.kind === "refund"
                ? { refundCandidate: candidates[0] }
                : { reimbursementCandidate: candidates[0] }),
            },
          ]
        : [],
  };
}
