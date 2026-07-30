"use server";

import { redirect } from "next/navigation";

import { routePaths } from "config/paths";
import { getCurrentLedgerContext } from "internal/ledger/adapter/next/currentLedger";
import { createRequestContainer } from "internal/container";
import { revalidateLedgerMutation } from "internal/ledger/adapter/next/revalidateLedger";
import {
  getLedgerCreateErrorMessage,
  ledgerCreateErrorCodes,
} from "internal/ledger/errors/ledgerCreate";
import { validateCreateLedgerForm } from "internal/ledger/schema/ledgerCreateForm";
import { createServerRequestDependencies } from "internal/shared/context/createServerRequestDependencies";
import { AppError } from "internal/shared/errors/appError";
import type { LedgerCreateActionState } from "types/ledgers";

function createErrorState(message: string): LedgerCreateActionState {
  return { error: message, errorKey: crypto.randomUUID() };
}

function createValidationErrorState(code: string): LedgerCreateActionState {
  return createErrorState(
    getLedgerCreateErrorMessage(code) ?? "账本信息不正确，请确认后重试。",
  );
}

function createActionErrorState(error: unknown): LedgerCreateActionState {
  if (error instanceof AppError) {
    return createErrorState(error.message);
  }

  console.error("[ledger] ledger create action failed unexpectedly", {
    errorName: error instanceof Error ? error.name : "unknown",
  });
  return createErrorState(
    getLedgerCreateErrorMessage(ledgerCreateErrorCodes.createFailed) ??
      "账本创建失败，请稍后重试。",
  );
}

export async function createLedger(
  _previousState: LedgerCreateActionState,
  formData: FormData,
): Promise<LedgerCreateActionState> {
  await getCurrentLedgerContext();
  const validation = validateCreateLedgerForm(formData);

  if (!validation.ok) {
    return createValidationErrorState(validation.error);
  }

  try {
    const dependencies = await createServerRequestDependencies();
    const container = createRequestContainer(dependencies);
    await container.ledger.service.create(validation.value);
  } catch (error) {
    return createActionErrorState(error);
  }

  revalidateLedgerMutation();
  redirect(routePaths.dashboard);
}
