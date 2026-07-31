import type { CurrentLedgerRole } from "internal/ledger";
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
} from "internal/account/util/accountView";

type AccountsViewInput = {
  accounts: Awaited<ReturnType<AccountRepository["listAccounts"]>>;
  displaySettings: AccountMemberDisplaySetting[];
  holders: Awaited<ReturnType<AccountRepository["listHolders"]>>;
  ledger: AccountLedgerSummary;
  members: AccountLedgerMember[];
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

export function buildAccountsView({
  accounts,
  displaySettings,
  holders,
  ledger,
  members,
  role,
  users,
}: AccountsViewInput) {
  const usersWithLedgerDisplayNames = mergeLedgerDisplayNames(
    users,
    displaySettings,
  );
  const appUserById = new Map(
    usersWithLedgerDisplayNames.map((user) => [user.id, user]),
  );

  return {
    accounts: buildAccountsWithHolders({
      accounts,
      appUserById,
      displayColorByUserId: buildDisplayColorByUserId({
        members,
        settings: displaySettings,
      }),
      holders,
    }),
    baseCurrency: ledger.baseCurrency,
    canManageAccounts: canManageMasterData(role),
    canWriteTransactions: canWriteTransaction(role),
    holderOptions: buildHolderOptions({ appUserById, members }),
    ledgerName: ledger.name,
  };
}
