import { createLedger } from "server/actions/ledgerCreate";
import { getLedgerCreateErrorMessage } from "server/errors/ledgerCreate";
import { loadLedgerCreateView } from "server/loaders/ledgerCreate";
import { LedgerCreateTemplate } from "templates/ledgers/LedgerCreate";

export default async function LedgerCreateRoute({
  searchParams,
}: {
  searchParams: Promise<{ error?: string; errorKey?: string }>;
}) {
  const [view, resolvedSearchParams] = await Promise.all([
    loadLedgerCreateView(),
    searchParams,
  ]);

  return (
    <LedgerCreateTemplate
      {...view}
      createLedgerAction={createLedger}
      errorKey={resolvedSearchParams.errorKey ?? null}
      errorMessage={getLedgerCreateErrorMessage(resolvedSearchParams.error)}
    />
  );
}
