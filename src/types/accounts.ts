import type { AccountHolderRole, AccountType } from "internal/account";
import type { ThemeColorKey } from "theme/themeColorTokens";
import type { BaseActionState } from "types/auth";

export { accountTypeOptions } from "internal/account";

export type { AccountHolderRole, AccountType };

export type AccountActionState = BaseActionState & {
  errorKey?: string;
};

export type AccountStateAction = (
  previousState: AccountActionState,
  formData: FormData,
) => Promise<AccountActionState>;

type AccountHolderBase = {
  id: string;
  display_name: string;
  role: AccountHolderRole;
  // Supabase numeric may be returned as string to avoid precision loss.
  share_ratio: number | string | null;
};

/**
 * 持有人判别联合：kind 为 "member" 时是真实成员；"placeholder" 时是待邀请成员，
 * user_id 为 null，不能拿 placeholder_id 当作用户查询头像、邮箱或成员颜色。
 */
export type AccountHolder =
  | (AccountHolderBase & {
      kind: "member";
      user_id: string;
      placeholder_id: null;
      email: string | null;
      display_color: ThemeColorKey;
    })
  | (AccountHolderBase & {
      kind: "placeholder";
      user_id: null;
      placeholder_id: string;
      email: null;
      display_color: null;
    });

export type AccountPlaceholderHolderOption = {
  placeholder_id: string;
  display_name: string;
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
