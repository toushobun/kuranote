import {
  unassignedAccountHolderId,
  type TransactionFilters,
  type TransactionGroupBy,
} from "internal/transaction/entity/transactionGrouping";

import type { TransactionListGroupContext } from "internal/transaction/util/grouping/recordContribution";

/** 账户 ID → 持有人 ID（成员 user_id 或占位 ID）；无持有人的账户不在其中。 */
export type HolderIdsByAccountId = ReadonlyMap<string, readonly string[]>;

/**
 * 账户的持有人；无持有人的账户归入「未指定持有人」。
 * 与数据库分组函数的 account_holders 同口径。
 */
export function listAccountHolderIds(
  accountId: string,
  holderIdsByAccountId: HolderIdsByAccountId,
): readonly string[] {
  const holderIds = holderIdsByAccountId.get(accountId);
  return holderIds?.length ? holderIds : [unassignedAccountHolderId];
}

/** 有账户筛选或持有人筛选（账户集合筛选）。 */
export function hasAccountScopeFilters(filters: TransactionFilters) {
  return Boolean(filters.accountId || filters.holderId);
}

/**
 * 账户集合（#909）：账户筛选、持有人筛选与所在分组（按账户 / 按持有人）的交集；
 * 没有任何账户条件时返回 null。与数据库分组函数的 scope_accounts 同口径。
 * 按单个账户筛选是集合只有一个账户的特例（#914 方案 D）。
 */
export function resolveAccountScope({
  filters,
  group,
  holderIdsByAccountId,
}: {
  filters: TransactionFilters;
  group?: TransactionListGroupContext;
  holderIdsByAccountId: HolderIdsByAccountId;
}): ((accountId: string) => boolean) | null {
  const conditions: ((accountId: string) => boolean)[] = [];
  const hasHolder = (accountId: string, holderId: string) =>
    listAccountHolderIds(accountId, holderIdsByAccountId).includes(holderId);

  const { accountId: filterAccountId, holderId: filterHolderId } = filters;
  if (filterAccountId) {
    conditions.push((accountId) => accountId === filterAccountId);
  }
  if (filterHolderId) {
    conditions.push((accountId) => hasHolder(accountId, filterHolderId));
  }
  if (group?.groupBy === "account") {
    conditions.push((accountId) => accountId === group.groupKey);
  }
  if (group?.groupBy === "holder") {
    conditions.push((accountId) => hasHolder(accountId, group.groupKey));
  }

  if (conditions.length === 0) return null;
  return (accountId) => conditions.every((condition) => condition(accountId));
}

/**
 * 持有人维度（持有人筛选或按持有人分组）：普通记录一律取账户集合的实际收付，
 * 退款 / 报销收入按实际进入的账户计入，不用业务净额（#909 口径 1）。
 */
export function usesHolderDimension({
  filters,
  groupBy,
}: {
  filters: TransactionFilters;
  groupBy?: TransactionGroupBy;
}) {
  return Boolean(filters.holderId) || groupBy === "holder";
}
