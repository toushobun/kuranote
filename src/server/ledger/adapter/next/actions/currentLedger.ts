"use server";

import { redirect } from "next/navigation";

import {
  ledgerSwitchResultValues,
  ledgersErrorHref,
  ledgersResultHref,
} from "config/paths";
import { createRequestContainer } from "server/container";
import { requireCurrentUserAndLedger } from "server/ledger/adapter/next/currentLedger";
import { currentLedgerErrorCodes } from "server/ledger/errors/currentLedger";
import { revalidateLedgerMutation } from "server/ledger/adapter/next/revalidateLedger";
import { createServerRequestDependencies } from "server/shared/context/createServerRequestDependencies";
import { AppError } from "server/shared/errors/appError";
import { getFormText, isUuid } from "utils/formData";

export async function updateCurrentLedger(formData: FormData) {
  const { userId } = await requireCurrentUserAndLedger();
  const ledgerId = getFormText(formData, "ledgerId");

  if (!isUuid(ledgerId)) {
    redirect(ledgersErrorHref(currentLedgerErrorCodes.ledgerInvalid));
  }

  const dependencies = await createServerRequestDependencies();
  const container = createRequestContainer(dependencies);

  try {
    await container.ledger.currentLedgerService.switch({ ledgerId, userId });
  } catch (error) {
    if (error instanceof AppError) {
      redirect(ledgersErrorHref(error.code));
    }
    throw error;
  }

  revalidateLedgerMutation();
  redirect(ledgersResultHref(ledgerSwitchResultValues.switched));
}
