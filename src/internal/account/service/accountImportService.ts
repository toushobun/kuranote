import type { AccountService } from "internal/account/service/accountService";

export type AccountImportEntry = {
  isArchived: boolean;
  currency: string;
  holderUserId: string | null;
  id: string;
  name: string;
};

export type AccountImportHolder = {
  displayName: string;
  /** 仅用于在同名成员之间做区分，不参与匹配。 */
  email?: string | null;
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
        holderPlaceholderId: null,
        holderUserIds: holderUserId ? [holderUserId] : [],
        initialBalance: 0,
        ledgerId,
        name,
        // 导入模板没有账户类型列，无法推断时统一归为“其他”。
        type: "other",
        userId,
      });
    },

    async loadContext({ ledgerId, userId }) {
      const view = await service.getView({
        ledgerId,
        userId,
        includeArchived: true,
      });

      return {
        // 占位持有的账户不能映射成 holderUserId: null，否则会被当成「无持有人」
        // 账户误复用；完整的持有人联合映射在导入映射阶段（#804）实现，这里先排除。
        accounts: view.accounts.flatMap((account) => {
          const holder = account.holders[0];
          if (holder?.kind === "placeholder") return [];
          return [
            {
              isArchived: account.is_archived,
              currency: account.currency,
              holderUserId: holder?.user_id ?? null,
              id: account.id,
              name: account.name,
            },
          ];
        }),
        holders: view.holderOptions.map((holder) => ({
          displayName: holder.display_name,
          email: holder.email,
          userId: holder.user_id,
        })),
      };
    },
  };
}
