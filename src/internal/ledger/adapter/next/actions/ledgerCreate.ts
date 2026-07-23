"use server";

import { redirect } from "next/navigation";

import { ledgerCreateErrorHref, routePaths } from "config/paths";
import { getCurrentLedgerContext } from "lib/ledger/current-ledger";
import { createRequestContainer } from "internal/container";
import { revalidateLedgerMutation } from "internal/ledger/adapter/next/revalidateLedger";
import { AppError } from "internal/shared/errors/appError";
import { createServerRequestDependencies } from "internal/shared/context/createServerRequestDependencies";
import { validateCreateLedgerForm } from "internal/ledger/schema/ledgerCreateForm";

export async function createLedger(formData: FormData) {
  await getCurrentLedgerContext();
  const validation = validateCreateLedgerForm(formData);

  if (!validation.ok) {
    redirect(ledgerCreateErrorHref(validation.error));
  }

  const dependencies = await createServerRequestDependencies();
  const container = createRequestContainer(dependencies);

  try {
    await container.ledger.service.create(validation.value);
  } catch (error) {
    if (error instanceof AppError) {
      redirect(ledgerCreateErrorHref(error.code));
    }
    throw error;
  }

  revalidateLedgerMutation();
  redirect(routePaths.dashboard);
}
