import type { CategoryType } from "internal/category";
import type { TransactionRecordStorageType } from "internal/transaction";
import {
  addTransactionAmount,
  createTransactionAmountSummary,
  formatMonthLabel,
  shiftMonth,
} from "utils/transactions";

export type StatisticsRankItem = {
  amount: string;
  id: string;
  name: string;
  transactionCount: number;
};

type StatisticsAmountSummary = {
  balance: string;
  currency: string;
  expense: string;
  income: string;
};

export type StatisticsViewData = {
  categoryExpenseRanking: StatisticsRankItem[];
  ledgerName: string;
  merchantExpenseRanking: StatisticsRankItem[];
  month: string;
  monthLabel: string;
  nextMonth: string;
  previousMonth: string;
  summary: StatisticsAmountSummary;
};

type StatisticsRecordInput = {
  id: string;
  merchant_id: string | null;
  type: TransactionRecordStorageType;
};

type StatisticsItemInput = {
  amount: string;
  category_id: string | null;
  refunded_amount?: string;
  is_refund_income?: boolean;
  transaction_record_id: string;
};

type StatisticsMerchantInput = {
  id: string;
  name: string;
};

type StatisticsCategoryInput = {
  id: string;
  name: string;
  parent_id: string | null;
  type: CategoryType;
};

type BuildStatisticsViewDataParams = {
  categories: StatisticsCategoryInput[];
  currency: string;
  items: StatisticsItemInput[];
  ledgerName: string;
  merchants: StatisticsMerchantInput[];
  month: string;
  records: StatisticsRecordInput[];
};

type RankingAccumulator = {
  amount: number;
  id: string;
  name: string;
  transactionIds: Set<string>;
};

export function buildStatisticsViewData({
  categories,
  currency,
  items,
  ledgerName,
  merchants,
  month,
  records,
}: BuildStatisticsViewDataParams): StatisticsViewData {
  const recordById = new Map(records.map((record) => [record.id, record]));
  const merchantById = new Map(
    merchants.map((merchant) => [merchant.id, merchant]),
  );
  const categoryById = new Map(
    categories.map((category) => [category.id, category]),
  );
  const summary = createTransactionAmountSummary(currency);
  const merchantRankingById = new Map<string, RankingAccumulator>();
  const categoryRankingById = new Map<string, RankingAccumulator>();

  for (const item of items) {
    const record = recordById.get(item.transaction_record_id);

    if (!record || record.type === "transfer") continue;

    const categoryId = item.category_id;

    if (!categoryId) continue;

    const category = categoryById.get(categoryId);

    if (!category) continue;

    const effectiveAmount =
      category.type === "expense"
        ? String(
            Math.max(
              0,
              Number(item.amount) - Number(item.refunded_amount ?? 0),
            ),
          )
        : item.is_refund_income
          ? "0"
          : item.amount;
    if (Number(effectiveAmount) !== 0) {
      addTransactionAmount(summary, category.type, effectiveAmount);
    }

    if (category.type !== "expense") {
      continue;
    }

    const merchantId = record.merchant_id;

    if (merchantId) {
      addRankingAmount(
        merchantRankingById,
        merchantId,
        merchantById.get(merchantId)?.name ?? "未指定商家",
        effectiveAmount,
        record.id,
      );
    }

    addRankingAmount(
      categoryRankingById,
      categoryId,
      getCategoryDisplayName(category, categoryById),
      effectiveAmount,
      record.id,
    );
  }

  return {
    categoryExpenseRanking: toSortedRanking(categoryRankingById),
    ledgerName,
    merchantExpenseRanking: toSortedRanking(merchantRankingById),
    month,
    monthLabel: formatMonthLabel(month),
    nextMonth: shiftMonth(month, 1),
    previousMonth: shiftMonth(month, -1),
    summary,
  };
}

function addRankingAmount(
  rankingById: Map<string, RankingAccumulator>,
  id: string,
  name: string,
  amount: string,
  transactionId: string,
) {
  const value = Number(amount);

  if (!Number.isFinite(value) || value === 0) return;

  const ranking = rankingById.get(id) ?? {
    amount: 0,
    id,
    name,
    transactionIds: new Set<string>(),
  };

  ranking.amount += value;
  ranking.transactionIds.add(transactionId);
  rankingById.set(id, ranking);
}

function getCategoryDisplayName(
  category: StatisticsCategoryInput,
  categoryById: Map<string, StatisticsCategoryInput>,
) {
  const parentCategory = category.parent_id
    ? categoryById.get(category.parent_id)
    : null;

  return parentCategory
    ? `${parentCategory.name} / ${category.name}`
    : category.name;
}

function toSortedRanking(
  rankingById: Map<string, RankingAccumulator>,
): StatisticsRankItem[] {
  return [...rankingById.values()]
    .map((ranking) => ({
      amount: String(ranking.amount),
      id: ranking.id,
      name: ranking.name,
      transactionCount: ranking.transactionIds.size,
    }))
    .sort((a, b) => {
      const amountDiff = Number(b.amount) - Number(a.amount);

      if (amountDiff !== 0) return amountDiff;

      const countDiff = b.transactionCount - a.transactionCount;

      if (countDiff !== 0) return countDiff;

      return a.name.localeCompare(b.name);
    });
}
