"use server";

import { redirect } from "next/navigation";

import { ledgerSwitchResultValues, ledgersResultHref } from "config/paths";
import { createRequestContainer } from "internal/container";
import { requireCurrentUserAndLedger } from "internal/ledger/adapter/next/currentLedger";
import { revalidateLedgerMutation } from "internal/ledger/adapter/next/revalidateLedger";
import {
  currentLedgerErrorCodes,
  getCurrentLedgerErrorMessage,
} from "internal/ledger/errors/currentLedger";
import { createServerRequestDependencies } from "internal/shared/context/createServerRequestDependencies";
import { AppError } from "internal/shared/errors/appError";
import type { CurrentLedgerActionState } from "types/ledgers";
import { getFormText, isUuid } from "utils/formData";

function createErrorState(message: string): CurrentLedgerActionState {
  return { error: message, errorKey: crypto.randomUUID() };
}

function validationErrorState(): CurrentLedgerActionState {
  return createErrorState(
    getCurrentLedgerErrorMessage(currentLedgerErrorCodes.ledgerInvalid) ??
      "无法切换到该账本，请刷新页面后重试。",
  );
}

function actionErrorState(error: unknown): CurrentLedgerActionState {
  if (error instanceof AppError) {
    return createErrorState(error.message);
  }

  console.error("[ledger] current ledger switch failed unexpectedly", {
    errorName: error instanceof Error ? error.name : "unknown",
  });
  return createErrorState(
    getCurrentLedgerErrorMessage(currentLedgerErrorCodes.updateFailed) ??
      "账本切换失败，请稍后重试。",
  );
}

export async function updateCurrentLedger(
  _previousState: CurrentLedgerActionState,
  formData: FormData,
): Promise<CurrentLedgerActionState> {
  const { userId } = await requireCurrentUserAndLedger();
  const ledgerId = getFormText(formData, "ledgerId");

  if (!isUuid(ledgerId)) {
    return validationErrorState();
  }

  try {
    const dependencies = await createServerRequestDependencies();
    const container = createRequestContainer(dependencies);
    await container.ledger.currentLedgerService.switch({ ledgerId, userId });
  } catch (error) {
    return actionErrorState(error);
  }

  revalidateLedgerMutation();
  redirect(ledgersResultHref(ledgerSwitchResultValues.switched));
}
