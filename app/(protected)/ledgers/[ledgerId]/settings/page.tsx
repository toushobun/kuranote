import {
  ledgerInviteErrorOperations,
  ledgerSettingsResultValues,
  type LedgerInviteErrorOperation,
} from "config/paths";
import { LedgerInvitePendingProvider } from "organisms/ledgers/LedgerInvitePendingContext";
import { createLedgerInvite } from "server/actions/ledgerInvite";
import { updateLedgerSettings } from "server/actions/ledgerSettings";
import { getLedgerInviteErrorMessage } from "server/errors/ledgerInvite";
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

function getLedgerInviteErrorOperation(
  operation: string | undefined,
): LedgerInviteErrorOperation {
  if (operation === ledgerInviteErrorOperations.replace) return operation;
  if (operation === ledgerInviteErrorOperations.revoke) return operation;
  return ledgerInviteErrorOperations.create;
}

export default async function LedgerSettingsRoute({
  params,
  searchParams,
}: {
  params: Promise<{ ledgerId: string }>;
  searchParams: Promise<{
    error?: string;
    errorKey?: string;
    inviteError?: string;
    inviteErrorKey?: string;
    inviteOperation?: string;
    result?: string;
  }>;
}) {
  const [{ ledgerId }, resolvedSearchParams] = await Promise.all([
    params,
    searchParams,
  ]);
  const view = await loadLedgerSettingsView(ledgerId);

  return (
    <LedgerInvitePendingProvider pendingInvites={view.pendingInvites}>
      <LedgerSettingsTemplate
        {...view}
        errorKey={resolvedSearchParams.errorKey ?? null}
        errorMessage={getLedgerSettingsErrorMessage(resolvedSearchParams.error)}
        inviteAction={createLedgerInvite}
        inviteErrorKey={resolvedSearchParams.inviteErrorKey ?? null}
        inviteErrorMessage={getLedgerInviteErrorMessage(
          resolvedSearchParams.inviteError,
        )}
        inviteErrorOperation={getLedgerInviteErrorOperation(
          resolvedSearchParams.inviteOperation,
        )}
        saveResult={getLedgerSettingsSaveResult(resolvedSearchParams.result)}
        updateLedgerSettingsAction={updateLedgerSettings}
      />
    </LedgerInvitePendingProvider>
  );
}
