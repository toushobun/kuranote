import type { ParsedTable } from "internal/dataImport/entity/parsedTable";
import type {
  IncomeExpenseImportRow,
  TransferImportRow,
} from "internal/dataImport/entity/importRow";
import type {
  ImportValidationIssue,
  ImportValidationResult,
} from "internal/dataImport/entity/importValidationIssue";
import { detectSheetKind } from "internal/dataImport/util/detectSheetKind";
import { groupIncomeExpenseRows } from "internal/dataImport/util/groupIncomeExpenseRows";
import { parseIncomeExpenseSheet } from "internal/dataImport/util/parseIncomeExpenseSheet";
import { parseTransferSheet } from "internal/dataImport/util/parseTransferSheet";

/**
 * 按表头识别每个 ParsedTable 属于「收支」「转账」「余额变更」中的哪一种，
 * 分别解析并校验，最终汇总为一个 ImportValidationResult。
 *
 * 「余额变更」sheet 只做识别、不解析内容（#755 完成前本期不支持），
 * 识别到本身不算失败，会体现在成功结果的 `balanceAdjustmentDetected` 里。
 */
export function validateImportWorkbook(
  tables: ParsedTable[],
): ImportValidationResult {
  if (tables.length === 0) {
    return {
      issues: [
        { kind: "structural", message: "文件为空或没有可识别的数据表。" },
      ],
      ok: false,
    };
  }

  const issues: ImportValidationIssue[] = [];
  const incomeExpenseTables: ParsedTable[] = [];
  const transferTables: ParsedTable[] = [];
  let balanceAdjustmentDetected = false;

  for (const table of tables) {
    const kind = detectSheetKind(table.headerRow);

    if (kind === "incomeExpense") {
      incomeExpenseTables.push(table);
    } else if (kind === "transfer") {
      transferTables.push(table);
    } else if (kind === "balanceAdjustment") {
      balanceAdjustmentDetected = true;
    } else {
      issues.push({
        kind: "structural",
        message: `无法识别「${table.sourceName}」的表格类型，请确认表头是否符合「收支」或「转账」模板要求。`,
      });
    }
  }

  if (
    incomeExpenseTables.length === 0 &&
    transferTables.length === 0 &&
    !balanceAdjustmentDetected &&
    issues.length === 0
  ) {
    issues.push({
      kind: "structural",
      message: "未找到「收支」或「转账」表，无法导入。",
    });
  }

  const incomeExpenseRows: IncomeExpenseImportRow[] = [];
  for (const table of incomeExpenseTables) {
    const result = parseIncomeExpenseSheet(table);
    issues.push(...result.issues);
    incomeExpenseRows.push(...result.rows);
  }

  const grouped = groupIncomeExpenseRows(incomeExpenseRows);
  issues.push(...grouped.issues);

  const transferRows: TransferImportRow[] = [];
  for (const table of transferTables) {
    const result = parseTransferSheet(table);
    issues.push(...result.issues);
    transferRows.push(...result.rows);
  }

  if (issues.length > 0) {
    return { issues, ok: false };
  }

  return {
    ok: true,
    summary: {
      balanceAdjustmentDetected,
      incomeExpenseCount: grouped.groups.length,
      transferCount: transferRows.length,
    },
  };
}
