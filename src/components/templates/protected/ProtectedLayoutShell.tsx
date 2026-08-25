import type { ReactNode } from "react";

import type { TransactionColorScheme } from "internal/user";
import { AppShell } from "templates/protected/AppShell";

type ProtectedLayoutShellProps = {
  canWriteTransactions?: boolean;
  children: ReactNode;
  email: string;
  transactionColorScheme: TransactionColorScheme;
};

export function ProtectedLayoutShell({
  canWriteTransactions = true,
  children,
  email,
  transactionColorScheme,
}: ProtectedLayoutShellProps) {
  return (
    <AppShell
      canWriteTransactions={canWriteTransactions}
      email={email}
      transactionColorScheme={transactionColorScheme}
    >
      {children}
    </AppShell>
  );
}
