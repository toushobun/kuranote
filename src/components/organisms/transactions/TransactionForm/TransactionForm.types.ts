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

export type SavedCrossCurrencyAllocation = {
  actualTargetAmount: string;
  foldedBackAmount: string;
  convertedAmount: string;
  incomeCurrency: string;
  targetCurrency: string;
  rate: number;
  rateDate: string;
};

export type CrossCurrencyOffsetRow = {
  kind: "refund" | "reimbursement";
  incomeAmount: string;
  incomeCurrency: string;
  convertedAmount: string;
  targetCurrency: string;
};

export type TransactionFormInitialItem = {
  amount: string;
  businessNetAmount?: string;
  savedLinkAllocation?: SavedCrossCurrencyAllocation;
  crossCurrencyOffsets?: CrossCurrencyOffsetRow[];
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
  savedLinkAllocation?: SavedCrossCurrencyAllocation;
  crossCurrencyOffsets?: CrossCurrencyOffsetRow[];
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
  /** 尚未保存时的客户端跨币种预览；保存后以数据库核销结果为准。 */
  linkPreview?: SavedCrossCurrencyAllocation & {
    businessNetAmount: string;
  };
};

export type TransactionItemPickerMode =
  | "expense"
  | "income"
  | "refund"
  | "reimbursement";

export type TransactionPickerErrors = {
  category?: string;
};
