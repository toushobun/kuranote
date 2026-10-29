import type { MerchantEntryHistoryRecord } from "internal/transaction/entity/merchantEntryHistory";
import type { MerchantEntrySuggestions } from "internal/transaction/schema";
import {
  automaticCategoryMinimumRecordCount,
  automaticCategoryRecordRatio,
  frequentAmountLimit,
  frequentAmountMinimumOccurrenceCount,
  recommendedAccountLimit,
} from "internal/transaction/service/read/recentUsage";
export function buildMerchantEntrySuggestions(
  records: readonly MerchantEntryHistoryRecord[],
): MerchantEntrySuggestions {
  const accountCounts = new Map<string, number>();
  const categoryCounts = new Map<string, number>();
  const amountGroups = new Map<
    string,
    { categoryId: string; currency: string; counts: Map<string, number> }
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
      const key = `${item.categoryId}:${currency}`;
      const group = amountGroups.get(key) ?? {
        categoryId: item.categoryId,
        currency,
        counts: new Map<string, number>(),
      };
      group.counts.set(item.amount, (group.counts.get(item.amount) ?? 0) + 1);
      amountGroups.set(key, group);
    }
  }
  // 样本为该商家最近的记录（最多 20 笔），阈值 = max(min(2, 样本数), ceil(样本数 / 2))：
  // 只有 1 笔记录时阈值为 1，≥ 2 笔时为 max(2, ceil(样本数 / 2))。
  const automaticCategoryThreshold = Math.max(
    Math.min(automaticCategoryMinimumRecordCount, records.length),
    Math.ceil(records.length * automaticCategoryRecordRatio),
  );
  return {
    recommendedAccountIds: [...accountCounts]
      .sort((a, b) => b[1] - a[1])
      .slice(0, recommendedAccountLimit)
      .map(([id]) => id),
    automaticCategoryIds: [...categoryCounts]
      .filter(([, count]) => count >= automaticCategoryThreshold)
      .sort((a, b) => b[1] - a[1])
      .map(([id]) => id),
    quickAmounts: [...amountGroups.values()].map(
      ({ categoryId, currency, counts }) => {
        const [lastAmount] = counts.keys();
        return {
          categoryId,
          currency,
          lastAmount,
          frequentAmounts: [...counts]
            .filter(
              ([amount, count]) =>
                count >= frequentAmountMinimumOccurrenceCount &&
                amount !== lastAmount,
            )
            .sort((a, b) => b[1] - a[1])
            .slice(0, frequentAmountLimit)
            .map(([amount]) => amount),
        };
      },
    ),
  };
}
