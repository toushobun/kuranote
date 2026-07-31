import { isThemeColorKey, type ThemeColorKey } from "theme/themeColorTokens";

export type AccountHolderDisplayColor = {
  account_id: string;
  user_id: string;
};

export type LedgerMemberDisplayColor = {
  display_color: string | null;
  user_id: string;
};

export function buildSingleHolderAccountColorById({
  activeMemberUserIds,
  holders,
  settings,
}: {
  activeMemberUserIds: Set<string>;
  holders: AccountHolderDisplayColor[];
  settings: LedgerMemberDisplayColor[];
}) {
  const holderUserIdsByAccountId = new Map<string, Set<string>>();
  const displayColorByUserId = new Map<string, ThemeColorKey>();

  for (const setting of settings) {
    if (setting.display_color && isThemeColorKey(setting.display_color)) {
      displayColorByUserId.set(setting.user_id, setting.display_color);
    }
  }

  for (const holder of holders) {
    if (!activeMemberUserIds.has(holder.user_id)) continue;

    const holderUserIds =
      holderUserIdsByAccountId.get(holder.account_id) ?? new Set<string>();
    holderUserIds.add(holder.user_id);
    holderUserIdsByAccountId.set(holder.account_id, holderUserIds);
  }

  const accountColorById = new Map<string, ThemeColorKey>();

  for (const [accountId, holderUserIds] of holderUserIdsByAccountId) {
    if (holderUserIds.size !== 1) continue;

    const [holderUserId] = holderUserIds;
    const displayColor = holderUserId
      ? displayColorByUserId.get(holderUserId)
      : undefined;

    if (displayColor) {
      accountColorById.set(accountId, displayColor);
    }
  }

  return accountColorById;
}
