import type { AccountExportSummary } from "internal/account/entity/accountExportSummary";
import type { AccountRepository } from "internal/account/repository/accountRepository";
import { mergeLedgerDisplayNames } from "internal/account/service/read/accountsView";
import { buildDisplayColorByUserId } from "internal/account/util/accountView";
import {
  requireActiveLedgerMemberRole,
  type LedgerAccessService,
} from "internal/ledger";
import { getStableFallbackThemeColorKey } from "theme/themeColorTokens";

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
      const [accounts, holders, settings, members] = await Promise.all([
        accountRepository.findSummariesByIds(ledgerId, accountIds),
        accountRepository.listHolders(ledgerId, accountIds),
        accountRepository.listDisplaySettings(ledgerId),
        accountRepository.listActiveMembers(ledgerId),
      ]);
      const users = mergeLedgerDisplayNames(
        await accountRepository.listUsers([
          ...new Set(holders.map((holder) => holder.user_id)),
        ]),
        settings,
      );
      const userById = new Map(users.map((user) => [user.id, user]));
      const holderByAccount = new Map(
        holders.map((holder) => [holder.account_id, holder]),
      );
      const colors = buildDisplayColorByUserId({ members, settings });
      return accounts.map((account) => {
        const holder = holderByAccount.get(account.id);
        const user = holder ? userById.get(holder.user_id) : undefined;
        return {
          ...account,
          holder:
            holder && user
              ? {
                  name: user.display_name,
                  displayColor:
                    colors.get(holder.user_id) ??
                    getStableFallbackThemeColorKey(holder.user_id),
                }
              : null,
        };
      });
    },
  };
}
