"use server";

import { redirect } from "next/navigation";
import { routePaths } from "config/paths";
import { createRequestContainer } from "internal/container";
import {
  ledgerSettingsErrorCodes,
  ledgerSettingsErrorMessages,
} from "internal/ledger/errors/ledgerSettings";
import { ledgerDeletionSchema } from "internal/ledger/schema/ledgerDeletion";
import { revalidateLedgerMutation } from "internal/ledger/adapter/next/revalidateLedger";
import { createErrorState } from "internal/shared/adapter/next/actionState";
import { requireAuthenticatedUserId } from "internal/shared/auth/authContext";
import { createServerRequestDependencies } from "internal/shared/context/createServerRequestDependencies";
import { AppError } from "internal/shared/errors/appError";
import type { ActionState } from "types/actions";

/** 页面交互直接调用 Service，无独立 HTTP 路由。 */
export async function deleteLedger(
  _previous: ActionState,
  formData: FormData,
): Promise<ActionState> {
  try {
    const parsed = ledgerDeletionSchema.safeParse({
      ledgerId: formData.get("ledgerId"),
      confirmationName: formData.get("confirmationName"),
    });
    if (!parsed.success)
      return createErrorState(parsed.error.issues[0].message);
    const dependencies = await createServerRequestDependencies();
    const userId = requireAuthenticatedUserId(dependencies.auth);
    await createRequestContainer(
      dependencies,
    ).ledger.settingsService.deleteLedger({ ...parsed.data, userId });
  } catch (error) {
    if (error instanceof AppError) return createErrorState(error.message);
    console.error("[ledger] deletion action failed unexpectedly", {
      errorName: error instanceof Error ? error.name : "unknown",
    });
    return createErrorState(
      ledgerSettingsErrorMessages[ledgerSettingsErrorCodes.deleteFailed],
    );
  }
  revalidateLedgerMutation();
  redirect(routePaths.dashboard);
}
