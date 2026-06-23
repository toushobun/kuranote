import type {
  TransactionCategoryOption,
  TransactionType,
} from "types/transactions";

export type TransactionFormInitialItem = {
  amount: string;
  categoryId: string;
};

export type TransactionFormInitialValues = {
  accountId: string;
  items: TransactionFormInitialItem[];
  merchantId: string;
  note: string;
  tagNames: string[];
  transactionAt: string;
  transactionRecordId?: string;
  type: TransactionType;
};

export type TransactionFormItem = {
  amount: string;
  categoryId: string;
  id: number;
};

export type CategoryPickerGroup = {
  categories: TransactionCategoryOption[];
  id: string;
  name: string;
};

export type TransactionItemSummary = TransactionFormItem & {
  category?: TransactionCategoryOption;
};

export type TransactionFieldErrors = {
  account?: string;
  items?: string;
  merchant?: string;
  tags?: string;
};

export type TransactionPickerErrors = {
  category?: string;
  amount?: string;
};
