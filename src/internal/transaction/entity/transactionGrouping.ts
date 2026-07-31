export type TransactionGroupBy =
  | "year"
  | "quarter"
  | "month"
  | "week"
  | "day"
  | "merchant"
  | "account"
  | "parentCategory"
  | "category"
  | "member";

export type TransactionFilterRecordType =
  | "all"
  | "income"
  | "expense"
  | "transfer";

export type TransactionFilters = {
  accountId?: string;
  categoryId?: string;
  dateFrom?: string;
  dateTo?: string;
  memberId?: string;
  merchantId?: string;
  parentCategoryId?: string;
  recordType: TransactionFilterRecordType;
};

export const defaultTransactionFilters = {
  recordType: "all",
} satisfies TransactionFilters;
