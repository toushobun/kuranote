import type { LedgerCurrency } from "internal/ledger/entity/ledgerCurrency";
import { jpyLedgerSetupTemplate } from "internal/ledger/entity/ledgerSetupTemplate/jpy";

/** 向导可创建的账户类型。现金固定一项，其余类型从候选名称中选择或自定义。 */
export const ledgerSetupAccountTypes = [
  "cash",
  "bank",
  "credit_card",
  "e_money",
] as const;

export type LedgerSetupAccountType = (typeof ledgerSetupAccountTypes)[number];

/** 提供候选名称的账户类型（现金不提供候选）。 */
export type LedgerSetupCandidateAccountType = Exclude<
  LedgerSetupAccountType,
  "cash"
>;

/** 现金账户：所有币种共用，向导默认勾选。 */
export const ledgerSetupCashAccount = {
  name: "现金",
  type: "cash",
} as const satisfies { name: string; type: LedgerSetupAccountType };

/** 商家标签。key 在模板内稳定唯一，草稿与完成写入通过 key 引用。 */
export type LedgerSetupMerchantTagTemplate = {
  /** 进入商家步骤时是否预先全选该标签下的商家。 */
  defaultSelected: boolean;
  icon: string;
  key: string;
  name: string;
  sortOrder: number;
};

export type LedgerSetupMerchantAliasTemplate = {
  alias: string;
  locale: string;
};

/** 预设商家。多场景商家只定义一次，通过 tagKeys 关联多个标签。 */
export type LedgerSetupMerchantTemplate = {
  aliases: readonly LedgerSetupMerchantAliasTemplate[];
  key: string;
  name: string;
  tagKeys: readonly string[];
  websiteUrl: string | null;
};

export type LedgerSetupTemplate = {
  accountCandidates: Readonly<
    Record<LedgerSetupCandidateAccountType, readonly string[]>
  >;
  currency: LedgerCurrency;
  merchantTags: readonly LedgerSetupMerchantTagTemplate[];
  merchants: readonly LedgerSetupMerchantTemplate[];
  /** 模板内容变更时递增；草稿记录该版本，完成写入时按当前版本重新校验。 */
  version: number;
};

/** 以账本默认货币为 key 的模板注册表。追加币种只需追加模板数据。 */
const ledgerSetupTemplates: Partial<Record<string, LedgerSetupTemplate>> = {
  [jpyLedgerSetupTemplate.currency]: jpyLedgerSetupTemplate,
};

/** 所有已注册的模板（供测试与校验遍历）。 */
export const registeredLedgerSetupTemplates: readonly LedgerSetupTemplate[] =
  Object.values(ledgerSetupTemplates).filter(
    (template): template is LedgerSetupTemplate => template !== undefined,
  );

/** 按币种取得模板；未注册的币种返回 null（无模板）。 */
export function getLedgerSetupTemplate(
  currency: string,
): LedgerSetupTemplate | null {
  return ledgerSetupTemplates[currency] ?? null;
}
