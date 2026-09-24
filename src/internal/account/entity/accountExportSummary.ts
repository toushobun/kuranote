import type { AccountSummary } from "internal/account/entity/accountSummary";
import type { ThemeColorKey } from "theme/themeColorTokens";

export type AccountExportSummary = AccountSummary & {
  /** 占位持有人没有成员个性色，displayColor 为 null，导出时不着色。 */
  holder: { name: string; displayColor: ThemeColorKey | null } | null;
};
