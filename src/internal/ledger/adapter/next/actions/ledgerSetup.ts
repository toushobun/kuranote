"use server";

import {
  createRequestContainer,
  type RequestContainer,
} from "internal/container";
import { getCurrentLedgerContext } from "internal/ledger/adapter/next/currentLedger";
import { readLedgerSetupProgress } from "internal/ledger/adapter/next/loadLedgerSetupWizard";
import { revalidateLedgerMutation } from "internal/ledger/adapter/next/revalidateLedger";
import { ledgerCreateErrorMessages } from "internal/ledger/errors/ledgerCreate";
import {
  ledgerSetupErrorCodes,
  ledgerSetupErrorMessages,
  ledgerSetupWriteErrorMessages,
  type LedgerSetupErrorCode,
} from "internal/ledger/errors/ledgerSetup";
import { validateLedgerSetupBasicInfoForm } from "internal/ledger/schema/ledgerSetupBasicInfoForm";
import { createErrorState } from "internal/shared/adapter/next/actionState";
import { createServerRequestDependencies } from "internal/shared/context/createServerRequestDependencies";
import { AppError, NotFoundError } from "internal/shared/errors/appError";
import type {
  CompleteLedgerSetupInput,
  LedgerSetupBasicInfoActionState,
  LedgerSetupCompleteActionState,
  LedgerSetupDraftActionState,
  SaveLedgerSetupDraftInput,
} from "types/ledgers";
import { isUuid } from "utils/formData";

const validationErrorMessages = {
  ...ledgerCreateErrorMessages,
  ...ledgerSetupErrorMessages,
};

function createActionErrorState(
  error: unknown,
  fallbackMessage: string,
  logMessage: string,
) {
  if (error instanceof AppError) {
    return createErrorState(error.message);
  }

  console.error(logMessage, {
    errorName: error instanceof Error ? error.name : "unknown",
  });
  return createErrorState(fallbackMessage);
}

function hasLedgerSetupErrorCode(
  error: unknown,
  ...codes: LedgerSetupErrorCode[]
) {
  return error instanceof AppError && codes.some((code) => code === error.code);
}

function createNotFoundError() {
  return new NotFoundError(
    ledgerSetupErrorCodes.notFound,
    ledgerSetupErrorMessages[ledgerSetupErrorCodes.notFound],
  );
}

type SetupService = RequestContainer["ledger"]["setupService"];

/** 写入后重新读取进度。读取不到说明该账本已在其他页面完成或被移除。 */
async function readProgressAfterWrite(setupService: SetupService) {
  const progress = await readLedgerSetupProgress(setupService);
  if (!progress) throw createNotFoundError();
  return progress;
}

/** Server Action 的参数来自客户端，账本 ID 在服务端重新校验。 */
function parseLedgerId(input: unknown): string | null {
  if (typeof input !== "object" || input === null) return null;

  const { ledgerId } = input as { ledgerId?: unknown };
  return typeof ledgerId === "string" && isUuid(ledgerId) ? ledgerId : null;
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
      if (
        !hasLedgerSetupErrorCode(error, ledgerSetupErrorCodes.inProgressExists)
      ) {
        throw error;
      }

      const existing = await readLedgerSetupProgress(setupService);
      if (!existing) throw error;

      return { progress: existing, restored: true };
    }

    const progress = await readProgressAfterWrite(setupService);

    revalidateLedgerMutation();
    return { progress };
  } catch (error) {
    return createActionErrorState(
      error,
      fallbackMessage,
      "[ledger] ledger setup basic info action failed unexpectedly",
    );
  }
}

/**
 * 保存向导第 2 步以后的草稿与 setup_step。成功后返回重新读取的进度。
 * 预设模板已更新或默认货币已变更时不保存，返回重新读取的进度（outdated），
 * 由向导替换状态并提示重新确认；同类型账户重名时由步骤在对应账户处提示。
 */
export async function saveLedgerSetupDraft(
  input: SaveLedgerSetupDraftInput,
): Promise<LedgerSetupDraftActionState> {
  await getCurrentLedgerContext();
  const ledgerId = parseLedgerId(input);

  if (!ledgerId) {
    return createErrorState(
      ledgerSetupErrorMessages[ledgerSetupErrorCodes.notFound],
    );
  }

  try {
    const dependencies = await createServerRequestDependencies();
    const setupService =
      createRequestContainer(dependencies).ledger.setupService;

    try {
      // step 与 draft 由 Service 按草稿 Schema 重新校验。
      await setupService.saveDraft({
        draft: input.draft,
        ledgerId,
        step: input.step,
      });
    } catch (error) {
      if (
        !hasLedgerSetupErrorCode(
          error,
          ledgerSetupErrorCodes.templateOutdated,
          ledgerSetupErrorCodes.currencyMismatch,
        )
      ) {
        throw error;
      }

      return {
        outdated: true,
        progress: await readProgressAfterWrite(setupService),
      };
    }

    const progress = await readProgressAfterWrite(setupService);

    revalidateLedgerMutation();
    return { progress };
  } catch (error) {
    const state = createActionErrorState(
      error,
      ledgerSetupWriteErrorMessages.draftSaveFailed,
      "[ledger] ledger setup draft action failed unexpectedly",
    );

    return hasLedgerSetupErrorCode(
      error,
      ledgerSetupErrorCodes.accountNameDuplicate,
    )
      ? { ...state, accountNameDuplicate: true }
      : state;
  }
}

/**
 * 向导第 5 步「完成创建」：按数据库中的草稿在同一事务内写入默认数据，
 * 将账本标记为已完成并切换为当前账本。成功后刷新依赖当前账本的页面，由向导进入下一步。
 * 预设内容已更新或默认货币已变更时不写入，返回重新读取的进度（outdated）；
 * 创建中账本已在其他页面完成或不存在时返回 notFound，由向导提示后关闭。
 */
export async function completeLedgerSetup(
  input: CompleteLedgerSetupInput,
): Promise<LedgerSetupCompleteActionState> {
  await getCurrentLedgerContext();
  const ledgerId = parseLedgerId(input);

  if (!ledgerId) {
    return {
      ...createErrorState(
        ledgerSetupErrorMessages[ledgerSetupErrorCodes.notFound],
      ),
      notFound: true,
    };
  }

  try {
    const dependencies = await createServerRequestDependencies();
    const setupService =
      createRequestContainer(dependencies).ledger.setupService;

    try {
      await setupService.complete(ledgerId);
    } catch (error) {
      if (
        !hasLedgerSetupErrorCode(
          error,
          ledgerSetupErrorCodes.templateOutdated,
          ledgerSetupErrorCodes.currencyMismatch,
        )
      ) {
        throw error;
      }

      return {
        outdated: true,
        progress: await readProgressAfterWrite(setupService),
      };
    }
  } catch (error) {
    const state = createActionErrorState(
      error,
      ledgerSetupWriteErrorMessages.completeFailed,
      "[ledger] ledger setup complete action failed unexpectedly",
    );

    return hasLedgerSetupErrorCode(error, ledgerSetupErrorCodes.notFound)
      ? { ...state, notFound: true }
      : state;
  }

  // 完成写入已切换当前账本：与切换 / 创建账本相同，失效依赖当前账本的页面。
  revalidateLedgerMutation();
  return { completed: true };
}
