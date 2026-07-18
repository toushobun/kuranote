"use server";

import { redirect } from "next/navigation";

import {
  ledgerInviteErrorHref,
  ledgerInviteErrorOperations,
  ledgerSettingsHref,
  routePaths,
} from "config/paths";
import { getCurrentLedgerContext } from "lib/ledger/current-ledger";
import { isValidLedgerInviteToken } from "lib/ledger/inviteToken";
import { createRequestContainer } from "server/container";
import { ledgerInviteErrorCodes } from "server/errors/ledgerInvite";
import { revalidateLedgerMutation } from "server/ledger/adapter/next/revalidateLedger";
import { createServerRequestDependencies } from "server/shared/context/createServerRequestDependencies";
import { AppError } from "server/shared/errors/appError";
import { isLedgerInviteRole } from "types/ledgers";

export async function createLedgerInvite(formData: FormData) {
  await getCurrentLedgerContext();
  const ledgerId = String(formData.get("ledgerId") ?? "").trim();
  const intent = String(formData.get("intent") ?? "create").trim();

  if (!ledgerId) {
    redirect(`${routePaths.ledgers}?inviteError=create_failed`);
  }

  const dependencies = await createServerRequestDependencies();
  const container = createRequestContainer(dependencies);

  if (intent === "revoke") {
    const inviteId = String(formData.get("inviteId") ?? "").trim();

    if (!inviteId) {
      redirect(
        ledgerInviteErrorHref(
          ledgerId,
          ledgerInviteErrorCodes.revokeFailed,
          ledgerInviteErrorOperations.revoke,
        ),
      );
    }

    try {
      await container.ledger.inviteService.revoke(ledgerId, inviteId);
    } catch (error) {
      if (error instanceof AppError) {
        redirect(
          ledgerInviteErrorHref(
            ledgerId,
            error.code,
            ledgerInviteErrorOperations.revoke,
          ),
        );
      }
      throw error;
    }

    revalidateLedgerMutation([ledgerSettingsHref(ledgerId)]);
    redirect(
      `/ledgers/${encodeURIComponent(ledgerId)}/settings?inviteResult=revoked`,
    );
  }

  if (intent !== "create") {
    redirect(
      ledgerInviteErrorHref(
        ledgerId,
        ledgerInviteErrorCodes.createFailed,
        ledgerInviteErrorOperations.create,
      ),
    );
  }

  const roleValue = String(formData.get("role") ?? "member").trim();
  if (!isLedgerInviteRole(roleValue)) {
    redirect(
      ledgerInviteErrorHref(
        ledgerId,
        ledgerInviteErrorCodes.inviteRoleInvalid,
        ledgerInviteErrorOperations.create,
      ),
    );
  }

  let result;
  try {
    result = await container.ledger.inviteService.create(ledgerId, roleValue);
  } catch (error) {
    if (error instanceof AppError) {
      redirect(
        ledgerInviteErrorHref(
          ledgerId,
          error.code,
          ledgerInviteErrorOperations.create,
        ),
      );
    }
    throw error;
  }

  if (!isValidLedgerInviteToken(result.token)) {
    redirect(
      ledgerInviteErrorHref(
        ledgerId,
        ledgerInviteErrorCodes.createFailed,
        ledgerInviteErrorOperations.create,
      ),
    );
  }

  revalidateLedgerMutation([ledgerSettingsHref(ledgerId)]);
  redirectToCreatedInvite(ledgerId, result);
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
