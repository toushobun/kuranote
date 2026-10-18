import type { IncomeExpenseImportRow } from "internal/dataImport/entity/importRow";
import {
  validateTransactionPayments,
  transactionPaymentValidationErrorMessages,
} from "internal/transaction";

/** 文件阶段以账户四列构造身份；执行阶段仍按实际账户 ID 再次校验。 */
export function validateImportPayments(
  items: IncomeExpenseImportRow[],
): string | null {
  const accounts = items[0].payments.map((payment) => ({
    ...payment,
    id: JSON.stringify([
      payment.accountName.toLowerCase(),
      payment.accountHolder,
      payment.accountCurrency,
      payment.accountType,
    ]),
  }));
  const result = validateTransactionPayments({
    accountOptions: accounts.map((account) => ({
      id: account.id,
      currency: account.accountCurrency,
    })),
    items: items.map((item) => ({
      amount: item.amount,
      categoryType: item.transactionType,
    })),
    payments: accounts.map((account) => ({
      accountId: account.id,
      amount: account.amount,
    })),
  });
  return result.ok
    ? null
    : transactionPaymentValidationErrorMessages[result.error];
}
