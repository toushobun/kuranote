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
  "amount" | "category_id" | "is_refund_income" | "refunded_amount"
>;

type TransactionAmountCategory = Pick<CategorySummaryDbRow, "id" | "type">;

export function getSignedTransactionItemAmount(
  item: TransactionAmountItem,
  categoryById: ReadonlyMap<string, TransactionAmountCategory>,
) {
  return getSignedItemAmount(item, categoryById);
}

export function calculateTransactionRecordNetAmount(
  items: TransactionAmountItem[],
  categoryById: ReadonlyMap<string, TransactionAmountCategory>,
) {
  return calculateRecordNetAmount(items, categoryById);
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
  return items.reduce(
    (sum, item) => sum + getSignedItemAmount(item, categoryById),
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

  for (const item of items) {
    const categoryType = item.category_id
      ? categoryById.get(item.category_id)?.type
      : undefined;

    if (categoryType === "income") {
      hasIncome = true;
    } else if (categoryType === "expense") {
      hasExpense = true;
    }

    const amount = Number(item.amount);

    if (!Number.isFinite(amount)) continue;

    if (categoryType === "income" && !item.is_refund_income) {
      incomeTotal += amount;
    } else if (categoryType === "expense") {
      expenseTotal += Math.max(0, amount - Number(item.refunded_amount ?? 0));
    }
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
) {
  const amount = Number(item.amount);

  if (!Number.isFinite(amount)) return 0;

  const categoryType = item.category_id
    ? categoryById.get(item.category_id)?.type
    : undefined;

  if (categoryType === "income") return item.is_refund_income ? 0 : amount;
  if (categoryType === "expense") {
    return -Math.max(0, amount - Number(item.refunded_amount ?? 0));
  }

  return 0;
}
