import { redirect } from "next/navigation";

import { routePaths } from "config/paths";
import { getCurrentLedgerContext } from "internal/ledger/adapter/next/currentLedgerContext";

export {
  getCurrentLedgerContext,
  getCurrentLedgerOrRedirect,
} from "internal/ledger/adapter/next/currentLedgerContext";

export async function requireCurrentUserAndLedger() {
  const context = await getCurrentLedgerContext();

  if (!context.currentLedger) {
    redirect(routePaths.dashboard);
  }

  return {
    currentLedger: context.currentLedger,
    userId: context.userId,
  };
}
