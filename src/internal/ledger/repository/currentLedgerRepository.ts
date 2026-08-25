import type { QueryData } from "@supabase/supabase-js";

import type {
  CurrentLedger,
  CurrentLedgerContext,
  CurrentLedgerRole,
} from "internal/ledger/entity/currentLedger";
import {
  currentLedgerErrorCodes,
  type CurrentLedgerErrorCode,
} from "internal/ledger/errors/currentLedger";
import type { Logger } from "internal/shared/logging/logger";
import type { AuthenticatedSupabaseClient } from "internal/shared/supabase/authenticatedClient";
import { toRepositoryError } from "internal/shared/supabase/repositoryError";
import {
  isTransactionColorScheme,
  type TransactionColorScheme,
} from "internal/user";

export type UpdateCurrentLedgerInput = {
  ledgerId: string;
  userId: string;
};

export type UpdateCurrentLedgerResult =
  | { ok: true }
  | { ok: false; code: CurrentLedgerErrorCode };

export interface CurrentLedgerContextRepository {
  getContext(userId: string, email: string): Promise<CurrentLedgerContext>;
}

export interface CurrentLedgerRepository {
  findAccessibleLedger(
    ledgerId: string,
    userId: string,
  ): Promise<CurrentLedger | null>;
  isActiveMember(ledgerId: string, userId: string): Promise<boolean>;
  isLedgerActive(ledgerId: string): Promise<boolean>;
  updateCurrentLedger(
    input: UpdateCurrentLedgerInput,
  ): Promise<UpdateCurrentLedgerResult>;
}

