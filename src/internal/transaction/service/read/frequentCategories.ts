import { RepositoryError } from "internal/shared/errors/appError";
import type {
  FrequentCategoryCount,
  TransactionFormRepository,
} from "internal/transaction/repository/transactionRepository";
import { getMonthBounds, normalizeMonth } from "utils/transactions";

const minimumHistoryItemCount = 20;
const frequentCategoryLimit = 5;

type LoadFrequentCategoryHistoryInput = {
  currentMonth?: string;
  ledgerId: string;
  transactionRepository: Pick<
    TransactionFormRepository,
    "loadFrequentCategoryCounts"
  >;
};

export async function loadFrequentCategoryHistory({
  currentMonth = normalizeMonth(),
  ledgerId,
  transactionRepository,
}: LoadFrequentCategoryHistoryInput): Promise<FrequentCategoryCount[] | null> {
  const { endIso, startIso } = getMonthBounds(currentMonth);

  try {
    const counts = await transactionRepository.loadFrequentCategoryCounts({
      dateEnd: endIso,
      dateStart: startIso,
      ledgerId,
      minimumItemCount: minimumHistoryItemCount,
    });
    return counts.length === 0 ? null : counts;
  } catch (error) {
    if (error instanceof RepositoryError) return null;
    throw error;
  }
}

export function selectFrequentCategoryIds(
  categoryCounts: FrequentCategoryCount[] | null,
  manualCategoryIds: string[],
): string[] {
  if (categoryCounts === null) {
    return manualCategoryIds.slice(0, frequentCategoryLimit);
  }

  const manualOrderById = new Map(
    manualCategoryIds.map((categoryId, index) => [categoryId, index]),
  );
  return categoryCounts
    .filter(({ categoryId }) => manualOrderById.has(categoryId))
    .sort((left, right) => {
      const countDifference = right.count - left.count;
      if (countDifference !== 0) return countDifference;

      const orderDifference =
        manualOrderById.get(left.categoryId)! -
        manualOrderById.get(right.categoryId)!;
      if (orderDifference !== 0) return orderDifference;

      return left.categoryId.localeCompare(right.categoryId);
    })
    .slice(0, frequentCategoryLimit)
    .map(({ categoryId }) => categoryId);
}
