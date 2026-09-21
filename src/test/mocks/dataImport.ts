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
        balanceAdjustmentCount: 0,
        incomeExpenseCount: 0,
        transferCount: count,
      },
    },
    units,
  };
}

export function makeBalanceAdjustmentTable(
  overrides: Record<string, string>[] = [{}],
) {
  const headerRow = [
    "交易类型",
    "日期",
    "记账人",
    "账户",
    "账户币种",
    "账户持有人",
    "金额",
    "备注",
  ];
  return {
    sourceName: "余额变更",
    headerRow,
    rows: overrides.map((override, index) => {
      const values: Record<string, string> = {
        交易类型: "余额变更",
        日期: "2026-01-05 12:00:00",
        记账人: "不会被读取",
        账户: "现金",
        账户币种: "JPY",
        账户持有人: "",
        金额: "100",
        备注: "初始余额",
        ...override,
      };
      return {
        rowNumber: index + 2,
        cells: headerRow.map((name) => values[name]),
      };
    }),
  };
}
