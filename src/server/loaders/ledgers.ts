import { redirect } from "next/navigation";

import { routePaths } from "config/paths";
import {
  getCurrentLedgerContext,
  type LedgerWithMemberCount,
} from "lib/ledger/current-ledger";
import { createClient } from "lib/supabase/server";

export async function loadLedgersView() {
  const { currentLedger, ledgers } = await getCurrentLedgerContext();

  if (!currentLedger) {
    redirect(routePaths.dashboard);
  }

  const memberCountByLedgerId = await loadLedgerMemberCounts(
    ledgers.map((ledger) => ledger.id),
  );
  const ledgersWithMemberCount: LedgerWithMemberCount[] = ledgers.map(
    (ledger) => ({
      ...ledger,
      memberCount: memberCountByLedgerId.get(ledger.id) ?? 0,
    }),
  );

  return {
    currentLedgerId: currentLedger.id,
    ledgers: ledgersWithMemberCount,
  };
}

async function loadLedgerMemberCounts(ledgerIds: string[]) {
  const supabase = await createClient();
  const entries = await Promise.all(
    ledgerIds.map(async (ledgerId) => {
      const { count, error } = await supabase
        .from("ledger_member")
        .select("ledger_id", { count: "exact", head: true })
        .eq("ledger_id", ledgerId)
        .eq("status", "active");

      if (error) {
        console.error("Failed to load ledger member count.", error);
        throw new Error(`Failed to load ledger member count: ${error.message}`);
      }

      return [ledgerId, count ?? 0] as const;
    }),
  );

  return new Map(entries);
}
