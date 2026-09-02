import {
  createMerchant,
  fetchMerchantIcon,
} from "internal/merchant/adapter/next/actions";
import { loadMerchantCreateView } from "internal/merchant/adapter/next/loadMerchantEditorViews";
import { MerchantCreateTemplate } from "templates/merchants/MerchantCreate";

export default async function MerchantCreatePage() {
  const view = await loadMerchantCreateView();

  return (
    <MerchantCreateTemplate
      createMerchantAction={createMerchant}
      fetchIconAction={fetchMerchantIcon}
      ledgerId={view.ledgerId}
      ledgerName={view.ledgerName}
      tags={view.tags}
    />
  );
}
