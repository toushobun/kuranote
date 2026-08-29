import { z } from "zod";
import { notFound } from "next/navigation";

import { createRequestContainer } from "internal/container";
import { getCurrentLedgerOrRedirect } from "internal/ledger/adapter/next/currentLedger";
import { createServerRequestDependencies } from "internal/shared/context/createServerRequestDependencies";
import { NotFoundError } from "internal/shared/errors/appError";

export async function loadMerchantCreateView() {
  const currentLedger = await getCurrentLedgerOrRedirect();
  const dependencies = await createServerRequestDependencies();
  await createRequestContainer(dependencies).merchant.service.assertCanManage({
    ledgerId: currentLedger.id,
  });

  return { ledgerId: currentLedger.id, ledgerName: currentLedger.name };
}

export async function loadMerchantEditView(merchantId: string) {
  if (!z.string().uuid().safeParse(merchantId).success) notFound();

  const currentLedger = await getCurrentLedgerOrRedirect();
  const dependencies = await createServerRequestDependencies();

  try {
    const merchant = await createRequestContainer(
      dependencies,
    ).merchant.service.getMerchant({
      ledgerId: currentLedger.id,
      merchantId,
    });
    return {
      ledgerId: currentLedger.id,
      ledgerName: currentLedger.name,
      merchant,
    };
  } catch (error) {
    if (error instanceof NotFoundError) notFound();
    throw error;
  }
}
