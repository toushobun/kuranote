"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import {
  ledgerInviteErrorHref,
  ledgerInviteErrorOperations,
  routePaths,
} from "config/paths";
import { getCurrentLedgerContext } from "lib/ledger/current-ledger";
import { isValidLedgerInviteToken } from "lib/ledger/inviteToken";
import { revalidateCurrentLedgerPaths } from "server/cache/currentLedger";
import { ledgerInviteErrorCodes } from "server/errors/ledgerInvite";
import {
  acceptLedgerInviteService,
  createLedgerInviteService,
  revokeLedgerInviteService,
} from "server/services/ledgerInvite";
import { isLedgerInviteRole } from "types/ledgers";

export async function createLedgerInvite(formData: FormData) {
  await getCurrentLedgerContext();
  const ledgerId = String(formData.get("ledgerId") ?? "").trim();
  const intent = String(formData.get("intent") ?? "create").trim();

  if (!ledgerId) {
    redirect(`${routePaths.ledgers}?inviteError=create_failed`);
  }

  if (intent === "revoke") {
    const inviteId = String(formData.get("inviteId") ?? "").trim();

    if (!inviteId) {
      redirect(
        ledgerInviteErrorHref(
          ledgerId,
          "revoke_failed",
          ledgerInviteErrorOperations.revoke,
        ),
      );
    }

    const revokeResult = await revokeLedgerInviteService(ledgerId, inviteId);

    if (!revokeResult.ok) {
      redirect(
        ledgerInviteErrorHref(
          ledgerId,
          revokeResult.error,
          ledgerInviteErrorOperations.revoke,
        ),
      );
    }

    revalidatePath(`/ledgers/${ledgerId}/settings`);
    redirect(
      `/ledgers/${encodeURIComponent(ledgerId)}/settings?inviteResult=revoked`,
    );
  }

  if (intent !== "create") {
    redirect(
      ledgerInviteErrorHref(
        ledgerId,
        "create_failed",
        ledgerInviteErrorOperations.create,
      ),
    );
  }

  const roleValue = String(formData.get("role") ?? "member").trim();
  if (!isLedgerInviteRole(roleValue)) {
    redirect(
      ledgerInviteErrorHref(
        ledgerId,
        "invite_role_invalid",
        ledgerInviteErrorOperations.create,
      ),
    );
  }

  const result = await createLedgerInviteService(ledgerId, roleValue);

  if (!result.ok) {
    redirect(
      ledgerInviteErrorHref(
        ledgerId,
        result.error,
        ledgerInviteErrorOperations.create,
      ),
    );
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

  revalidatePath(`/ledgers/${ledgerId}/settings`);
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

export async function acceptLedgerInvite(formData: FormData) {
  const token = String(formData.get("token") ?? "").trim();

  if (!isValidLedgerInviteToken(token)) {
    redirect("/invite/invalid");
  }

  const result = await acceptLedgerInviteSafely(token);

  if (!result.ok) {
    redirect(`/invite/${token}?error=${encodeURIComponent(result.error)}`);
  }

  revalidateCurrentLedgerPaths();
  redirect(routePaths.dashboard);
}

async function acceptLedgerInviteSafely(token: string) {
  try {
    return await acceptLedgerInviteService(token);
  } catch {
    console.error("[ledgerInvite] failed to accept invite action");
    return { error: ledgerInviteErrorCodes.acceptFailed, ok: false } as const;
  }
}
