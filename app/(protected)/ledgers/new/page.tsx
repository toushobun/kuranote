import { routePaths } from "config/paths";
import { getCurrentLedgerContext } from "lib/ledger/current-ledger";
import { createRequestContainer } from "internal/container";
import { createLedger } from "internal/ledger/adapter/next/actions/ledgerCreate";
import { createServerRequestDependencies } from "internal/shared/context/createServerRequestDependencies";
import { LedgerCreateTemplate } from "templates/ledgers/LedgerCreate";

export default async function LedgerCreateRoute() {
  // redirect() 属于页面边界，currentLedger 解析保留在这里；Service 不感知 Next.js 导航行为。
  const { currentLedger, email, userId } = await getCurrentLedgerContext();
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
    />
  );
}
