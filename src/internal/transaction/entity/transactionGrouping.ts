import type { TransactionSpecialStatusFilterValue } from "internal/transaction/entity/transactionSpecialStatus";

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
  | "member"
  | "holder"
  | "specialStatus";

export type TransactionFilterRecordType =
  | "all"
  | "income"
  | "expense"
  | "refundableExpense"
  | "transfer";

export type TransactionFilters = {
  accountId?: string;
  categoryId?: string;
  dateFrom?: string;
  dateTo?: string;
  /** 账户持有人（#909）：成员 user_id、占位 ID，或 `unassignedAccountHolderId`。 */
  holderId?: string;
  memberId?: string;
  merchantId?: string;
  parentCategoryId?: string;
  recordType: TransactionFilterRecordType;
  specialStatuses?: TransactionSpecialStatusFilterValue[];
};

export const defaultTransactionFilters = {
  recordType: "all",
} satisfies TransactionFilters;

/**
 * 无持有人的账户归入的持有人 ID 与名称（「未指定持有人」）。
 * 数据库分组函数（load_transaction_group_summaries_with_special_status）中写死了同样的值，修改时需要新增 migration。
 */
export const unassignedAccountHolderId = "none";
export const unassignedAccountHolderLabel = "未指定持有人";
