import { redirect } from "next/navigation";

import { routePaths } from "config/paths";
import { getCurrentLedgerContext } from "lib/ledger/current-ledger";
import { LedgerSettingsPlaceholderTemplate } from "templates/ledgers/LedgerSettingsPlaceholder";

export default async function LedgerSettingsPlaceholderRoute({
  params,
}: {
  params: Promise<{ ledgerId: string }>;
}) {
  const [{ ledgerId }, { currentLedger, ledgers }] = await Promise.all([
    params,
    getCurrentLedgerContext(),
  ]);

  if (!currentLedger) {
    redirect(routePaths.dashboard);
  }

  const ledger = ledgers.find((item) => item.id === ledgerId);

  if (!ledger) {
    redirect(routePaths.ledgers);
  }

  return <LedgerSettingsPlaceholderTemplate ledgerName={ledger.name} />;
}
