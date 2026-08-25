import type { ReactNode } from "react";

import { getCurrentLedgerContext } from "internal/ledger/adapter/next/currentLedger";
import { canWriteTransaction } from "internal/ledger";
import {
  defaultTransactionColorScheme,
  transactionColorSchemes,
} from "internal/user";
import { ProtectedLayoutShell } from "templates/protected/ProtectedLayoutShell";

export default async function ProtectedLayout({
  children,
}: {
  children: ReactNode;
}) {
  const {
    currentLedger,
    email,
    transactionColorScheme: storedColorScheme,
  } = await getCurrentLedgerContext();
  const transactionColorScheme =
    transactionColorSchemes.find((scheme) => scheme === storedColorScheme) ??
    defaultTransactionColorScheme;

  return (
    <ProtectedLayoutShell
      canWriteTransactions={
        currentLedger
          ? canWriteTransaction(currentLedger.currentUserRole)
          : false
      }
      email={email}
      transactionColorScheme={transactionColorScheme}
    >
      {children}
    </ProtectedLayoutShell>
  );
}
