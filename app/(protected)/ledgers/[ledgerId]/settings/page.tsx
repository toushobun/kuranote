import { redirect } from "next/navigation";

import { ledgerSettingsResultValues, routePaths } from "config/paths";
import { createRequestContainer } from "internal/container";
import { canManageMembers } from "internal/ledger";
import { createLedgerInvite } from "internal/ledger/adapter/next/actions/ledgerInvite";
import {
  deleteLedgerPlaceholderMember,
  renameLedgerPlaceholderMember,
} from "internal/ledger/adapter/next/actions/ledgerPlaceholderMember";
import { updateLedgerSettings } from "internal/ledger/adapter/next/actions/ledgerSettings";
import { createServerRequestDependencies } from "internal/shared/context/createServerRequestDependencies";
import { AuthorizationError } from "internal/shared/errors/appError";
import { getCurrentLedgerContext } from "internal/ledger/adapter/next/currentLedger";
import { LedgerInvitePendingProvider } from "organisms/ledgers/LedgerInvitePendingContext/LedgerInvitePendingContext";
import { LedgerSettingsActionStateTemplate } from "templates/ledgers/LedgerSettingsActionState";
import type { LedgerSettingsSaveResult } from "templates/ledgers/LedgerSettings";

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
  searchParams: Promise<{ result?: string }>;
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
  // 邀请与 token 只对管理者读取；其他 active 成员只读占位摘要。
  const canManage = canManageMembers(ledger.currentUserRole);
  let settingsView;
  let pendingInvites;
  let placeholderMembers;

  try {
    [settingsView, pendingInvites, placeholderMembers] = await Promise.all([
      container.ledger.settingsService.getView({
        currentLedger,
        ledger,
        userId,
      }),
      canManage
        ? container.ledger.inviteService.listPending({ ledgerId, userId })
        : Promise.resolve([]),
      container.ledger.placeholderMemberService.listUnclaimed({
        ledgerId,
        userId,
      }),
    ]);
  } catch (error) {
    // 用户可能在 currentLedger 快照取得后被移出账本，保持旧行为并在页面边界友好跳转。
    if (error instanceof AuthorizationError) {
      redirect(routePaths.ledgers);
    }

    throw error;
  }

  const view = { ...settingsView, pendingInvites, placeholderMembers };

  return (
    <LedgerInvitePendingProvider pendingInvites={view.pendingInvites}>
      <LedgerSettingsActionStateTemplate
        {...view}
        inviteAction={createLedgerInvite}
        placeholderMemberActions={
          canManage
            ? {
                delete: deleteLedgerPlaceholderMember,
                rename: renameLedgerPlaceholderMember,
              }
            : null
        }
        saveResult={getLedgerSettingsSaveResult(resolvedSearchParams.result)}
        updateLedgerSettingsAction={updateLedgerSettings}
      />
    </LedgerInvitePendingProvider>
  );
}
