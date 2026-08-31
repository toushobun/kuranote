import { getCurrentLedgerOrRedirect } from "internal/ledger/adapter/next/currentLedger";
import { createRequestContainer } from "internal/container";
import { createServerRequestDependencies } from "internal/shared/context/createServerRequestDependencies";
import { MerchantsTemplate } from "templates/merchants/Merchants";

export default async function MerchantsPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string }>;
}) {
  const params = await searchParams;
  const currentLedger = await getCurrentLedgerOrRedirect();
  const dependencies = await createServerRequestDependencies();
  const container = createRequestContainer(dependencies);
  const view = await container.merchant.service.list({
    keyword: params.q ?? "",
    ledgerId: currentLedger.id,
  });

  return (
    <MerchantsTemplate
      canManageMerchants={view.canManageMerchants}
      keyword={params.q ?? ""}
      ledgerId={currentLedger.id}
      merchants={view.merchants}
    />
  );
}
