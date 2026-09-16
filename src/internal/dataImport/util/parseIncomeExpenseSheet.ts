import type { ParsedTable } from "internal/dataImport/entity/parsedTable";
import type { IncomeExpenseImportRow } from "internal/dataImport/entity/importRow";
import type { ImportValidationIssue } from "internal/dataImport/entity/importValidationIssue";
import {
  importCurrencyPattern,
  importNoteMaxLength,
  incomeExpenseColumns,
  incomeExpenseTypeValues,
} from "internal/dataImport/schema";
import {
  buildColumnIndex,
  findMissingRequiredColumns,
} from "internal/dataImport/util/columnIndex";
import { parseHolderList } from "internal/dataImport/util/parseHolderList";
import { parseImportAmount } from "internal/dataImport/util/parseImportAmount";
import { parseImportDate } from "internal/dataImport/util/parseImportDate";

export type ParseIncomeExpenseSheetResult = {
  issues: ImportValidationIssue[];
  rows: IncomeExpenseImportRow[];
};

export function parseIncomeExpenseSheet(
  table: ParsedTable,
): ParseIncomeExpenseSheetResult {
  const columnIndex = buildColumnIndex(table.headerRow);
  const missingColumns = findMissingRequiredColumns(
    columnIndex,
    incomeExpenseColumns,
  );

  if (missingColumns.length > 0) {
    return {
      issues: [
        {
          kind: "structural",
          message: `「收支」表缺少必填列：${missingColumns.join("、")}。`,
          sheet: "incomeExpense",
        },
      ],
      rows: [],
    };
  }

  const issues: ImportValidationIssue[] = [];
  const rows: IncomeExpenseImportRow[] = [];

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

    const dateResult = parseImportDate(get("日期"));
    if (!dateResult.ok) {
      addIssue("日期", "日期格式不正确，应为 YYYY-MM-DD。");
    }

    const typeText = get("交易类型");
    if (!(incomeExpenseTypeValues as readonly string[]).includes(typeText)) {
      addIssue("交易类型", "交易类型必须是「支出」或「收入」。");
    }

    const merchantName = get("商家");
    if (!merchantName) {
      addIssue("商家", "商家不能为空。");
    }

    const parentCategoryName = get("一级分类");
    if (!parentCategoryName) {
      addIssue("一级分类", "一级分类不能为空。");
    }

    const accountName = get("账户");
    if (!accountName) {
      addIssue("账户", "账户不能为空。");
    }

    const accountCurrencyText = get("账户币种");
    if (!importCurrencyPattern.test(accountCurrencyText)) {
      addIssue("账户币种", "账户币种必须是 3 位字母代码，例如 CNY。");
    }

    const amountResult = parseImportAmount(get("金额"), { allowZero: true });
    if (!amountResult.ok) {
      addIssue("金额", "金额必须是不超过两位小数的非负数字。");
    }

    const note = get("备注");
    if (note.length > importNoteMaxLength) {
      addIssue("备注", `备注不能超过 ${importNoteMaxLength} 个字符。`);
    }

    if (hasError) {
      continue;
    }

    rows.push({
      accountCurrency: accountCurrencyText.toUpperCase(),
      accountHolders: parseHolderList(get("账户持有人")),
      accountName,
      amount: amountResult.ok ? amountResult.value : 0,
      billRef: get("账单关联") || null,
      childCategoryName: get("二级分类") || null,
      merchantName,
      merchantTag: get("商家分类") || null,
      note: note || null,
      parentCategoryName,
      rowNumber,
      transactionAt: dateResult.ok ? dateResult.value : "",
      transactionType: typeText === "支出" ? "expense" : "income",
    });
  }

  return { issues, rows };
}
