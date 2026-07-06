import { redirect } from "next/navigation";

import { routePaths } from "config/paths";
import { getCurrentLedgerContext } from "lib/ledger/current-ledger";
import { SettingsTemplate } from "templates/settings/Settings";

export default async function SettingsRoute() {
  const { currentLedger } = await getCurrentLedgerContext();

  if (!currentLedger) {
    redirect(routePaths.ledgerSetup);
  }

  return <SettingsTemplate />;
}
