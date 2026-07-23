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
import { MerchantsTemplate } from "templates/merchants/Merchants";
import { getMerchantErrorMessage } from "utils/pageErrors";

export default async function MerchantsPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string; merchantId?: string; q?: string }>;
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
    <MerchantsTemplate
      archiveMerchantAction={archiveMerchant}
      archiveMerchantAliasAction={archiveMerchantAlias}
      createMerchantAction={createMerchant}
      createMerchantAliasAction={createMerchantAlias}
      errorMerchantId={params.merchantId ?? null}
      errorMessage={getMerchantErrorMessage(params.error)}
      keyword={params.q ?? ""}
      ledgerName={view.ledgerName}
      merchants={view.merchants}
      updateMerchantAction={updateMerchant}
    />
  );
}
