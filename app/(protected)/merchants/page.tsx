import { merchantResultValues } from "config/paths";
import {
  addMerchantPresets,
  archiveMerchantTag,
  createMerchantTag,
  reorderMerchantTags,
  reorderMerchants,
  setPreferredMerchantAlias,
  updateMerchantTag,
} from "internal/merchant/adapter/next/actions";
import { loadMerchantsView } from "internal/merchant/adapter/next/loadMerchantsView";
import { MerchantsTemplate } from "templates/merchants/Merchants";

export default async function MerchantsPage({
  searchParams,
}: {
  searchParams: Promise<{
    q?: string;
    tagId?: string;
    result?: string;
    count?: string;
  }>;
}) {
  const params = await searchParams;
  const view = await loadMerchantsView({
    keyword: params.q,
    tagId: params.tagId,
  });

  return (
    <MerchantsTemplate
      addPresetsAction={addMerchantPresets}
      presetOptions={view.presetOptions}
      presetAddedCount={
        Number.isSafeInteger(Number(params.count)) && Number(params.count) >= 0
          ? Number(params.count)
          : 0
      }
      archiveAction={archiveMerchantTag}
      canManageMerchants={view.canManageMerchants}
      createAction={createMerchantTag}
      keyword={params.q ?? ""}
      ledgerId={view.ledgerId}
      merchants={view.merchants}
      setPreferredMerchantAliasAction={setPreferredMerchantAlias}
      saveResult={
        params.result === merchantResultValues.presetsAdded ||
        params.result === merchantResultValues.created ||
        params.result === merchantResultValues.updated ||
        params.result === merchantResultValues.archived
          ? params.result
          : null
      }
      selectedTag={view.selectedTag}
      reorderAction={reorderMerchantTags}
      reorderMerchantsAction={reorderMerchants}
      tagFilterError={view.tagFilterError}
      tags={view.tags}
      updateAction={updateMerchantTag}
    />
  );
}
