import type {
  CurrentLedgerRole,
  LedgerPlaceholderMemberSummary,
} from "internal/ledger";
import { canManageMasterData, canWriteTransaction } from "internal/ledger";
import type {
  AccountLedgerMember,
  AccountLedgerSummary,
  AccountMemberDisplaySetting,
  AccountRepository,
  AccountUser,
} from "internal/account/repository/accountRepository";
import {
  buildAccountsWithHolders,
  buildDisplayColorByUserId,
  buildHolderOptions,
  buildPlaceholderHolderOptions,
} from "internal/account/util/accountView";

type AccountsViewInput = {
  accountIdsWithTransactions: string[];
  accounts: Awaited<ReturnType<AccountRepository["listAccounts"]>>;
  displaySettings: AccountMemberDisplaySetting[];
  holders: Awaited<ReturnType<AccountRepository["listHolders"]>>;
  ledger: AccountLedgerSummary;
  members: AccountLedgerMember[];
  placeholders: LedgerPlaceholderMemberSummary[];
  role: CurrentLedgerRole;
  users: AccountUser[];
};

export function mergeLedgerDisplayNames(
  users: AccountUser[],
  settings: AccountMemberDisplaySetting[],
): AccountUser[] {
  const settingByUserId = new Map(
    settings.map((setting) => [setting.user_id, setting] as const),
  );

  return users.map((user) => {
    const ledgerDisplayName = settingByUserId
      .get(user.id)
      ?.display_name?.trim();

    return {
      ...user,
      display_name: ledgerDisplayName || user.display_name,
    };
  });
}

/** 新增账户表单与账户列表共用的持有人显示规则。 */
export function buildAccountFormHolderOptions({
  displaySettings,
  members,
  placeholders,
  users,
}: Pick<
  AccountsViewInput,
  "displaySettings" | "members" | "placeholders" | "users"
>) {
  const usersWithLedgerDisplayNames = mergeLedgerDisplayNames(
    users,
    displaySettings,
  );
  const appUserById = new Map(
    usersWithLedgerDisplayNames.map((user) => [user.id, user]),
  );
  const displayColorByUserId = buildDisplayColorByUserId({
    members,
    settings: displaySettings,
  });

  return {
    appUserById,
    displayColorByUserId,
    holderOptions: buildHolderOptions({
      appUserById,
      displayColorByUserId,
      members,
    }),
    placeholderHolderOptions: buildPlaceholderHolderOptions(placeholders),
  };
}

export function buildAccountsView({
  accountIdsWithTransactions,
  accounts,
  displaySettings,
  holders,
  ledger,
  members,
  placeholders,
  role,
  users,
}: AccountsViewInput) {
  const {
    appUserById,
    displayColorByUserId,
    holderOptions,
    placeholderHolderOptions,
  } = buildAccountFormHolderOptions({
    displaySettings,
    members,
    placeholders,
    users,
  });
  const accountIdsWithTransactionsSet = new Set(accountIdsWithTransactions);

  return {
    accounts: buildAccountsWithHolders({
      // 已有交易的账户在编辑表单中禁用币种字段（#910）。
      accounts: accounts.map((account) => ({
        ...account,
        has_transactions: accountIdsWithTransactionsSet.has(account.id),
      })),
      appUserById,
      displayColorByUserId,
      holders,
      placeholderById: new Map(
        placeholders.map((placeholder) => [placeholder.id, placeholder]),
      ),
    }),
    baseCurrency: ledger.baseCurrency,
    canManageAccounts: canManageMasterData(role),
    canWriteTransactions: canWriteTransaction(role),
    holderOptions,
    ledgerName: ledger.name,
    placeholderHolderOptions,
  };
}
