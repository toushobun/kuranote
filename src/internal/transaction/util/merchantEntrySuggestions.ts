import type { MerchantEntryHistoryRecord } from "internal/transaction/entity/merchantEntryHistory";
import type {
  FrequentMerchant,
  MerchantEntrySuggestions,
} from "internal/transaction/schema";
import {
  automaticCategoryMinimumRecordCount,
  frequentAmountLimit,
  frequentAmountMinimumOccurrenceCount,
  frequentMerchantLimit,
  recommendedAccountLimit,
} from "internal/transaction/service/read/recentUsage";
import {
  formatRefundMinorUnits,
  toRefundMinorUnits,
} from "internal/transaction/util/refundAllocation";

export function selectFrequentMerchants(
  counts: FrequentMerchant[],
): FrequentMerchant[] {
  return [...counts]
    .sort((a, b) => b.recordCount - a.recordCount)
    .slice(0, frequentMerchantLimit);
}

export function buildMerchantEntrySuggestions(
  records: readonly MerchantEntryHistoryRecord[],
): MerchantEntrySuggestions {
  const accountCounts = new Map<string, number>();
  const categoryCounts = new Map<string, number>();
  const amountsByCategory = new Map<
    string,
    Map<string, { amount: string; currency: string; count: number }>
  >();
  for (const record of records) {
    for (const id of new Set(
      record.payments.filter((p) => !p.isArchived).map((p) => p.accountId),
    )) {
      accountCounts.set(id, (accountCounts.get(id) ?? 0) + 1);
    }
    for (const id of new Set(record.items.map((item) => item.categoryId))) {
      categoryCounts.set(id, (categoryCounts.get(id) ?? 0) + 1);
    }
    // 多账户付款只允许同币种；归档状态不影响历史金额的币种。
    const currency = record.payments[0]?.currency;
    if (!currency) continue;
    for (const item of record.items) {
      const units = toRefundMinorUnits(item.amount);
      if (units === null) continue;
      const amount = formatRefundMinorUnits(units);
      const amounts = amountsByCategory.get(item.categoryId) ?? new Map();
      const key = `${currency}:${amount}`;
      const existing = amounts.get(key);
      amounts.set(key, { amount, currency, count: (existing?.count ?? 0) + 1 });
      amountsByCategory.set(item.categoryId, amounts);
    }
  }
  return {
    recommendedAccountIds: [...accountCounts]
      .sort((a, b) => b[1] - a[1])
      .slice(0, recommendedAccountLimit)
      .map(([id]) => id),
    automaticCategoryIds: [...categoryCounts]
      .filter(([, count]) => count >= automaticCategoryMinimumRecordCount)
      .sort((a, b) => b[1] - a[1])
      .map(([id]) => id),
    quickAmounts: [...amountsByCategory].map(([categoryId, amounts]) => {
      const [last] = amounts.values();
      return {
        categoryId,
        lastAmount: { amount: last.amount, currency: last.currency },
        frequentAmounts: [...amounts.values()]
          .filter(
            (value) =>
              value.count >= frequentAmountMinimumOccurrenceCount &&
              value !== last,
          )
          .sort((a, b) => b.count - a.count)
          .slice(0, frequentAmountLimit)
          .map(({ amount, currency }) => ({ amount, currency })),
      };
    }),
  };
}
