import type {
  AccountOptionDbRow,
  AppUserSummaryDbRow,
  CategorySummaryDbRow,
  MerchantSummaryDbRow,
  TransactionConsumerDbRow,
  TransactionItemDbRow,
} from "internal/db-types";

import type { TransactionGroupLoaderContext } from "internal/transaction/util/grouping/types";

export type TransactionGroupContextLookups = {
  accountById: Map<string, AccountOptionDbRow>;
  categoryById: Map<string, CategorySummaryDbRow>;
  consumerById: Map<string, AppUserSummaryDbRow>;
  consumersByRecordId: Map<string, TransactionConsumerDbRow[]>;
  itemsByRecordId: Map<string, TransactionItemDbRow[]>;
  merchantById: Map<string, MerchantSummaryDbRow>;
  recorderById: Map<string, AppUserSummaryDbRow>;
};

const contextLookupsCache = new WeakMap<
  TransactionGroupLoaderContext,
  TransactionGroupContextLookups
>();

/**
 * 同一个 context 对象在一次请求内可能被多个筛选 / 分组 / 明细构建步骤复用，
 * 用 WeakMap 按 context 身份缓存派生的查找表，避免重复重建。
 */
export function getTransactionGroupContextLookups(
  context: TransactionGroupLoaderContext,
): TransactionGroupContextLookups {
  const cached = contextLookupsCache.get(context);
  if (cached) return cached;

  const lookups: TransactionGroupContextLookups = {
    accountById: new Map(
      context.accounts.map((account) => [account.id, account] as const),
    ),
    categoryById: new Map(
      context.categories.map((category) => [category.id, category] as const),
    ),
    consumerById: new Map(
      (context.consumerMembers ?? []).map((user) => [user.id, user] as const),
    ),
    consumersByRecordId: groupConsumersByRecordId(context.consumers ?? []),
    itemsByRecordId: groupItemsByRecordId(context.items),
    merchantById: new Map(
      context.merchants.map((merchant) => [merchant.id, merchant] as const),
    ),
    recorderById: new Map(
      context.recorders.map((user) => [user.id, user] as const),
    ),
  };

  contextLookupsCache.set(context, lookups);
  return lookups;
}

function groupConsumersByRecordId(consumers: TransactionConsumerDbRow[]) {
  const consumersByRecordId = new Map<string, TransactionConsumerDbRow[]>();

  for (const consumer of consumers) {
    const recordConsumers =
      consumersByRecordId.get(consumer.transaction_record_id) ?? [];
    recordConsumers.push(consumer);
    consumersByRecordId.set(consumer.transaction_record_id, recordConsumers);
  }

  return consumersByRecordId;
}

function groupItemsByRecordId(items: TransactionItemDbRow[]) {
  const itemsByRecordId = new Map<string, TransactionItemDbRow[]>();

  for (const item of items) {
    const recordItems = itemsByRecordId.get(item.transaction_record_id) ?? [];
    recordItems.push(item);
    itemsByRecordId.set(item.transaction_record_id, recordItems);
  }

  return itemsByRecordId;
}
