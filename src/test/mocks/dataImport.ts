import type { ImportExecutionUnit } from "internal/dataImport";
import type {
  BalanceAdjustmentImportRow,
  IncomeExpenseImportRow,
  TransferImportRow,
} from "internal/dataImport/entity/importRow";

/** 构造一个转账执行单元，可覆盖任意行字段（例如转出/转入持有人）。 */
export function makeTransferUnit(
  overrides: Partial<TransferImportRow> = {},
): ImportExecutionUnit {
  return {
    kind: "transfer",
    row: {
      amount: 100,
      fromAccountCurrency: "JPY",
      fromAccountHolder: null,
      fromAccountName: "钱包",
      fromAccountType: "cash",
      note: null,
      rowNumber: 2,
      toAccountCurrency: "JPY",
      toAccountHolder: null,
      toAccountName: "银行卡",
      toAccountType: "bank",
      transactionAt: "2026-09-17 10:00:00",
      ...overrides,
    },
  };
}

/** 构造一个只有一条明细的收支执行单元。 */
export function makeIncomeExpenseUnit(
  overrides: Partial<IncomeExpenseImportRow> = {},
): ImportExecutionUnit {
  const item: IncomeExpenseImportRow = {
    accountCurrency: "JPY",
    accountHolder: null,
    accountName: "钱包",
    accountType: "cash",
    amount: 1200,
    billRef: null,
    childCategoryName: "食材",
    merchantName: "超市",
    merchantTag: null,
    note: null,
    parentCategoryName: "餐饮",
    rowNumber: 2,
    transactionAt: "2026-09-17 10:00:00",
    transactionType: "expense",
    ...overrides,
  };
  return {
    kind: "incomeExpense",
    group: { items: [item], rowNumbers: [item.rowNumber] },
  };
}

/** 构造一个余额变更执行单元。 */
export function makeBalanceAdjustmentUnit(
  overrides: Partial<BalanceAdjustmentImportRow> = {},
): ImportExecutionUnit {
  return {
    kind: "balanceAdjustment",
    row: {
      accountCurrency: "JPY",
      accountHolder: null,
      accountName: "现金",
      accountType: "cash",
      amount: 100,
      note: null,
      rowNumber: 2,
      transactionAt: "2026-09-17 10:00:00",
      ...overrides,
    },
  };
}

/**
 * 构造 `analyzeImportFile` 的校验通过结果：`count` 条转账执行单元，转出账户
 * 持有人统一为 `fromAccountHolder`（默认无持有人）。
 */
export function makeAnalyzeImportFileResult(
  count: number,
  fromAccountHolder: string | null = null,
) {
  const units: ImportExecutionUnit[] = Array.from(
    { length: count },
    (_, index) => makeTransferUnit({ fromAccountHolder, rowNumber: index + 2 }),
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
    "账户类型",
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
        账户类型: "现金",
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
