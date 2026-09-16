import type { ParsedTable } from "internal/dataImport/entity/parsedTable";
import type { TransferImportRow } from "internal/dataImport/entity/importRow";
import type { ImportValidationIssue } from "internal/dataImport/entity/importValidationIssue";
import {
  importCurrencyPattern,
  importNoteMaxLength,
  transferColumns,
  transferTypeValue,
} from "internal/dataImport/schema";
import {
  buildColumnIndex,
  findMissingRequiredColumns,
} from "internal/dataImport/util/columnIndex";
import { parseHolderName } from "internal/dataImport/util/parseHolderName";
import { parseImportAmount } from "internal/dataImport/util/parseImportAmount";
import { parseImportDate } from "internal/dataImport/util/parseImportDate";

export type ParseTransferSheetResult = {
  issues: ImportValidationIssue[];
  rows: TransferImportRow[];
};

export function parseTransferSheet(
  table: ParsedTable,
): ParseTransferSheetResult {
  const columnIndex = buildColumnIndex(table.headerRow);
  const missingColumns = findMissingRequiredColumns(
    columnIndex,
    transferColumns,
  );

  if (missingColumns.length > 0) {
    return {
      issues: [
        {
          kind: "structural",
          message: `「转账」表缺少必填列：${missingColumns.join("、")}。`,
          sheet: "transfer",
        },
      ],
      rows: [],
    };
  }

  const issues: ImportValidationIssue[] = [];
  const rows: TransferImportRow[] = [];

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
        sheet: "transfer",
      });
      hasError = true;
    };

    const typeText = get("交易类型");
    if (typeText !== transferTypeValue) {
      addIssue("交易类型", `交易类型必须是「${transferTypeValue}」。`);
    }

    const dateResult = parseImportDate(get("日期"));
    if (!dateResult.ok) {
      addIssue("日期", "日期格式不正确，应为 YYYY-MM-DD HH:MM:SS。");
    }

    const fromAccountName = get("转出账户");
    if (!fromAccountName) {
      addIssue("转出账户", "转出账户不能为空。");
    }

    const fromAccountCurrencyText = get("转出账户币种");
    const fromAccountCurrencyValid = importCurrencyPattern.test(
      fromAccountCurrencyText,
    );
    if (!fromAccountCurrencyValid) {
      addIssue("转出账户币种", "转出账户币种必须是 3 位字母代码，例如 CNY。");
    }

    const toAccountName = get("转入账户");
    if (!toAccountName) {
      addIssue("转入账户", "转入账户不能为空。");
    }

    const toAccountCurrencyText = get("转入账户币种");
    const toAccountCurrencyValid = importCurrencyPattern.test(
      toAccountCurrencyText,
    );
    if (!toAccountCurrencyValid) {
      addIssue("转入账户币种", "转入账户币种必须是 3 位字母代码，例如 CNY。");
    }

    const amountResult = parseImportAmount(get("金额"), { allowZero: false });
    if (!amountResult.ok) {
      addIssue("金额", "金额必须是大于 0、不超过两位小数的数字。");
    }

    const note = get("备注");
    if (note.length > importNoteMaxLength) {
      addIssue("备注", `备注不能超过 ${importNoteMaxLength} 个字符。`);
    }

    const fromAccountHolder = parseHolderName(get("转出账户持有人"));
    const toAccountHolder = parseHolderName(get("转入账户持有人"));

    // 「转出/转入账户是否相同」只依赖这四个字段自身是否合法，与「交易类型」
    // 「日期」「金额」「备注」等无关字段是否报错无关，避免这些字段的错误
    // 掩盖同账户错误，导致用户要多次上传才能看到完整的错误列表。
    if (
      fromAccountName &&
      toAccountName &&
      fromAccountCurrencyValid &&
      toAccountCurrencyValid &&
      fromAccountName === toAccountName &&
      fromAccountCurrencyText.toUpperCase() ===
        toAccountCurrencyText.toUpperCase() &&
      fromAccountHolder === toAccountHolder
    ) {
      addIssue("转入账户", "转出账户与转入账户不能是同一个账户。");
    }

    if (hasError) {
      continue;
    }

    rows.push({
      amount: amountResult.ok ? amountResult.value : 0,
      fromAccountCurrency: fromAccountCurrencyText.toUpperCase(),
      fromAccountHolder,
      fromAccountName,
      note: note || null,
      rowNumber,
      toAccountCurrency: toAccountCurrencyText.toUpperCase(),
      toAccountHolder,
      toAccountName,
      transactionAt: dateResult.ok ? dateResult.value : "",
    });
  }

  return { issues, rows };
}
