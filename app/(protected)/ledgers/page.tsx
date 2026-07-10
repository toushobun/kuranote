import {
  ledgerSwitchResultValues,
  type LedgerSwitchResultValue,
} from "config/paths";
import { updateCurrentLedger } from "server/actions/currentLedger";
import { loadLedgersView } from "server/loaders/ledgers";
import { LedgersTemplate } from "templates/ledgers/Ledgers";
import { getCurrentLedgerErrorMessage } from "utils/pageErrors";

function getLedgerSwitchResult(
  result: string | undefined,
): LedgerSwitchResultValue | null {
  if (result === ledgerSwitchResultValues.switched) {
    return ledgerSwitchResultValues.switched;
  }

  return null;
}

export default async function LedgersRoute({
  searchParams,
}: {
  searchParams: Promise<{ error?: string; errorKey?: string; result?: string }>;
}) {
  const [view, resolvedSearchParams] = await Promise.all([
    loadLedgersView(),
    searchParams,
  ]);

  return (
    <LedgersTemplate
      {...view}
      errorKey={resolvedSearchParams.errorKey ?? null}
      errorMessage={getCurrentLedgerErrorMessage(resolvedSearchParams.error)}
      switchResult={getLedgerSwitchResult(resolvedSearchParams.result)}
      updateCurrentLedgerAction={updateCurrentLedger}
    />
  );
}
