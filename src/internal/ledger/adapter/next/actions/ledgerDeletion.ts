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
import type { LedgerDeletionImpactState } from "types/ledgers";

function actionErrorState(error: unknown, fallbackMessage: string) {
  if (error instanceof AppError) return createErrorState(error.message);
  console.error("[ledger] deletion action failed unexpectedly", {
    errorName: error instanceof Error ? error.name : "unknown",
  });
  return createErrorState(fallbackMessage);
}

async function getSettingsService() {
  const dependencies = await createServerRequestDependencies();
  return {
    userId: requireAuthenticatedUserId(dependencies.auth),
    settingsService:
      createRequestContainer(dependencies).ledger.settingsService,
  };
}

/** 打开删除弹层时才读取影响统计，避免设置页每次加载都执行计数查询。 */
export async function loadLedgerDeletionImpact(
  ledgerId: string,
): Promise<LedgerDeletionImpactState> {
  try {
    const parsed = ledgerDeletionSchema.shape.ledgerId.safeParse(ledgerId);
    if (!parsed.success)
      return createErrorState(parsed.error.issues[0].message);
    const { settingsService, userId } = await getSettingsService();
    return {
      impact: await settingsService.getDeletionImpact({
        ledgerId: parsed.data,
        userId,
      }),
    };
  } catch (error) {
    return actionErrorState(
      error,
      ledgerSettingsErrorMessages[ledgerSettingsErrorCodes.deleteImpactFailed],
    );
  }
}

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
    const { settingsService, userId } = await getSettingsService();
    await settingsService.deleteLedger({ ...parsed.data, userId });
  } catch (error) {
    return actionErrorState(
      error,
      ledgerSettingsErrorMessages[ledgerSettingsErrorCodes.deleteFailed],
    );
  }
  revalidateLedgerMutation();
  redirect(routePaths.dashboard);
}
