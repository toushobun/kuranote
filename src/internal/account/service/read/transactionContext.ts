import type {
  AccountLedgerMember,
  AccountMemberDisplaySetting,
  AccountRepository,
} from "internal/account/repository/accountRepository";
import { buildSingleHolderAccountColorById } from "internal/account/util/accountHolderDisplayColors";
import { getAccountHolderId } from "internal/account/util/accountView";

type TransactionAccountContextInput = {
  accounts: Awaited<ReturnType<AccountRepository["findSummariesByIds"]>>;
  holders: Awaited<ReturnType<AccountRepository["listHolders"]>>;
  members: AccountLedgerMember[];
  settings: AccountMemberDisplaySetting[];
};

export function buildTransactionAccountContext({
  accounts,
  holders,
  members,
  settings,
}: TransactionAccountContextInput) {
  const holderIdsByAccountId = new Map<string, string[]>();
  for (const holder of holders) {
    holderIdsByAccountId.set(holder.account_id, [
      ...(holderIdsByAccountId.get(holder.account_id) ?? []),
      getAccountHolderId(holder),
    ]);
  }

  return {
    accountColorById: buildSingleHolderAccountColorById({
      activeMemberUserIds: new Set(members.map((member) => member.user_id)),
      holders,
      settings,
    }),
    accounts: accounts.map(({ currency, id, name }) => ({
      currency,
      id,
      name,
    })),
    holderIdsByAccountId,
    showRecorder: members.length > 1,
  };
}
