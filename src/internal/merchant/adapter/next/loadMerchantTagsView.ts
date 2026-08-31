import { createRequestContainer } from "internal/container";
import { canManageMasterData } from "internal/ledger";
import { getCurrentLedgerOrRedirect } from "internal/ledger/adapter/next/currentLedger";
import { createServerRequestDependencies } from "internal/shared/context/createServerRequestDependencies";

export async function loadMerchantTagsView() {
  const currentLedger = await getCurrentLedgerOrRedirect();
  const canManageMerchants = canManageMasterData(currentLedger.currentUserRole);

  if (!canManageMerchants) {
    return { canManageMerchants, tags: [] };
  }

  const dependencies = await createServerRequestDependencies();
  const tags = await createRequestContainer(
    dependencies,
  ).merchant.service.listTags({ ledgerId: currentLedger.id });

  return { canManageMerchants, tags };
}
