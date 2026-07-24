"use server";

import { redirect } from "next/navigation";

import {
  ledgerSettingsHref,
  ledgerSettingsResultHref,
  ledgerSettingsResultValues,
} from "config/paths";
import { createRequestContainer } from "internal/container";
import { requireCurrentUserAndLedger } from "internal/ledger/adapter/next/currentLedger";
import { revalidateLedgerMutation } from "internal/ledger/adapter/next/revalidateLedger";
import {
  getLedgerSettingsErrorMessage,
  ledgerSettingsErrorCodes,
} from "internal/ledger/errors/ledgerSettings";
import { validateUpdateLedgerSettingsForm } from "internal/ledger/schema/ledgerSettingsForm";
import { createServerRequestDependencies } from "internal/shared/context/createServerRequestDependencies";
import { AppError } from "internal/shared/errors/appError";
import type { LedgerSettingsActionState } from "types/ledgers";

function createErrorState(message: string): LedgerSettingsActionState {
  return { error: message, errorKey: crypto.randomUUID() };
}

function validationErrorState(code: string): LedgerSettingsActionState {
  return createErrorState(
    getLedgerSettingsErrorMessage(code) ?? "账本设置内容不正确，请确认后重试。",
  );
}

function actionErrorState(error: unknown): LedgerSettingsActionState {
  if (error instanceof AppError) {
    return createErrorState(error.message);
  }

  console.error("[ledger] ledger settings action failed unexpectedly", {
    errorName: error instanceof Error ? error.name : "unknown",
  });
  return createErrorState(
    getLedgerSettingsErrorMessage(ledgerSettingsErrorCodes.updateFailed) ??
      "账本设置保存失败，请稍后重试。",
  );
}

export async function updateLedgerSettings(
  _previousState: LedgerSettingsActionState,
  formData: FormData,
): Promise<LedgerSettingsActionState> {
  const { userId } = await requireCurrentUserAndLedger();
  const validation = validateUpdateLedgerSettingsForm(formData);

  if (!validation.ok) {
    return validationErrorState(validation.error);
  }

  const values = validation.value;

  try {
    const dependencies = await createServerRequestDependencies();
    const container = createRequestContainer(dependencies);

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
      return validationErrorState(ledgerSettingsErrorCodes.updateFailed);
    }
  } catch (error) {
    return actionErrorState(error);
  }

  revalidateLedgerMutation([ledgerSettingsHref(values.ledgerId)]);
  redirect(
    ledgerSettingsResultHref(
      values.ledgerId,
      ledgerSettingsResultValues.updated,
    ),
  );
}
