import type { ReactNode } from "react";

import { getCurrentLedgerContext } from "internal/ledger/adapter/next/currentLedger";
import { canWriteTransaction } from "internal/ledger";
import {
  defaultTransactionColorScheme,
  defaultUserThemeKey,
} from "internal/user";
import { ProtectedLayoutShell } from "templates/protected/ProtectedLayoutShell";

export default async function ProtectedLayout({
  children,
}: {
  children: ReactNode;
}) {
  const { currentLedger, themeKey, transactionColorScheme } =
    await getCurrentLedgerContext();

  return (
    <ProtectedLayoutShell
      canWriteTransactions={
        currentLedger
          ? canWriteTransaction(currentLedger.currentUserRole)
          : false
      }
      themeKey={themeKey ?? defaultUserThemeKey}
      transactionColorScheme={
        transactionColorScheme ?? defaultTransactionColorScheme
      }
    >
      {children}
    </ProtectedLayoutShell>
  );
}
