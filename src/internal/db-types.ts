import type { ThemeColorKey } from "theme/themeColorTokens";
import type { CategoryType } from "internal/category";
import type { TransactionRecordStorageType } from "internal/transaction";
import type { TransactionSpecialStatusStorageValue } from "internal/transaction";

export type TransactionRecordDbRow = {
  id: string;
  type: TransactionRecordStorageType;
  transaction_at: string;
  merchant_id: string | null;
  note: string | null;
  created_by?: string | null;
  created_at: string;
};

export type TransactionItemDbRow = {
  id?: string;
  transaction_record_id: string;
  account_id: string;
  category_id: string | null;
  amount: string;
  business_net_amount?: string;
  balance_delta?: string;
  note?: string | null;
  special_status?: TransactionSpecialStatusStorageValue | null;
  refunded_amount?: string;
  reimbursement_amount?: string;
  has_refund_link?: boolean;
  has_reimbursement_link?: boolean;
  is_refund_income?: boolean;
  is_reimbursement_income?: boolean;
  updated_at: string;
};

export type AccountOptionDbRow = {
  id: string;
  name: string;
  currency: string;
};

export type CategorySummaryDbRow = {
  id: string;
  name: string;
  parent_id: string | null;
  type: CategoryType;
};

export type CategoryOptionDbRow = CategorySummaryDbRow;

export type LedgerMemberDisplaySettingDbRow = {
  display_color?: string | null;
  display_name: string | null;
  user_id: string;
};

export type MerchantSummaryDbRow = {
  id: string;
  name: string;
  icon_url: string | null;
};

export type AppUserSummaryDbRow = {
  display_color?: ThemeColorKey | null;
  id: string;
  display_name: string;
};
