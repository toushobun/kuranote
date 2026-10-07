import type { LedgerCurrency } from "internal/ledger/entity/ledgerCurrency";
import type { LedgerSetupDraft } from "internal/ledger/schema/ledgerSetupDraft";
import type { ThemeColorKey } from "theme/themeColorTokens";

/** 账本创建状态。取值与 ledger.setup_status 的 check 约束一致。 */
export const ledgerSetupStatuses = {
  completed: "completed",
  inProgress: "in_progress",
} as const;

/** 创建中账本可记录的向导步骤范围。与 ledger_setup_state_check 一致。 */
export const ledgerSetupStepRange = { max: 5, min: 1 } as const;

/** 草稿大小上限（字节）。与 public.ledger_setup_draft_max_bytes() 一致。 */
export const ledgerSetupDraftMaxBytes = 65536;

/**
 * 向导草稿与完成写入的条数、长度上限。长度与 account、merchant、merchant_alias、
 * merchant_tags 的 check 约束一致，条数与 complete_ledger_setup 的 payload 校验一致。
 */
export const ledgerSetupLimits = {
  accountNameMaxLength: 100,
  aliasLocaleMaxLength: 20,
  aliasLocaleMinLength: 2,
  aliasMaxLength: 100,
  maxAccounts: 50,
  maxMerchantAliases: 20,
  maxMerchantTagKeys: 20,
  maxMerchantTags: 50,
  maxMerchants: 200,
  merchantNameMaxLength: 100,
  merchantTagIconMaxLength: 32,
  merchantTagNameMaxLength: 100,
  templateKeyMaxLength: 100,
} as const;

/** 当前用户的创建中账本。草稿已按账本当前默认货币的模板补全与校正。 */
export type LedgerSetup = {
  baseCurrency: LedgerCurrency;
  /** 当前用户在该账本中的个性色。 */
  displayColor: ThemeColorKey;
  /** 当前用户在该账本中的显示名。 */
  displayName: string;
  draft: LedgerSetupDraft;
  /**
   * 数据库中的草稿是否已保存账户或商家选择。修改默认货币会清空这些选择，
   * 向导据此决定是否需要二次确认；只有补全出来的默认值时为 false。
   */
  hasTemplateSelections: boolean;
  id: string;
  name: string;
  step: number;
};
