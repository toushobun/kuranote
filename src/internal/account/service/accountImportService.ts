import type { AccountService } from "internal/account/service/accountService";

export type AccountImportEntry = {
  currency: string;
  holderUserId: string | null;
  id: string;
  name: string;
};

export type AccountImportHolder = {
  displayName: string;
  userId: string;
};

export type AccountImportContext = {
  accounts: AccountImportEntry[];
  holders: AccountImportHolder[];
};

export interface AccountImportService {
  createAccount(input: {
    currency: string;
    holderUserId: string | null;
    ledgerId: string;
    name: string;
    userId: string;
  }): Promise<{ accountId: string }>;
  loadContext(input: {
    ledgerId: string;
    userId: string;
  }): Promise<AccountImportContext>;
}

/** 数据导入模块只依赖这一层窄接口，不直接接触 Account Repository。 */
export function createAccountImportService(
  service: AccountService,
): AccountImportService {
  return {
    async createAccount({ currency, holderUserId, ledgerId, name, userId }) {
      return service.create({
        currency,
        holderUserIds: holderUserId ? [holderUserId] : [],
        initialBalance: 0,
        ledgerId,
        name,
        type: "other",
        userId,
      });
    },

    async loadContext({ ledgerId, userId }) {
      const view = await service.getView({ ledgerId, userId });

      return {
        accounts: view.accounts.map((account) => ({
          currency: account.currency,
          holderUserId: account.holders[0]?.user_id ?? null,
          id: account.id,
          name: account.name,
        })),
        holders: view.holderOptions.map((holder) => ({
          displayName: holder.display_name,
          userId: holder.user_id,
        })),
      };
    },
  };
}
