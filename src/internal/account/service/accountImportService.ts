import type { AccountService } from "internal/account/service/accountService";

/**
 * 导入用的账户持有人引用：真实成员与待邀请成员（占位）互斥，`null` 为无持有人。
 * 占位 ID 永远不是 userId，不能混用。
 */
export type AccountImportHolderRef =
  | { kind: "member"; userId: string }
  | { kind: "placeholder"; placeholderId: string };

export type AccountImportEntry = {
  isArchived: boolean;
  currency: string;
  holder: AccountImportHolderRef | null;
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
    holder: AccountImportHolderRef | null;
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
    async createAccount({ currency, holder, ledgerId, name, userId }) {
      return service.create({
        currency,
        holderPlaceholderId:
          holder?.kind === "placeholder" ? holder.placeholderId : null,
        holderUserIds: holder?.kind === "member" ? [holder.userId] : [],
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
        // 占位持有的账户必须带上占位引用，不能映射成无持有人，否则会被误复用。
        accounts: view.accounts.map((account) => {
          const holder = account.holders[0];
          return {
            isArchived: account.is_archived,
            currency: account.currency,
            holder: !holder
              ? null
              : holder.kind === "placeholder"
                ? { kind: "placeholder", placeholderId: holder.placeholder_id }
                : { kind: "member", userId: holder.user_id },
            id: account.id,
            name: account.name,
          };
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
