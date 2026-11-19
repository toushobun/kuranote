import type {
  EmbeddedWorksheetPhoto,
  ParsedTable,
} from "internal/dataImport/entity/parsedTable";
import type {
  ImportExecutionUnit,
  TransferImportRow,
} from "internal/dataImport/entity/importRow";
import type {
  ImportValidationIssue,
  ImportValidationResult,
} from "internal/dataImport/entity/importValidationIssue";
import {
  importPhotoValidationMessages,
  importStructuralErrorMessages,
} from "internal/dataImport/errors";
import { incomeExpensePhotoColumnNames } from "internal/dataImport/schema";
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
  photosByRow?: Map<number, EmbeddedWorksheetPhoto[]>;
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
          {
            kind: "structural",
            message: importStructuralErrorMessages.workbookEmpty,
          },
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
      message: importStructuralErrorMessages.sheetNotFound,
    });
  }

  // 相同类型的多个「收支」工作表各自从第 1 行计数，只有行号无法区分图片归属。
  // 未包含图片的旧式多工作表导入仍按原行为执行。
  if (
    incomeExpenseTables.length > 1 &&
    incomeExpenseTables.some(
      (table) =>
        (table.photos?.length ?? 0) > 0 || (table.photoIssues?.length ?? 0) > 0,
    )
  ) {
    issues.push({
      kind: "structural",
      message: importPhotoValidationMessages.multipleIncomeExpenseSheets,
      sheet: "incomeExpense",
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
  const photosByRow = new Map<number, EmbeddedWorksheetPhoto[]>();
  const firstRows = new Set(grouped.groups.map((group) => group.rowNumbers[0]));
  for (const table of incomeExpenseTables) {
    issues.push(...(table.photoIssues ?? []));
    for (const photo of table.photos ?? []) {
      if (!firstRows.has(photo.rowNumber)) {
        issues.push({
          column: photo.columnName,
          kind: "row",
          message: importPhotoValidationMessages.notFirstRow,
          rowNumber: photo.rowNumber,
          sheet: "incomeExpense",
        });
      }
      const list = photosByRow.get(photo.rowNumber) ?? [];
      list.push(photo);
      photosByRow.set(photo.rowNumber, list);
    }
  }
  for (const photos of photosByRow.values()) {
    photos.sort(
      (a, b) =>
        incomeExpensePhotoColumnNames.indexOf(
          a.columnName as (typeof incomeExpensePhotoColumnNames)[number],
        ) -
        incomeExpensePhotoColumnNames.indexOf(
          b.columnName as (typeof incomeExpensePhotoColumnNames)[number],
        ),
    );
  }

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
    ...(photosByRow.size ? { photosByRow } : {}),
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
