/**
 * 付款明细：一个账户 + 一个金额，挂在 transaction_record 上（总分关系）。
 * `amount` 为 null 表示单账户，由 RPC 按明细推导 balance_delta；
 * 多账户（≥ 2 行）时每行必须提交 amount。
 */
export type TransactionPayment = {
  accountId: string;
  amount: string | null;
};
