"use server";

import { redirect } from "next/navigation";

import {
  ledgerSettingsErrorHref,
  ledgerSettingsHref,
  ledgerSettingsResultHref,
  ledgerSettingsResultValues,
  routePaths,
} from "config/paths";
import { createRequestContainer } from "internal/container";
import { requireCurrentUserAndLedger } from "internal/ledger/adapter/next/currentLedger";
import { ledgerSettingsErrorCodes } from "internal/ledger/errors/ledgerSettings";
import { revalidateLedgerMutation } from "internal/ledger/adapter/next/revalidateLedger";
import { createServerRequestDependencies } from "internal/shared/context/createServerRequestDependencies";
import { AppError } from "internal/shared/errors/appError";
import { validateUpdateLedgerSettingsForm } from "internal/ledger/schema/ledgerSettingsForm";
import { getFormText } from "utils/formData";

export async function updateLedgerSettings(formData: FormData) {
  const { userId } = await requireCurrentUserAndLedger();
  const ledgerId = getFormText(formData, "ledgerId");
  const validation = validateUpdateLedgerSettingsForm(formData);

  if (!validation.ok) {
    if (validation.error === ledgerSettingsErrorCodes.ledgerInvalid) {
      redirect(routePaths.ledgers);
    }

    redirect(ledgerSettingsErrorHref(ledgerId, validation.error));
  }

  const values = validation.value;
  const dependencies = await createServerRequestDependencies();
  const container = createRequestContainer(dependencies);

  try {
    if (values.intent === "ledger" && values.ledgerSettings) {
      await container.ledger.settingsService.update({
        intent: "ledger",
        ledgerId: values.ledgerId,
        settings: values.ledgerSettings,
        userId,
      });
    } else if (values.intent === "member" && values.memberSettings) {
      await container.ledger.settingsService.update({
        intent: "member",
        ledgerId: values.ledgerId,
        settings: values.memberSettings,
        userId,
      });
    } else {
      redirect(
        ledgerSettingsErrorHref(
          values.ledgerId,
          ledgerSettingsErrorCodes.updateFailed,
        ),
      );
    }
  } catch (error) {
    if (error instanceof AppError) {
      redirect(ledgerSettingsErrorHref(values.ledgerId, error.code));
    }
    throw error;
  }

  revalidateLedgerMutation([ledgerSettingsHref(values.ledgerId)]);
  redirect(
    ledgerSettingsResultHref(
      values.ledgerId,
      ledgerSettingsResultValues.updated,
    ),
  );
}
