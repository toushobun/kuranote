"use server";

import { redirect } from "next/navigation";

import { ledgerSettingsHref } from "config/paths";
import { getCurrentLedgerContext } from "lib/ledger/current-ledger";
import { isValidLedgerInviteToken } from "lib/ledger/inviteToken";
import { createRequestContainer } from "internal/container";
import { revalidateLedgerMutation } from "internal/ledger/adapter/next/revalidateLedger";
import {
  getLedgerInviteErrorMessage,
  ledgerInviteErrorCodes,
} from "internal/ledger/errors/ledgerInvite";
import { createServerRequestDependencies } from "internal/shared/context/createServerRequestDependencies";
import { AppError } from "internal/shared/errors/appError";
import {
  isLedgerInviteRole,
  type LedgerInviteActionOperation,
  type LedgerInviteActionState,
} from "types/ledgers";

export async function createLedgerInvite(
  _previousState: LedgerInviteActionState,
  formData: FormData,
): Promise<LedgerInviteActionState> {
  const intent = String(formData.get("intent") ?? "create").trim();
  const operation: LedgerInviteActionOperation =
    intent === "revoke" ? "revoke" : "create";
  const { userId } = await getCurrentLedgerContext();
  const ledgerId = String(formData.get("ledgerId") ?? "").trim();

  if (!ledgerId) {
    return createErrorState(
      operation === "revoke"
        ? ledgerInviteErrorCodes.revokeFailed
        : ledgerInviteErrorCodes.createFailed,
      operation,
    );
  }

  if (operation === "revoke") {
    const inviteId = String(formData.get("inviteId") ?? "").trim();

    if (!inviteId) {
      return createErrorState(ledgerInviteErrorCodes.revokeFailed, operation);
    }

    try {
      const dependencies = await createServerRequestDependencies();
      const container = createRequestContainer(dependencies);
      await container.ledger.inviteService.revoke({
        inviteId,
        ledgerId,
        userId,
      });
    } catch (error) {
      return createActionErrorState(
        error,
        operation,
        ledgerInviteErrorCodes.revokeFailed,
      );
    }

    revalidateLedgerMutation([ledgerSettingsHref(ledgerId)]);
    redirect(
      `/ledgers/${encodeURIComponent(ledgerId)}/settings?inviteResult=revoked`,
    );
  }

  if (intent !== "create") {
    return createErrorState(ledgerInviteErrorCodes.createFailed, operation);
  }

  const roleValue = String(formData.get("role") ?? "member").trim();
  if (!isLedgerInviteRole(roleValue)) {
    return createErrorState(
      ledgerInviteErrorCodes.inviteRoleInvalid,
      operation,
    );
  }

  let result;
  try {
    const dependencies = await createServerRequestDependencies();
    const container = createRequestContainer(dependencies);
    result = await container.ledger.inviteService.create({
      ledgerId,
      role: roleValue,
      userId,
    });
  } catch (error) {
    return createActionErrorState(
      error,
      operation,
      ledgerInviteErrorCodes.createFailed,
    );
  }

  if (!isValidLedgerInviteToken(result.token)) {
    return createErrorState(ledgerInviteErrorCodes.createFailed, operation);
  }

  revalidateLedgerMutation([ledgerSettingsHref(ledgerId)]);
  redirectToCreatedInvite(ledgerId, result);
}

function createErrorState(
  code: string,
  operation: LedgerInviteActionOperation,
): LedgerInviteActionState {
  return {
    error: getLedgerInviteErrorMessage(code) ?? "邀请操作失败，请稍后重试。",
    errorKey: crypto.randomUUID(),
    operation,
  };
}

function createActionErrorState(
  error: unknown,
  operation: LedgerInviteActionOperation,
  fallbackCode: string,
): LedgerInviteActionState {
  if (error instanceof AppError) {
    return {
      error: error.message,
      errorKey: crypto.randomUUID(),
      operation,
    };
  }

  console.error("[ledger] ledger invite action failed unexpectedly", {
    errorName: error instanceof Error ? error.name : "unknown",
    operation,
  });
  return createErrorState(fallbackCode, operation);
}

function redirectToCreatedInvite(
  ledgerId: string,
  result: { inviteId: string; role: string; token: string },
): never {
  const fragment = new URLSearchParams({
    inviteId: result.inviteId,
    inviteRole: result.role,
    inviteToken: result.token,
  });
  redirect(
    `/ledgers/${encodeURIComponent(ledgerId)}/settings#${fragment.toString()}`,
  );
}
