import type { ParsedTable } from "internal/dataImport/entity/parsedTable";
import type { ImportValidationIssue } from "internal/dataImport/entity/importValidationIssue";
import {
  importCurrencyPattern,
  importNoteMaxLength,
  incomeExpenseColumns,
  incomeExpenseSharedColumns,
  incomeExpenseTypeValues,
  type IncomeExpenseSharedColumn,
} from "internal/dataImport/schema";
import {
  buildColumnIndex,
  findColumnStructuralIssues,
} from "internal/dataImport/util/columnIndex";
import { parseAccountType } from "internal/dataImport/util/parseAccountType";
import { parseHolderName } from "internal/dataImport/util/parseHolderName";
import { parseImportAmount } from "internal/dataImport/util/parseImportAmount";
import { parseImportDate } from "internal/dataImport/util/parseImportDate";

/**
 * 「收支」表一行的解析结果。共享字段（见 `incomeExpenseSharedColumns`）只做
 * 逐字段的格式合法性校验（字面 `-` 也算合法），保留原始文本，不解析成最终
 * 值——是否是「账单关联」分组的首行、首行与后续行是否一致，依赖分组关系，
 * 交给 `groupIncomeExpenseRows` 处理。
 */
export type IncomeExpenseSheetRow = {
  amount: number;
  billRef: string | null;
  childCategoryName: string | null;
  parentCategoryName: string;
  rowNumber: number;
  sharedTexts: Record<IncomeExpenseSharedColumn, string>;
  transactionType: "expense" | "income";
};

export type ParseIncomeExpenseSheetResult = {
  issues: ImportValidationIssue[];
  rows: IncomeExpenseSheetRow[];
};

const billRefPlaceholder = "-";

const sharedColumnValidators: Partial<
  Record<IncomeExpenseSharedColumn, (text: string) => string | null>
> = {
  商家: (text) => (text ? null : "商家不能为空。"),
  日期: (text) =>
    parseImportDate(text).ok
      ? null
      : "日期格式不正确，应为 YYYY-MM-DD HH:MM:SS。",
  账户: (text) => (text ? null : "账户不能为空。"),
  账户持有人: (text) =>
    parseHolderName(text).ok
      ? null
      : "账户持有人只能填写 0 个或 1 个持有人姓名，不支持填写多个持有人。",
  账户币种: (text) =>
    importCurrencyPattern.test(text)
      ? null
      : "账户币种必须是 3 位字母代码，例如 CNY。",
  账户类型: (text) => {
    const result = parseAccountType(text, "账户类型");
    return result.ok ? null : result.message;
  },
  备注: (text) =>
    text.length > importNoteMaxLength
      ? `备注不能超过 ${importNoteMaxLength} 个字符。`
      : null,
};

export function parseIncomeExpenseSheet(
  table: ParsedTable,
): ParseIncomeExpenseSheetResult {
  const structuralIssues = findColumnStructuralIssues(
    table,
    incomeExpenseColumns,
    "incomeExpense",
  );

  if (structuralIssues.length > 0) {
    return { issues: structuralIssues, rows: [] };
  }

  const columnIndex = buildColumnIndex(table.headerRow);

  const issues: ImportValidationIssue[] = [];
  const rows: IncomeExpenseSheetRow[] = [];

  for (const tableRow of table.rows) {
    const get = (name: string) => {
      const position = columnIndex[name];
      return position === undefined
        ? ""
        : (tableRow.cells[position] ?? "").trim();
    };
    const rowNumber = tableRow.rowNumber;
    let hasError = false;

    const addIssue = (column: string, message: string) => {
      issues.push({
        column,
        kind: "row",
        message,
        rowNumber,
        sheet: "incomeExpense",
      });
      hasError = true;
    };

    const billRef = get("账单关联") || null;
    const isGrouped = billRef !== null;

    const sharedTexts = {} as Record<IncomeExpenseSharedColumn, string>;
    for (const column of incomeExpenseSharedColumns) {
      const text = get(column);
      sharedTexts[column] = text;

      if (isGrouped && text === billRefPlaceholder) {
        continue;
      }

      const errorMessage = sharedColumnValidators[column]?.(text);
      if (errorMessage) {
        addIssue(column, errorMessage);
      }
    }

    const typeText = get("交易类型");
    if (!(incomeExpenseTypeValues as readonly string[]).includes(typeText)) {
      addIssue("交易类型", "交易类型必须是「支出」或「收入」。");
    }

    const parentCategoryName = get("一级分类");
    if (!parentCategoryName) {
      addIssue("一级分类", "一级分类不能为空。");
    }

    const amountResult = parseImportAmount(get("金额"), { allowZero: true });
    if (!amountResult.ok) {
      addIssue("金额", "金额必须是不超过两位小数的非负数字。");
    }

    if (hasError) {
      continue;
    }

    rows.push({
      amount: amountResult.ok ? amountResult.value : 0,
      billRef,
      childCategoryName: get("二级分类") || null,
      parentCategoryName,
      rowNumber,
      sharedTexts,
      transactionType: typeText === "支出" ? "expense" : "income",
    });
  }

  return { issues, rows };
}
