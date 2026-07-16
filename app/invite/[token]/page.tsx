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
  const [preview, isAuthenticated] = await Promise.all([
    loadLedgerInvitePreview(token),
    probeAuthentication(),
  ]);

  return (
    <LedgerInviteTemplate
      acceptAction={acceptLedgerInvite}
      errorMessage={getLedgerInviteErrorMessage(query.error)}
      isAuthenticated={isAuthenticated}
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
