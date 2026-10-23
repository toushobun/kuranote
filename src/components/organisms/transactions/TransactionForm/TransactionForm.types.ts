import type { ReactNode } from "react";

import type {
  TransactionPayment,
  TransactionSpecialStatus,
} from "internal/transaction";
import type {
  TransactionAccountOption,
  TransactionBusinessStatus,
  TransactionCategoryOption,
  TransactionMerchantOption,
  TransactionGroupPage,
  TransactionMonthPage,
  TransactionRefundCandidate,
  TransactionSearchPage,
  TransactionTimeGroupViewData,
  TransactionType,
} from "types/transactions";

export type TransactionFormProps = {
  action: (formData: FormData) => void | Promise<void>;
  accountOptions: TransactionAccountOption[];
  categoryOptions: TransactionCategoryOption[];
  closeHref?: string;
  errorMessage?: string | null;
  formId?: string;
  frequentCategoryIds?: string[];
  hideHeader?: boolean;
  hideSubmitButton?: boolean;
  initialType?: TransactionType;
  initialValues?: TransactionFormInitialValues;
  ledgerName?: string;
  merchantOptions: TransactionMerchantOption[];
  /** 账本是否开启多账户付款（#931）；关闭时不显示「添加付款账户」。 */
  multiAccountPaymentEnabled?: boolean;
  refundPickerView?: TransactionTimeGroupViewData;
  reimbursementPickerView?: TransactionTimeGroupViewData;
  loadRefundGroupItemsAction?: (
    groupKey: string,
    offset: number,
  ) => Promise<TransactionMonthPage>;
  loadRefundMoreGroupsAction?: (
    offset: number,
  ) => Promise<TransactionGroupPage>;
  loadRefundSearchPageAction?: (
    query: string,
    offset: number,
  ) => Promise<TransactionSearchPage>;
  loadReimbursementGroupItemsAction?: (
    groupKey: string,
    offset: number,
  ) => Promise<TransactionMonthPage>;
  loadReimbursementMoreGroupsAction?: (
    offset: number,
  ) => Promise<TransactionGroupPage>;
  loadReimbursementSearchPageAction?: (
    query: string,
    offset: number,
  ) => Promise<TransactionSearchPage>;
  onSubmitDisabledChange?: (disabled: boolean) => void;
  /** 只读详情（#928）：整体禁用，不能修改任何字段。 */
  readOnly?: boolean;
  // 新建记账时缺少账户 / 商家的添加入口；不传时不显示提示卡片（编辑记账）。
  setupHrefs?: { account: string; merchant: string };
  submitLabel?: string;
  title?: string;
  transactionItemSpecialStatusEnabled?: boolean;
  typeNavigation?: ReactNode;
};

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

export type TransactionFieldErrors = {
  account?: string;
  items?: string;
  merchant?: string;
};

export type TransactionPickerErrors = {
  category?: string;
  amount?: string;
};
