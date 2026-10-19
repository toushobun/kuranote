import type {
  AccountOptionDbRow,
  AppUserSummaryDbRow,
  CategorySummaryDbRow,
  TransactionItemDbRow,
  TransactionPaymentDbRow,
  TransactionRecordDbRow,
} from "internal/db-types";
import type {
  TransactionFilters,
  TransactionGroupBy,
} from "internal/transaction/entity/transactionGrouping";
import type { TransactionGroupPage } from "internal/transaction/entity/transactionReadModels";
import {
  fromTransactionSpecialStatusStorageValue,
  transactionSpecialStatusLabels,
  transactionSpecialStatusStorageValues,
  type TransactionSpecialStatusStorageValue,
} from "internal/transaction/entity/transactionSpecialStatus";
import type {
  TransactionAmountSummary,
  TransactionSharedPaymentSummary,
} from "internal/transaction/service/read/transactionReadModels";
import { groupByKey, paginateItems } from "utils/collections";

import { listRecordAccountMovements } from "./grouping/recordAccounts";
import {
  getSharedPaymentAmounts,
  resolveRecordLevelContribution,
  toSharedPaymentSummary,
} from "./grouping/recordContribution";
import {
  addSignedAmount,
  createSummary,
  getSignedTransactionItemAmount,
  normalizeSummary,
} from "./transactionAmountHelpers";
import { transactionFallbackLabels } from "./transactionFallbackLabels";
import {
  getTransactionTimeGroupInfo,
  isTransactionTimeGroupBy,
} from "./transactionListGroupTime";

export type BuildTransactionGroupSummaryPageParams = {
  accounts: AccountOptionDbRow[];
  categories: CategorySummaryDbRow[];
  currency: string;
  /** 已规范化的筛选条件（`normalizeTransactionFilters`）；`items` 已按它过滤。 */
  filters: TransactionFilters;
  groupBy: TransactionGroupBy;
  items: TransactionItemDbRow[];
  merchants: { id: string; name: string }[];
  offset: number;
  pageSize: number;
  payments: TransactionPaymentDbRow[];
  records: TransactionRecordDbRow[];
  recorders: AppUserSummaryDbRow[];
};

type MutableGroup = {
  id: string;
  key: string;
  label: string;
  latestTransactionAt: string;
  recordIds: Set<string>;
  sharedPaymentAccountShareAmount: number;
  sharedPaymentRecordIds: Set<string>;
  sharedPaymentRecordTotalAmount: number;
  summary: TransactionAmountSummary;
  itemCount: number;
};

type RecordGroupContext = {
  categoryById: Map<string, CategorySummaryDbRow>;
  filters: TransactionFilters;
  payments: TransactionPaymentDbRow[];
  record: TransactionRecordDbRow;
  recordItems: TransactionItemDbRow[];
};

