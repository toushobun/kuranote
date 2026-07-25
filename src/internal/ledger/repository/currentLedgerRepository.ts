import {
  currentLedgerErrorCodes,
  type CurrentLedgerErrorCode,
} from "internal/ledger/errors/currentLedger";
import type { Logger } from "internal/shared/logging/logger";
import type { AuthenticatedSupabaseClient } from "internal/shared/supabase/authenticatedClient";
import { toRepositoryError } from "internal/shared/supabase/repositoryError";

export type UpdateCurrentLedgerInput = {
  ledgerId: string;
  userId: string;
};

export type UpdateCurrentLedgerResult =
  | { ok: true }
  | { ok: false; code: CurrentLedgerErrorCode };

export interface CurrentLedgerRepository {
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
): CurrentLedgerRepository {
  return {
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
