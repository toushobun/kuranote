import type {
  CategorySummaryDbRow,
  TransactionItemDbRow,
} from "internal/db-types";
import type { CategoryType } from "internal/category";
import type { TransactionAmountSummary } from "internal/transaction/service/read/transactionReadModels";
import {
  addTransactionAmount,
  createTransactionAmountSummary,
} from "utils/transactions";

type TransactionAmountItem = Pick<
  TransactionItemDbRow,
  | "amount"
  | "category_id"
  | "id"
  | "is_refund_income"
  | "is_reimbursement_income"
  | "refunded_amount"
  | "settled_by_item_id"
  | "special_status"
>;

type TransactionAmountCategory = Pick<CategorySummaryDbRow, "id" | "type">;

export function buildSettledIncomeItemIdSet(items: TransactionAmountItem[]) {
  return new Set(
    items.flatMap((item) =>
      item.settled_by_item_id ? [item.settled_by_item_id] : [],
    ),
  );
}

export function getSignedTransactionItemAmount(
  item: TransactionAmountItem,
  categoryById: ReadonlyMap<string, TransactionAmountCategory>,
  settledIncomeItemIds: ReadonlySet<string> = new Set(),
) {
  return getSignedItemAmount(item, categoryById, true, settledIncomeItemIds);
}

export function calculateTransactionRecordNetAmount(
  items: TransactionAmountItem[],
  categoryById: ReadonlyMap<string, TransactionAmountCategory>,
) {
  return calculateRecordNetAmount(items, categoryById);
}

export function calculateTransactionRecordDisplayAmount(
  items: TransactionAmountItem[],
  categoryById: ReadonlyMap<string, TransactionAmountCategory>,
) {
  return items.reduce(
    (sum, item) => sum + getSignedItemAmount(item, categoryById, false),
    0,
  );
}

export function getTransactionRecordCategoryType(
  items: TransactionAmountItem[],
  categoryById: ReadonlyMap<string, TransactionAmountCategory>,
): CategoryType {
  const summary = getTransactionRecordAmountProfile(items, categoryById);

  if (summary.netAmount > 0) return "income";
  if (summary.netAmount < 0) return "expense";
  if (summary.hasExpense) return "expense";
  if (summary.hasIncome) return "income";

  return "expense";
}

export function createSummary(currency: string): TransactionAmountSummary {
  return createTransactionAmountSummary(currency);
}

export function calculateRecordNetAmount(
  items: TransactionAmountItem[],
  categoryById: ReadonlyMap<string, TransactionAmountCategory>,
) {
  const settledIncomeItemIds = buildSettledIncomeItemIdSet(items);
  return items.reduce(
    (sum, item) =>
      sum + getSignedItemAmount(item, categoryById, true, settledIncomeItemIds),
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

export function normalizeSummary(
  summary: TransactionAmountSummary,
): TransactionAmountSummary {
  return {
    balance: String(Number(summary.balance)),
    currency: summary.currency,
    expense: String(Number(summary.expense)),
    income: String(Number(summary.income)),
  };
}

function getTransactionRecordAmountProfile(
  items: TransactionAmountItem[],
  categoryById: ReadonlyMap<string, TransactionAmountCategory>,
) {
  let expenseTotal = 0;
  let hasExpense = false;
  let hasIncome = false;
  let incomeTotal = 0;
  const settledIncomeItemIds = buildSettledIncomeItemIdSet(items);

  for (const item of items) {
    const categoryType = item.category_id
      ? categoryById.get(item.category_id)?.type
      : undefined;

    if (categoryType === "income") {
      hasIncome = true;
    } else if (categoryType === "expense") {
      hasExpense = true;
    }

    const signedAmount = getSignedItemAmount(
      item,
      categoryById,
      true,
      settledIncomeItemIds,
    );
    if (signedAmount > 0) incomeTotal += signedAmount;
    else if (signedAmount < 0) expenseTotal += -signedAmount;
  }

  return {
    expenseTotal,
    hasExpense,
    hasIncome,
    incomeTotal,
    netAmount: incomeTotal - expenseTotal,
  };
}

function getSignedItemAmount(
  item: TransactionAmountItem,
  categoryById: ReadonlyMap<string, TransactionAmountCategory>,
  deductRefundedAmount = true,
  settledIncomeItemIds: ReadonlySet<string> = new Set(),
) {
  const amount = Number(item.amount);

  if (!Number.isFinite(amount)) return 0;

  const categoryType = item.category_id
    ? categoryById.get(item.category_id)?.type
    : undefined;

  if (categoryType === "income") {
    const isSettlingIncome =
      item.is_reimbursement_income ||
      (item.id ? settledIncomeItemIds.has(item.id) : false);
    return deductRefundedAmount && (item.is_refund_income || isSettlingIncome)
      ? 0
      : amount;
  }
  if (categoryType === "expense") {
    if (deductRefundedAmount && item.special_status === "reimbursed") return 0;
    const refundedAmount = deductRefundedAmount
      ? Number(item.refunded_amount ?? 0)
      : 0;
    return -Math.max(0, amount - refundedAmount);
  }

  return 0;
}
