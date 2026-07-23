"use server";

import { redirect } from "next/navigation";

import {
  ledgerSwitchResultValues,
  ledgersErrorHref,
  ledgersResultHref,
} from "config/paths";
import { createRequestContainer } from "internal/container";
import { requireCurrentUserAndLedger } from "internal/ledger/adapter/next/currentLedger";
import { currentLedgerErrorCodes } from "internal/ledger/errors/currentLedger";
import { revalidateLedgerMutation } from "internal/ledger/adapter/next/revalidateLedger";
import { createServerRequestDependencies } from "internal/shared/context/createServerRequestDependencies";
import { AppError } from "internal/shared/errors/appError";
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
