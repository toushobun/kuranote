import type { ReactNode } from "react";

import { createRequestContainer } from "internal/container";
import { getCurrentLedgerContext } from "internal/ledger/adapter/next/currentLedger";
import { canWriteTransaction } from "internal/ledger";
import { createServerRequestDependencies } from "internal/shared/context/createServerRequestDependencies";
import { ProtectedLayoutShell } from "templates/protected/ProtectedLayoutShell";

export default async function ProtectedLayout({
  children,
}: {
  children: ReactNode;
}) {
  const dependencies = await createServerRequestDependencies();
  const [{ currentLedger, email }, profile] = await Promise.all([
    getCurrentLedgerContext(),
    createRequestContainer(dependencies).user.service.getCurrentProfile(),
  ]);

  return (
    <ProtectedLayoutShell
      canWriteTransactions={
        currentLedger
          ? canWriteTransaction(currentLedger.currentUserRole)
          : false
      }
      email={email}
      transactionColorScheme={profile.transactionColorScheme}
    >
      {children}
    </ProtectedLayoutShell>
  );
}
