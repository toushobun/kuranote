import type {
  TransactionItemDbRow,
  TransactionPaymentDbRow,
  TransactionRecordDbRow,
} from "internal/db-types";

const itemAccountMissingMessage = "转账 / 余额调整的明细缺少账户，数据不完整。";

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
    accountId: requireItemAccountId(item),
    balanceDelta: item.balance_delta ?? null,
  }));
}

/**
 * 转账 / 余额调整明细上的账户（数据库约束保证非 NULL）。
 * 普通记录明细不保存账户（#914），账户只能从付款明细取，不调用这里。
 */
export function requireItemAccountId(
  item: Pick<TransactionItemDbRow, "account_id">,
): string {
  if (item.account_id === null) throw new Error(itemAccountMissingMessage);
  return item.account_id;
}