export function buildTransactionGroupSummaryPage({
  accounts,
  categories,
  currency,
  filters,
  groupBy,
  items,
  merchants,
  offset,
  pageSize,
  payments,
  records,
  recorders,
}: BuildTransactionGroupSummaryPageParams): TransactionGroupPage {
  const itemsByRecordId = groupByKey(
    items,
    (item) => item.transaction_record_id,
  );
  const paymentsByRecordId = groupByKey(
    payments,
    (payment) => payment.transaction_record_id,
  );
  const accountById = new Map(accounts.map((account) => [account.id, account]));
  const categoryById = new Map(
    categories.map((category) => [category.id, category]),
  );
  const merchantById = new Map(
    merchants.map((merchant) => [merchant.id, merchant]),
  );
  const recorderById = new Map(
    recorders.map((recorder) => [recorder.id, recorder]),
  );
  const groups = new Map<string, MutableGroup>();

  for (const record of records) {
    const recordContext: RecordGroupContext = {
      categoryById,
      filters,
      payments: paymentsByRecordId.get(record.id) ?? [],
      record,
      recordItems: itemsByRecordId.get(record.id) ?? [],
    };

    if (isTransactionTimeGroupBy(groupBy)) {
      const timeGroup = getTransactionTimeGroupInfo(
        groupBy,
        record.transaction_at,
      );
      const group = getOrCreateGroup({
        currency,
        groupBy,
        groups,
        key: timeGroup.key,
        label: timeGroup.label,
        transactionAt: record.transaction_at,
      });
      addRecordToGroup(group, recordContext);
      continue;
    }

    if (groupBy === "merchant") {
      const group = getMerchantGroup({
        currency,
        groupBy,
        groups,
        merchantById,
        record,
      });
      addRecordToGroup(group, recordContext);
      continue;
    }

    if (groupBy === "member") {
      const group = getMemberGroup({
        currency,
        groupBy,
        groups,
        record,
        recorderById,
      });
      addRecordToGroup(group, recordContext);
      continue;
    }

    if (groupBy === "account") {
      addAccountGroups({
        accountById,
        currency,
        groupBy,
        groups,
        recordContext,
      });
      continue;
    }

    addItemGroups({ currency, groupBy, groups, recordContext });
  }

  const sortedGroups = [...groups.values()].sort((a, b) => {
    if (groupBy === "specialStatus") {
      return (
        transactionSpecialStatusStorageValues.indexOf(
          a.key as TransactionSpecialStatusStorageValue,
        ) -
        transactionSpecialStatusStorageValues.indexOf(
          b.key as TransactionSpecialStatusStorageValue,
        )
      );
    }
    if (a.latestTransactionAt !== b.latestTransactionAt) {
      return b.latestTransactionAt.localeCompare(a.latestTransactionAt);
    }

    return a.label.localeCompare(b.label, "zh-Hans-CN");
  });
  const groupPage = paginateItems(sortedGroups, offset, pageSize);

  return {
    groupBy,
    groups: groupPage.items.map((group) => ({
      id: group.id,
      key: group.key,
      label: group.label,
      ...withSharedPayment(
        toSharedPaymentSummary({
          accountShareAmount: group.sharedPaymentAccountShareAmount,
          filters,
          groupBy,
          recordCount: group.sharedPaymentRecordIds.size,
          recordTotalAmount: group.sharedPaymentRecordTotalAmount,
        }),
      ),
      summary: normalizeSummary(group.summary),
      transactionCount:
        groupBy === "specialStatus" ? group.itemCount : group.recordIds.size,
    })),
    nextOffset: groupPage.nextOffset,
  };
}

function getMerchantGroup({
  currency,
  groupBy,
  groups,
  merchantById,
  record,
}: {
  currency: string;
  groupBy: TransactionGroupBy;
  groups: Map<string, MutableGroup>;
  merchantById: Map<string, { id: string; name: string }>;
  record: TransactionRecordDbRow;
}) {
  return getOrCreateGroup({
    currency,
    groupBy,
    groups,
    key: record.merchant_id ?? "unknown",
    label: record.merchant_id
      ? (merchantById.get(record.merchant_id)?.name ??
        transactionFallbackLabels.merchant)
      : transactionFallbackLabels.merchant,
    transactionAt: record.transaction_at,
  });
}

function getMemberGroup({
  currency,
  groupBy,
  groups,
  record,
  recorderById,
}: {
  currency: string;
  groupBy: TransactionGroupBy;
  groups: Map<string, MutableGroup>;
  record: TransactionRecordDbRow;
  recorderById: Map<string, AppUserSummaryDbRow>;
}) {
  return getOrCreateGroup({
    currency,
    groupBy,
    groups,
    key: record.created_by ?? "unknown",
    label: record.created_by
      ? (recorderById.get(record.created_by)?.display_name ??
        transactionFallbackLabels.member)
      : transactionFallbackLabels.member,
    transactionAt: record.transaction_at,
  });
}

/**
 * 按账户分组取记录的实际收付（付款明细 / 转账明细的 balance_delta），
 * 有账户筛选时只计该账户；转账 / 余额调整计入笔数但不计入收支。
 */
function addAccountGroups({
  accountById,
  currency,
  groupBy,
  groups,
  recordContext,
}: {
  accountById: Map<string, AccountOptionDbRow>;
  currency: string;
  groupBy: TransactionGroupBy;
  groups: Map<string, MutableGroup>;
  recordContext: RecordGroupContext;
}) {
  const { filters, payments, record, recordItems } = recordContext;

  for (const movement of listRecordAccountMovements(
    record,
    recordItems,
    payments,
  )) {
    if (filters.accountId && movement.accountId !== filters.accountId) {
      continue;
    }

    const group = getOrCreateGroup({
      currency,
      groupBy,
      groups,
      key: movement.accountId,
      label:
        accountById.get(movement.accountId)?.name ??
        transactionFallbackLabels.account,
      transactionAt: record.transaction_at,
    });
    trackGroupRecord(group, recordContext);

    if (record.type === "normal") {
      addSignedAmount(group.summary, Number(movement.balanceDelta ?? 0));
    }
  }
}

