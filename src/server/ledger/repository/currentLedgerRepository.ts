import {
  currentLedgerErrorCodes,
  type CurrentLedgerErrorCode,
} from "server/errors/currentLedger";
import type { AuthenticatedSupabaseClient } from "server/shared/supabase/authenticatedClient";

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

      return !error && Boolean(data);
    },

    async isLedgerActive(ledgerId) {
      const { data, error } = await supabase
        .from("ledger")
        .select("id")
        .eq("id", ledgerId)
        .eq("is_archived", false)
        .maybeSingle();

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
        return { code: currentLedgerErrorCodes.updateFailed, ok: false };
      }

      return { ok: true };
    },
  };
}
