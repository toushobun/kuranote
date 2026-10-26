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

import {
  listAccountHolderIds,
  type HolderIdsByAccountId,
} from "internal/transaction/util/grouping/accountScope";
import { listRecordAccountMovements } from "internal/transaction/util/grouping/recordAccounts";

export function recordMatchesGroup({
  categoryById,
  groupBy,
  groupKey,
  holderIdsByAccountId,
  items,
  payments,
  record,
}: {
  categoryById: Map<string, CategorySummaryDbRow>;
  groupBy: TransactionGroupBy;
  groupKey: string;
  holderIdsByAccountId: HolderIdsByAccountId;
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
  if (groupBy === "holder") {
    return listRecordAccountMovements(record, items, payments).some(
      (movement) =>
        listAccountHolderIds(movement.accountId, holderIdsByAccountId).includes(
          groupKey,
        ),
    );
  }

  return items.some((item) =>
    itemMatchesGroup({ categoryById, groupBy, groupKey, item }),
  );
}

const itemLevelGroupByValues = new Set<TransactionGroupBy>([
  "parentCategory",
  "category",
  "specialStatus",
]);

/** 明细级维度（大分类 / 小分类 / 特殊状态）：组按明细划分，一笔记录可以出现在多个组里。 */
export function isItemLevelGroupBy(groupBy: TransactionGroupBy) {
  return itemLevelGroupByValues.has(groupBy);
}

/** 明细是否属于明细级维度的某个组；其他维度不按明细划分，返回 false。 */
export function itemMatchesGroup({
  categoryById,
  groupBy,
  groupKey,
  item,
}: {
  categoryById: ReadonlyMap<
    string,
    Pick<CategorySummaryDbRow, "id" | "parent_id">
  >;
  groupBy: TransactionGroupBy;
  groupKey: string;
  item: Pick<TransactionItemDbRow, "category_id" | "special_status">;
}) {
  if (groupBy === "parentCategory") {
    return matchesParentCategory(item, categoryById, groupKey);
  }

  if (groupBy === "category") {
    const category = item.category_id
      ? categoryById.get(item.category_id)
      : undefined;
    return (category?.id ?? "unknown") === groupKey;
  }

  if (groupBy === "specialStatus") {
    return (item.special_status ?? "none") === groupKey;
  }

  return false;
}

export function matchesParentCategory(
  item: Pick<TransactionItemDbRow, "category_id">,
  categoryById: ReadonlyMap<
    string,
    Pick<CategorySummaryDbRow, "id" | "parent_id">
  >,
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
