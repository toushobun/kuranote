import {
  createMerchant,
  fetchMerchantIcon,
} from "internal/merchant/adapter/next/actions";
import { loadMerchantCreateView } from "internal/merchant/adapter/next/loadMerchantEditorViews";
import { getSafeNextPath } from "lib/navigation/safeNextPath";
import { MerchantCreateTemplate } from "templates/merchants/MerchantCreate";

export default async function MerchantCreatePage({
  searchParams,
}: {
  searchParams: Promise<{ name?: string; returnTo?: string }>;
}) {
  const params = await searchParams;
  const view = await loadMerchantCreateView();

  return (
    <MerchantCreateTemplate
      createMerchantAction={createMerchant}
      fetchIconAction={fetchMerchantIcon}
      initialName={params.name?.trim() ?? ""}
      ledgerId={view.ledgerId}
      ledgerName={view.ledgerName}
      returnTo={getSafeNextPath(params.returnTo)}
      tags={view.tags}
    />
  );
}
