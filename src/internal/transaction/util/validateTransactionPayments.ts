import type { TransactionPayment } from "internal/transaction/entity/transactionPayment";
import {
  transactionErrorCodes,
  type TransactionPaymentValidationErrorCode,
} from "internal/transaction/errors";
import { toRefundMinorUnits } from "internal/transaction/util/refundAllocation";

export type TransactionPaymentValidationItem = {
  amount: number | string;
  categoryType: "expense" | "income" | null;
};

export type TransactionPaymentValidationAccountOption = {
  currency: string;
  id: string;
};

export type TransactionPaymentValidationResult =
  | { ok: true }
  | { ok: false; error: TransactionPaymentValidationErrorCode };

// 与金额字段的存储精度（numeric(14,2)）保持一致，多账户金额最多两位小数。
const moneyPrecisionPattern = /^\d+(\.\d{1,2})?$/;

/**
 * 普通记录付款明细的纯数据校验：账户去重、归档、同币种、多行时全部为支出
 * 明细、付款合计 = 支出明细合计。与数据库延迟约束触发器规则一致（第二道
 * 防线），零 IO，供 Service 与前端 hook（#915）共同复用。
 */
export function validateTransactionPayments({
  accountOptions,
  items,
  payments,
}: {
  accountOptions: readonly TransactionPaymentValidationAccountOption[];
  items: readonly TransactionPaymentValidationItem[];
  payments: readonly TransactionPayment[];
}): TransactionPaymentValidationResult {
  const accountIds = payments.map((payment) => payment.accountId);
  if (new Set(accountIds).size !== accountIds.length) {
    return { error: transactionErrorCodes.paymentAccountDuplicate, ok: false };
  }

  const currencyByAccountId = new Map(
    accountOptions.map((account) => [account.id, account.currency] as const),
  );
  for (const accountId of accountIds) {
    if (!currencyByAccountId.has(accountId)) {
      return { error: transactionErrorCodes.accountInvalid, ok: false };
    }
  }

  // 单账户：金额由 RPC 按明细推导，这里不需要进一步校验。
  if (payments.length <= 1) return { ok: true };

  if (items.some((item) => item.categoryType !== "expense")) {
    return {
      error: transactionErrorCodes.paymentMultiAccountNotAllowed,
      ok: false,
    };
  }

  const firstCurrency = currencyByAccountId.get(accountIds[0]!);
  if (
    accountIds.some(
      (accountId) => currencyByAccountId.get(accountId) !== firstCurrency,
    )
  ) {
    return { error: transactionErrorCodes.paymentCurrencyMismatch, ok: false };
  }

  let paymentTotalUnits = BigInt(0);
  for (const payment of payments) {
    if (payment.amount === null) {
      return { error: transactionErrorCodes.paymentAmountRequired, ok: false };
    }
    if (!moneyPrecisionPattern.test(payment.amount)) {
      return { error: transactionErrorCodes.amountInvalid, ok: false };
    }
    const units = toRefundMinorUnits(payment.amount);
    if (units === null) {
      return { error: transactionErrorCodes.amountInvalid, ok: false };
    }
    paymentTotalUnits += units;
  }

  let itemTotalUnits = BigInt(0);
  for (const item of items) {
    const units = toRefundMinorUnits(item.amount);
    if (units === null) {
      return { error: transactionErrorCodes.amountInvalid, ok: false };
    }
    itemTotalUnits += units;
  }

  if (paymentTotalUnits !== itemTotalUnits) {
    return { error: transactionErrorCodes.paymentTotalMismatch, ok: false };
  }

  return { ok: true };
}
