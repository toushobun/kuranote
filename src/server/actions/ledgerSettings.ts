"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import {
  ledgerSettingsErrorHref,
  ledgerSettingsHref,
  ledgerSettingsResultHref,
  ledgerSettingsResultValues,
  routePaths,
} from "config/paths";
import { requireCurrentUserAndLedger } from "server/context/currentLedger";
import { ledgerSettingsErrorCodes } from "server/errors/ledgerSettings";
import { updateLedgerSettingsService } from "server/services/ledgerSettings";
import { validateUpdateLedgerSettingsForm } from "server/validators/ledgerSettings";
import { getFormText } from "utils/formData";

const ledgerSettingsRevalidatePaths = [
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
  const result = await updateLedgerSettingsService({
    ledgerId: values.ledgerId,
    ledgerSettings: values.ledgerSettings,
    memberSettings: values.memberSettings,
    userId,
  });

  if (!result.ok) {
    redirect(ledgerSettingsErrorHref(values.ledgerId, result.error));
  }

  ledgerSettingsRevalidatePaths.forEach((path) => {
    revalidatePath(path);
  });
  revalidatePath(ledgerSettingsHref(values.ledgerId));
  redirect(
    ledgerSettingsResultHref(
      values.ledgerId,
      ledgerSettingsResultValues.updated,
    ),
  );
}
