"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import { routePaths } from "config/paths";
import { getCurrentLedgerContext } from "lib/ledger/current-ledger";
import {
  acceptLedgerInviteService,
  createLedgerInviteService,
} from "server/services/ledgerInvite";

export async function createLedgerInvite(formData: FormData) {
  await getCurrentLedgerContext();
  const ledgerId = String(formData.get("ledgerId") ?? "").trim();

  if (!ledgerId) {
    redirect(`${routePaths.ledgers}?inviteError=create_failed`);
  }

  const result = await createLedgerInviteService(ledgerId);

  if (!result.ok) {
    redirect(
      `/ledgers/${encodeURIComponent(ledgerId)}/settings?inviteError=${encodeURIComponent(result.error)}`,
    );
  }

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
