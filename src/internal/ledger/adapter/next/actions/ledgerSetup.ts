"use server";

import { createRequestContainer } from "internal/container";
import { getCurrentLedgerContext } from "internal/ledger/adapter/next/currentLedger";
import { readLedgerSetupProgress } from "internal/ledger/adapter/next/loadLedgerSetupWizard";
import { revalidateLedgerMutation } from "internal/ledger/adapter/next/revalidateLedger";
import { ledgerCreateErrorMessages } from "internal/ledger/errors/ledgerCreate";
import {
  ledgerSetupErrorCodes,
  ledgerSetupErrorMessages,
  ledgerSetupWriteErrorMessages,
} from "internal/ledger/errors/ledgerSetup";
import { validateLedgerSetupBasicInfoForm } from "internal/ledger/schema/ledgerSetupBasicInfoForm";
import { createErrorState } from "internal/shared/adapter/next/actionState";
import { createServerRequestDependencies } from "internal/shared/context/createServerRequestDependencies";
import { AppError, NotFoundError } from "internal/shared/errors/appError";
import type { LedgerSetupBasicInfoActionState } from "types/ledgers";

const validationErrorMessages = {
  ...ledgerCreateErrorMessages,
  ...ledgerSetupErrorMessages,
};

function createActionErrorState(
  error: unknown,
  fallbackMessage: string,
): LedgerSetupBasicInfoActionState {
  if (error instanceof AppError) {
    return createErrorState(error.message);
  }

  console.error("[ledger] ledger setup basic info action failed unexpectedly", {
    errorName: error instanceof Error ? error.name : "unknown",
  });
  return createErrorState(fallbackMessage);
}

function isInProgressExistsError(error: unknown) {
  return (
    error instanceof AppError &&
    error.code === ledgerSetupErrorCodes.inProgressExists
  );
}

/**
 * 向导第 1 步「基本信息」提交：尚无创建中账本时创建账本（创建中），
 * 已有时更新基本信息。成功后返回重新读取的进度，由向导进入下一步。
 * 已存在其他创建中账本时返回该账本的进度，由向导恢复，不作为失败处理。
 */
export async function submitLedgerSetupBasicInfo(
  _previousState: LedgerSetupBasicInfoActionState,
  formData: FormData,
): Promise<LedgerSetupBasicInfoActionState> {
  await getCurrentLedgerContext();
  const validation = validateLedgerSetupBasicInfoForm(formData);

  if (!validation.ok) {
    return createErrorState(validationErrorMessages[validation.error]);
  }

  const { ledgerId, ...basicInfo } = validation.value;
  const fallbackMessage = ledgerId
    ? ledgerSetupWriteErrorMessages.basicInfoUpdateFailed
    : ledgerSetupWriteErrorMessages.createFailed;

  try {
    const dependencies = await createServerRequestDependencies();
    const setupService =
      createRequestContainer(dependencies).ledger.setupService;

    try {
      if (ledgerId) {
        await setupService.updateBasicInfo({ ...basicInfo, ledgerId });
      } else {
        await setupService.create(basicInfo);
      }
    } catch (error) {
      if (!isInProgressExistsError(error)) throw error;

      const existing = await readLedgerSetupProgress(setupService);
      if (!existing) throw error;

      return { progress: existing, restored: true };
    }

    const progress = await readLedgerSetupProgress(setupService);

    // 写入成功后立即读取不到，说明该账本已在其他页面完成或被移除。
    if (!progress) {
      throw new NotFoundError(
        ledgerSetupErrorCodes.notFound,
        ledgerSetupErrorMessages[ledgerSetupErrorCodes.notFound],
      );
    }

    revalidateLedgerMutation();
    return { progress };
  } catch (error) {
    return createActionErrorState(error, fallbackMessage);
  }
}
