import { convertLedgerAmount } from "internal/exchangeRate/util/convertLedgerAmount";
import {
  addSignedAmount,
  calculateRecordNetAmount,
} from "utils/transactionRecordAmounts";
import { compareDisplayText, groupByKey } from "utils/collections";
import type { CategoryType } from "internal/category";
import type { TransactionRecordStorageType } from "internal/transaction";
import {
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
  hasForeignCurrency?: boolean;
  missingRateCount?: number;
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
  record_currency?: string | null;
  ledger_rate?: number | string | null;
  type: TransactionRecordStorageType;
};

type StatisticsItemInput = {
  amount: string;
  business_net_amount?: string;
  category_id: string | null;
  has_refund_link?: boolean;
  has_reimbursement_link?: boolean;
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
  const itemsByRecordId = groupByKey(
    items,
    (item) => item.transaction_record_id,
  );
  const merchantRankingById = new Map<string, RankingAccumulator>();
  for (const record of records) {
    if (record.type !== "normal") continue;
    const netAmount = calculateRecordNetAmount(
      itemsByRecordId.get(record.id) ?? [],
      categoryById,
    );
    if (record.record_currency && record.record_currency !== currency) {
      summary.hasForeignCurrency = true;
    }
    const convertedAmount = convertLedgerAmount(netAmount, record.ledger_rate);
    if (convertedAmount === null) {
      summary.missingRateCount = (summary.missingRateCount ?? 0) + 1;
      continue;
    }
    addSignedAmount(summary, convertedAmount);
    if (record.merchant_id && convertedAmount < 0) {
      addRankingAmount(
        merchantRankingById,
        record.merchant_id,
        merchantById.get(record.merchant_id)?.name ?? "未指定商家",
        String(-convertedAmount),
        record.id,
      );
    }
  }
  const categoryRankingById = new Map<string, RankingAccumulator>();
  const categoryAmountByRecord = new Map<string, number>();

  for (const item of items) {
    const record = recordById.get(item.transaction_record_id);

    if (!record || record.type === "transfer") continue;

    const categoryId = item.category_id;

    if (!categoryId) continue;

    const category = categoryById.get(categoryId);

    if (!category) continue;

    const effectiveAmount = item.business_net_amount ?? item.amount;
    if (category.type !== "expense") continue;

    const key = `${record.id}:${categoryId}`;
    const numericAmount = Number(effectiveAmount);
    if (!Number.isFinite(numericAmount)) continue;
    categoryAmountByRecord.set(
      key,
      (categoryAmountByRecord.get(key) ?? 0) + numericAmount,
    );
  }
  for (const [key, amount] of categoryAmountByRecord) {
    const separator = key.lastIndexOf(":");
    const recordId = key.slice(0, separator);
    const categoryId = key.slice(separator + 1);
    const record = recordById.get(recordId);
    const category = categoryById.get(categoryId);
    if (!record || !category) continue;
    const converted = convertLedgerAmount(amount, record.ledger_rate);
    if (converted === null) continue;
    addRankingAmount(
      categoryRankingById,
      categoryId,
      getCategoryDisplayName(category, categoryById),
      String(converted),
      recordId,
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

      return compareDisplayText(a.name, b.name);
    });
}
