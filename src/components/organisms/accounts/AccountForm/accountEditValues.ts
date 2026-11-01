import { isAccountBalanceText, isValidTargetBalance } from "internal/account";
import {
  getInitialAccountHolderSelection,
  type AccountHolderSelection,
} from "molecules/accounts/accountHolderSelection";
import type {
  Account,
  AccountHolderOption,
  AccountPlaceholderHolderOption,
} from "types/accounts";

export type AccountEditHolderDefaults = {
  /** 候选外的当前占位持有人也补进来，不改持有人直接保存时才会原样带回。 */
  placeholderOptions: AccountPlaceholderHolderOption[];
  /** 已离开账本的成员持有人：只显示，由数据库保存时保留。 */
  preservedHolderOptions: AccountHolderOption[];
  selection: AccountHolderSelection;
};

/** 编辑账户时由当前持有人求持有人选项与初始选择。 */
export function getAccountEditHolderDefaults({
  account,
  holderOptions,
  placeholderHolderOptions,
}: {
  account: Account;
  holderOptions: AccountHolderOption[];
  placeholderHolderOptions: AccountPlaceholderHolderOption[];
}): AccountEditHolderDefaults {
  const selectableUserIds = new Set(
    holderOptions.map((option) => option.user_id),
  );
  const preservedHolderOptions = account.holders.flatMap((holder) =>
    holder.kind === "member" && !selectableUserIds.has(holder.user_id)
      ? [
          {
            display_color: holder.display_color,
            display_name: holder.display_name,
            email: holder.email,
            user_id: holder.user_id,
          },
        ]
      : [],
  );
  const currentPlaceholder = account.holders.find(
    (holder) => holder.kind === "placeholder",
  );
  const placeholderOptions =
    currentPlaceholder &&
    !placeholderHolderOptions.some(
      (option) => option.placeholder_id === currentPlaceholder.placeholder_id,
    )
      ? [
          ...placeholderHolderOptions,
          {
            display_name: currentPlaceholder.display_name,
            placeholder_id: currentPlaceholder.placeholder_id,
          },
        ]
      : placeholderHolderOptions;

  return {
    placeholderOptions,
    preservedHolderOptions,
    selection: getInitialAccountHolderSelection({
      holderUserIds: [...selectableUserIds],
      placeholderOptions,
      selectedPlaceholderId: currentPlaceholder?.placeholder_id ?? null,
      selectedUserIds: account.holders.flatMap((holder) =>
        holder.kind === "member" ? [holder.user_id] : [],
      ),
    }),
  };
}

/** 编辑时输入的目标余额与当前余额的差：无效输入时 valid 为 false，差值按 0。 */
export function getAccountBalanceAdjustment(
  targetBalanceText: string,
  currentBalance: number | string,
) {
  const text = targetBalanceText.trim();
  const valid =
    isAccountBalanceText(text) && isValidTargetBalance(Number(text));
  const delta = valid
    ? (Math.round(Number(text) * 100) -
        Math.round(Number(currentBalance) * 100)) /
      100
    : 0;

  return { delta, valid };
}

export type AccountFormValues = {
  balance: string;
  balanceAdjustmentNote: string;
  currency: string;
  holderSelection: AccountHolderSelection;
  name: string;
  type: string | null;
};

/** 表单是否改过：与初始值比较，改回原值不算修改；余额按数值比较（85000 与 85000.00 相同）。 */
export function isAccountFormDirty(
  initial: AccountFormValues,
  current: AccountFormValues,
) {
  return (
    initial.name !== current.name ||
    initial.type !== current.type ||
    initial.currency !== current.currency ||
    initial.balanceAdjustmentNote !== current.balanceAdjustmentNote ||
    !isSameBalanceText(initial.balance, current.balance) ||
    initial.holderSelection?.kind !== current.holderSelection?.kind ||
    initial.holderSelection?.id !== current.holderSelection?.id
  );
}

function isSameBalanceText(initial: string, current: string) {
  if (initial.trim() === current.trim()) return true;
  const { delta, valid } = getAccountBalanceAdjustment(current, initial);
  return valid && delta === 0;
}
