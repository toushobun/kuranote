import { redirect } from "next/navigation";

import { routePaths, routeWithQuery } from "config/paths";
import { isValidLedgerInviteToken } from "lib/ledger/inviteToken";
import { createAuthenticatedSupabaseClient } from "internal/shared/supabase/authenticatedClient";
import {
  loadLedgerInvitePreview,
  type LedgerInvitePreview,
} from "internal/ledger/adapter/next/loadLedgerInvitePreview";
import { LedgerInviteTemplate } from "templates/ledgers/LedgerInvite";

const invalidInvitePreview: LedgerInvitePreview = {
  inviteRole: null,
  inviterName: null,
  ledgerName: null,
  status: "invalid",
};

export default async function LedgerInviteRoute({
  params,
}: {
  params: Promise<{ token: string }>;
}) {
  const { token } = await params;

  if (!isValidLedgerInviteToken(token)) {
    return (
      <LedgerInviteTemplate
        exitHref={routePaths.home}
        preview={invalidInvitePreview}
        token=""
      />
    );
  }

  const invitePath = `/invite/${token}`;
  const isAuthenticated = await probeAuthentication();

  if (!isAuthenticated) {
    redirect(routeWithQuery(routePaths.login, { next: invitePath }));
  }

  const preview = await loadLedgerInvitePreview(token);

  return <LedgerInviteTemplate preview={preview} token={token} />;
}

export async function probeAuthentication(): Promise<boolean> {
  try {
    const supabase = await createAuthenticatedSupabaseClient();
    const { data, error } = await supabase.auth.getUser();
    return error === null && data.user !== null;
  } catch {
    console.error("[ledgerInvite] failed to probe authentication");
    return false;
  }
}
