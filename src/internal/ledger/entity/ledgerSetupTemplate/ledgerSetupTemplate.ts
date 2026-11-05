export const ledgerSetupRegions = ["jp", "cn"] as const;
export type LedgerSetupRegion = (typeof ledgerSetupRegions)[number];

export function isLedgerSetupRegion(
  value: unknown,
): value is LedgerSetupRegion {
  return value === "jp" || value === "cn";
}

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
  regions: readonly LedgerSetupRegion[];
  generic?: boolean;
};

export type LedgerSetupAccountCandidates = Readonly<
  Record<LedgerSetupCandidateAccountType, readonly string[]>
>;

export type LedgerSetupTemplate = {
  accountCandidates: LedgerSetupAccountCandidates;
  accountCandidatesByRegion: Readonly<
    Record<LedgerSetupRegion, LedgerSetupAccountCandidates>
  >;
  region: LedgerSetupRegion;
  merchantTags: readonly LedgerSetupMerchantTagTemplate[];
  merchants: readonly LedgerSetupMerchantTemplate[];
  /** 模板内容变更时递增；草稿记录该版本，完成写入时按当前版本重新校验。 */
  version: number;
};
