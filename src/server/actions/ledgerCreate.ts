"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import { ledgerCreateErrorHref, routePaths } from "config/paths";
import { getCurrentLedgerContext } from "lib/ledger/current-ledger";
import { createLedgerService } from "server/services/ledgerCreate";
import { validateCreateLedgerForm } from "server/validators/ledgerCreate";

const ledgerCreateRevalidatePaths = [
  routePaths.dashboard,
  routePaths.transactions,
  routePaths.transactionsNew,
  routePaths.accounts,
  routePaths.categories,
  routePaths.merchants,
  routePaths.statistics,
  routePaths.settings,
  routePaths.ledgers,
] as const;

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

  ledgerCreateRevalidatePaths.forEach((path) => {
    revalidatePath(path);
  });
  redirect(routePaths.dashboard);
}
