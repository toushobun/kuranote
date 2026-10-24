import type { TransactionAmountSummary } from "types/transactions";
import { addTransactionAmount } from "utils/transactions";

type TransactionAmountItem = {
  amount: string;
  business_net_amount?: string | null;
  category_id: string | null;
};
type TransactionAmountCategory = { id: string; type: "income" | "expense" };

/** 先使用退款 / 报销后的业务净额，再抵消同笔记录的收支；关联收入由视图置零。 */
export function calculateRecordNetAmount(
  items: TransactionAmountItem[],
  categoryById: ReadonlyMap<string, TransactionAmountCategory>,
) {
  return items.reduce(
    (sum, item) => sum + getSignedItemAmount(item, categoryById, true),
    0,
  );
}

export function addSignedAmount(
  summary: TransactionAmountSummary,
  amount: number,
) {
  if (!Number.isFinite(amount) || amount === 0) return;

  addTransactionAmount(
    summary,
    amount > 0 ? "income" : "expense",
    String(Math.abs(amount)),
  );
}

export function getSignedItemAmount(
  item: TransactionAmountItem,
  categoryById: ReadonlyMap<string, TransactionAmountCategory>,
  useBusinessNetAmount = true,
) {
  const amount = Number(
    useBusinessNetAmount
      ? (item.business_net_amount ?? item.amount)
      : item.amount,
  );

  if (!Number.isFinite(amount)) return 0;

  const categoryType = item.category_id
    ? categoryById.get(item.category_id)?.type
    : undefined;

  if (categoryType === "income") {
    return amount;
  }
  if (categoryType === "expense") {
    return -amount;
  }

  return 0;
}
