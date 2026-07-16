"use server";

import { redirect } from "next/navigation";

import { ledgerCreateErrorHref, routePaths } from "config/paths";
import { getCurrentLedgerContext } from "lib/ledger/current-ledger";
import { revalidateCurrentLedgerPaths } from "server/cache/currentLedger";
import { createLedgerService } from "server/services/ledgerCreate";
import { validateCreateLedgerForm } from "server/validators/ledgerCreate";

export async function createLedger(formData: FormData) {
  await getCurrentLedgerContext();
  const validation = validateCreateLedgerForm(formData);

  if (!validation.ok) {
    redirect(ledgerCreateErrorHref(validation.error));
  }

  const result = await createLedgerService(validation.value);

  if (!result.ok) {
    redirect(ledgerCreateErrorHref(result.error));
  }

  revalidateCurrentLedgerPaths();
  redirect(routePaths.dashboard);
}
