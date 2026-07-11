import type { ReactNode } from "react";

import { AppShell } from "templates/protected/AppShell";

type ProtectedLayoutShellProps = {
  canWriteTransactions?: boolean;
  children: ReactNode;
  email: string;
};

export function ProtectedLayoutShell({
  canWriteTransactions = true,
  children,
  email,
}: ProtectedLayoutShellProps) {
  return (
    <AppShell canWriteTransactions={canWriteTransactions} email={email}>
      {children}
    </AppShell>
  );
}
