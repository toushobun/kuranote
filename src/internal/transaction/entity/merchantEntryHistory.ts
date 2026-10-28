/** 最近商家交易的统计样本；按交易时间从新到旧，明细及付款按原顺序排列。 */
export type MerchantEntryHistoryRecord = {
  id: string;
  payments: {
    accountId: string;
    currency: string;
    isArchived: boolean;
  }[];
  items: { categoryId: string; amount: string }[];
};
