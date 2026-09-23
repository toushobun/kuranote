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
  updated_at?: string;
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

// 从本地 Supabase 生成的 ledger_placeholder_member 行类型。
export type LedgerPlaceholderMemberDbRow = {
  claimed_at: string | null;
  claimed_by: string | null;
  created_at: string;
  created_by: string;
  display_name: string;
  id: string;
  ledger_id: string;
};

// 从本地 Supabase 生成的 account_holder 行类型。
export type AccountHolderDbRow = {
  account_id: string;
  created_at: string;
  created_by: string | null;
  id: string;
  ledger_id: string;
  placeholder_id: string | null;
  role: string;
  share_ratio: number | null;
  updated_at: string;
  updated_by: string | null;
  user_id: string | null;
};

// 从本地 Supabase 生成的 account_name_scope 行类型。
export type AccountNameScopeDbRow = {
  account_id: string;
  currency: string;
  holder_placeholder_id: string | null;
  holder_user_id: string | null;
  ledger_id: string;
  name: string;
  type: string;
};

// 从本地 Supabase 生成的 ledger_invite 行类型。
export type LedgerInviteDbRow = {
  accepted_at: string | null;
  accepted_by: string | null;
  created_at: string;
  created_by: string;
  id: string;
  invite_token: string | null;
  inviter_user_id: string;
  ledger_id: string;
  placeholder_id: string | null;
  revoked_at: string | null;
  revoked_by: string | null;
  role: string;
  token_hash: string;
};
