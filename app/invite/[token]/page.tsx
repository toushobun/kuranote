import { redirect } from "next/navigation";

import { routePaths, routeWithQuery } from "config/paths";
import { isValidLedgerInviteToken } from "lib/ledger/inviteToken";
import { createClient } from "lib/supabase/server";
import { acceptLedgerInvite } from "server/actions/ledgerInvite";
import { getLedgerInviteErrorMessage } from "server/errors/ledgerInvite";
import {
  loadLedgerInvitePreview,
  type LedgerInvitePreview,
} from "server/services/ledgerInvite";
import { LedgerInviteTemplate } from "templates/ledgers/LedgerInvite";

const invalidInvitePreview: LedgerInvitePreview = {
  inviteRole: null,
  inviterName: null,
  ledgerName: null,
  status: "invalid",
};

export default async function LedgerInviteRoute({
  params,
  searchParams,
}: {
  params: Promise<{ token: string }>;
  searchParams: Promise<{ error?: string }>;
}) {
  const [{ token }, query] = await Promise.all([params, searchParams]);
  const errorMessage = getLedgerInviteErrorMessage(query.error);

  if (!isValidLedgerInviteToken(token)) {
    return (
      <LedgerInviteTemplate
        acceptAction={acceptLedgerInvite}
        errorMessage={errorMessage}
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

  return (
    <LedgerInviteTemplate
      acceptAction={acceptLedgerInvite}
      errorMessage={errorMessage}
      preview={preview}
      token={token}
    />
  );
}

export async function probeAuthentication(): Promise<boolean> {
  try {
    const supabase = await createClient();
    const { data, error } = await supabase.auth.getUser();
    return error === null && data.user !== null;
  } catch {
    console.error("[ledgerInvite] failed to probe authentication");
    return false;
  }
}
