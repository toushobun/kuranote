import { createClient } from "lib/supabase/server";
import {
  currentLedgerErrorCodes,
  type CurrentLedgerErrorCode,
} from "server/errors/currentLedger";
import type { ServiceResult } from "server/services/serviceResult";

export type UpdateCurrentLedgerParams = {
  ledgerId: string;
  userId: string;
};

export async function updateCurrentLedgerService(
  params: UpdateCurrentLedgerParams,
): Promise<ServiceResult<CurrentLedgerErrorCode>> {
  const supabase = await createClient();

  const { data: memberData, error: memberError } = await supabase
    .from("ledger_member")
    .select("ledger_id")
    .eq("ledger_id", params.ledgerId)
    .eq("user_id", params.userId)
    .eq("status", "active")
    .maybeSingle();

  if (memberError || !memberData) {
    return { ok: false, error: currentLedgerErrorCodes.ledgerInvalid };
  }

  const { data: ledgerData, error: ledgerError } = await supabase
    .from("ledger")
    .select("id")
    .eq("id", params.ledgerId)
    .eq("is_archived", false)
    .maybeSingle();

  if (ledgerError || !ledgerData) {
    return { ok: false, error: currentLedgerErrorCodes.ledgerInvalid };
  }

  const { error, count } = await supabase
    .from("app_user")
    .update(
      {
        current_ledger_id: params.ledgerId,
        updated_by: params.userId,
      },
      { count: "exact" },
    )
    .eq("id", params.userId)
    .eq("status", "active");

  if (error || count !== 1) {
    return { ok: false, error: currentLedgerErrorCodes.updateFailed };
  }

  return { ok: true };
}
