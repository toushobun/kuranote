import {
  getFallbackThemeColorKey,
  getStableFallbackThemeColorKey,
  isThemeColorKey,
  type ThemeColorKey,
} from "theme/themeColorTokens";
import type {
  AccountHolderData,
  AccountLedgerMember,
  AccountMemberDisplaySetting,
  AccountUser,
} from "internal/account/repository/accountRepository";
import type { AccountHolderRole } from "internal/account/entity/accountHolderRole";
import type { LedgerPlaceholderMemberSummary } from "internal/ledger";

type AccountHolderViewBase = {
  display_name: string;
  id: string;
  role: AccountHolderRole;
  share_ratio: number | string | null;
};

/**
 * 持有人视图判别联合：kind 区分真实成员与占位。占位没有用户资料，
 * 不带邮箱与成员个性色（display_color 为 null），也不能用 ID 查询用户。
 */
type AccountHolderView =
  | (AccountHolderViewBase & {
      display_color: ThemeColorKey;
      email: string | null;
      kind: "member";
      placeholder_id: null;
      user_id: string;
    })
  | (AccountHolderViewBase & {
      display_color: null;
      email: null;
      kind: "placeholder";
      placeholder_id: string;
      user_id: null;
    });

/** 占位摘要暂未读到（例如读取竞态）时的兜底名称，仍按占位展示而不是无持有人。 */
export const unknownPlaceholderHolderName = "待邀请成员";

type AccountView<T> = T & {
  holders: AccountHolderView[];
};

type AccountHolderOptionView = {
  display_name: string;
  email: string | null;
  user_id: string;
};

export function buildAccountsWithHolders<T extends { id: string }>({
  accounts,
  appUserById,
  displayColorByUserId,
  holders,
  placeholderById,
}: {
  accounts: T[];
  appUserById: Map<string, AccountUser>;
  displayColorByUserId: Map<string, ThemeColorKey>;
  holders: AccountHolderData[];
  placeholderById: Map<string, LedgerPlaceholderMemberSummary>;
}): AccountView<T>[] {
  const holdersByAccountId = new Map<string, AccountHolderView[]>();

  for (const holder of holders) {
    if (holder.user_id === null) {
      const accountHolders = holdersByAccountId.get(holder.account_id) ?? [];
      accountHolders.push({
        display_color: null,
        display_name:
          placeholderById.get(holder.placeholder_id)?.displayName ??
          unknownPlaceholderHolderName,
        email: null,
        id: holder.id,
        kind: "placeholder",
        placeholder_id: holder.placeholder_id,
        role: holder.role,
        share_ratio: holder.share_ratio,
        user_id: null,
      });
      holdersByAccountId.set(holder.account_id, accountHolders);
      continue;
    }

    const appUser = appUserById.get(holder.user_id);

    if (!appUser) {
      continue;
    }

    const accountHolders = holdersByAccountId.get(holder.account_id) ?? [];

    accountHolders.push({
      id: holder.id,
      kind: "member",
      placeholder_id: null,
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

/** 占位候选：只列未认领占位，与成员候选分开表达。 */
export function buildPlaceholderHolderOptions(
  placeholders: LedgerPlaceholderMemberSummary[],
) {
  return placeholders
    .map((placeholder) => ({
      display_name: placeholder.displayName,
      placeholder_id: placeholder.id,
    }))
    .sort((a, b) => a.display_name.localeCompare(b.display_name));
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
