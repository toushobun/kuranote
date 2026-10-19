import type {
  CategorySummaryDbRow,
  TransactionItemDbRow,
  TransactionPaymentDbRow,
  TransactionRecordDbRow,
} from "internal/db-types";
import type { TransactionGroupBy } from "internal/transaction/entity/transactionGrouping";
import {
  getTransactionTimeGroupInfo,
  isTransactionTimeGroupBy,
} from "internal/transaction/util/transactionListGroups";

import { listRecordAccountMovements } from "internal/transaction/util/grouping/recordAccounts";

export function recordMatchesGroup({
  categoryById,
  groupBy,
  groupKey,
  items,
  payments,
  record,
}: {
  categoryById: Map<string, CategorySummaryDbRow>;
  groupBy: TransactionGroupBy;
  groupKey: string;
  items: TransactionItemDbRow[];
  payments: TransactionPaymentDbRow[];
  record: TransactionRecordDbRow;
}) {
  if (isTransactionTimeGroupBy(groupBy)) {
    return (
      getTransactionTimeGroupInfo(groupBy, record.transaction_at).key ===
      groupKey
    );
  }

  if (groupBy === "merchant") {
    return (record.merchant_id ?? "unknown") === groupKey;
  }
  if (groupBy === "member") {
    return (record.created_by ?? "unknown") === groupKey;
  }

  if (groupBy === "account") {
    return listRecordAccountMovements(record, items, payments).some(
      (movement) => movement.accountId === groupKey,
    );
  }

  if (groupBy === "parentCategory") {
    return items.some((item) =>
      matchesParentCategory(item, categoryById, groupKey),
    );
  }

  if (groupBy === "category") {
    return items.some((item) => {
      const category = item.category_id
        ? categoryById.get(item.category_id)
        : undefined;
      return (category?.id ?? "unknown") === groupKey;
    });
  }

  if (groupBy === "specialStatus") {
    return items.some((item) => (item.special_status ?? "none") === groupKey);
  }

  return false;
}

export function matchesParentCategory(
  item: TransactionItemDbRow,
  categoryById: Map<string, CategorySummaryDbRow>,
  parentCategoryId: string | undefined,
) {
  if (!parentCategoryId) return false;

  const category = item.category_id
    ? categoryById.get(item.category_id)
    : undefined;
  const parent = category?.parent_id
    ? categoryById.get(category.parent_id)
    : category;

  return (parent?.id ?? "unknown") === parentCategoryId;
}
