import { createLedger } from "server/actions/ledgerSetup";
import { loadDashboardView } from "server/loaders/dashboard";
import { DashboardTemplate } from "templates/dashboard/Dashboard";
import { getLedgerSetupErrorMessage } from "utils/pageErrors";

export default async function DashboardPage({
  searchParams,
}: {
  searchParams: Promise<{ ledgerSetupError?: string }>;
}) {
  const [data, params] = await Promise.all([loadDashboardView(), searchParams]);

  return (
    <DashboardTemplate
      createLedgerAction={createLedger}
      createLedgerErrorMessage={getLedgerSetupErrorMessage(
        params.ledgerSetupError,
      )}
      data={data}
    />
  );
}
