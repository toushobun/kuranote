import type {
  TransactionPayment,
  TransactionSpecialStatus,
} from "internal/transaction";
import type {
  TransactionBusinessStatus,
  TransactionCategoryOption,
  TransactionRefundCandidate,
  TransactionType,
} from "types/transactions";

export type TransactionFormInitialItem = {
  amount: string;
  businessNetAmount?: string;
  businessStatus?: TransactionBusinessStatus | null;
  categoryId: string;
  expectedUpdatedAt?: string;
  id?: string;
  refundCandidate?: TransactionRefundCandidate | null;
  reimbursementCandidate?: TransactionRefundCandidate | null;
  refundedAmount?: string;
  // 被其他记录报销核销的金额（编辑时由服务端读取）。
  reimbursementAmount?: string;
  specialStatus?: TransactionSpecialStatus | null;
};

export type TransactionFormInitialValues = {
  // 编辑时的记录级乐观锁版本，原样作为隐藏字段提交。
  expectedRecordUpdatedAt?: string;
  items: TransactionFormInitialItem[];
  merchantId: string;
  note: string;
  // 按录入顺序；1 行为单账户（金额由明细推导），≥ 2 行为多账户。
  payments: TransactionPayment[];
  transactionAt: string;
  transactionRecordId?: string;
  type: TransactionType;
};

export type TransactionFormItem = {
  amount: string;
  businessNetAmount?: string;
  businessStatus?: TransactionBusinessStatus | null;
  categoryId: string;
  expectedUpdatedAt?: string;
  id: number;
  persistedId?: string;
  reimbursementCandidate?: TransactionRefundCandidate | null;
  refundedAmount?: string;
  reimbursementAmount?: string;
  refundCandidate?: TransactionRefundCandidate | null;
  specialStatus?: TransactionSpecialStatus | null;
  specialStatusLocked?: boolean;
};

export type CategoryPickerGroup = {
  categories: TransactionCategoryOption[];
  id: string;
  name: string;
};

export type TransactionItemSummary = TransactionFormItem & {
  category?: TransactionCategoryOption;
};

export type TransactionItemPickerMode =
  | "expense"
  | "income"
  | "refund"
  | "reimbursement";

export type TransactionPickerErrors = {
  category?: string;
};
