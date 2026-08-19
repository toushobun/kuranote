import { serverFallbackTimeZone } from "config/dateTime";
import type {
  CategorySummaryDbRow,
  TransactionItemDbRow,
  TransactionRecordDbRow,
} from "internal/db-types";
import type { TransactionFilters } from "internal/transaction/entity/transactionGrouping";
import {
  toTransactionSpecialStatusStorageValue,
  transactionSpecialStatuses,
} from "internal/transaction/entity/transactionSpecialStatus";
import { defaultTransactionFilters } from "internal/transaction/entity/transactionGrouping";
import { getTransactionRecordCategoryType } from "internal/transaction/util/transactionAmountHelpers";
import { calculateRemainingOffsetMinorUnits } from "internal/transaction/util/refundAllocation";
import {
  getDateKeyInTimeZone,
  isDateText as isDateKey,
} from "utils/transactions";

import { getTransactionGroupContextLookups } from "internal/transaction/util/grouping/contextLookups";
import { matchesParentCategory } from "internal/transaction/util/grouping/groupMatching";
import type { TransactionGroupLoaderContext } from "internal/transaction/util/grouping/types";

export function filterTransactionRecords(
  context: TransactionGroupLoaderContext,
  filters: TransactionFilters,
) {
  const normalizedFilters = normalizeTransactionFilters(filters);
  const lookups = getTransactionGroupContextLookups(context);
  const { categoryById, itemsByRecordId } = lookups;

  return context.records.filter((record) => {
    const recordItems = itemsByRecordId.get(record.id) ?? [];
    const matchingItems = filterItems(
      recordItems,
      categoryById,
      normalizedFilters,
    );

    if (!matchesDateRange(record, normalizedFilters)) return false;
    if (
      !matchesRecordType(record, recordItems, categoryById, normalizedFilters)
    ) {
      return false;
    }
    if (
      normalizedFilters.merchantId &&
      record.merchant_id !== normalizedFilters.merchantId
    ) {
      return false;
    }
    if (
      normalizedFilters.memberId &&
      record.created_by !== normalizedFilters.memberId
    ) {
      return false;
    }
    if (hasItemFilters(normalizedFilters) && matchingItems.length === 0) {
      return false;
    }

    return true;
  });
}

export function filterTransactionItems(
  context: TransactionGroupLoaderContext,
  filters: TransactionFilters,
) {
  const normalizedFilters = normalizeTransactionFilters(filters);
  const { categoryById } = getTransactionGroupContextLookups(context);
  return filterItems(context.items, categoryById, normalizedFilters);
}

export function normalizeTransactionFilters(
  filters: TransactionFilters,
): TransactionFilters {
  return {
    ...defaultTransactionFilters,
    ...filters,
    accountId: normalizeOptionalValue(filters.accountId),
    categoryId: normalizeOptionalValue(filters.categoryId),
    dateFrom: normalizeOptionalValue(filters.dateFrom),
    dateTo: normalizeOptionalValue(filters.dateTo),
    memberId: normalizeOptionalValue(filters.memberId),
    merchantId: normalizeOptionalValue(filters.merchantId),
    parentCategoryId: normalizeOptionalValue(filters.parentCategoryId),
    specialStatuses: normalizeSpecialStatuses(filters.specialStatuses),
  };
}

function normalizeSpecialStatuses(
  values: TransactionFilters["specialStatuses"],
) {
  const validValues = new Set<string>(transactionSpecialStatuses);
  return [...new Set(values ?? [])].filter((value) => validValues.has(value));
}

function hasItemFilters(filters: TransactionFilters) {
  return Boolean(
    filters.accountId ||
    filters.parentCategoryId ||
    filters.categoryId ||
    filters.specialStatuses?.length ||
    filters.recordType === "refundableExpense",
  );
}

function filterItems(
  items: TransactionItemDbRow[],
  categoryById: Map<string, CategorySummaryDbRow>,
  filters: TransactionFilters,
) {
  if (!hasItemFilters(filters)) return items;

  return items.filter((item) => {
    if (filters.recordType === "refundableExpense") {
      const categoryType = item.category_id
        ? categoryById.get(item.category_id)?.type
        : undefined;
      if (categoryType !== "expense" || !hasRemainingOffsetAmount(item)) {
        return false;
      }
    }
    if (filters.accountId && item.account_id !== filters.accountId)
      return false;
    if (
      filters.parentCategoryId &&
      !matchesParentCategory(item, categoryById, filters.parentCategoryId)
    ) {
      return false;
    }
    if (filters.categoryId && item.category_id !== filters.categoryId) {
      return false;
    }
    if (filters.specialStatuses?.length) {
      const itemStatus = item.special_status;
      if (
        !filters.specialStatuses.some(
          (status) =>
            toTransactionSpecialStatusStorageValue(status) === itemStatus,
        )
      ) {
        return false;
      }
    }
    return true;
  });
}

export function normalizeOptionalValue(value: string | undefined) {
  const normalized = value?.trim();
  return normalized ? normalized : undefined;
}

function matchesDateRange(
  record: TransactionRecordDbRow,
  filters: TransactionFilters,
) {
  const dateKey = getDateKeyInTimeZone(
    record.transaction_at,
    serverFallbackTimeZone,
  );

  if (
    filters.dateFrom &&
    isDateKey(filters.dateFrom) &&
    dateKey < filters.dateFrom
  ) {
    return false;
  }
  if (filters.dateTo && isDateKey(filters.dateTo) && dateKey > filters.dateTo) {
    return false;
  }

  return true;
}

function matchesRecordType(
  record: TransactionRecordDbRow,
  items: TransactionItemDbRow[],
  categoryById: Map<string, CategorySummaryDbRow>,
  filters: TransactionFilters,
) {
  if (filters.recordType === "all") return true;
  if (filters.recordType === "transfer") return record.type === "transfer";
  if (record.type !== "normal") return false;
  if (filters.recordType === "refundableExpense") {
    return items.some((item) => {
      const categoryType = item.category_id
        ? categoryById.get(item.category_id)?.type
        : undefined;
      return categoryType === "expense" && hasRemainingOffsetAmount(item);
    });
  }

  return (
    getTransactionRecordCategoryType(items, categoryById) === filters.recordType
  );
}

function hasRemainingOffsetAmount(item: TransactionItemDbRow) {
  const remainingUnits = calculateRemainingOffsetMinorUnits(
    item.amount,
    item.refunded_amount ?? "0",
    item.reimbursement_amount ?? "0",
  );
  return remainingUnits !== null && remainingUnits > BigInt(0);
}
