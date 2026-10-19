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

type RecordPayment = Pick<
  TransactionPaymentDbRow,
  "account_id" | "amount" | "balance_delta"
>;

/**
 * 有账户筛选时，多账户记录（「共同支付」）的金额口径
 * （docs/design/issue-834-split-payment.md 2.1 / 2.4）：
 * - `accountShare`：记录级维度且没有其他明细级筛选，金额是该账户的付款份额；
 * - `matchedItems`：明细级维度分组或有其他明细级筛选（出现条件 1 / 2），金额是命中明细全额；
 * - `null`：没有账户筛选，或按账户分组（金额就是付款份额，不需要标识）。
 *
 * 列表行不传 `groupBy`：行金额只由筛选条件决定，不随分组维度变化。
 */
export type SharedPaymentAmountBasis = "accountShare" | "matchedItems";

const itemLevelGroupByValues = new Set<TransactionGroupBy>([
  "parentCategory",
  "category",
  "specialStatus",
]);

export function resolveSharedPaymentAmountBasis({
  filters,
  groupBy,
}: {
  filters: TransactionFilters;
  groupBy?: TransactionGroupBy;
}): SharedPaymentAmountBasis | null {
  if (!filters.accountId || groupBy === "account") return null;
  if (
    hasNonAccountItemFilters(filters) ||
    (groupBy !== undefined && itemLevelGroupByValues.has(groupBy))
  ) {
    return "matchedItems";
  }

  return "accountShare";
}

/**
 * 有账户筛选时，多账户记录中该账户的付款金额与整笔金额（付款明细 amount 合计）；
 * 没有账户筛选或单账户记录返回 null。组头与列表行共用。
 */
export function getSharedPaymentAmounts({
  accountId,
  payments,
}: {
  accountId: string | undefined;
  payments: RecordPayment[];
}): { accountShareAmount: number; recordTotalAmount: number } | null {
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
 * 记录在记录级维度（时间 / 商家 / 成员）和列表行中计入的有符号金额：
 * 满足「有账户筛选 ∧ 多账户记录 ∧ 没有其他明细级筛选」时取该账户的付款份额（balance_delta），
 * 否则取命中明细的业务净额合计。与 SQL 分组函数的份额行同口径，TS 端只在这里判断。
 */
export function resolveRecordLevelContribution({
  categoryById,
  filters,
  matchedItems,
  payments,
}: {
  categoryById: ReadonlyMap<string, Pick<CategorySummaryDbRow, "id" | "type">>;
  filters: TransactionFilters;
  matchedItems: Pick<
    TransactionItemDbRow,
    "amount" | "business_net_amount" | "category_id"
  >[];
  payments: RecordPayment[];
}) {
  if (
    payments.length >= 2 &&
    resolveSharedPaymentAmountBasis({ filters }) === "accountShare"
  ) {
    return sumPayments(
      payments.filter((payment) => payment.account_id === filters.accountId),
      "balance_delta",
    );
  }

  return calculateRecordNetAmount(matchedItems, categoryById);
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
