import type {
  TransactionItemDbRow,
  TransactionPaymentDbRow,
  TransactionRecordDbRow,
} from "internal/db-types";

export type TransactionRecordAccountMovement = {
  accountId: string;
  balanceDelta: string | null;
};

/**
 * 记录的账户来源，与数据库视图 transaction_account_movement 同口径：
 * 普通记录取付款明细，转账 / 余额调整取明细账户。普通记录不读明细的 account_id。
 */
export function listRecordAccountMovements(
  record: Pick<TransactionRecordDbRow, "type">,
  items: Pick<TransactionItemDbRow, "account_id" | "balance_delta">[],
  payments: Pick<TransactionPaymentDbRow, "account_id" | "balance_delta">[],
): TransactionRecordAccountMovement[] {
  if (record.type === "normal") {
    return payments.map((payment) => ({
      accountId: payment.account_id,
      balanceDelta: payment.balance_delta,
    }));
  }

  return items.map((item) => ({
    accountId: item.account_id,
    balanceDelta: item.balance_delta ?? null,
  }));
}
