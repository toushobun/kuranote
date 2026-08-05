import type { ReactNode } from "react";

import type { TransactionSpecialStatus } from "internal/transaction";
import type {
  TransactionAccountOption,
  TransactionBusinessStatus,
  TransactionCategoryOption,
  TransactionMerchantOption,
  TransactionGroupPage,
  TransactionMonthPage,
  TransactionRefundCandidate,
  TransactionReimbursementCandidate,
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
  hideHeader?: boolean;
  hideSubmitButton?: boolean;
  initialType?: TransactionType;
  initialValues?: TransactionFormInitialValues;
  ledgerName?: string;
  merchantOptions: TransactionMerchantOption[];
  reimbursementCandidates?: TransactionReimbursementCandidate[];
  refundPickerView?: TransactionTimeGroupViewData;
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
  onSubmitDisabledChange?: (disabled: boolean) => void;
  submitLabel?: string;
  title?: string;
  transactionItemSpecialStatusEnabled?: boolean;
  typeNavigation?: ReactNode;
};

export type TransactionFormInitialItem = {
  amount: string;
  businessStatus?: TransactionBusinessStatus | null;
  categoryId: string;
  id?: string;
  refundCandidates?: TransactionRefundCandidate[];
  refundedAmount?: string;
  reimbursementItemIds?: string[];
  specialStatus?: TransactionSpecialStatus | null;
};

export type TransactionFormInitialValues = {
  accountId: string;
  items: TransactionFormInitialItem[];
  merchantId: string;
  note: string;
  transactionAt: string;
  transactionRecordId?: string;
  type: TransactionType;
};

export type TransactionFormItem = {
  amount: string;
  businessStatus?: TransactionBusinessStatus | null;
  categoryId: string;
  id: number;
  persistedId?: string;
  refundedAmount?: string;
  refundCandidates?: TransactionRefundCandidate[];
  reimbursementItemIds?: string[];
  specialStatus?: TransactionSpecialStatus | null;
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
