import { redirect } from "next/navigation";

import {
  ledgerInviteErrorOperations,
  ledgerSettingsResultValues,
  routePaths,
  type LedgerInviteErrorOperation,
} from "config/paths";
import { getCurrentLedgerContext } from "lib/ledger/current-ledger";
import { LedgerInvitePendingProvider } from "organisms/ledgers/LedgerInvitePendingContext/LedgerInvitePendingContext";
import { createLedgerInvite } from "internal/ledger/adapter/next/actions/ledgerInvite";
import { updateLedgerSettings } from "internal/ledger/adapter/next/actions/ledgerSettings";
import { createRequestContainer } from "internal/container";
import { getLedgerInviteErrorMessage } from "internal/ledger";
import { createServerRequestDependencies } from "internal/shared/context/createServerRequestDependencies";
import { AuthorizationError } from "internal/shared/errors/appError";
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

  // redirect() 属于页面边界，currentLedger 解析保留在这里；Service 不感知 Next.js 导航行为。
  const { currentLedger, ledgers, userId } = await getCurrentLedgerContext();

  if (!currentLedger) {
    redirect(routePaths.dashboard);
  }

  const ledger = ledgers.find((item) => item.id === ledgerId);

  if (!ledger) {
    redirect(routePaths.ledgers);
  }

  const dependencies = await createServerRequestDependencies();
  const container = createRequestContainer(dependencies);
  let settingsView;
  let pendingInvites;

  try {
    [settingsView, pendingInvites] = await Promise.all([
      container.ledger.settingsService.getView({
        currentLedger,
        ledger,
        userId,
      }),
      container.ledger.inviteService.listPending({ ledgerId, userId }),
    ]);
  } catch (error) {
    // 用户可能在 currentLedger 快照取得后被移出账本，保持旧行为并在页面边界友好跳转。
    if (error instanceof AuthorizationError) {
      redirect(routePaths.ledgers);
    }

    throw error;
  }

  const view = { ...settingsView, pendingInvites };

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
