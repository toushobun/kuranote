import type { ReactNode } from "react";

import { getCurrentLedgerContext } from "internal/ledger/adapter/next/currentLedger";
import { canWriteTransaction } from "internal/ledger";
import { ProtectedLayoutShell } from "templates/protected/ProtectedLayoutShell";

export default async function ProtectedLayout({
  children,
}: {
  children: ReactNode;
}) {
  const { currentLedger, email } = await getCurrentLedgerContext();

  return (
    <ProtectedLayoutShell
      canWriteTransactions={
        currentLedger
          ? canWriteTransaction(currentLedger.currentUserRole)
          : false
      }
      email={email}
    >
      {children}
    </ProtectedLayoutShell>
  );
}
