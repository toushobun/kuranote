import type { AccountHolderSelection } from "molecules/accounts/accountHolderSelection";
import type {
  AccountHolder,
  AccountHolderOption,
  AccountPlaceholderHolderOption,
} from "types/accounts";

/** 把持有人选择转成账户卡片的持有人，预览时与列表中的个性色胶囊一致。 */
export function buildAccountPreviewHolders({
  holderOptions,
  placeholderOptions,
  preservedHolderOptions = [],
  selection,
}: {
  holderOptions: AccountHolderOption[];
  placeholderOptions: AccountPlaceholderHolderOption[];
  /** 编辑时保存会保留的非活跃成员持有人，始终显示在前面。 */
  preservedHolderOptions?: AccountHolderOption[];
  selection: AccountHolderSelection;
}): AccountHolder[] {
  return [
    ...preservedHolderOptions.map(toMemberHolder),
    ...buildSelectedHolders({ holderOptions, placeholderOptions, selection }),
  ];
}

function buildSelectedHolders({
  holderOptions,
  placeholderOptions,
  selection,
}: {
  holderOptions: AccountHolderOption[];
  placeholderOptions: AccountPlaceholderHolderOption[];
  selection: AccountHolderSelection;
}): AccountHolder[] {
  if (selection?.kind === "member") {
    const option = holderOptions.find(
      (holder) => holder.user_id === selection.id,
    );
    return option ? [toMemberHolder(option)] : [];
  }

  if (selection?.kind === "placeholder") {
    const option = placeholderOptions.find(
      (placeholder) => placeholder.placeholder_id === selection.id,
    );
    return option
      ? [
          {
            display_color: null,
            display_name: option.display_name,
            email: null,
            id: option.placeholder_id,
            kind: "placeholder",
            placeholder_id: option.placeholder_id,
            role: "owner",
            share_ratio: null,
            user_id: null,
          },
        ]
      : [];
  }

  return [];
}

function toMemberHolder(option: AccountHolderOption): AccountHolder {
  return {
    display_color: option.display_color,
    display_name: option.display_name,
    email: option.email,
    id: option.user_id,
    kind: "member",
    placeholder_id: null,
    role: "owner",
    share_ratio: null,
    user_id: option.user_id,
  };
}

/** 预览用余额：输入中途（空、只有负号等）还不是数字时按 0 显示。 */
export function getAccountPreviewBalance(balanceText: string) {
  const balance = Number(balanceText.trim());
  return balanceText.trim() !== "" && Number.isFinite(balance) ? balance : 0;
}
