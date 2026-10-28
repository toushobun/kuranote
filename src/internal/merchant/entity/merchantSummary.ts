export type MerchantSummary = {
  icon_url: string | null;
  id: string;
  name: string;
};

export type MerchantTagSummary = {
  icon: string;
  id: string;
  merchant_count: number;
  name: string;
  sort_order: number;
};

/** 新增记账流程的商家候选：摘要 + 商家分类（#943）。 */
export type MerchantEntryOptions = {
  merchants: (MerchantSummary & { tags: MerchantTagSummary[] })[];
  tags: MerchantTagSummary[];
};
