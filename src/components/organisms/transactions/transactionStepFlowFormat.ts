import { flowMessages as m } from "config/transactionStepFlowMessages";
import type { TransactionItemSummary } from "organisms/transactions/TransactionForm/TransactionForm.types";
import type { TransactionCategoryOption } from "types/transactions";
import { getCurrencySymbol } from "utils/currency";
import { getAmountDecimalPlaces } from "utils/transactionAmountInput";
import { formatUnsignedCurrencyAmount } from "utils/transactions";

const plainAmountPattern = /^\d+(\.\d+)?$/;

function countDecimals(amount: string) {
  return amount.split(".")[1]?.length ?? 0;
}

/** 不带正负号的「符号 + 金额」；换币种后小数位超出时按原值显示，不按新币种四舍五入。 */
export function formatStepCurrencyAmount(amount: string, currency: string) {
  const decimals = countDecimals(amount);
  if (decimals <= getAmountDecimalPlaces(currency))
    return formatUnsignedCurrencyAmount(amount, currency);
  return `${getCurrencySymbol(currency)}${new Intl.NumberFormat(undefined, {
    maximumFractionDigits: decimals,
  }).format(Math.abs(Number(amount)))}`;
}

/**
 * 小票的支出 / 收入合计：换币种后小数位超出的金额也按原值计入，合计不会显示成 ¥0；
 * 按其中最多的小数位取整，避免浮点误差。
 */
export function sumStepItemAmounts(
  items: readonly Pick<TransactionItemSummary, "amount" | "category">[],
) {
  const totals = { expense: 0, income: 0 };
  let decimals = 0;
  for (const item of items) {
    const amount = item.amount.trim();
    if (!plainAmountPattern.test(amount)) continue;
    decimals = Math.max(decimals, countDecimals(amount));
    totals[item.category?.type === "income" ? "income" : "expense"] +=
      Number(amount);
  }
  return {
    expenseTotal: Number(totals.expense.toFixed(decimals)),
    incomeTotal: Number(totals.income.toFixed(decimals)),
  };
}

/** 分步流程中明细的品名：「大分类 · 小分类」，未选分类时显示提示。 */
export function formatStepItemCategory(category?: TransactionCategoryOption) {
  return category
    ? [category.parentName, category.name].filter(Boolean).join(" · ")
    : m.missingCategory;
}

/** 分步流程中明细的金额：收入带「+ 」，未填写时显示「待输入」。 */
export function formatStepItemAmount(
  item: Pick<TransactionItemSummary, "amount" | "category">,
  currency: string,
) {
  if (!item.amount.trim()) return m.pendingAmount;
  return `${item.category?.type === "income" ? "+ " : ""}${formatStepCurrencyAmount(item.amount, currency)}`;
}

/** 分步流程的合计：支出减收入，收入多于支出时带「+ 」。 */
export function formatStepNetTotal(
  expenseTotal: number,
  incomeTotal: number,
  currency: string,
) {
  const decimals = Math.max(
    countDecimals(String(expenseTotal)),
    countDecimals(String(incomeTotal)),
  );
  return `${incomeTotal > expenseTotal ? "+ " : ""}${formatStepCurrencyAmount(Math.abs(expenseTotal - incomeTotal).toFixed(decimals), currency)}`;
}
