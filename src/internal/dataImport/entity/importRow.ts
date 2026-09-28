import type { AccountType } from "internal/account";

export type IncomeExpenseImportRow = {
  accountCurrency: string;
  accountHolder: string | null;
  accountName: string;
  accountType: AccountType;
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
  fromAccountType: AccountType;
  note: string | null;
  rowNumber: number;
  toAccountCurrency: string;
  toAccountHolder: string | null;
  toAccountName: string;
  toAccountType: AccountType;
  transactionAt: string;
};

export type BalanceAdjustmentImportRow = {
  accountCurrency: string;
  accountHolder: string | null;
  accountName: string;
  accountType: AccountType;
  amount: number;
  note: string | null;
  rowNumber: number;
  transactionAt: string;
};

export type ImportTransactionGroup = {
  items: IncomeExpenseImportRow[];
  rowNumbers: number[];
};

/** 导入执行的最小单位：一个收支交易组，或一条转账、余额变更。 */
export type ImportExecutionUnit =
  | { group: ImportTransactionGroup; kind: "incomeExpense" }
  | { kind: "transfer"; row: TransferImportRow }
  | { kind: "balanceAdjustment"; row: BalanceAdjustmentImportRow };
