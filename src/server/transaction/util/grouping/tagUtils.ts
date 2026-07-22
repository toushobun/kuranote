import type { TransactionItemDbRow } from "server/db-types";

import type {
  RawTagAssignment,
  TransactionGroupLoaderContext,
} from "server/transaction/util/grouping/types";

export function groupItemsByRecordId(items: TransactionItemDbRow[]) {
  const itemsByRecordId = new Map<string, TransactionItemDbRow[]>();

  for (const item of items) {
    const recordItems = itemsByRecordId.get(item.transaction_record_id) ?? [];
    recordItems.push(item);
    itemsByRecordId.set(item.transaction_record_id, recordItems);
  }

  return itemsByRecordId;
}

export function groupRawTagsByRecordId(tagAssignments: RawTagAssignment[]) {
  const tagsByRecordId = new Map<string, RawTagAssignment[]>();

  for (const assignment of tagAssignments) {
    const tags = tagsByRecordId.get(assignment.transaction_record_id) ?? [];
    tags.push(assignment);
    tagsByRecordId.set(assignment.transaction_record_id, tags);
  }

  return tagsByRecordId;
}

export function buildGroupTagAssignments(
  context: TransactionGroupLoaderContext,
) {
  return context.tagAssignments.flatMap((assignment) => {
    const tagName = context.tagById.get(assignment.tag_id);

    if (!tagName) return [];

    return [
      {
        tagId: assignment.tag_id,
        tagName,
        transactionRecordId: assignment.transaction_record_id,
      },
    ];
  });
}
