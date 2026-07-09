import { ledgerSettingsResultValues } from "config/paths";
import { updateLedgerSettings } from "server/actions/ledgerSettings";
import { loadLedgerSettingsView } from "server/loaders/ledgerSettings";
import {
  LedgerSettingsTemplate,
  type LedgerSettingsSaveResult,
} from "templates/ledgers/LedgerSettings";
import { getLedgerSettingsErrorMessage } from "utils/pageErrors";

function getLedgerSettingsSaveResult(
  result: string | undefined,
): LedgerSettingsSaveResult | null {
  if (result === ledgerSettingsResultValues.updated) return "updated";
  return null;
}

export default async function LedgerSettingsRoute({
  params,
  searchParams,
}: {
  params: Promise<{ ledgerId: string }>;
  searchParams: Promise<{ error?: string; errorKey?: string; result?: string }>;
}) {
  const [{ ledgerId }, resolvedSearchParams] = await Promise.all([
    params,
    searchParams,
  ]);
  const view = await loadLedgerSettingsView(ledgerId);

  return (
    <LedgerSettingsTemplate
      {...view}
      errorKey={resolvedSearchParams.errorKey ?? null}
      errorMessage={getLedgerSettingsErrorMessage(resolvedSearchParams.error)}
      saveResult={getLedgerSettingsSaveResult(resolvedSearchParams.result)}
      updateLedgerSettingsAction={updateLedgerSettings}
    />
  );
}
