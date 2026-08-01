import type { CurrentLedgerRole } from "internal/ledger/entity/currentLedger";
import type { ThemeColorKey } from "theme/themeColorTokens";

export type LedgerSettingsMemberView = {
  avatarUrl: string | null;
  displayColor: ThemeColorKey;
  displayName: string;
  email: string | null;
  role: CurrentLedgerRole;
  userId: string;
};

export type LedgerSettingsView = {
  canEditLedger: boolean;
  currentUser: {
    displayColor: ThemeColorKey;
    displayName: string;
    userId: string;
  };
  ledger: {
    baseCurrency: string;
    currentUserRole: CurrentLedgerRole;
    id: string;
    isCurrent: boolean;
    name: string;
    transactionItemSpecialStatusEnabled: boolean;
  };
  members: LedgerSettingsMemberView[];
};
