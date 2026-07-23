import { redirect } from "next/navigation";

import {
  ledgerSwitchResultValues,
  routePaths,
  type LedgerSwitchResultValue,
} from "config/paths";
import { getCurrentLedgerContext } from "lib/ledger/current-ledger";
import { updateCurrentLedger } from "internal/ledger/adapter/next/actions/currentLedger";
import { createRequestContainer } from "internal/container";
import { createServerRequestDependencies } from "internal/shared/context/createServerRequestDependencies";
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
  // redirect() 属于页面边界，currentLedger 解析保留在这里；Service 不感知 Next.js 导航行为。
  const [{ currentLedger, ledgers }, resolvedSearchParams] = await Promise.all([
    getCurrentLedgerContext(),
    searchParams,
  ]);

  if (!currentLedger) {
    redirect(routePaths.dashboard);
  }

  const dependencies = await createServerRequestDependencies();
  const container = createRequestContainer(dependencies);
  const memberCountByLedgerId = await container.ledger.service.getMemberCounts(
    ledgers.map((ledger) => ledger.id),
  );
  const ledgersWithMemberCount = ledgers.map((ledger) => ({
    ...ledger,
    memberCount: memberCountByLedgerId.get(ledger.id) ?? 0,
  }));

  return (
    <LedgersTemplate
      currentLedgerId={currentLedger.id}
      errorKey={resolvedSearchParams.errorKey ?? null}
      errorMessage={getCurrentLedgerErrorMessage(resolvedSearchParams.error)}
      ledgers={ledgersWithMemberCount}
      switchResult={getLedgerSwitchResult(resolvedSearchParams.result)}
      updateCurrentLedgerAction={updateCurrentLedger}
    />
  );
}
