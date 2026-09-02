import { z } from "zod";
import { notFound } from "next/navigation";

import { createRequestContainer } from "internal/container";
import { getCurrentLedgerOrRedirect } from "internal/ledger/adapter/next/currentLedger";
import { createServerRequestDependencies } from "internal/shared/context/createServerRequestDependencies";
import { NotFoundError } from "internal/shared/errors/appError";

export async function loadMerchantCreateView() {
  const currentLedger = await getCurrentLedgerOrRedirect();
  const dependencies = await createServerRequestDependencies();
  const service = createRequestContainer(dependencies).merchant.service;
  await service.assertCanManage({ ledgerId: currentLedger.id });
  const tags = await service.listTags({ ledgerId: currentLedger.id });

  return { ledgerId: currentLedger.id, ledgerName: currentLedger.name, tags };
}

export async function loadMerchantEditView(merchantId: string) {
  if (!z.string().uuid().safeParse(merchantId).success) notFound();

  const currentLedger = await getCurrentLedgerOrRedirect();
  const dependencies = await createServerRequestDependencies();

  try {
    const service = createRequestContainer(dependencies).merchant.service;
    const merchant = await service.getMerchant({
      ledgerId: currentLedger.id,
      merchantId,
    });
    const tags = await service.listTags({ ledgerId: currentLedger.id });
    return {
      ledgerId: currentLedger.id,
      ledgerName: currentLedger.name,
      merchant,
      tags,
    };
  } catch (error) {
    if (error instanceof NotFoundError) notFound();
    throw error;
  }
}
