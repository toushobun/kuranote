import {
  currentLedgerErrorCodes,
  type CurrentLedgerErrorCode,
} from "internal/ledger/errors/currentLedger";
import type { Logger } from "internal/shared/logging/logger";
import type { AuthenticatedSupabaseClient } from "internal/shared/supabase/authenticatedClient";

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
      }

      return !error && Boolean(data);
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
      }

      return !error && Boolean(data);
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

      if (error || count !== 1) {
        if (error) {
          logger.error("[ledger] failed to update current ledger", {
            ledgerId,
            message: error.message,
            userId,
          });
        }

        return { code: currentLedgerErrorCodes.updateFailed, ok: false };
      }

      return { ok: true };
    },
  };
}
