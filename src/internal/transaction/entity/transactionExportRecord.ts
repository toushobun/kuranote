export type TransactionExportRecord = {
  id: string;
  type: "normal" | "transfer" | "balance_adjustment";
  transactionAt: string;
  merchantId: string | null;
  recorderName: string;
  note: string;
  items: {
    accountId: string;
    categoryId: string | null;
    amount: string;
    balanceDelta: string;
  }[];
};
