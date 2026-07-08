import { redirect } from "next/navigation";

import { routePaths } from "config/paths";
import { getCurrentLedgerContext } from "lib/ledger/current-ledger";

export async function loadLedgersView() {
  const { currentLedger, ledgers } = await getCurrentLedgerContext();

  if (!currentLedger) {
    redirect(routePaths.dashboard);
  }

  return {
    currentLedgerId: currentLedger.id,
    ledgers,
  };
}
