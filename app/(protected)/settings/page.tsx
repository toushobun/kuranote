import { redirect } from "next/navigation";

import { routePaths } from "config/paths";
import { getCurrentLedgerContext } from "internal/ledger/adapter/next/currentLedger";
import { logout } from "internal/auth/adapter/next/actions";
import { SettingsTemplate } from "templates/settings/Settings";

export default async function SettingsRoute() {
  const { currentLedger } = await getCurrentLedgerContext();

  if (!currentLedger) {
    redirect(routePaths.dashboard);
  }

  return (
    <SettingsTemplate
      currentLedgerName={currentLedger.name}
      logoutAction={logout}
    />
  );
}
