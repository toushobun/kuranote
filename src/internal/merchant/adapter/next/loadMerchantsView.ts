import { z } from "zod";

import { createRequestContainer } from "internal/container";
import { getCurrentLedgerOrRedirect } from "internal/ledger/adapter/next/currentLedger";
import { createServerRequestDependencies } from "internal/shared/context/createServerRequestDependencies";

export async function loadMerchantsView(input: {
  keyword?: string;
  tagId?: string;
}) {
  const currentLedger = await getCurrentLedgerOrRedirect();
  const dependencies = await createServerRequestDependencies();
  const validTagId = z.string().uuid().safeParse(input.tagId);
  const view = await createRequestContainer(dependencies).merchant.service.list(
    {
      keyword: input.keyword ?? "",
      ledgerId: currentLedger.id,
      tagId: validTagId.success ? validTagId.data : null,
    },
  );
  return { ...view, ledgerId: currentLedger.id };
}
