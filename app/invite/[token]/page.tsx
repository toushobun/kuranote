import { createClient } from "lib/supabase/server";
import { acceptLedgerInvite } from "server/actions/ledgerInvite";
import { getLedgerInviteErrorMessage } from "server/errors/ledgerInvite";
import { loadLedgerInvitePreview } from "server/services/ledgerInvite";
import { LedgerInviteTemplate } from "templates/ledgers/LedgerInvite";

export default async function LedgerInviteRoute({
  params,
  searchParams,
}: {
  params: Promise<{ token: string }>;
  searchParams: Promise<{ error?: string }>;
}) {
  const [{ token }, query] = await Promise.all([params, searchParams]);
  const supabase = await createClient();
  const [preview, authResult] = await Promise.all([
    loadLedgerInvitePreview(token),
    supabase.auth.getUser(),
  ]);

  return (
    <LedgerInviteTemplate
      acceptAction={acceptLedgerInvite}
      errorMessage={getLedgerInviteErrorMessage(query.error)}
      isAuthenticated={authResult.data.user !== null}
      preview={preview}
      token={token}
    />
  );
}
