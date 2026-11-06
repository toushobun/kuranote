export const ledgerSetupRegions = ["jp", "cn"] as const;
export type LedgerSetupRegion = (typeof ledgerSetupRegions)[number];

export function isLedgerSetupRegion(
  value: unknown,
): value is LedgerSetupRegion {
  return value === "jp" || value === "cn";
}

/** 向导可创建的账户类型。各类型都只从地区候选名称中勾选。 */
export const ledgerSetupAccountTypes = [
  "cash",
  "bank",
  "credit_card",
  "e_money",
] as const;

export type LedgerSetupAccountType = (typeof ledgerSetupAccountTypes)[number];

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

/** 地区账户候选。现金候选的第一项是该地区的默认现金账户。 */
export type LedgerSetupAccountCandidates = Readonly<
  Record<LedgerSetupAccountType, readonly string[]>
>;

export type LedgerSetupTemplate = {
  accountCandidatesByRegion: Readonly<
    Record<LedgerSetupRegion, LedgerSetupAccountCandidates>
  >;
  region: LedgerSetupRegion;
  merchantTags: readonly LedgerSetupMerchantTagTemplate[];
  merchants: readonly LedgerSetupMerchantTemplate[];
  /** 模板内容变更时递增；草稿记录该版本，完成写入时按当前版本重新校验。 */
  version: number;
};
