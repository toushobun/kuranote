import type { CurrentLedgerRole } from "lib/ledger/current-ledger";
import { canModifyTransaction } from "lib/ledger/permissions";
import { createClient } from "lib/supabase/server";

export async function canModifyTransactionRecord({
  ledgerId,
  role,
  transactionRecordId,
  userId,
}: {
  ledgerId: string;
  role: CurrentLedgerRole;
  transactionRecordId: string;
  userId: string;
}) {
  if (role === "owner" || role === "admin") return true;
  if (role === "viewer") return false;

  const supabase = await createClient();
  const { data, error } = await supabase
    .from("transaction_record")
    .select("created_by")
    .eq("id", transactionRecordId)
    .eq("ledger_id", ledgerId)
    .eq("status", "active")
    .maybeSingle();

  if (error || !data) return false;

  return canModifyTransaction({
    createdBy: data.created_by,
    role,
    userId,
  });
}
