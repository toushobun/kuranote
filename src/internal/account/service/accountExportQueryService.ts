import type { AccountExportSummary } from "internal/account/entity/accountExportSummary";
import type { AccountRepository } from "internal/account/repository/accountRepository";
import { mergeLedgerDisplayNames } from "internal/account/service/read/accountsView";
import {
  buildAccountsWithHolders,
  buildDisplayColorByUserId,
} from "internal/account/util/accountView";
import {
  requireActiveLedgerMemberRole,
  type LedgerAccessService,
} from "internal/ledger";

export interface AccountExportQueryService {
  findExportSummaries(input: {
    accountIds: string[];
    ledgerId: string;
    userId: string;
  }): Promise<AccountExportSummary[]>;
}

export function createAccountExportQueryService({
  accountRepository,
  ledgerAccessService,
}: {
  accountRepository: Pick<
    AccountRepository,
    | "findSummariesByIds"
    | "listHolders"
    | "listDisplaySettings"
    | "listActiveMembers"
    | "listUsers"
  >;
  ledgerAccessService: LedgerAccessService;
}): AccountExportQueryService {
  return {
    async findExportSummaries({ accountIds, ledgerId, userId }) {
      await requireActiveLedgerMemberRole(ledgerAccessService, {
        ledgerId,
        userId,
      });
      const uniqueAccountIds = [...new Set(accountIds)];
      if (uniqueAccountIds.length === 0) return [];
      const [settings, members] = await Promise.all([
        accountRepository.listDisplaySettings(ledgerId),
        accountRepository.listActiveMembers(ledgerId),
      ]);
      const displayColorByUserId = buildDisplayColorByUserId({
        members,
        settings,
      });
      const result: AccountExportSummary[] = [];
      for (let offset = 0; offset < uniqueAccountIds.length; offset += 100) {
        const ids = uniqueAccountIds.slice(offset, offset + 100);
        const [accounts, holders] = await Promise.all([
          accountRepository.findSummariesByIds(ledgerId, ids),
          accountRepository.listHolders(ledgerId, ids),
        ]);
        const users = mergeLedgerDisplayNames(
          await accountRepository.listUsers([
            ...new Set(holders.map((holder) => holder.user_id)),
          ]),
          settings,
        );
        const accountsWithHolders = buildAccountsWithHolders({
          accounts,
          holders,
          appUserById: new Map(users.map((user) => [user.id, user])),
          displayColorByUserId,
        });
        for (const {
          holders: accountHolders,
          ...account
        } of accountsWithHolders) {
          const holder = accountHolders[0];
          result.push({
            ...account,
            holder: holder
              ? {
                  name: holder.display_name,
                  displayColor: holder.display_color,
                }
              : null,
          });
        }
      }
      return result;
    },
  };
}
