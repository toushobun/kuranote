export type CurrentLedgerRole = "owner" | "admin" | "member" | "viewer";

export type CurrentLedger = {
  id: string;
  name: string;
  baseCurrency: string;
  currentUserId?: string;
  currentUserRole: CurrentLedgerRole;
  transactionItemSpecialStatusEnabled?: boolean;
};

export type LedgerWithMemberCount = CurrentLedger & {
  memberCount: number;
};

export type CurrentLedgerContext = {
  userId: string;
  email: string;
  ledgers: CurrentLedger[];
  currentLedger: CurrentLedger | null;
  transactionColorScheme?: string;
};
