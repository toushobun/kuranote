import {
  calculateRecordNetAmount,
  getSignedItemAmount,
} from "utils/transactionRecordAmounts";
export {
  calculateRecordNetAmount,
  addSignedAmount,
} from "utils/transactionRecordAmounts";
import type {
  CategorySummaryDbRow,
  TransactionItemDbRow,
} from "internal/db-types";
import type { CategoryType } from "internal/category";
import type { TransactionAmountSummary } from "internal/transaction/service/read/transactionReadModels";
import { createTransactionAmountSummary } from "utils/transactions";

type TransactionAmountItem = Pick<
  TransactionItemDbRow,
  "amount" | "business_net_amount" | "category_id"
>;

type TransactionAmountCategory = Pick<CategorySummaryDbRow, "id" | "type">;

export function getSignedTransactionItemAmount(
  item: TransactionAmountItem,
  categoryById: ReadonlyMap<string, TransactionAmountCategory>,
) {
  return getSignedItemAmount(item, categoryById, true);
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

    const signedAmount = getSignedItemAmount(item, categoryById, true);
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
