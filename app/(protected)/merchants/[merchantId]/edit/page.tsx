import {
  archiveMerchant,
  archiveMerchantAlias,
  createMerchantAlias,
  fetchMerchantIcon,
  setPreferredMerchantAlias,
  updateMerchant,
} from "internal/merchant/adapter/next/actions";
import { loadMerchantEditView } from "internal/merchant/adapter/next/loadMerchantEditorViews";
import { MerchantEditTemplate } from "templates/merchants/MerchantEdit";

export default async function MerchantEditPage({
  params,
}: {
  params: Promise<{ merchantId: string }>;
}) {
  const { merchantId } = await params;
  const view = await loadMerchantEditView(merchantId);

  return (
    <MerchantEditTemplate
      archiveMerchantAction={archiveMerchant}
      archiveMerchantAliasAction={archiveMerchantAlias}
      createMerchantAliasAction={createMerchantAlias}
      fetchIconAction={fetchMerchantIcon}
      ledgerId={view.ledgerId}
      ledgerName={view.ledgerName}
      merchant={view.merchant}
      tags={view.tags}
      setPreferredMerchantAliasAction={setPreferredMerchantAlias}
      updateMerchantAction={updateMerchant}
    />
  );
}
