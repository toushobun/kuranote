import type { TransactionFormRepository } from "internal/transaction/repository/transactionRepository";
import {
  formatDateKey,
  getMonthBounds,
  normalizeMonth,
} from "utils/transactions";

const minimumHistoryItemCount = 20;
const frequentCategoryLimit = 5;

type LoadFrequentCategoryHistoryInput = {
  currentMonth?: string;
  ledgerId: string;
  transactionRepository: Pick<
    TransactionFormRepository,
    | "findLatestActiveNormalTransactionAtBefore"
    | "listActiveNormalCategoryIdsByMonth"
  >;
};

export async function loadFrequentCategoryHistory({
  currentMonth = normalizeMonth(),
  ledgerId,
  transactionRepository,
}: LoadFrequentCategoryHistoryInput): Promise<string[] | null> {
  const categoryIds: string[] = [];
  let month = currentMonth;

  while (true) {
    const { endIso, startIso } = getMonthBounds(month);
    categoryIds.push(
      ...(await transactionRepository.listActiveNormalCategoryIdsByMonth({
        dateEnd: endIso,
        dateStart: startIso,
        ledgerId,
      })),
    );

    if (categoryIds.length >= minimumHistoryItemCount) return categoryIds;

    const previousTransactionAt =
      await transactionRepository.findLatestActiveNormalTransactionAtBefore(
        ledgerId,
        startIso,
      );
    if (!previousTransactionAt) return null;

    month = formatDateKey(previousTransactionAt).slice(0, 7);
  }
}

export function selectFrequentCategoryIds(
  historyCategoryIds: string[] | null,
  manualCategoryIds: string[],
): string[] {
  if (historyCategoryIds === null) {
    return manualCategoryIds.slice(0, frequentCategoryLimit);
  }

  const manualOrderById = new Map(
    manualCategoryIds.map((categoryId, index) => [categoryId, index]),
  );
  const countsById = new Map<string, number>();

  for (const categoryId of historyCategoryIds) {
    if (!manualOrderById.has(categoryId)) continue;
    countsById.set(categoryId, (countsById.get(categoryId) ?? 0) + 1);
  }

  return [...countsById.entries()]
    .sort(([leftId, leftCount], [rightId, rightCount]) => {
      const countDifference = rightCount - leftCount;
      if (countDifference !== 0) return countDifference;

      const orderDifference =
        (manualOrderById.get(leftId) ?? Number.MAX_SAFE_INTEGER) -
        (manualOrderById.get(rightId) ?? Number.MAX_SAFE_INTEGER);
      if (orderDifference !== 0) return orderDifference;

      return leftId.localeCompare(rightId);
    })
    .slice(0, frequentCategoryLimit)
    .map(([categoryId]) => categoryId);
}
