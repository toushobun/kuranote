import type {
  CategorySummaryDbRow,
  TransactionItemDbRow,
  TransactionPaymentDbRow,
} from "internal/db-types";
import type {
  TransactionFilters,
  TransactionGroupBy,
} from "internal/transaction/entity/transactionGrouping";
import type { TransactionSharedPaymentSummary } from "internal/transaction/service/read/transactionReadModels";
import { calculateRecordNetAmount } from "internal/transaction/util/transactionAmountHelpers";

import { hasNonAccountItemFilters } from "internal/transaction/util/grouping/filters";
import {
  isItemLevelGroupBy,
  itemMatchesGroup,
} from "internal/transaction/util/grouping/groupMatching";

type RecordPayment = Pick<
  TransactionPaymentDbRow,
  "account_id" | "amount" | "balance_delta"
>;

type ContributionItem = Pick<
  TransactionItemDbRow,
  "amount" | "business_net_amount" | "category_id" | "special_status"
>;

type ContributionCategoryById = ReadonlyMap<
  string,
  Pick<CategorySummaryDbRow, "id" | "parent_id" | "type">
>;

/** 列表行所在的分组。组头、搜索结果、仪表盘等不按组展开的列表不传。 */
export type TransactionListGroupContext = {
  groupBy: TransactionGroupBy;
  groupKey: string;
};

/**
 * 多账户记录（「共同支付」）的金额口径（docs/design/issue-834-split-payment.md 2.1 / 2.4）：
 * - `accountShare`：按账户分组（有无筛选都一样），或有账户筛选的记录级维度且没有其他明细级筛选，
 *   金额是该账户的付款份额；
 * - `matchedItems`：有账户筛选 + 明细级维度分组或其他明细级筛选（出现条件 1 / 2），金额是命中明细全额；
 * - `null`：没有账户筛选，也不按账户分组。
 */
export type SharedPaymentAmountBasis = "accountShare" | "matchedItems";

export function resolveSharedPaymentAmountBasis({
  filters,
  groupBy,
}: {
  filters: TransactionFilters;
  groupBy?: TransactionGroupBy;
}): SharedPaymentAmountBasis | null {
  if (groupBy === "account") return "accountShare";
  if (!filters.accountId) return null;
  if (
    hasNonAccountItemFilters(filters) ||
    (groupBy !== undefined && isItemLevelGroupBy(groupBy))
  ) {
    return "matchedItems";
  }

  return "accountShare";
}

/** 份额与「本账户」指向的账户：按账户分组时是所在组的账户，否则是筛选的账户。 */
function resolveSharedPaymentAccountId({
  filters,
  group,
}: {
  filters: TransactionFilters;
  group?: TransactionListGroupContext;
}) {
  return group?.groupBy === "account" ? group.groupKey : filters.accountId;
}

/**
 * 多账户记录中该账户的付款金额与整笔金额（付款明细 amount 合计）；
 * 没有对应账户（无账户筛选且不按账户分组）或单账户记录返回 null。组头与列表行共用。
 */
export function getSharedPaymentAmounts({
  filters,
  group,
  payments,
}: {
  filters: TransactionFilters;
  group?: TransactionListGroupContext;
  payments: RecordPayment[];
}): { accountShareAmount: number; recordTotalAmount: number } | null {
  const accountId = resolveSharedPaymentAccountId({ filters, group });
  if (!accountId || payments.length < 2) return null;

  return {
    accountShareAmount: sumPayments(
      payments.filter((payment) => payment.account_id === accountId),
      "amount",
    ),
    recordTotalAmount: sumPayments(payments, "amount"),
  };
}

/**
 * 计入金额的明细：多账户记录在出现条件 1（有账户筛选 + 明细级维度分组）下，列表行只计命中所在组的明细，
 * 与组合计一致；其他情况为命中筛选的全部明细（单账户记录保持现状）。
 */
export function resolveContributionItems<TItem extends ContributionItem>({
  categoryById,
  filters,
  group,
  matchedItems,
  payments,
}: {
  categoryById: ContributionCategoryById;
  filters: TransactionFilters;
  group?: TransactionListGroupContext;
  matchedItems: TItem[];
  payments: RecordPayment[];
}): TItem[] {
  if (
    !group ||
    payments.length < 2 ||
    !isItemLevelGroupBy(group.groupBy) ||
    resolveSharedPaymentAmountBasis({ filters, groupBy: group.groupBy }) !==
      "matchedItems"
  ) {
    return matchedItems;
  }

  return matchedItems.filter((item) =>
    itemMatchesGroup({
      categoryById,
      groupBy: group.groupBy,
      groupKey: group.groupKey,
      item,
    }),
  );
}

/**
 * 记录计入的有符号金额：用于记录级维度（时间 / 商家 / 成员）的组合计，以及列表行的主金额。
 * 多账户记录的口径为 `accountShare` 时取该账户的付款份额（balance_delta），
 * 否则取计入明细（`resolveContributionItems`）的业务净额合计。
 * 与 SQL 分组函数的份额行同口径；列表行传入所在分组后与组合计一致。
 */
export function resolveRecordLevelContribution({
  categoryById,
  filters,
  group,
  matchedItems,
  payments,
}: {
  categoryById: ContributionCategoryById;
  filters: TransactionFilters;
  group?: TransactionListGroupContext;
  matchedItems: ContributionItem[];
  payments: RecordPayment[];
}) {
  if (
    payments.length >= 2 &&
    resolveSharedPaymentAmountBasis({ filters, groupBy: group?.groupBy }) ===
      "accountShare"
  ) {
    const accountId = resolveSharedPaymentAccountId({ filters, group });
    return sumPayments(
      payments.filter((payment) => payment.account_id === accountId),
      "balance_delta",
    );
  }

  return calculateRecordNetAmount(
    resolveContributionItems({
      categoryById,
      filters,
      group,
      matchedItems,
      payments,
    }),
    categoryById,
  );
}

/**
 * 组头的「共同支付」提示：只在组合计含命中明细全额（出现条件 1 / 2）且组内有多账户记录时给出。
 */
export function toSharedPaymentSummary({
  accountShareAmount,
  filters,
  groupBy,
  recordCount,
  recordTotalAmount,
}: {
  accountShareAmount: number;
  filters: TransactionFilters;
  groupBy: TransactionGroupBy;
  recordCount: number;
  recordTotalAmount: number;
}): TransactionSharedPaymentSummary | undefined {
  if (
    recordCount <= 0 ||
    resolveSharedPaymentAmountBasis({ filters, groupBy }) !== "matchedItems"
  ) {
    return undefined;
  }

  return {
    accountShareAmount: String(accountShareAmount),
    recordCount,
    recordTotalAmount: String(recordTotalAmount),
  };
}

function sumPayments(
  payments: RecordPayment[],
  field: "amount" | "balance_delta",
) {
  return payments.reduce((sum, payment) => {
    const value = Number(payment[field]);
    return Number.isFinite(value) ? sum + value : sum;
  }, 0);
}
