import { MerchantsTemplate } from "merchants-template/Merchants";
import {
  archiveMerchant,
  archiveMerchantAlias,
  createMerchant,
  createMerchantAlias,
  updateMerchant,
} from "server/actions/merchants";
import { loadMerchantsView } from "server/loaders/merchants";

type MerchantsHomeProps = {
  errorMerchantId: string | null;
  errorMessage: string | null;
  keyword: string;
};

export async function MerchantsHome({
  errorMerchantId,
  errorMessage,
  keyword,
}: MerchantsHomeProps) {
  const view = await loadMerchantsView(keyword);

  return (
    <MerchantsTemplate
      archiveMerchantAction={archiveMerchant}
      archiveMerchantAliasAction={archiveMerchantAlias}
      createMerchantAction={createMerchant}
      createMerchantAliasAction={createMerchantAlias}
      errorMerchantId={errorMerchantId}
      errorMessage={errorMessage}
      keyword={keyword}
      ledgerName={view.ledgerName}
      merchants={view.merchants}
      updateMerchantAction={updateMerchant}
    />
  );
}
