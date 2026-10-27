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

import {
  hasAccountScopeFilters,
  resolveAccountScope,
  usesHolderDimension,
  type HolderIdsByAccountId,
} from "internal/transaction/util/grouping/accountScope";
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
 * - `accountShare`：按账户 / 持有人分组（有无筛选都一样），或有账户集合筛选（账户 / 持有人）的
 *   记录级维度且没有其他明细级筛选，金额是账户集合的付款份额；
 * - `matchedItems`：有账户集合筛选 + 明细级维度分组或其他明细级筛选（出现条件 1 / 2），金额是命中明细全额；
 * - `null`：没有账户集合筛选，也不按账户 / 持有人分组。
 */
export type SharedPaymentAmountBasis = "accountShare" | "matchedItems";

export function resolveSharedPaymentAmountBasis({
  filters,
  groupBy,
}: {
  filters: TransactionFilters;
  groupBy?: TransactionGroupBy;
}): SharedPaymentAmountBasis | null {
  if (groupBy === "account" || groupBy === "holder") return "accountShare";
  if (!hasAccountScopeFilters(filters)) return null;
  if (
    hasNonAccountItemFilters(filters) ||
    (groupBy !== undefined && isItemLevelGroupBy(groupBy))
  ) {
    return "matchedItems";
  }

  return "accountShare";
}

type RecordPaymentScopeInput = {
  filters: TransactionFilters;
  group?: TransactionListGroupContext;
  holderIdsByAccountId: HolderIdsByAccountId;
  payments: RecordPayment[];
};

/** 账户集合内的付款明细；没有账户集合（无账户 / 持有人筛选且不按账户 / 持有人分组）时返回 null。 */
function listScopePayments({
  filters,
  group,
  holderIdsByAccountId,
  payments,
}: RecordPaymentScopeInput) {
  const scope = resolveAccountScope({ filters, group, holderIdsByAccountId });
  return scope ? payments.filter((payment) => scope(payment.account_id)) : null;
}

/**
 * 「共同支付」记录的整笔金额（付款明细 amount 合计）：付款账户一部分在集合内、
 * 一部分在集合外时才算共同支付；付款账户全在集合内（例如同一持有人的两个账户）时份额 = 整笔，返回 null。
 * 没有账户集合时也返回 null。组头与列表行共用。
 */
export function getSharedPaymentAmounts(
  input: RecordPaymentScopeInput,
): { recordTotalAmount: number } | null {
  const scopePayments = listScopePayments(input);
  if (
    !scopePayments ||
    scopePayments.length === 0 ||
    scopePayments.length === input.payments.length
  ) {
    return null;
  }

  return {
    recordTotalAmount: sumPayments(input.payments, "amount"),
  };
}

/**
 * 记录金额的来源：
 * - `movement`：账户集合的实际收付（balance_delta）。口径为 `accountShare` 时的共同支付记录，
 *   以及持有人维度下的所有普通记录（#909 口径 1）；
 * - `items`：计入明细（`resolveContributionItems`）的业务净额。
 */
export function resolveRecordAmountSource(
  input: RecordPaymentScopeInput,
): "movement" | "items" {
  const { filters, group } = input;
  if (
    resolveSharedPaymentAmountBasis({ filters, groupBy: group?.groupBy }) ===
      "accountShare" &&
    (getSharedPaymentAmounts(input) !== null ||
      usesHolderDimension({ filters, groupBy: group?.groupBy }))
  ) {
    return "movement";
  }

  return "items";
}

/**
 * 计入金额的明细：共同支付记录在出现条件 1（有账户集合筛选 + 明细级维度分组）下，列表行只计命中所在组的明细，
 * 与组合计一致；其他情况为命中筛选的全部明细（非共同支付记录保持现状）。
 */
export function resolveContributionItems<TItem extends ContributionItem>({
  categoryById,
  filters,
  group,
  holderIdsByAccountId,
  matchedItems,
  payments,
}: RecordPaymentScopeInput & {
  categoryById: ContributionCategoryById;
  matchedItems: TItem[];
}): TItem[] {
  if (
    !group ||
    !isItemLevelGroupBy(group.groupBy) ||
    resolveSharedPaymentAmountBasis({ filters, groupBy: group.groupBy }) !==
      "matchedItems" ||
    !getSharedPaymentAmounts({ filters, group, holderIdsByAccountId, payments })
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
 * 金额来源（`resolveRecordAmountSource`）为 `movement` 时取账户集合的实际收付（balance_delta）合计，
 * 否则取计入明细（`resolveContributionItems`）的业务净额合计。
 * 与 SQL 分组函数的份额行同口径；列表行传入所在分组后与组合计一致。
 */
export function resolveRecordLevelContribution({
  categoryById,
  matchedItems,
  ...input
}: RecordPaymentScopeInput & {
  categoryById: ContributionCategoryById;
  matchedItems: ContributionItem[];
}) {
  if (resolveRecordAmountSource(input) === "movement") {
    return sumPayments(listScopePayments(input) ?? [], "balance_delta");
  }

  return calculateRecordNetAmount(
    resolveContributionItems({ ...input, categoryById, matchedItems }),
    categoryById,
  );
}

/**
 * 组头的「共同支付」提示：只在组合计含命中明细全额（出现条件 1 / 2）且组内有多账户记录时给出。
 */
export function toSharedPaymentSummary({
  filters,
  groupBy,
  recordCount,
  recordTotalAmount,
}: {
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
