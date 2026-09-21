import type { ParsedTable } from "internal/dataImport/entity/parsedTable";
import type {
  ImportExecutionUnit,
  TransferImportRow,
} from "internal/dataImport/entity/importRow";
import type {
  ImportValidationIssue,
  ImportValidationResult,
} from "internal/dataImport/entity/importValidationIssue";
import { detectSheetKind } from "internal/dataImport/util/detectSheetKind";
import { groupIncomeExpenseRows } from "internal/dataImport/util/groupIncomeExpenseRows";
import {
  parseIncomeExpenseSheet,
  type IncomeExpenseSheetRow,
} from "internal/dataImport/util/parseIncomeExpenseSheet";
import { parseBalanceAdjustmentSheet } from "internal/dataImport/util/parseBalanceAdjustmentSheet";
import { parseTransferSheet } from "internal/dataImport/util/parseTransferSheet";

/**
 * 按 sheet 名识别每个 ParsedTable 属于「收支」「转账」「余额变更」中的哪一种，
 * 分别解析并校验，最终汇总为一个 ImportValidationResult。不匹配这三个名字的
 * 工作表忽略，不算错误。
 *
 * 三种 sheet 至少存在一个，否则视为结构性错误。
 */
export function validateImportWorkbook(
  tables: ParsedTable[],
): ImportValidationResult {
  return analyzeImportWorkbook(tables).result;
}

export type AnalyzeImportWorkbookResult = {
  result: ImportValidationResult;
  /** 仅在校验通过时非空：按「收支」「转账」「余额变更」的顺序展开的全部执行单元。 */
  units: ImportExecutionUnit[];
};

/**
 * 与 `validateImportWorkbook` 相同的校验，同时在同一次解析中产出执行单元，
 * 避免调用方为拿到执行单元把同一份表格再解析一遍。
 */
export function analyzeImportWorkbook(
  tables: ParsedTable[],
): AnalyzeImportWorkbookResult {
  if (tables.length === 0) {
    return {
      result: {
        issues: [
          { kind: "structural", message: "文件为空或没有可识别的数据表。" },
        ],
        ok: false,
      },
      units: [],
    };
  }

  const issues: ImportValidationIssue[] = [];
  const incomeExpenseTables: ParsedTable[] = [];
  const transferTables: ParsedTable[] = [];
  const balanceAdjustmentTables: ParsedTable[] = [];

  for (const table of tables) {
    const kind = detectSheetKind(table.sourceName);

    if (kind === "incomeExpense") {
      incomeExpenseTables.push(table);
    } else if (kind === "transfer") {
      transferTables.push(table);
    } else if (kind === "balanceAdjustment") {
      balanceAdjustmentTables.push(table);
    }
  }

  if (
    incomeExpenseTables.length === 0 &&
    transferTables.length === 0 &&
    balanceAdjustmentTables.length === 0
  ) {
    issues.push({
      kind: "structural",
      message: "未找到「收支」「转账」或「余额变更」表，无法导入。",
    });
  }

  const incomeExpenseSheetRows: IncomeExpenseSheetRow[] = [];
  for (const table of incomeExpenseTables) {
    const result = parseIncomeExpenseSheet(table);
    issues.push(...result.issues);
    incomeExpenseSheetRows.push(...result.rows);
  }

  const grouped = groupIncomeExpenseRows(incomeExpenseSheetRows);
  issues.push(...grouped.issues);

  const transferRows: TransferImportRow[] = [];
  for (const table of transferTables) {
    const result = parseTransferSheet(table);
    issues.push(...result.issues);
    transferRows.push(...result.rows);
  }

  const balanceAdjustmentRows = balanceAdjustmentTables.flatMap((table) => {
    const parsed = parseBalanceAdjustmentSheet(table);
    issues.push(...parsed.issues);
    return parsed.rows;
  });

  if (issues.length > 0) {
    return { result: { issues, ok: false }, units: [] };
  }

  return {
    result: {
      ok: true,
      summary: {
        balanceAdjustmentCount: balanceAdjustmentRows.length,
        incomeExpenseCount: grouped.groups.length,
        transferCount: transferRows.length,
      },
    },
    units: [
      ...grouped.groups.map(
        (group): ImportExecutionUnit => ({ group, kind: "incomeExpense" }),
      ),
      ...transferRows.map(
        (row): ImportExecutionUnit => ({ kind: "transfer", row }),
      ),
      ...balanceAdjustmentRows.map(
        (row): ImportExecutionUnit => ({ kind: "balanceAdjustment", row }),
      ),
    ],
  };
}
