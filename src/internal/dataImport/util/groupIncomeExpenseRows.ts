import type {
  ImportTransactionGroup,
  IncomeExpenseImportRow,
} from "internal/dataImport/entity/importRow";
import type { ImportRowIssue } from "internal/dataImport/entity/importValidationIssue";
import { incomeExpenseImportErrorMessages } from "internal/dataImport/errors";
import {
  incomeExpenseSharedColumns,
  type IncomeExpenseSharedColumn,
} from "internal/dataImport/schema";
import type { IncomeExpenseSheetRow } from "internal/dataImport/util/parseIncomeExpenseSheet";
import { parsePaymentAccounts } from "internal/dataImport/util/parsePaymentAccounts";
import { validateImportPayments } from "internal/dataImport/util/validateImportPayments";
import { parseImportDate } from "internal/dataImport/util/parseImportDate";

export type GroupIncomeExpenseRowsResult = {
  groups: ImportTransactionGroup[];
  issues: ImportRowIssue[];
};

const billRefPlaceholder = "-";

/**
 * 「账户币种」最终以大写存储、校验时也不区分大小写，因此比较后续行是否
 * 「与首行完全相同」时同样按大写比较，避免 `cny` 与 `CNY` 被误判为不一致。
 */
function normalizedSharedText(column: IncomeExpenseSharedColumn, text: string) {
  return column === "账户币种" ? text.toUpperCase() : text;
}

function resolveSharedFields(row: IncomeExpenseSheetRow) {
  const dateText = row.sharedTexts["日期"];
  const dateResult = parseImportDate(dateText);
  const result = parsePaymentAccounts(row.sharedTexts);
  if (!result.ok) return result;
  return {
    ok: true as const,
    value: {
      payments: result.payments,
      merchantName: row.sharedTexts["商家"],
      merchantTag: row.sharedTexts["商家分类"] || null,
      note: row.sharedTexts["备注"] || null,
      transactionAt: dateResult.ok ? dateResult.value : dateText,
    },
  };
}

function buildItem(
  row: IncomeExpenseSheetRow,
  shared: Extract<
    ReturnType<typeof resolveSharedFields>,
    { ok: true }
  >["value"],
): IncomeExpenseImportRow {
  return {
    ...shared,
    amount: row.amount,
    billRef: row.billRef,
    childCategoryName: row.childCategoryName,
    parentCategoryName: row.parentCategoryName,
    rowNumber: row.rowNumber,
    transactionType: row.transactionType,
  };
}

/**
 * 「账单关联」合并规则：
 *
 * - 共享字段（见 `incomeExpenseSharedColumns`）在同一个非空 `账单关联` 值下，
 *   只由第一次出现的行（按文件顺序，与 `交易类型` 无关）提供真实值；后续行
 *   必须填字面 `-` 以继承首行的值，或者原样复述首行内容，除此之外的值都
 *   视为不一致，报告行错误且该行不参与合并。
 * - 同一账单关联合并成一笔交易，每条明细保留自己的收支类型。
 * - `账单关联` 为空的行各自独立成组，不受上述规则影响。
 */
export function groupIncomeExpenseRows(
  rows: IncomeExpenseSheetRow[],
): GroupIncomeExpenseRowsResult {
  const issues: ImportRowIssue[] = [];
  const groups: ImportTransactionGroup[] = [];
  const billRefFirstRow = new Map<string, IncomeExpenseSheetRow>();
  const billGroups = new Map<string, ImportTransactionGroup>();

  for (const row of rows) {
    let firstRow =
      row.billRef === null ? row : billRefFirstRow.get(row.billRef);
    const billRef = row.billRef;
    if (billRef !== null) {
      if (!firstRow) {
        const placeholderColumns = incomeExpenseSharedColumns.filter(
          (column) => row.sharedTexts[column] === billRefPlaceholder,
        );

        if (placeholderColumns.length > 0) {
          issues.push({
            column: "账单关联",
            kind: "row",
            message:
              incomeExpenseImportErrorMessages.billRefFirstRowPlaceholder(
                billRef,
                row.rowNumber,
                placeholderColumns,
              ),
            rowNumber: row.rowNumber,
            sheet: "incomeExpense",
          });
          continue;
        }

        billRefFirstRow.set(billRef, row);
        firstRow = row;
      } else {
        const mismatchedColumns = incomeExpenseSharedColumns.filter(
          (column) => {
            const text = row.sharedTexts[column];
            return (
              text !== billRefPlaceholder &&
              normalizedSharedText(column, text) !==
                normalizedSharedText(column, firstRow!.sharedTexts[column])
            );
          },
        );

        if (mismatchedColumns.length > 0) {
          issues.push({
            column: "账单关联",
            kind: "row",
            message: incomeExpenseImportErrorMessages.billRefSharedMismatch(
              billRef,
              firstRow.rowNumber,
              row.rowNumber,
              mismatchedColumns,
            ),
            rowNumber: row.rowNumber,
            sheet: "incomeExpense",
          });
          continue;
        }
      }
    }

    const groupKey = billRef;
    const shared = resolveSharedFields(firstRow!);
    if (!shared.ok) {
      issues.push({
        column: shared.column,
        message: shared.message,
        kind: "row",
        rowNumber: row.rowNumber,
        sheet: "incomeExpense",
      });
      continue;
    }
    const item = buildItem(row, shared.value);
    const existingGroup =
      groupKey === null ? undefined : billGroups.get(groupKey);

    if (existingGroup) {
      existingGroup.items.push(item);
      existingGroup.rowNumbers.push(row.rowNumber);
    } else {
      const group: ImportTransactionGroup = {
        items: [item],
        rowNumbers: [row.rowNumber],
      };
      if (groupKey !== null) billGroups.set(groupKey, group);
      groups.push(group);
    }
  }

  for (const group of groups) {
    const message = validateImportPayments(group.items);
    if (message)
      issues.push({
        kind: "row",
        column: "付款金额",
        message,
        rowNumber: group.rowNumbers[0],
        sheet: "incomeExpense",
      });
  }
  return { groups, issues };
}
