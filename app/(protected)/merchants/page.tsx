import { getCurrentLedgerOrRedirect } from "lib/ledger/current-ledger";
import { createRequestContainer } from "internal/container";
import {
  archiveMerchant,
  archiveMerchantAlias,
  createMerchant,
  createMerchantAlias,
  updateMerchant,
} from "internal/merchant/adapter/next/actions";
import { createServerRequestDependencies } from "internal/shared/context/createServerRequestDependencies";
import { MerchantsActionStateTemplate } from "templates/merchants/MerchantsActionState";

export default async function MerchantsPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string }>;
}) {
  const params = await searchParams;
  const currentLedger = await getCurrentLedgerOrRedirect();
  const dependencies = await createServerRequestDependencies();
  const container = createRequestContainer(dependencies);
  const view = await container.merchant.service.getView({
    keyword: params.q ?? "",
    ledgerId: currentLedger.id,
    ledgerName: currentLedger.name,
  });

  return (
    <MerchantsActionStateTemplate
      archiveMerchantAction={archiveMerchant}
      archiveMerchantAliasAction={archiveMerchantAlias}
      createMerchantAction={createMerchant}
      createMerchantAliasAction={createMerchantAlias}
      keyword={params.q ?? ""}
      ledgerName={view.ledgerName}
      merchants={view.merchants}
      updateMerchantAction={updateMerchant}
    />
  );
}
