import { createLedger } from "server/actions/ledgerSetup";
import { LedgerSetupTemplate } from "ledger-setup-template/LedgerSetup";

type LedgerSetupPageProps = {
  errorMessage: string | null;
};

export function LedgerSetupPage({ errorMessage }: LedgerSetupPageProps) {
  return (
    <LedgerSetupTemplate
      createLedgerAction={createLedger}
      errorMessage={errorMessage}
    />
  );
}
