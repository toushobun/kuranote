import type { TransactionPayment } from "internal/transaction/entity/transactionPayment";

/**
 * 付款明细转换为 RPC `p_payments` payload（3.4）：单账户不传金额，由 RPC 按
 * 明细推导；多账户每行必须提交金额。供 transactionRepository 与
 * linkedTransactionItemRepository 共用，避免各自重复实现。
 */
export function toTransactionPaymentRpcPayload(
  payments: readonly TransactionPayment[],
) {
  return payments.map((payment) => ({
    accountId: payment.accountId,
    ...(payment.amount === null ? {} : { amount: payment.amount }),
  }));
}
