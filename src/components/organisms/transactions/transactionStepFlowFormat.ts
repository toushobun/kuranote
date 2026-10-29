import { flowMessages as m } from "config/transactionStepFlowMessages";
import type { TransactionItemSummary } from "organisms/transactions/TransactionForm/TransactionForm.types";
import type { TransactionCategoryOption } from "types/transactions";
import { formatUnsignedCurrencyAmount } from "utils/transactions";

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
  return `${item.category?.type === "income" ? "+ " : ""}${formatUnsignedCurrencyAmount(item.amount, currency)}`;
}

/** 分步流程的合计：支出减收入，收入多于支出时带「+ 」。 */
export function formatStepNetTotal(
  expenseTotal: number,
  incomeTotal: number,
  currency: string,
) {
  return `${incomeTotal > expenseTotal ? "+ " : ""}${formatUnsignedCurrencyAmount(String(expenseTotal - incomeTotal), currency)}`;
}
