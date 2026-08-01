import type { ReactNode } from "react";

import type {
  TransactionAccountOption,
  TransactionCategoryOption,
  TransactionMerchantOption,
  TransactionType,
} from "types/transactions";
import type { TransactionSpecialStatusValue } from "../TransactionBusinessBadge/transactionBusinessBadgeConfig";

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
  onSubmitDisabledChange?: (disabled: boolean) => void;
  submitLabel?: string;
  title?: string;
  transactionItemSpecialStatusEnabled?: boolean;
  typeNavigation?: ReactNode;
};

export type TransactionFormInitialItem = {
  amount: string;
  categoryId: string;
  specialStatus?: TransactionSpecialStatusValue | null;
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
  categoryId: string;
  id: number;
  specialStatus?: TransactionSpecialStatusValue;
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
