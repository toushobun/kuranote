"use server";

import { parseCheckDataImportFileForm } from "internal/dataImport/adapter/next/formParser";
import { getDataImportErrorMessage } from "internal/dataImport/errors";
import { createRequestContainer } from "internal/container";
import { requireCurrentUserAndLedger } from "internal/ledger/adapter/next/currentLedger";
import { createServerRequestDependencies } from "internal/shared/context/createServerRequestDependencies";
import type { DataImportActionState } from "types/dataImport";

async function getDataImportValidationService() {
  const dependencies = await createServerRequestDependencies();
  return createRequestContainer(dependencies).dataImport.service;
}

function createErrorState(message: string): DataImportActionState {
  return { error: message, errorKey: crypto.randomUUID() };
}

/**
 * 「检查格式」Server Action：只做纯校验，不写入数据库。
 *
 * 登录状态与当前账本成员身份由 requireCurrentUserAndLedger() 在服务端重新
 * 校验（未登录或账本无效会被重定向），不信任前端传入的 ledgerId——本 Action
 * 实际上不需要读取账本内的任何数据，这里调用它单纯是为了满足
 * docs/AI_RULES.md 的安全边界：写操作 / 敏感操作必须先确认登录状态与账本
 * 成员身份，不能只依赖前端已经在正确账本下的假设。
 */
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
    return createErrorState("文件检查失败，请稍后重试。");
  }
}
