import type { ReactNode } from "react";

import { getCurrentLedgerContext } from "internal/ledger/adapter/next/currentLedger";
import { canWriteTransaction } from "internal/ledger";
import { defaultTransactionColorScheme } from "internal/user";
import { ProtectedLayoutShell } from "templates/protected/ProtectedLayoutShell";

export default async function ProtectedLayout({
  children,
}: {
  children: ReactNode;
}) {
  const { currentLedger, email, transactionColorScheme } =
    await getCurrentLedgerContext();

  return (
    <ProtectedLayoutShell
      canWriteTransactions={
        currentLedger
          ? canWriteTransaction(currentLedger.currentUserRole)
          : false
      }
      email={email}
      transactionColorScheme={
        transactionColorScheme ?? defaultTransactionColorScheme
      }
    >
      {children}
    </ProtectedLayoutShell>
  );
}
