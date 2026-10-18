type TransactionExportRecordCommon = {
  id: string;
  transactionAt: string;
  merchantId: string | null;
  recorderName: string;
  note: string;
};

export type TransactionExportPayment = {
  accountId: string;
  amount: string;
};

type TransactionExportAccountItem = {
  accountId: string;
  categoryId: string | null;
  amount: string;
  balanceDelta: string;
};

/**
 * 普通记录（type = "normal"）的账户来自 `payments`（#834 子 Issue 3），
 * 明细只保留分类与金额；转账 / 余额调整仍由明细的 `accountId` 表达账户。
 * 转账与余额调整各自写成独立成员（而不是合并成 "transfer" | "balance_adjustment"
 * 的单一成员），这样按 `record.type` 分支时 TS 才能把 `items` / `payments` 的形状
 * 完整收窄出来。
 */
export type TransactionExportRecord =
  | (TransactionExportRecordCommon & {
      type: "normal";
      items: { categoryId: string | null; amount: string }[];
      payments: TransactionExportPayment[];
    })
  | (TransactionExportRecordCommon & {
      type: "transfer";
      items: TransactionExportAccountItem[];
    })
  | (TransactionExportRecordCommon & {
      type: "balance_adjustment";
      items: TransactionExportAccountItem[];
    });
