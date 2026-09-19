import type { AccountSummary } from "internal/account/entity/accountSummary";
import type { ThemeColorKey } from "theme/themeColorTokens";

export type AccountExportSummary = AccountSummary & {
  holder: { name: string; displayColor: ThemeColorKey } | null;
};
