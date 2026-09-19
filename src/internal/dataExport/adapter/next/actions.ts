"use server";

import { createRequestContainer } from "internal/container";
import { dataExportErrorMessages } from "internal/dataExport/errors";
import { requireCurrentUserAndLedger } from "internal/ledger/adapter/next/currentLedger";
import { createServerRequestDependencies } from "internal/shared/context/createServerRequestDependencies";
import { AppError } from "internal/shared/errors/appError";
import type { DataExportActionState } from "types/dataExport";

export async function exportCurrentLedgerData(): Promise<DataExportActionState> {
  // 认证边界允许登录/账本选择导航，业务失败仍通过 inline state 返回。
  const { currentLedger, userId } = await requireCurrentUserAndLedger();
  let dependencies:
    | Awaited<ReturnType<typeof createServerRequestDependencies>>
    | undefined;
  try {
    dependencies = await createServerRequestDependencies();
    const data = await createRequestContainer(
      dependencies,
    ).dataExport.service.getData({ ledgerId: currentLedger.id, userId });
    return { data };
  } catch (error) {
    if (error instanceof AppError)
      return { error: error.message, errorKey: crypto.randomUUID() };
    const context = {
      errorName: error instanceof Error ? error.name : "unknown",
      ledgerId: currentLedger.id,
    };
    if (dependencies)
      dependencies.logger.error(
        "[dataExport] export action failed unexpectedly",
        context,
      );
    else
      console.error("[dataExport] export action failed unexpectedly", context);
    return {
      error: dataExportErrorMessages.exportFailed,
      errorKey: crypto.randomUUID(),
    };
  }
}
