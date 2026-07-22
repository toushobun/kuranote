import { routePaths } from "config/paths";
import { getCurrentLedgerContext } from "lib/ledger/current-ledger";
import { createLedger } from "server/ledger/adapter/next/actions/ledgerCreate";
import { createRequestContainer } from "server/container";
import { getLedgerCreateErrorMessage } from "server/ledger/errors/ledgerCreate";
import { createServerRequestDependencies } from "server/shared/context/createServerRequestDependencies";
import { LedgerCreateTemplate } from "templates/ledgers/LedgerCreate";

export default async function LedgerCreateRoute({
  searchParams,
}: {
  searchParams: Promise<{ error?: string; errorKey?: string }>;
}) {
  // redirect() 属于页面边界，currentLedger 解析保留在这里；Service 不感知 Next.js 导航行为。
  const [{ currentLedger, email, userId }, resolvedSearchParams] =
    await Promise.all([getCurrentLedgerContext(), searchParams]);
  const dependencies = await createServerRequestDependencies();
  const container = createRequestContainer(dependencies);
  const view = await container.ledger.service.getCreateDefaults({
    email,
    inheritedCurrency: currentLedger?.baseCurrency,
    userId,
  });

  return (
    <LedgerCreateTemplate
      {...view}
      backHref={currentLedger ? routePaths.ledgers : routePaths.dashboard}
      createLedgerAction={createLedger}
      errorKey={resolvedSearchParams.errorKey ?? null}
      errorMessage={getLedgerCreateErrorMessage(resolvedSearchParams.error)}
    />
  );
}
