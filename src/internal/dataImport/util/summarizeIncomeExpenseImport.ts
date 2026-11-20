import type { IncomeExpenseImportRow } from "internal/dataImport/entity/importRow";

/** 与服务端导入记录类型一致，按分计算混合收支明细的净额。 */
export function summarizeIncomeExpenseImport(
  items: readonly Pick<IncomeExpenseImportRow, "amount" | "transactionType">[],
): {
  totalAmount: number;
  type: IncomeExpenseImportRow["transactionType"];
} {
  const totalAmount =
    items.reduce(
      (sum, item) =>
        sum +
        (item.transactionType === "income" ? 1 : -1) *
          Math.round(item.amount * 100),
      0,
    ) / 100;
  return {
    totalAmount,
    type:
      totalAmount > 0 ||
      (totalAmount === 0 &&
        items.every((item) => item.transactionType === "income"))
        ? "income"
        : "expense",
  };
}