export function createSupabaseCurrentLedgerRepository(
  supabase: AuthenticatedSupabaseClient,
  logger: Logger = {
    error: () => undefined,
    info: () => undefined,
    warn: () => undefined,
  },
): CurrentLedgerRepository & CurrentLedgerContextRepository {
  return {
    async getContext(userId, email) {
      const appUserQuery = supabase
        .from("app_user")
        .select("current_ledger_id, transaction_color_scheme")
        .eq("id", userId);
      type AppUserRows = QueryData<typeof appUserQuery>;

      const { data: appUserData, error: appUserError } = await appUserQuery;

      if (appUserError) {
        console.error("Failed to load current app user.", appUserError);
        throw new Error(
          `Failed to load current app user: ${appUserError.message}`,
        );
      }

      const appUserRows: AppUserRows = appUserData ?? [];
      const storedCurrentLedgerId = appUserRows.find(
        (row) => typeof row.current_ledger_id === "string",
      )?.current_ledger_id;
      const storedTransactionColorScheme = appUserRows.find(
        (row) => typeof row.transaction_color_scheme === "string",
      )?.transaction_color_scheme;
      let transactionColorScheme: TransactionColorScheme | undefined;

      if (storedTransactionColorScheme !== undefined) {
        if (isTransactionColorScheme(storedTransactionColorScheme)) {
          transactionColorScheme = storedTransactionColorScheme;
        } else {
          logger.error(
            "[ledger] invalid transaction color scheme in current user context",
            { userId },
          );
        }
      }

      const memberQuery = supabase
        .from("ledger_member")
        .select("ledger_id, role")
        .eq("user_id", userId)
        .eq("status", "active")
        .order("joined_at", { ascending: true, nullsFirst: false })
        .order("created_at", { ascending: true })
        .order("ledger_id", { ascending: true });
      type LedgerMemberRows = QueryData<typeof memberQuery>;

      const { data: memberData, error: memberError } = await memberQuery;

      if (memberError) {
        console.error("Failed to load current ledger members.", memberError);
        throw new Error(
          `Failed to load current ledger members: ${memberError.message}`,
        );
      }

      const memberRows: LedgerMemberRows = memberData ?? [];
      const ledgerIds = memberRows
        .map((row) => row.ledger_id)
        .filter(
          (ledgerId): ledgerId is string =>
            typeof ledgerId === "string" && ledgerId.length > 0,
        );

      if (ledgerIds.length === 0) {
        return {
          userId,
          email,
          ledgers: [],
          currentLedger: null,
          ...(transactionColorScheme ? { transactionColorScheme } : {}),
        };
      }

      const ledgerQuery = supabase
        .from("ledger")
        .select(
          "id, name, base_currency, transaction_item_special_status_enabled",
        )
        .in("id", ledgerIds)
        .eq("is_archived", false);
      type LedgerRows = QueryData<typeof ledgerQuery>;

      const { data: ledgerData, error: ledgerError } = await ledgerQuery;

      if (ledgerError) {
        console.error("Failed to load current ledgers.", ledgerError);
        throw new Error(
          `Failed to load current ledgers: ${ledgerError.message}`,
        );
      }

      const roleByLedgerId = new Map<string, CurrentLedgerRole>();

      for (const row of memberRows) {
        if (typeof row.ledger_id !== "string" || row.ledger_id.length === 0) {
          continue;
        }

        roleByLedgerId.set(
          row.ledger_id,
          toCurrentLedgerRole(typeof row.role === "string" ? row.role : null),
        );
      }

      const ledgerRows: LedgerRows = ledgerData ?? [];
      const ledgerById = new Map(
        ledgerRows.map((ledger) => [
          ledger.id,
          {
            id: ledger.id,
            name: ledger.name,
            baseCurrency: ledger.base_currency,
            currentUserId: userId,
            currentUserRole:
              roleByLedgerId.get(ledger.id) ?? fallbackCurrentLedgerRole,
            transactionItemSpecialStatusEnabled:
              ledger.transaction_item_special_status_enabled,
          },
        ]),
      );

      const ledgers: CurrentLedger[] = ledgerIds.flatMap((ledgerId) => {
        const ledger = ledgerById.get(ledgerId);
        return ledger ? [ledger] : [];
      });
      const currentLedger = storedCurrentLedgerId
        ? (ledgers.find((ledger) => ledger.id === storedCurrentLedgerId) ??
          null)
        : null;

      return {
        userId,
        email,
        ledgers,
        currentLedger: currentLedger ?? ledgers[0] ?? null,
        ...(transactionColorScheme ? { transactionColorScheme } : {}),
      };
    },

    async findAccessibleLedger(ledgerId, userId) {
      const { data: member, error: memberError } = await supabase
        .from("ledger_member")
        .select("role")
        .eq("ledger_id", ledgerId)
        .eq("user_id", userId)
        .eq("status", "active")
        .maybeSingle();

      if (memberError) {
        logger.error("[ledger] failed to read accessible ledger member", {
          ledgerId,
          message: memberError.message,
          userId,
        });
        throw toRepositoryError(
          "current_ledger_member_lookup_failed",
          "账本成员信息读取失败，请稍后重试。",
        );
      }
      if (!member) return null;

      const { data: ledger, error: ledgerError } = await supabase
        .from("ledger")
        .select(
          "id, name, base_currency, transaction_item_special_status_enabled",
        )
        .eq("id", ledgerId)
        .eq("is_archived", false)
        .maybeSingle();

      if (ledgerError) {
        logger.error("[ledger] failed to read accessible ledger", {
          ledgerId,
          message: ledgerError.message,
          userId,
        });
        throw toRepositoryError(
          "current_ledger_lookup_failed",
          "账本信息读取失败，请稍后重试。",
        );
      }
      if (!ledger) return null;

      return {
        baseCurrency: ledger.base_currency,
        currentUserId: userId,
        currentUserRole: toCurrentLedgerRole(member.role),
        id: ledger.id,
        name: ledger.name,
        transactionItemSpecialStatusEnabled:
          ledger.transaction_item_special_status_enabled,
      };
    },

    async isActiveMember(ledgerId, userId) {
      const { data, error } = await supabase
        .from("ledger_member")
        .select("ledger_id")
        .eq("ledger_id", ledgerId)
        .eq("user_id", userId)
        .eq("status", "active")
        .maybeSingle();

      if (error) {
        logger.error("[ledger] failed to check active member status", {
          ledgerId,
          message: error.message,
          userId,
        });
        throw toRepositoryError(
          "current_ledger_member_lookup_failed",
          "账本成员信息读取失败，请稍后重试。",
        );
      }

      return Boolean(data);
    },

    async isLedgerActive(ledgerId) {
      const { data, error } = await supabase
        .from("ledger")
        .select("id")
        .eq("id", ledgerId)
        .eq("is_archived", false)
        .maybeSingle();

      if (error) {
        logger.error("[ledger] failed to check ledger active status", {
          ledgerId,
          message: error.message,
        });
        throw toRepositoryError(
          "current_ledger_lookup_failed",
          "账本信息读取失败，请稍后重试。",
        );
      }

      return Boolean(data);
    },

    async updateCurrentLedger({ ledgerId, userId }) {
      const { error, count } = await supabase
        .from("app_user")
        .update(
          { current_ledger_id: ledgerId, updated_by: userId },
          { count: "exact" },
        )
        .eq("id", userId)
        .eq("status", "active");

      if (error) {
        logger.error("[ledger] failed to update current ledger", {
          ledgerId,
          message: error.message,
          userId,
        });
        throw toRepositoryError(
          "current_ledger_update_failed",
          "当前账本切换失败，请稍后重试。",
        );
      }

      if (count !== 1) {
        return { code: currentLedgerErrorCodes.updateFailed, ok: false };
      }

      return { ok: true };
    },
  };
}

const fallbackCurrentLedgerRole: CurrentLedgerRole = "member";

function toCurrentLedgerRole(role: string | null): CurrentLedgerRole {
  if (
    role === "owner" ||
    role === "admin" ||
    role === "member" ||
    role === "viewer"
  ) {
    return role;
  }

  return fallbackCurrentLedgerRole;
}
