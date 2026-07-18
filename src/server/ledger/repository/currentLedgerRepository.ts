import {
  currentLedgerErrorCodes,
  type CurrentLedgerErrorCode,
} from "server/errors/currentLedger";
import type { AuthenticatedSupabaseClient } from "server/shared/supabase/authenticatedClient";

export type SwitchCurrentLedgerInput = {
  ledgerId: string;
  userId: string;
};

export type SwitchCurrentLedgerResult =
  | { ok: true }
  | { ok: false; code: CurrentLedgerErrorCode };

export interface CurrentLedgerRepository {
  switch(input: SwitchCurrentLedgerInput): Promise<SwitchCurrentLedgerResult>;
}

export function createSupabaseCurrentLedgerRepository(
  supabase: AuthenticatedSupabaseClient,
): CurrentLedgerRepository {
  return {
    async switch({ ledgerId, userId }) {
      const { data: memberData, error: memberError } = await supabase
        .from("ledger_member")
        .select("ledger_id")
        .eq("ledger_id", ledgerId)
        .eq("user_id", userId)
        .eq("status", "active")
        .maybeSingle();

      if (memberError || !memberData) {
        return { code: currentLedgerErrorCodes.ledgerInvalid, ok: false };
      }

      const { data: ledgerData, error: ledgerError } = await supabase
        .from("ledger")
        .select("id")
        .eq("id", ledgerId)
        .eq("is_archived", false)
        .maybeSingle();

      if (ledgerError || !ledgerData) {
        return { code: currentLedgerErrorCodes.ledgerInvalid, ok: false };
      }

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
