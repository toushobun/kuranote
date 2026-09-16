export type IncomeExpenseImportRow = {
  accountCurrency: string;
  accountHolders: string[];
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
  fromAccountHolders: string[];
  fromAccountName: string;
  note: string | null;
  rowNumber: number;
  toAccountCurrency: string;
  toAccountHolders: string[];
  toAccountName: string;
  transactionAt: string;
};

export type ImportTransactionGroup = {
  items: IncomeExpenseImportRow[];
  rowNumbers: number[];
};
