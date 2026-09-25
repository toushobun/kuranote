import type {
  ImportTransactionGroup,
  IncomeExpenseImportRow,
} from "internal/dataImport/entity/importRow";
import type { ImportRowIssue } from "internal/dataImport/entity/importValidationIssue";
import {
  incomeExpenseSharedColumns,
  type IncomeExpenseSharedColumn,
} from "internal/dataImport/schema";
import type { IncomeExpenseSheetRow } from "internal/dataImport/util/parseIncomeExpenseSheet";
import { parseAccountType } from "internal/dataImport/util/parseAccountType";
import { parseHolderName } from "internal/dataImport/util/parseHolderName";
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
  // 走到这里的行已经在 parseIncomeExpenseSheet 里通过了账户持有人格式校验，
  // 因此这里必定是 ok:true，取值时兜底 null 只是满足类型、不会实际触发。
  const holderResult = parseHolderName(row.sharedTexts["账户持有人"]);
  // 账户类型同样已在 parseIncomeExpenseSheet 里通过校验，兜底值不会实际触发。
  const accountTypeResult = parseAccountType(
    row.sharedTexts["账户类型"],
    "账户类型",
  );

  return {
    accountCurrency: row.sharedTexts["账户币种"].toUpperCase(),
    accountHolder: holderResult.ok ? holderResult.value : null,
    accountName: row.sharedTexts["账户"],
    accountType: accountTypeResult.ok ? accountTypeResult.value : "other",
    merchantName: row.sharedTexts["商家"],
    merchantTag: row.sharedTexts["商家分类"] || null,
    note: row.sharedTexts["备注"] || null,
    transactionAt: dateResult.ok ? dateResult.value : dateText,
  };
}

function buildItem(
  row: IncomeExpenseSheetRow,
  shared: ReturnType<typeof resolveSharedFields>,
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
 * - 用于合并出多笔交易 items 的分组按 `(账单关联, 交易类型)`：同一账单关联下
 *   不同交易类型的行分别合并为不同的交易，但共享同一份共享字段取值。
 * - `账单关联` 为空的行各自独立成组，不受上述规则影响。
 */
export function groupIncomeExpenseRows(
  rows: IncomeExpenseSheetRow[],
): GroupIncomeExpenseRowsResult {
  const issues: ImportRowIssue[] = [];
  const groups: ImportTransactionGroup[] = [];
  const billRefFirstRow = new Map<string, IncomeExpenseSheetRow>();
  const typeGroups = new Map<string, ImportTransactionGroup>();

  for (const row of rows) {
    if (row.billRef === null) {
      const item = buildItem(row, resolveSharedFields(row));
      groups.push({ items: [item], rowNumbers: [row.rowNumber] });
      continue;
    }

    const billRef = row.billRef;
    let firstRow = billRefFirstRow.get(billRef);

    if (!firstRow) {
      const placeholderColumns = incomeExpenseSharedColumns.filter(
        (column) => row.sharedTexts[column] === billRefPlaceholder,
      );

      if (placeholderColumns.length > 0) {
        issues.push({
          column: "账单关联",
          kind: "row",
          message: `账单关联「${billRef}」下第 ${row.rowNumber} 行是该账单关联首次出现的行，${placeholderColumns.join("、")} 不能填写「-」，需提供实际值。`,
          rowNumber: row.rowNumber,
          sheet: "incomeExpense",
        });
        continue;
      }

      billRefFirstRow.set(billRef, row);
      firstRow = row;
    } else {
      const mismatchedColumns = incomeExpenseSharedColumns.filter((column) => {
        const text = row.sharedTexts[column];
        return (
          text !== billRefPlaceholder &&
          normalizedSharedText(column, text) !==
            normalizedSharedText(column, firstRow!.sharedTexts[column])
        );
      });

      if (mismatchedColumns.length > 0) {
        issues.push({
          column: "账单关联",
          kind: "row",
          message: `账单关联「${billRef}」下第 ${firstRow.rowNumber} 行与第 ${row.rowNumber} 行的 ${mismatchedColumns.join("、")} 不一致，无法合并为同一笔交易。`,
          rowNumber: row.rowNumber,
          sheet: "incomeExpense",
        });
        continue;
      }
    }

    const typeKey = `${billRef} ${row.transactionType}`;
    const item = buildItem(row, resolveSharedFields(firstRow));
    const existingTypeGroup = typeGroups.get(typeKey);

    if (existingTypeGroup) {
      existingTypeGroup.items.push(item);
      existingTypeGroup.rowNumbers.push(row.rowNumber);
    } else {
      const group: ImportTransactionGroup = {
        items: [item],
        rowNumbers: [row.rowNumber],
      };
      typeGroups.set(typeKey, group);
      groups.push(group);
    }
  }

  return { groups, issues };
}
