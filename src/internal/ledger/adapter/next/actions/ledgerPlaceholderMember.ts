"use server";

import { ledgerSettingsHref, routePaths } from "config/paths";
import {
  createRequestContainer,
  type RequestContainer,
} from "internal/container";
import { requireCurrentUserAndLedger } from "internal/ledger/adapter/next/currentLedger";
import { revalidateLedgerMutation } from "internal/ledger/adapter/next/revalidateLedger";
import {
  getLedgerPlaceholderMemberErrorMessage,
  ledgerPlaceholderMemberErrorCodes,
} from "internal/ledger/errors/ledgerPlaceholderMember";
import {
  parseDeleteLedgerPlaceholderMemberForm,
  parseRenameLedgerPlaceholderMemberForm,
} from "internal/ledger/schema/ledgerPlaceholderMemberForm";
import { createServerRequestDependencies } from "internal/shared/context/createServerRequestDependencies";
import { AppError } from "internal/shared/errors/appError";
import type {
  LedgerPlaceholderMemberActionOperation,
  LedgerPlaceholderMemberActionState,
} from "types/ledgers";

const fallbackCodes = {
  delete: ledgerPlaceholderMemberErrorCodes.deleteFailed,
  rename: ledgerPlaceholderMemberErrorCodes.renameFailed,
} as const satisfies Record<LedgerPlaceholderMemberActionOperation, string>;

function errorState(
  code: string,
  operation: LedgerPlaceholderMemberActionOperation,
): LedgerPlaceholderMemberActionState {
  return {
    error:
      getLedgerPlaceholderMemberErrorMessage(code) ??
      getLedgerPlaceholderMemberErrorMessage(fallbackCodes[operation])!,
    errorKey: crypto.randomUUID(),
    operation,
  };
}

function actionErrorState(
  error: unknown,
  operation: LedgerPlaceholderMemberActionOperation,
): LedgerPlaceholderMemberActionState {
  if (error instanceof AppError) {
    return { error: error.message, errorKey: crypto.randomUUID(), operation };
  }

  console.error("[ledger] placeholder member action failed unexpectedly", {
    errorName: error instanceof Error ? error.name : "unknown",
    operation,
  });
  return errorState(fallbackCodes[operation], operation);
}

/** 成员列表、账户持有人候选与导入候选都读取占位，写操作成功后一并失效。 */
function revalidatePlaceholderMutation(ledgerId: string) {
  revalidateLedgerMutation([
    ledgerSettingsHref(ledgerId),
    routePaths.settingsDataImport,
  ]);
}

async function run(
  operation: LedgerPlaceholderMemberActionOperation,
  ledgerId: string,
  execute: (
    service: RequestContainer["ledger"]["placeholderMemberService"],
  ) => Promise<unknown>,
): Promise<LedgerPlaceholderMemberActionState> {
  try {
    const dependencies = await createServerRequestDependencies();
    await execute(
      createRequestContainer(dependencies).ledger.placeholderMemberService,
    );
  } catch (error) {
    return actionErrorState(error, operation);
  }

  revalidatePlaceholderMutation(ledgerId);
  return { operation, successKey: crypto.randomUUID() };
}

export async function renameLedgerPlaceholderMember(
  _previousState: LedgerPlaceholderMemberActionState,
  formData: FormData,
): Promise<LedgerPlaceholderMemberActionState> {
  const { userId } = await requireCurrentUserAndLedger();
  const parsed = parseRenameLedgerPlaceholderMemberForm(formData);
  if (!parsed.ok) return errorState(parsed.error, "rename");

  return run("rename", parsed.value.ledgerId, (service) =>
    service.rename({ ...parsed.value, userId }),
  );
}

export async function deleteLedgerPlaceholderMember(
  _previousState: LedgerPlaceholderMemberActionState,
  formData: FormData,
): Promise<LedgerPlaceholderMemberActionState> {
  const { userId } = await requireCurrentUserAndLedger();
  const parsed = parseDeleteLedgerPlaceholderMemberForm(formData);
  if (!parsed.ok) return errorState(parsed.error, "delete");

  return run("delete", parsed.value.ledgerId, (service) =>
    service.delete({ ...parsed.value, userId }),
  );
}
