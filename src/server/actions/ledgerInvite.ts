"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import { routePaths } from "config/paths";
import { getCurrentLedgerContext } from "lib/ledger/current-ledger";
import {
  acceptLedgerInviteService,
  createLedgerInviteService,
  revokeLedgerInviteService,
} from "server/services/ledgerInvite";

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
        `/ledgers/${encodeURIComponent(ledgerId)}/settings?inviteError=revoke_failed`,
      );
    }

    const revokeResult = await revokeLedgerInviteService(ledgerId, inviteId);

    if (!revokeResult.ok) {
      redirect(
        `/ledgers/${encodeURIComponent(ledgerId)}/settings?inviteError=${encodeURIComponent(revokeResult.error)}`,
      );
    }

    revalidatePath(`/ledgers/${ledgerId}/settings`);
    redirect(
      `/ledgers/${encodeURIComponent(ledgerId)}/settings?inviteResult=revoked`,
    );
  }

  const result = await createLedgerInviteService(ledgerId);

  if (!result.ok) {
    redirect(
      `/ledgers/${encodeURIComponent(ledgerId)}/settings?inviteError=${encodeURIComponent(result.error)}`,
    );
  }

  revalidatePath(`/ledgers/${ledgerId}/settings`);
  redirect(
    `/ledgers/${encodeURIComponent(ledgerId)}/settings#inviteToken=${encodeURIComponent(result.token)}`,
  );
}

export async function acceptLedgerInvite(formData: FormData) {
  const token = String(formData.get("token") ?? "").trim();

  if (!token) {
    redirect("/invite/invalid");
  }

  const result = await acceptLedgerInviteService(token);

  if (!result.ok) {
    redirect(
      `/invite/${encodeURIComponent(token)}?error=${encodeURIComponent(result.error)}`,
    );
  }

  [
    routePaths.dashboard,
    routePaths.ledgers,
    routePaths.settings,
    routePaths.transactions,
    routePaths.statistics,
  ].forEach((path) => revalidatePath(path));

  redirect(routePaths.dashboard);
}
