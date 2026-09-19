import type { ImportExecutionUnit } from "internal/dataImport";

/** 构造 `analyzeImportFile` 的校验通过结果：`count` 条转账执行单元。 */
export function makeAnalyzeImportFileResult(count: number) {
  const units: ImportExecutionUnit[] = Array.from(
    { length: count },
    (_, index) => ({
      kind: "transfer",
      row: {
        amount: 100,
        fromAccountCurrency: "JPY",
        fromAccountHolder: null,
        fromAccountName: "钱包",
        note: null,
        rowNumber: index + 2,
        toAccountCurrency: "JPY",
        toAccountHolder: null,
        toAccountName: "银行卡",
        transactionAt: "2026-09-17 10:00:00",
      },
    }),
  );

  return {
    result: {
      ok: true as const,
      summary: {
        balanceAdjustmentDetected: false,
        incomeExpenseCount: 0,
        transferCount: count,
      },
    },
    units,
  };
}
