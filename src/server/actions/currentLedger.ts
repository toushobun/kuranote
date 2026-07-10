"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import { routePaths, routeWithQuery } from "config/paths";
import { requireCurrentUserAndLedger } from "server/context/currentLedger";
import { currentLedgerErrorCodes } from "server/errors/currentLedger";
import { updateCurrentLedgerService } from "server/services/currentLedger";
import { getFormText, isUuid } from "utils/formData";

const currentLedgerRevalidatePaths = [
  routePaths.dashboard,
  routePaths.transactions,
  routePaths.transactionsNew,
  routePaths.transactionsSearch,
  routePaths.accounts,
  routePaths.categories,
  routePaths.merchants,
  routePaths.statistics,
  routePaths.settings,
  routePaths.ledgers,
] as const;

function currentLedgerErrorHref(error: string) {
  return routeWithQuery(routePaths.ledgers, {
    error,
    errorKey: crypto.randomUUID(),
  });
}

function currentLedgerSuccessHref() {
  return routeWithQuery(routePaths.ledgers, { result: "switched" });
}

export async function updateCurrentLedger(formData: FormData) {
  const { userId } = await requireCurrentUserAndLedger();
  const ledgerId = getFormText(formData, "ledgerId");

  if (!isUuid(ledgerId)) {
    redirect(currentLedgerErrorHref(currentLedgerErrorCodes.ledgerInvalid));
  }

  const result = await updateCurrentLedgerService({ ledgerId, userId });

  if (!result.ok) {
    redirect(currentLedgerErrorHref(result.error));
  }

  currentLedgerRevalidatePaths.forEach((path) => {
    revalidatePath(path);
  });
  redirect(currentLedgerSuccessHref());
}
