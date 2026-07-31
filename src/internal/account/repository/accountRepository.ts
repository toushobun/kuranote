import type { CurrentLedgerRole } from "internal/ledger";
import type { AccountType } from "internal/account/entity/accountType";
import type { AccountHolderRole } from "internal/account/entity/accountHolderRole";
import type { AccountSummary } from "internal/account/entity/accountSummary";
import type { Logger } from "internal/shared/logging/logger";
import { ConflictError } from "internal/shared/errors/appError";
import {
  accountErrorCodes,
  getAccountErrorMessage,
} from "internal/account/errors";
import type { AuthenticatedSupabaseClient } from "internal/shared/supabase/authenticatedClient";
import { toRepositoryError } from "internal/shared/supabase/repositoryError";

type AccountRow = {
  created_at: string;
  currency: string;
  current_balance: number | string;
  id: string;
  initial_balance: number | string;
  name: string;
  sort_order: number;
  type: AccountType;
};

type AccountHolderRow = {
  account_id: string;
  id: string;
  role: AccountHolderRole;
  share_ratio: number | string | null;
  user_id: string;
};

type AppUserRow = {
  display_name: string;
  email: string | null;
  id: string;
  status: string;
};

type LedgerMemberRow = {
  created_at: string;
  joined_at: string | null;
  role: unknown;
  user_id: string;
};

type LedgerMemberDisplaySettingRow = {
  display_color: string;
  display_name: string | null;
  user_id: string;
};

export type AccountData = {
  created_at: string;
  currency: string;
  current_balance: number | string;
  id: string;
  initial_balance: number | string;
  name: string;
  sort_order: number;
  type: AccountType;
};

export type AccountHolderData = {
  account_id: string;
  id: string;
  role: AccountHolderRole;
  share_ratio: number | string | null;
  user_id: string;
};

export type AccountUser = {
  display_name: string;
  email: string | null;
  id: string;
  status: string;
};

export type AccountMemberDisplaySetting = {
  display_color: string;
  display_name: string | null;
  user_id: string;
};

export type AccountLedgerSummary = {
  baseCurrency: string;
  id: string;
  name: string;
};

export type AccountLedgerMember = {
  created_at: string;
  joined_at: string | null;
  role: CurrentLedgerRole;
  user_id: string;
};

export type CreateAccountInput = {
  currency: string;
  holderUserIds: string[];
  initialBalance: number;
  ledgerId: string;
  name: string;
  type: AccountType;
};

export type UpdateAccountInput = {
  accountId: string;
  currency: string;
  holderUserIds: string[];
  ledgerId: string;
  name: string;
  type: AccountType;
};

export type ArchiveAccountInput = {
  accountId: string;
  archivedAt: string;
  ledgerId: string;
  userId: string;
};

export interface AccountRepository {
  archive(input: ArchiveAccountInput): Promise<boolean>;
  create(input: CreateAccountInput): Promise<string | null>;
  findSummariesByIds(
    ledgerId: string,
    accountIds: string[],
  ): Promise<AccountSummary[]>;
  findActiveLedger(ledgerId: string): Promise<AccountLedgerSummary | null>;
  isActiveAccount(ledgerId: string, accountId: string): Promise<boolean>;
  listAccounts(ledgerId: string): Promise<AccountData[]>;
  listActiveMembers(ledgerId: string): Promise<AccountLedgerMember[]>;
  listDisplaySettings(ledgerId: string): Promise<AccountMemberDisplaySetting[]>;
  listHolders(
    ledgerId: string,
    accountIds: string[],
  ): Promise<AccountHolderData[]>;
  listUsers(userIds: string[]): Promise<AccountUser[]>;
  update(input: UpdateAccountInput): Promise<boolean>;
}

function toCurrentLedgerRole(value: unknown): CurrentLedgerRole {
  if (
    value === "owner" ||
    value === "admin" ||
    value === "member" ||
    value === "viewer"
  ) {
    return value;
  }

  throw toRepositoryError(
    "account_member_role_invalid",
    "账户成员资料格式异常，请稍后重试。",
  );
}

