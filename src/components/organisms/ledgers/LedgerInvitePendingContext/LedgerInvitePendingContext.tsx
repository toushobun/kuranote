"use client";

import { createContext, useContext, type ReactNode } from "react";

import type { PendingLedgerInvite } from "types/ledgers";

const PendingLedgerInvitesContext = createContext<PendingLedgerInvite[]>([]);

export function LedgerInvitePendingProvider({
  children,
  pendingInvites,
}: {
  children: ReactNode;
  pendingInvites: PendingLedgerInvite[];
}) {
  return (
    <PendingLedgerInvitesContext value={pendingInvites}>
      {children}
    </PendingLedgerInvitesContext>
  );
}

export function usePendingLedgerInvites() {
  return useContext(PendingLedgerInvitesContext);
}
