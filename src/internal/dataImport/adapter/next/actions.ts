"use server";

import {
  createAccountImportService,
} from "internal/account";
import { createCategoryImportService } from "internal/category";
import {
  parseCheckDataImportFileForm,
  parseExecuteDataImportBatchForm,
} from "internal/dataImport/adapter/next/formParser";
import { getDataImportErrorMessage } from "internal/dataImport/errors";
import { createDataImportExecutionService } from "internal/dataImport/service/dataImportExecutionService";
import { createRequestContainer } from "internal/container";
import { requireCurrentUserAndLedger } from "internal/ledger/adapter/next/currentLedger";
import { createMerchantImportService } from "internal/merchant";
import { AppError } from "internal/shared/errors/appError";
import { createServerRequestDependencies } from "internal/shared/context/createServerRequestDependencies";
import { createTransactionImportService } from "internal/transaction";
import type {
  DataImportActionState,
  DataImportBatchActionState,
} from "types/dataImport";

async function getDataImportValidationService() {
  const dependencies = await createServerRequestDependencies();
  return createRequestContainer(dependencies).dataImport.service;
}

function createErrorState<T extends DataImportActionState | DataImportBatchActionState>(
  message: string,
): T {
  return { error: message, errorKey: crypto.randomUUID() } as T;
}

/** 「检查格式」Server Action：只做纯校验，不写入数据库。 */
export async function checkDataImportFormat(
  _previousState: DataImportActionState,
  formData: FormData,
): Promise<DataImportActionState> {
  await requireCurrentUserAndLedger();

  const parsed = parseCheckDataImportFileForm(formData);
  if (!parsed.ok) {
    return createErrorState(
      getDataImportErrorMessage(parsed.error) ?? "文件不正确，请确认后重试。",
    );
  }

  const fileBuffer = await parsed.value.file.arrayBuffer();

  try {
    const service = await getDataImportValidationService();
    const result = await service.checkFile({
      fileBuffer,
      fileName: parsed.value.file.name,
    });

    return { result };
  } catch (error) {
    console.error("[dataImport] check format action failed unexpectedly", {
      errorName: error instanceof Error ? error.name : "unknown",
    });
    return createErrorState(
      getDataImportErrorMessage("validation_failed") ??
        "文件检查失败，请稍后重试。",
    );
  }
}

/**
 * 「开始导入」的单批 Server Action。每次调用都重新确认当前用户与当前账本，
 * 重新解析同一个文件，并且只执行传入 offset 对应的固定批次。
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

  const dependencies = await createServerRequestDependencies();
  const container = createRequestContainer(dependencies);
  const service = createDataImportExecutionService({
    accountImportService: createAccountImportService(container.account.service),
    categoryImportService: createCategoryImportService(
      container.category.service,
    ),
    logger: dependencies.logger,
    merchantImportService: createMerchantImportService(
      container.merchant.service,
    ),
    transactionImportService: createTransactionImportService({
      currentLedger,
      service: container.transaction.service,
    }),
  });

  try {
    const batch = await service.executeBatch({
      fileBuffer: await parsed.value.file.arrayBuffer(),
      fileName: parsed.value.file.name,
      ledgerId: currentLedger.id,
      offset: parsed.value.offset,
      userId,
    });
    return { batch };
  } catch (error) {
    if (error instanceof AppError) {
      return createErrorState(error.message);
    }

    dependencies.logger.error(
      "[dataImport] execute batch action failed unexpectedly",
      {
        errorName: error instanceof Error ? error.name : "unknown",
        ledgerId: currentLedger.id,
        offset: parsed.value.offset,
      },
    );
    return createErrorState(
      getDataImportErrorMessage("execution_failed") ??
        "数据导入失败，请稍后重试。",
    );
  }
}
