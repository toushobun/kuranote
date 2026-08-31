import { redirect } from "next/navigation";

import { routePaths } from "config/paths";
import {
  archiveMerchantTag,
  createMerchantTag,
  reorderMerchantTags,
  updateMerchantTag,
} from "internal/merchant/adapter/next/actions";
import { loadMerchantTagsView } from "internal/merchant/adapter/next/loadMerchantTagsView";
import { MerchantTagsTemplate } from "templates/merchants/MerchantTags";

export default async function MerchantTagsPage() {
  const view = await loadMerchantTagsView();

  if (!view.canManageMerchants) {
    redirect(routePaths.merchants);
  }

  return (
    <MerchantTagsTemplate
      archiveAction={archiveMerchantTag}
      createAction={createMerchantTag}
      reorderAction={reorderMerchantTags}
      tags={view.tags}
      updateAction={updateMerchantTag}
    />
  );
}
