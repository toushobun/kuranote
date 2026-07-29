import type { ThemeColorKey } from "theme/themeColorTokens";

export type LedgerCreateDefaultsInput = {
  email: string;
  inheritedCurrency?: string;
  userId: string;
};

export type LedgerCreateDefaults = {
  defaults: {
    baseCurrency: string;
    displayColor: ThemeColorKey;
    displayName: string;
    ledgerName: string;
  };
};
