"use server";

import { createRequestContainer } from "internal/container";
import { parseExecuteDataImportBatchForm } from "internal/dataImport/adapter/next/formParser";
import { getDataImportErrorMessage } from "internal/dataImport/errors";
import { requireCurrentUserAndLedger } from "internal/ledger/adapter/next/currentLedger";
import { createServerRequestDependencies } from "internal/shared/context/createServerRequestDependencies";
import { AppError } from "internal/shared/errors/appError";
import type { DataImportBatchActionState } from "types/dataImport";

function createErrorState(message: string): DataImportBatchActionState {
  return { error: message, errorKey: crypto.randomUUID() };
}

/**
 * 「开始导入」的单批 Server Action。文件由浏览器端解析，这里每次只接收这一批
 * 的行数据（JSON），重新校验其结构，并重新确认当前用户与当前账本后执行。
 */
export async function executeDataImportBatch(
  _previousState: DataImportBatchActionState,
  formData: FormData,
): Promise<DataImportBatchActionState> {
  const { currentLedger, userId } = await requireCurrentUserAndLedger();
  const parsed = parseExecuteDataImportBatchForm(formData);
  if (!parsed.ok) {
    return createErrorState(
      getDataImportErrorMessage(parsed.error) ??
        "导入文件或进度信息不正确，请重新检查格式后再试。",
    );
  }

  let dependencies:
    | Awaited<ReturnType<typeof createServerRequestDependencies>>
    | undefined;

  try {
    dependencies = await createServerRequestDependencies();
    const container = createRequestContainer(dependencies);
    const service = container.dataImport.createExecutionService(currentLedger);
    const batch = await service.executeBatch({
      holderMapping: parsed.value.holderMapping,
      ledgerId: currentLedger.id,
      timeZoneOffsetMinutes: parsed.value.timeZoneOffsetMinutes,
      units: parsed.value.units,
      userId,
    });
    return { batch };
  } catch (error) {
    if (error instanceof AppError) {
      return createErrorState(error.message);
    }

    const logContext = {
      errorName: error instanceof Error ? error.name : "unknown",
      ledgerId: currentLedger.id,
    };
    if (dependencies) {
      dependencies.logger.error(
        "[dataImport] execute batch action failed unexpectedly",
        logContext,
      );
    } else {
      console.error(
        "[dataImport] execute batch action failed unexpectedly",
        logContext,
      );
    }
    return createErrorState(
      getDataImportErrorMessage("execution_failed") ??
        "数据导入失败，请稍后重试。",
    );
  }
}
