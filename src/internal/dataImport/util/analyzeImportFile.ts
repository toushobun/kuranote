import type { ImportExecutionUnit } from "internal/dataImport/entity/importRow";
import type { ImportValidationResult } from "internal/dataImport/entity/importValidationIssue";
import {
  dataImportErrorCodes,
  getDataImportErrorMessage,
} from "internal/dataImport/errors";
import { maxImportFileSizeBytes } from "internal/dataImport/schema";
import { detectSheetKind } from "internal/dataImport/util/detectSheetKind";
import { groupIncomeExpenseRows } from "internal/dataImport/util/groupIncomeExpenseRows";
import { parseImportFile } from "internal/dataImport/util/parseImportFile";
import { parseIncomeExpenseSheet } from "internal/dataImport/util/parseIncomeExpenseSheet";
import { parseTransferSheet } from "internal/dataImport/util/parseTransferSheet";
import { validateImportWorkbook } from "internal/dataImport/util/validateImportWorkbook";
import type { ParsedTable } from "internal/dataImport/entity/parsedTable";

export type AnalyzeImportFileResult = {
  result: ImportValidationResult;
  /** 仅在 `result.ok` 时非空：按「收支」再「转账」的顺序展开的全部执行单元。 */
  units: ImportExecutionUnit[];
};

/** 从已通过校验的 ParsedTable 展开全部执行单元。 */
export function buildImportExecutionUnits(
  tables: ParsedTable[],
): ImportExecutionUnit[] {
  const incomeExpenseRows = tables
    .filter((table) => detectSheetKind(table.sourceName) === "incomeExpense")
    .flatMap((table) => parseIncomeExpenseSheet(table).rows);
  const transferRows = tables
    .filter((table) => detectSheetKind(table.sourceName) === "transfer")
    .flatMap((table) => parseTransferSheet(table).rows);

  return [
    ...groupIncomeExpenseRows(incomeExpenseRows).groups.map(
      (group): ImportExecutionUnit => ({ group, kind: "incomeExpense" }),
    ),
    ...transferRows.map(
      (row): ImportExecutionUnit => ({ kind: "transfer", row }),
    ),
  ];
}

/**
 * 浏览器端一次性解析并校验导入文件：文件本身不会上传到服务器，校验通过后
 * 返回的执行单元由调用方分批发给 Server Action。本函数不读写数据库。
 */
export async function analyzeImportFile(
  file: File,
): Promise<AnalyzeImportFileResult> {
  if (file.size > maxImportFileSizeBytes) {
    return {
      result: {
        issues: [
          {
            kind: "structural",
            message: getDataImportErrorMessage(
              dataImportErrorCodes.fileTooLarge,
            )!,
          },
        ],
        ok: false,
      },
      units: [],
    };
  }

  const parsed = await parseImportFile(file.name, await file.arrayBuffer());
  if (!parsed.ok) {
    return {
      result: {
        issues: [{ kind: "structural", message: parsed.message }],
        ok: false,
      },
      units: [],
    };
  }

  const result = validateImportWorkbook(parsed.tables);
  return {
    result,
    units: result.ok ? buildImportExecutionUnits(parsed.tables) : [],
  };
}
