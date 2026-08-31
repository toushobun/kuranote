import {
  archiveMerchantTag,
  createMerchantTag,
  reorderMerchantTags,
  updateMerchantTag,
} from "internal/merchant/adapter/next/actions";
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
      archiveMerchantTagAction={archiveMerchantTag}
      canManageMerchants={view.canManageMerchants}
      createMerchantTagAction={createMerchantTag}
      keyword={params.q ?? ""}
      ledgerId={view.ledgerId}
      merchants={view.merchants}
      reorderMerchantTagsAction={reorderMerchantTags}
      selectedTag={view.selectedTag}
      tags={view.tags}
      updateMerchantTagAction={updateMerchantTag}
    />
  );
}
