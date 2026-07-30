import type {
  AccountLedgerMemberRecord,
  AccountRepository,
} from "internal/account/repository/accountRepository";
import { buildSingleHolderAccountColorById } from "internal/account/util/accountHolderDisplayColors";
import type { LedgerMemberDisplaySettingRecord } from "types/accounts";

type TransactionAccountContextInput = {
  accounts: Awaited<ReturnType<AccountRepository["findSummariesByIds"]>>;
  holders: Awaited<ReturnType<AccountRepository["listHolders"]>>;
  members: AccountLedgerMemberRecord[];
  settings: LedgerMemberDisplaySettingRecord[];
};

export function buildTransactionAccountContext({
  accounts,
  holders,
  members,
  settings,
}: TransactionAccountContextInput) {
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
    showRecorder: members.length > 1,
  };
}
