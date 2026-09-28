import type { ParsedTable } from "internal/dataImport/entity/parsedTable";
import type { BalanceAdjustmentImportRow } from "internal/dataImport/entity/importRow";
import type { ImportValidationIssue } from "internal/dataImport/entity/importValidationIssue";
import { balanceAdjustmentImportErrorMessages as messages } from "internal/dataImport/errors";
import {
  balanceAdjustmentColumns,
  balanceAdjustmentTypeValue,
  importCurrencyPattern,
  importNoteMaxLength,
} from "internal/dataImport/schema";
import {
  buildColumnIndex,
  findColumnStructuralIssues,
} from "internal/dataImport/util/columnIndex";
import { parseAccountType } from "internal/dataImport/util/parseAccountType";
import { parseHolderName } from "internal/dataImport/util/parseHolderName";
import { parseImportAmount } from "internal/dataImport/util/parseImportAmount";
import { parseImportDate } from "internal/dataImport/util/parseImportDate";
import { balanceAdjustmentErrorMessages } from "internal/transaction";

export function parseBalanceAdjustmentSheet(table: ParsedTable) {
  const issues: ImportValidationIssue[] = findColumnStructuralIssues(
    table,
    balanceAdjustmentColumns,
    "balanceAdjustment",
  );
  const rows: BalanceAdjustmentImportRow[] = [];
  if (issues.length) return { issues, rows };
  const columns = buildColumnIndex(table.headerRow);
  for (const { cells, rowNumber } of table.rows) {
    const get = (name: string) => (cells[columns[name]] ?? "").trim();
    const before = issues.length;
    const fail = (column: string, message: string) =>
      issues.push({
        kind: "row",
        sheet: "balanceAdjustment",
        column,
        message,
        rowNumber,
      });
    const date = parseImportDate(get("日期"));
    const amount = parseImportAmount(get("金额"), {
      allowNegative: true,
      allowZero: false,
    });
    const holder = parseHolderName(get("账户持有人"));
    const accountName = get("账户");
    const accountCurrency = get("账户币种").toUpperCase();
    const accountType = parseAccountType(get("账户类型"), "账户类型");
    const note = get("备注");
    if (get("交易类型") !== balanceAdjustmentTypeValue)
      fail("交易类型", messages.typeInvalid);
    if (!date.ok) fail("日期", messages.dateInvalid);
    if (!amount.ok || Math.abs(amount.value) >= 1e12)
      fail("金额", messages.amountInvalid);
    if (!holder.ok) fail("账户持有人", messages.holderInvalid);
    if (!accountName) fail("账户", messages.accountRequired);
    if (!importCurrencyPattern.test(accountCurrency))
      fail("账户币种", messages.currencyInvalid);
    if (!accountType.ok) fail("账户类型", accountType.message);
    if (note.length > importNoteMaxLength)
      fail("备注", balanceAdjustmentErrorMessages.noteTooLong);
    if (
      issues.length !== before ||
      !date.ok ||
      !amount.ok ||
      !holder.ok ||
      !accountType.ok
    )
      continue;
    rows.push({
      accountName,
      accountCurrency,
      accountHolder: holder.value,
      accountType: accountType.value,
      amount: amount.value,
      note: note || null,
      rowNumber,
      transactionAt: date.value,
    });
  }
  return { issues, rows };
}
