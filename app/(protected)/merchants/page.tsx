import { loadMerchantsView } from "internal/merchant/adapter/next/loadMerchantsView";
import { MerchantsTemplate } from "templates/merchants/Merchants";

export default async function MerchantsPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; tagId?: string }>;
}) {
  const params = await searchParams;
  const view = await loadMerchantsView({
    keyword: params.q,
    tagId: params.tagId,
  });

  return (
    <MerchantsTemplate
      canManageMerchants={view.canManageMerchants}
      keyword={params.q ?? ""}
      ledgerId={view.ledgerId}
      merchants={view.merchants}
      selectedTag={view.selectedTag}
      tagFilterError={view.tagFilterError}
      tags={view.tags}
    />
  );
}
