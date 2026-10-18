import { paymentSeparatorPattern } from "config/dataImportExportFormat";
import type { ImportPaymentAccount } from "internal/dataImport/entity/importRow";
import {
  incomeExpenseImportErrorMessages,
  importRowErrorMessages,
} from "internal/dataImport/errors";
import { parseAccountType } from "internal/dataImport/util/parseAccountType";
import { parseImportAmount } from "internal/dataImport/util/parseImportAmount";

/** 保留空位置，不能 filter，否则持有人会错配到账户。 */
export function splitPaymentCell(text: string): string[] {
  return text.split(paymentSeparatorPattern).map((value) => value.trim());
}

export function parsePaymentAccounts(texts: {
  账户: string;
  账户持有人: string;
  账户类型: string;
  账户币种: string;
  付款金额: string;
}):
  | { ok: true; payments: ImportPaymentAccount[] }
  | { ok: false; column: string; message: string } {
  const names = splitPaymentCell(texts.账户);
  const holders = texts.账户持有人.trim()
    ? splitPaymentCell(texts.账户持有人)
    : names.map(() => "");
  const types = splitPaymentCell(texts.账户类型);
  const amounts = splitPaymentCell(texts.付款金额);
  const fail = (column: string, message: string) => ({
    ok: false as const,
    column,
    message,
  });
  if (names.length === 1 && texts.付款金额.trim())
    return fail(
      "付款金额",
      incomeExpenseImportErrorMessages.singlePaymentAmount,
    );
  if (holders.length !== names.length)
    return fail(
      "账户持有人",
      incomeExpenseImportErrorMessages.paymentCountMismatch,
    );
  if (types.length !== names.length)
    return fail(
      "账户类型",
      incomeExpenseImportErrorMessages.paymentCountMismatch,
    );
  if (names.length > 1 && amounts.length !== names.length)
    return fail(
      "付款金额",
      incomeExpenseImportErrorMessages.paymentCountMismatch,
    );
  const payments: ImportPaymentAccount[] = [];
  for (const [index, name] of names.entries()) {
    if (!name) return fail("账户", importRowErrorMessages.accountRequired);
    const type = parseAccountType(types[index], "账户类型");
    if (!type.ok) return fail("账户类型", type.message);
    if (names.length > 1 && !parseImportAmount(amounts[index]).ok)
      return fail("付款金额", incomeExpenseImportErrorMessages.amountInvalid);
    payments.push({
      accountName: name,
      accountHolder: holders[index] || null,
      accountType: type.value,
      accountCurrency: texts.账户币种.toUpperCase(),
      amount: names.length === 1 ? null : amounts[index],
    });
  }
  return { ok: true, payments };
}
