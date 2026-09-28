import type { AccountSummary } from "internal/account/entity/accountSummary";
import type { AccountType } from "internal/account/entity/accountType";
import type { ThemeColorKey } from "theme/themeColorTokens";

export type AccountExportSummary = AccountSummary & {
  /** 导出「账户类型」列，再导入时与名称、持有人、币种一起匹配回原账户。 */
  type: AccountType;
  /** 占位持有人没有成员个性色，displayColor 为 null，导出时不着色。 */
  holder: { name: string; displayColor: ThemeColorKey | null } | null;
};
