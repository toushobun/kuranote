"use server";

import { createRequestContainer } from "internal/container";
import { dataExportErrorMessages } from "internal/dataExport/errors";
import { dataExportOptionsSchema, type DataExportOptions } from "internal/dataExport/schema";
import { requireCurrentUserAndLedger } from "internal/ledger/adapter/next/currentLedger";
import { createErrorState } from "internal/shared/adapter/next/actionState";
import { createServerRequestDependencies } from "internal/shared/context/createServerRequestDependencies";
import { AppError } from "internal/shared/errors/appError";
import type { DataExportActionState } from "types/dataExport";

export async function exportCurrentLedgerData(
  options: DataExportOptions = { recordTypes: ["normal", "transfer", "balance_adjustment"] },
): Promise<DataExportActionState> {
  // 认证边界允许登录/账本选择导航，业务失败仍通过 inline state 返回。
  const { currentLedger, userId } = await requireCurrentUserAndLedger();
  let dependencies:
    | Awaited<ReturnType<typeof createServerRequestDependencies>>
    | undefined;
  try {
    const parsed = dataExportOptionsSchema.safeParse(options);
    if (!parsed.success) return createErrorState(dataExportErrorMessages.invalidScope);
    dependencies = await createServerRequestDependencies();
    const data = await createRequestContainer(
      dependencies,
    ).dataExport.service.getData({
      ledgerId: currentLedger.id,
      userId,
      ...parsed.data,
    });
    return { data, ledgerName: currentLedger.name };
  } catch (error) {
    if (error instanceof AppError) return createErrorState(error.message);
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
    return createErrorState(dataExportErrorMessages.exportFailed);
  }
}
