import type { ReactNode } from "react";

import type { TransactionColorScheme, UserThemeKey } from "internal/user";
import { AppShell } from "templates/protected/AppShell";

type ProtectedLayoutShellProps = {
  canWriteTransactions?: boolean;
  children: ReactNode;
  themeKey: UserThemeKey;
  transactionColorScheme: TransactionColorScheme;
};

export function ProtectedLayoutShell({
  canWriteTransactions = true,
  children,
  themeKey,
  transactionColorScheme,
}: ProtectedLayoutShellProps) {
  return (
    <AppShell
      canWriteTransactions={canWriteTransactions}
      themeKey={themeKey}
      transactionColorScheme={transactionColorScheme}
    >
      {children}
    </AppShell>
  );
}
