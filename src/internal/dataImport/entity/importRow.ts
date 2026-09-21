export type IncomeExpenseImportRow = {
  accountCurrency: string;
  accountHolder: string | null;
  accountName: string;
  amount: number;
  billRef: string | null;
  childCategoryName: string | null;
  merchantName: string;
  merchantTag: string | null;
  note: string | null;
  parentCategoryName: string;
  rowNumber: number;
  transactionAt: string;
  transactionType: "expense" | "income";
};

export type TransferImportRow = {
  amount: number;
  fromAccountCurrency: string;
  fromAccountHolder: string | null;
  fromAccountName: string;
  note: string | null;
  rowNumber: number;
  toAccountCurrency: string;
  toAccountHolder: string | null;
  toAccountName: string;
  transactionAt: string;
};

export type ImportTransactionGroup = {
  items: IncomeExpenseImportRow[];
  rowNumbers: number[];
};

/** 导入执行的最小单位：一个收支交易组，或一条转账。 */
export type ImportExecutionUnit =
  | { group: ImportTransactionGroup; kind: "incomeExpense" }
  | { kind: "transfer"; row: TransferImportRow };