function addItemGroups({
  currency,
  groupBy,
  groups,
  recordContext,
}: {
  currency: string;
  groupBy: TransactionGroupBy;
  groups: Map<string, MutableGroup>;
  recordContext: RecordGroupContext;
}) {
  const { categoryById, record, recordItems } = recordContext;

  for (const item of recordItems) {
    if (groupBy === "parentCategory") {
      const category = item.category_id
        ? categoryById.get(item.category_id)
        : undefined;
      const parent = category?.parent_id
        ? categoryById.get(category.parent_id)
        : category;
      const group = getOrCreateGroup({
        currency,
        groupBy,
        groups,
        key: parent?.id ?? "unknown",
        label: parent?.name ?? transactionFallbackLabels.parentCategory,
        transactionAt: record.transaction_at,
      });
      addItemToGroup(group, recordContext, item);
      continue;
    }

    if (groupBy === "category") {
      const category = item.category_id
        ? categoryById.get(item.category_id)
        : undefined;
      const group = getOrCreateGroup({
        currency,
        groupBy,
        groups,
        key: category?.id ?? "unknown",
        label: category?.name ?? transactionFallbackLabels.subcategory,
        transactionAt: record.transaction_at,
      });
      addItemToGroup(group, recordContext, item);
      continue;
    }

    if (groupBy === "specialStatus") {
      const key = item.special_status;
      if (!key) continue;
      const group = getOrCreateGroup({
        currency,
        groupBy,
        groups,
        key,
        label:
          transactionSpecialStatusLabels[
            fromTransactionSpecialStatusStorageValue(key)
          ],
        transactionAt: record.transaction_at,
      });
      addItemToGroup(group, recordContext, item);
    }
  }
}

function getOrCreateGroup({
  currency,
  groupBy,
  groups,
  key,
  label,
  transactionAt,
}: {
  currency: string;
  groupBy: TransactionGroupBy;
  groups: Map<string, MutableGroup>;
  key: string;
  label: string;
  transactionAt: string;
}) {
  const id = `${groupBy}:${key}`;
  const group = groups.get(id) ?? {
    id,
    itemCount: 0,
    key,
    label,
    latestTransactionAt: transactionAt,
    recordIds: new Set<string>(),
    sharedPaymentAccountShareAmount: 0,
    sharedPaymentRecordIds: new Set<string>(),
    sharedPaymentRecordTotalAmount: 0,
    summary: createSummary(currency),
  };

  if (transactionAt > group.latestTransactionAt) {
    group.latestTransactionAt = transactionAt;
  }

  groups.set(id, group);

  return group;
}

function addRecordToGroup(
  group: MutableGroup,
  recordContext: RecordGroupContext,
) {
  const { categoryById, filters, payments, record, recordItems } =
    recordContext;
  trackGroupRecord(group, recordContext);

  if (record.type !== "normal") return;

  addSignedAmount(
    group.summary,
    resolveRecordLevelContribution({
      categoryById,
      filters,
      matchedItems: recordItems,
      payments,
    }),
  );
}

function addItemToGroup(
  group: MutableGroup,
  recordContext: RecordGroupContext,
  item: TransactionItemDbRow,
) {
  const { categoryById, record } = recordContext;
  trackGroupRecord(group, recordContext);
  group.itemCount += 1;

  if (record.type !== "normal") return;

  const signedAmount = getSignedTransactionItemAmount(item, categoryById);
  addSignedAmount(group.summary, signedAmount);
}

/** 记录计入组：笔数，以及有账户筛选时的「共同支付」统计（一笔记录在一个组内只计一次）。 */
function trackGroupRecord(
  group: MutableGroup,
  recordContext: RecordGroupContext,
) {
  const { filters, payments, record } = recordContext;
  group.recordIds.add(record.id);

  if (group.sharedPaymentRecordIds.has(record.id)) return;

  const sharedAmounts = getSharedPaymentAmounts({
    accountId: filters.accountId,
    payments,
  });
  if (!sharedAmounts) return;

  group.sharedPaymentRecordIds.add(record.id);
  group.sharedPaymentAccountShareAmount += sharedAmounts.accountShareAmount;
  group.sharedPaymentRecordTotalAmount += sharedAmounts.recordTotalAmount;
}

function withSharedPayment(
  sharedPayment: TransactionSharedPaymentSummary | undefined,
) {
  return sharedPayment ? { sharedPayment } : {};
}
