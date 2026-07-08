import { redirect } from "next/navigation";

import { routePaths } from "config/paths";
import { getCurrentLedgerContext } from "lib/ledger/current-ledger";
import { LedgerCreatePlaceholderTemplate } from "templates/ledgers/LedgerCreatePlaceholder";

export default async function LedgerCreatePlaceholderRoute() {
  const { currentLedger } = await getCurrentLedgerContext();

  if (!currentLedger) {
    redirect(routePaths.dashboard);
  }

  return <LedgerCreatePlaceholderTemplate />;
}
