import { redirect } from "next/navigation";

import { getCurrentLedgerContext } from "lib/ledger/current-ledger";
import { LedgerSetupPage } from "pages/ledger-setup/LedgerSetup";
import { routePaths } from "config/paths";
import { getLedgerSetupErrorMessage } from "utils/pageErrors";

export default async function LedgerSetupRoute({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>;
}) {
  const { currentLedger } = await getCurrentLedgerContext();

  if (currentLedger) {
    redirect(routePaths.dashboard);
  }

  const params = await searchParams;

  return (
    <LedgerSetupPage errorMessage={getLedgerSetupErrorMessage(params.error)} />
  );
}
