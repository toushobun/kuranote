import {
  getFallbackThemeColorKey,
  getStableFallbackThemeColorKey,
  isThemeColorKey,
  type ThemeColorKey,
} from "theme/themeColorTokens";
import type {
  AccountData,
  AccountHolderData,
  AccountLedgerMember,
  AccountMemberDisplaySetting,
  AccountUser,
} from "internal/account/repository/accountRepository";
import type { AccountHolderRole } from "internal/account/entity/accountHolderRole";

type AccountHolderView = {
  display_color: ThemeColorKey;
  display_name: string;
  email: string | null;
  id: string;
  role: AccountHolderRole;
  share_ratio: number | string | null;
  user_id: string;
};

type AccountView = AccountData & {
  holders: AccountHolderView[];
};

type AccountHolderOptionView = {
  display_name: string;
  email: string | null;
  user_id: string;
};

export function buildAccountsWithHolders({
  accounts,
  appUserById,
  displayColorByUserId,
  holders,
}: {
  accounts: AccountData[];
  appUserById: Map<string, AccountUser>;
  displayColorByUserId: Map<string, ThemeColorKey>;
  holders: AccountHolderData[];
}): AccountView[] {
  const holdersByAccountId = new Map<string, AccountHolderView[]>();

  for (const holder of holders) {
    const appUser = appUserById.get(holder.user_id);

    if (!appUser) {
      continue;
    }

    const accountHolders = holdersByAccountId.get(holder.account_id) ?? [];

    accountHolders.push({
      id: holder.id,
      user_id: holder.user_id,
      display_name: appUser.display_name,
      email: appUser.email,
      display_color:
        displayColorByUserId.get(holder.user_id) ??
        getStableFallbackThemeColorKey(holder.user_id),
      role: holder.role,
      share_ratio: holder.share_ratio,
    });

    holdersByAccountId.set(holder.account_id, accountHolders);
  }

  return accounts.map((account) => ({
    ...account,
    holders: holdersByAccountId.get(account.id) ?? [],
  }));
}

export function buildHolderOptions({
  appUserById,
  members,
}: {
  appUserById: Map<string, AccountUser>;
  members: AccountLedgerMember[];
}) {
  return members
    .map((member): AccountHolderOptionView | null => {
      const appUser = appUserById.get(member.user_id);

      if (!appUser || appUser.status !== "active") {
        return null;
      }

      return {
        user_id: member.user_id,
        display_name: appUser.display_name,
        email: appUser.email,
      };
    })
    .filter((option): option is AccountHolderOptionView => option !== null)
    .sort((a, b) =>
      (a.display_name || a.email || "").localeCompare(
        b.display_name || b.email || "",
      ),
    );
}

export function buildDisplayColorByUserId({
  members,
  settings,
}: {
  members: AccountLedgerMember[];
  settings: AccountMemberDisplaySetting[];
}) {
  const displayColorByUserId = new Map<string, ThemeColorKey>();
  const sortedMembers = [...members].sort((a, b) => {
    const timeCompare = (a.joined_at ?? a.created_at).localeCompare(
      b.joined_at ?? b.created_at,
    );

    return timeCompare || a.user_id.localeCompare(b.user_id);
  });

  sortedMembers.forEach((member, index) => {
    displayColorByUserId.set(member.user_id, getFallbackThemeColorKey(index));
  });

  for (const setting of settings) {
    if (isThemeColorKey(setting.display_color)) {
      displayColorByUserId.set(setting.user_id, setting.display_color);
    }
  }

  return displayColorByUserId;
}
