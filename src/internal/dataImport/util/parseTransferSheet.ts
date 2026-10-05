import type { ParsedTable } from "internal/dataImport/entity/parsedTable";
import type { TransferImportRow } from "internal/dataImport/entity/importRow";
import type { ImportValidationIssue } from "internal/dataImport/entity/importValidationIssue";
import {
  importRowErrorMessages,
  transferImportErrorMessages,
} from "internal/dataImport/errors";
import {
  importCurrencyPattern,
  importNoteMaxLength,
  transferColumns,
  transferTypeValue,
} from "internal/dataImport/schema";
import {
  buildColumnIndex,
  findColumnStructuralIssues,
} from "internal/dataImport/util/columnIndex";
import { parseAccountType } from "internal/dataImport/util/parseAccountType";
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
  const structuralIssues = findColumnStructuralIssues(
    table,
    transferColumns,
    "transfer",
  );

  if (structuralIssues.length > 0) {
    return { issues: structuralIssues, rows: [] };
  }

  const columnIndex = buildColumnIndex(table.headerRow);

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
      addIssue("交易类型", transferImportErrorMessages.typeInvalid);
    }

    const dateResult = parseImportDate(get("日期"));
    if (!dateResult.ok) {
      addIssue("日期", importRowErrorMessages.dateInvalid);
    }

    const fromAccountName = get("转出账户");
    if (!fromAccountName) {
      addIssue("转出账户", transferImportErrorMessages.fromAccountRequired);
    }

    const fromAccountCurrencyText = get("转出账户币种");
    const fromAccountCurrencyValid = importCurrencyPattern.test(
      fromAccountCurrencyText,
    );
    if (!fromAccountCurrencyValid) {
      addIssue(
        "转出账户币种",
        transferImportErrorMessages.fromAccountCurrencyInvalid,
      );
    }

    const toAccountName = get("转入账户");
    if (!toAccountName) {
      addIssue("转入账户", transferImportErrorMessages.toAccountRequired);
    }

    const toAccountCurrencyText = get("转入账户币种");
    const toAccountCurrencyValid = importCurrencyPattern.test(
      toAccountCurrencyText,
    );
    if (!toAccountCurrencyValid) {
      addIssue(
        "转入账户币种",
        transferImportErrorMessages.toAccountCurrencyInvalid,
      );
    }

    const amountResult = parseImportAmount(get("金额"), { allowZero: false });
    if (!amountResult.ok) {
      addIssue("金额", transferImportErrorMessages.amountInvalid);
    }

    const note = get("备注");
    if (note.length > importNoteMaxLength) {
      addIssue("备注", importRowErrorMessages.noteTooLong);
    }

    const fromAccountHolderResult = parseHolderName(get("转出账户持有人"));
    if (!fromAccountHolderResult.ok) {
      addIssue("转出账户持有人", importRowErrorMessages.holderInvalid);
    }

    const toAccountHolderResult = parseHolderName(get("转入账户持有人"));
    if (!toAccountHolderResult.ok) {
      addIssue("转入账户持有人", importRowErrorMessages.holderInvalid);
    }

    const fromAccountTypeResult = parseAccountType(
      get("转出账户类型"),
      "转出账户类型",
    );
    if (!fromAccountTypeResult.ok) {
      addIssue("转出账户类型", fromAccountTypeResult.message);
    }

    const toAccountTypeResult = parseAccountType(
      get("转入账户类型"),
      "转入账户类型",
    );
    if (!toAccountTypeResult.ok) {
      addIssue("转入账户类型", toAccountTypeResult.message);
    }

    // 「转出/转入账户是否相同」只依赖这几个字段自身是否合法，与「交易类型」
    // 「日期」「金额」「备注」等无关字段是否报错无关，避免这些字段的错误
    // 掩盖同账户错误，导致用户要多次上传才能看到完整的错误列表。
    // 账户名称与导入执行时的账户匹配规则一致，不区分大小写。
    if (
      fromAccountName &&
      toAccountName &&
      fromAccountCurrencyValid &&
      toAccountCurrencyValid &&
      fromAccountHolderResult.ok &&
      toAccountHolderResult.ok &&
      fromAccountTypeResult.ok &&
      toAccountTypeResult.ok &&
      fromAccountName.toLowerCase() === toAccountName.toLowerCase() &&
      fromAccountCurrencyText.toUpperCase() ===
        toAccountCurrencyText.toUpperCase() &&
      fromAccountHolderResult.value === toAccountHolderResult.value &&
      fromAccountTypeResult.value === toAccountTypeResult.value
    ) {
      addIssue("转入账户", transferImportErrorMessages.sameAccount);
    }

    if (
      hasError ||
      !fromAccountHolderResult.ok ||
      !toAccountHolderResult.ok ||
      !fromAccountTypeResult.ok ||
      !toAccountTypeResult.ok
    ) {
      continue;
    }

    rows.push({
      amount: amountResult.ok ? amountResult.value : 0,
      fromAccountCurrency: fromAccountCurrencyText.toUpperCase(),
      fromAccountHolder: fromAccountHolderResult.value,
      fromAccountName,
      fromAccountType: fromAccountTypeResult.value,
      note: note || null,
      rowNumber,
      toAccountCurrency: toAccountCurrencyText.toUpperCase(),
      toAccountHolder: toAccountHolderResult.value,
      toAccountName,
      toAccountType: toAccountTypeResult.value,
      transactionAt: dateResult.ok ? dateResult.value : "",
    });
  }

  return { issues, rows };
}
