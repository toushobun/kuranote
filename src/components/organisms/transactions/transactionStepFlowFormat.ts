import { flowMessages as m } from "config/transactionStepFlowMessages";
import type { TransactionItemSummary } from "organisms/transactions/TransactionForm/TransactionForm.types";
import type { TransactionCategoryOption } from "types/transactions";
import { getCurrencySymbol } from "utils/currency";
import { getAmountDecimalPlaces } from "utils/transactionAmountInput";
import {
  formatUnsignedCurrencyAmount,
  hasBusinessNetAmountOffset,
} from "utils/transactions";

const plainAmountPattern = /^\d+(\.\d+)?$/;
const signedAmountPattern = /^-?\d+(\.\d+)?$/;

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

/** 金额文本求和：跳过空值和非数字，按其中最多的小数位取整，避免浮点误差。 */
function sumDecimalAmounts(amounts: readonly (string | undefined)[]) {
  let total = 0;
  let decimals = 0;
  for (const amount of amounts) {
    const text = amount?.trim() ?? "";
    if (!signedAmountPattern.test(text)) continue;
    decimals = Math.max(decimals, countDecimals(text));
    total += Number(text);
  }
  return Number(total.toFixed(decimals));
}

type ReceiptTotalItem = Pick<
  TransactionItemSummary,
  | "amount"
  | "businessNetAmount"
  | "category"
  | "refundedAmount"
  | "reimbursementAmount"
>;

/**
 * 小票合计：支出 / 收入按原金额（换币种后小数位超出的金额也按原值计入，合计不会显示成 ¥0），
 * 净额按业务金额（扣除被其他记录退款 / 报销核销的部分），已退款 / 已报销取支出明细的核销金额。
 */
export function summarizeStepReceiptTotals(items: readonly ReceiptTotalItem[]) {
  const filled = items.filter((item) =>
    plainAmountPattern.test(item.amount.trim()),
  );
  const expenses = filled.filter((item) => item.category?.type !== "income");
  const incomes = filled.filter((item) => item.category?.type === "income");
  const businessTotal = (list: readonly ReceiptTotalItem[]) =>
    sumDecimalAmounts(
      list.map((item) => item.businessNetAmount ?? item.amount),
    );
  return {
    expenseTotal: sumDecimalAmounts(expenses.map((item) => item.amount)),
    incomeTotal: sumDecimalAmounts(incomes.map((item) => item.amount)),
    businessExpenseTotal: businessTotal(expenses),
    businessIncomeTotal: businessTotal(incomes),
    refundedTotal: sumDecimalAmounts(
      expenses.map((item) => item.refundedAmount),
    ),
    reimbursedTotal: sumDecimalAmounts(
      expenses.map((item) => item.reimbursementAmount),
    ),
    // 有核销时左侧显示「净额」而不是「合计」。
    hasBusinessOffset: filled.some((item) =>
      hasBusinessNetAmountOffset(item.amount, item.businessNetAmount),
    ),
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
