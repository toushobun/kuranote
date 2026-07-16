"use server";

import { redirect } from "next/navigation";

import {
  ledgerSwitchResultValues,
  ledgersErrorHref,
  ledgersResultHref,
} from "config/paths";
import { revalidateCurrentLedgerPaths } from "server/cache/currentLedger";
import { requireCurrentUserAndLedger } from "server/context/currentLedger";
import { currentLedgerErrorCodes } from "server/errors/currentLedger";
import { updateCurrentLedgerService } from "server/services/currentLedger";
import { getFormText, isUuid } from "utils/formData";

export async function updateCurrentLedger(formData: FormData) {
  const { userId } = await requireCurrentUserAndLedger();
  const ledgerId = getFormText(formData, "ledgerId");

  if (!isUuid(ledgerId)) {
    redirect(ledgersErrorHref(currentLedgerErrorCodes.ledgerInvalid));
  }

  const result = await updateCurrentLedgerService({ ledgerId, userId });

  if (!result.ok) {
    redirect(ledgersErrorHref(result.error));
  }

  revalidateCurrentLedgerPaths();
  redirect(ledgersResultHref(ledgerSwitchResultValues.switched));
}