export function createSupabaseAccountRepository(
  supabase: AuthenticatedSupabaseClient,
  logger: Logger,
): AccountRepository {
  function logError(
    operation: string,
    error: { code?: string | null; message?: string | null },
    details: Record<string, unknown>,
  ) {
    logger.error(`[account] ${operation}`, {
      code: error.code,
      ...details,
    });
  }

  return {
    async archive({ accountId, archivedAt, ledgerId, userId }) {
      const { count, error } = await supabase
        .from("account")
        .update(
          {
            archived_at: archivedAt,
            archived_by: userId,
            is_archived: true,
            updated_by: userId,
          },
          { count: "exact" },
        )
        .eq("id", accountId)
        .eq("ledger_id", ledgerId)
        .eq("is_archived", false);

      if (error) {
        logError("failed to archive account", error, { accountId, ledgerId });
        throw toRepositoryError(
          "account_archive_failed",
          "账户删除失败，请稍后重试。",
        );
      }

      return count === 1;
    },

    async create(input) {
      const { data, error } = await supabase.rpc(
        "create_account_with_holders",
        {
          p_currency: input.currency,
          p_holder_user_ids: input.holderUserIds,
          p_initial_balance: input.initialBalance,
          p_ledger_id: input.ledgerId,
          p_name: input.name,
          p_type: input.type,
        },
      );

      if (error) {
        logError("failed to create account", error, {
          ledgerId: input.ledgerId,
        });
        if (error.code === "23505") {
          throw new ConflictError(
            accountErrorCodes.createFailed,
            getAccountErrorMessage(accountErrorCodes.createFailed) ??
              "账户新增失败，请稍后重试。",
          );
        }
        throw toRepositoryError(
          "account_create_failed",
          "账户新增失败，请稍后重试。",
        );
      }

      if (typeof data !== "string") {
        throw toRepositoryError(
          "account_create_result_invalid",
          "账户新增失败，请稍后重试。",
        );
      }
      return data;
    },

    async findSummariesByIds(ledgerId, accountIds) {
      const uniqueAccountIds = [...new Set(accountIds)];
      if (uniqueAccountIds.length === 0) return [];
      const { data, error } = await supabase
        .from("account")
        .select("id, name, currency")
        .eq("ledger_id", ledgerId)
        .in("id", uniqueAccountIds);
      if (error) {
        logError("failed to load account summaries", error, { ledgerId });
        throw toRepositoryError(
          "account_summaries_load_failed",
          "账户信息加载失败，请稍后重试。",
        );
      }
      return (data ?? []).map((row) => ({
        currency: row.currency,
        id: row.id,
        name: row.name,
      }));
    },

    async findActiveLedger(ledgerId) {
      const { data, error } = await supabase
        .from("ledger")
        .select("id, name, base_currency")
        .eq("id", ledgerId)
        .eq("is_archived", false)
        .maybeSingle();

      if (error) {
        logError("failed to load ledger", error, { ledgerId });
        throw toRepositoryError(
          "account_ledger_load_failed",
          "账本信息加载失败，请稍后重试。",
        );
      }

      return data
        ? {
            baseCurrency: data.base_currency,
            id: data.id,
            name: data.name,
          }
        : null;
    },

    async isActiveAccount(ledgerId, accountId) {
      const { data, error } = await supabase
        .from("account")
        .select("id")
        .eq("id", accountId)
        .eq("ledger_id", ledgerId)
        .eq("is_archived", false)
        .maybeSingle();

      if (error) {
        logError("failed to check account", error, { accountId, ledgerId });
        throw toRepositoryError(
          "account_lookup_failed",
          "账户信息确认失败，请稍后重试。",
        );
      }

      return Boolean(data);
    },

    async listAccounts(ledgerId) {
      const { data, error } = await supabase
        .from("account")
        .select(
          "id, name, type, currency, initial_balance, current_balance, sort_order, created_at",
        )
        .eq("ledger_id", ledgerId)
        .eq("is_archived", false)
        .order("sort_order", { ascending: true })
        .order("created_at", { ascending: true });

      if (error) {
        logError("failed to load accounts", error, { ledgerId });
        throw toRepositoryError(
          "accounts_load_failed",
          "账户列表加载失败，请稍后重试。",
        );
      }

      return ((data ?? []) as AccountRow[]).map((row) => ({
        created_at: row.created_at,
        currency: row.currency,
        current_balance: row.current_balance,
        id: row.id,
        initial_balance: row.initial_balance,
        name: row.name,
        sort_order: row.sort_order,
        type: row.type,
      }));
    },

    async listActiveMembers(ledgerId) {
      const { data, error } = await supabase
        .from("ledger_member")
        .select("user_id, role, joined_at, created_at")
        .eq("ledger_id", ledgerId)
        .eq("status", "active")
        .order("joined_at", { ascending: true, nullsFirst: false })
        .order("created_at", { ascending: true })
        .order("user_id", { ascending: true });

      if (error) {
        logError("failed to load active ledger members", error, { ledgerId });
        throw toRepositoryError(
          "account_members_load_failed",
          "账本成员加载失败，请稍后重试。",
        );
      }

      return ((data ?? []) as LedgerMemberRow[]).map((member) => ({
        created_at: member.created_at,
        joined_at: member.joined_at,
        role: toCurrentLedgerRole(member.role),
        user_id: member.user_id,
      }));
    },

    async listDisplaySettings(ledgerId) {
      const { data, error } = await supabase
        .from("ledger_member_display_setting")
        .select("user_id, display_name, display_color")
        .eq("ledger_id", ledgerId);

      if (error) {
        logError("failed to load ledger member display settings", error, {
          ledgerId,
        });
        throw toRepositoryError(
          "account_member_display_settings_load_failed",
          "账本成员显示设置加载失败，请稍后重试。",
        );
      }

      return ((data ?? []) as LedgerMemberDisplaySettingRow[]).map(
        (setting) => ({
          display_color: setting.display_color,
          display_name: setting.display_name,
          user_id: setting.user_id,
        }),
      );
    },

    async listHolders(ledgerId, accountIds) {
      if (accountIds.length === 0) return [];

      const { data, error } = await supabase
        .from("account_holder")
        .select("id, account_id, user_id, role, share_ratio")
        .eq("ledger_id", ledgerId)
        .in("account_id", accountIds);

      if (error) {
        logError("failed to load account holders", error, { ledgerId });
        throw toRepositoryError(
          "account_holders_load_failed",
          "账户持有人加载失败，请稍后重试。",
        );
      }

      return ((data ?? []) as AccountHolderRow[]).map((holder) => ({
        account_id: holder.account_id,
        id: holder.id,
        role: holder.role,
        share_ratio: holder.share_ratio,
        user_id: holder.user_id,
      }));
    },

    async listUsers(userIds) {
      if (userIds.length === 0) return [];

      const { data, error } = await supabase
        .from("app_user")
        .select("id, display_name, email, status")
        .in("id", userIds);

      if (error) {
        logError("failed to load account holder users", error, {});
        throw toRepositoryError(
          "account_holder_users_load_failed",
          "账户持有人资料加载失败，请稍后重试。",
        );
      }

      return ((data ?? []) as AppUserRow[]).map((user) => ({
        display_name: user.display_name,
        email: user.email,
        id: user.id,
        status: user.status,
      }));
    },

    async update(input) {
      const { data, error } = await supabase.rpc(
        "update_account_with_holders",
        {
          p_account_id: input.accountId,
          p_currency: input.currency,
          p_holder_user_ids: input.holderUserIds,
          p_ledger_id: input.ledgerId,
          p_name: input.name,
          p_type: input.type,
        },
      );

      if (error) {
        logError("failed to update account", error, {
          accountId: input.accountId,
          ledgerId: input.ledgerId,
        });
        if (error.code === "23505") {
          throw new ConflictError(
            accountErrorCodes.updateFailed,
            getAccountErrorMessage(accountErrorCodes.updateFailed) ??
              "账户更新失败，请稍后重试。",
          );
        }
        throw toRepositoryError(
          "account_update_failed",
          "账户更新失败，请稍后重试。",
        );
      }

      return data === input.accountId;
    },
  };
}
