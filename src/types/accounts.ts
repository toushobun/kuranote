import type { AccountType } from "internal/account";
import type { ThemeColorKey } from "theme/themeColorTokens";
import type { BaseActionState } from "types/auth";

export const accountTypeOptions = [
  { label: "现金", value: "cash" },
  { label: "银行卡", value: "bank" },
  { label: "信用卡", value: "credit_card" },
  { label: "电子钱包", value: "e_money" },
  { label: "其他", value: "other" },
] as const;

export type { AccountType };

export type AccountActionState = BaseActionState & {
  errorKey?: string;
};

export type AccountStateAction = (
  previousState: AccountActionState,
  formData: FormData,
) => Promise<AccountActionState>;

export type AccountHolderRole = "owner" | "co_owner";

export type AccountHolder = {
  id: string;
  user_id: string;
  display_name: string;
  email: string | null;
  display_color: ThemeColorKey;
  role: AccountHolderRole;
  // Supabase numeric may be returned as string to avoid precision loss.
  share_ratio: number | string | null;
};

export type AccountHolderOption = {
  user_id: string;
  display_name: string;
  email: string | null;
};

export type Account = {
  id: string;
  name: string;
  type: AccountType;
  currency: string;
  // Supabase numeric may be returned as string to avoid precision loss.
  initial_balance: number | string;
  current_balance: number | string;
  sort_order: number;
  created_at: string;
  holders: AccountHolder[];
};
