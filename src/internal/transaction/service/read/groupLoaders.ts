import type { CurrentLedger } from "internal/ledger";
import type { TransactionRecordDbRow } from "internal/db-types";
import type { TransactionGroupRepository } from "internal/transaction/repository/transactionRepository";
import {
  buildTransactionGroupSummaryPage,
  isTransactionTimeGroupBy,
} from "internal/transaction/util/transactionListGroups";
import {
  getTransactionTimeGroupInfo,
  type TransactionTimeGroupBy,
} from "internal/transaction/util/transactionListGroupTime";
import type {
  TransactionFilters,
  TransactionGroupBy,
  TransactionGroupPage,
  TransactionMonthPage,
  TransactionTimeGroupViewData,
} from "types/transactions";
import { defaultTransactionFilters } from "types/transactions";
import {
  getMonthBounds,
  groupTransactionItemsByDate,
  isDateText as isDateKey,
} from "utils/transactions";

import {
  buildTransactionListItemsFromContext,
  loadTransactionGroupLoaderContextForRecords,
  type TransactionReadDependencies,
} from "internal/transaction/service/read/transactionContext";
import { getTransactionGroupContextLookups } from "internal/transaction/util/grouping/contextLookups";
import {
  filterTransactionRecords,
  normalizeTransactionFilters,
} from "internal/transaction/util/grouping/filters";
import { recordMatchesGroup } from "internal/transaction/util/grouping/groupMatching";
import {
  transactionPageSize,
  type TransactionGroupLoaderContext,
} from "internal/transaction/util/grouping/types";

const transactionRecordScanPageSize = 100;
const nonTimeTransactionGroupByValues = new Set<string>([
  "merchant",
  "account",
  "parentCategory",
  "category",
  "member",
]);

const transactionGroupSummaryRpcPageSize = transactionPageSize + 1;

export async function loadStep4TransactionGroupView(
  dependencies: TransactionReadDependencies<TransactionGroupRepository>,
  currentLedger: CurrentLedger,
  groupBy: TransactionGroupBy = "month",
  filters: TransactionFilters = defaultTransactionFilters,
): Promise<TransactionTimeGroupViewData> {
  const groupPage = await loadStep4TransactionGroupPage(
    dependencies,
    currentLedger,
    groupBy,
    0,
    filters,
  );
  const initialGroup = groupPage.groups[0] ?? null;
  const shouldExpandInitialGroup = isTransactionTimeGroupBy(groupBy);
  const initialPage =
    shouldExpandInitialGroup && initialGroup
      ? await loadStep4TransactionGroupItemsPage(
          dependencies,
          currentLedger,
          groupBy,
          initialGroup.key,
          0,
          filters,
        )
      : null;

  return {
    groupBy,
    groups: groupPage.groups,
    initialDateGroupsByGroupId:
      initialGroup && initialPage
        ? { [initialGroup.id]: initialPage.groups }
        : {},
    initialExpandedGroupId:
      shouldExpandInitialGroup && initialGroup ? initialGroup.id : null,
    initialNextItemOffsetByGroupId:
      initialGroup && initialPage
        ? { [initialGroup.id]: initialPage.nextOffset }
        : {},
    nextOffset: groupPage.nextOffset,
  };
}

export async function loadStep4TransactionGroupPage(
  dependencies: TransactionReadDependencies<TransactionGroupRepository>,
  currentLedger: CurrentLedger,
  groupBy: TransactionGroupBy,
  offset: number,
  filters: TransactionFilters = defaultTransactionFilters,
): Promise<TransactionGroupPage> {
  // 时间维度分组的分组边界与记录扫描顺序（按 transaction_at 倒序）严格单调，
  // 可以增量分批扫描、只在拿到足够多"已闭合"分组后停止。
  if (isTransactionTimeGroupBy(groupBy)) {
    return loadStep4TimeGroupedTransactionGroupPage(
      dependencies,
      currentLedger,
      groupBy,
      offset,
      filters,
    );
  }

  // 非时间维度分组的记录会分散在整个 ledger 历史中，必须由 SQL/RPC 聚合完整分组，
  // 避免在 loader 中拉取全部交易记录与明细后再做内存聚合。
  return loadStep4NonTimeGroupedTransactionGroupPage(
    dependencies,
    currentLedger,
    groupBy,
    offset,
    filters,
  );
}

async function loadStep4NonTimeGroupedTransactionGroupPage(
  dependencies: TransactionReadDependencies<TransactionGroupRepository>,
  currentLedger: CurrentLedger,
  groupBy: TransactionGroupBy,
  offset: number,
  filters: TransactionFilters,
): Promise<TransactionGroupPage> {
  if (!nonTimeTransactionGroupByValues.has(groupBy)) {
    throw new Error(`Unsupported transaction group: ${groupBy}`);
  }

  const normalizedFilters = normalizeTransactionFilters(filters);
  const dateBounds = getFilterDateBounds(normalizedFilters);
  const safeOffset = Math.max(0, offset);

  if (dateBounds?.isEmpty) {
    return { groupBy, groups: [], nextOffset: null };
  }

  const pageRows = await dependencies.transactionRepository.loadGroupSummaries({
    accountId: normalizedFilters.accountId,
    categoryId: normalizedFilters.categoryId,
    dateEnd: dateBounds?.endIso,
    dateStart: dateBounds?.startIso,
    groupBy,
    ledgerId: currentLedger.id,
    limit: transactionGroupSummaryRpcPageSize,
    memberId: normalizedFilters.memberId,
    merchantId: normalizedFilters.merchantId,
    offset: safeOffset,
    parentCategoryId: normalizedFilters.parentCategoryId,
    recordType: normalizedFilters.recordType,
  });
  const groups = pageRows.slice(0, transactionPageSize).map((row) => ({
    id: row.group_id,
    key: row.group_key,
    label: row.group_label,
    summary: {
      balance: normalizeRpcAmount(row.balance),
      currency: currentLedger.baseCurrency,
      expense: normalizeRpcAmount(row.expense),
      income: normalizeRpcAmount(row.income),
    },
    transactionCount: Number(row.transaction_count ?? 0),
  }));

  return {
    groupBy,
    groups,
    nextOffset:
      pageRows.length > transactionPageSize
        ? safeOffset + transactionPageSize
        : null,
  };
}

async function loadStep4TimeGroupedTransactionGroupPage(
  dependencies: TransactionReadDependencies<TransactionGroupRepository>,
  currentLedger: CurrentLedger,
  groupBy: TransactionTimeGroupBy,
  offset: number,
  filters: TransactionFilters,
): Promise<TransactionGroupPage> {
  const safeOffset = Math.max(0, offset);
  const targetGroupCount = safeOffset + transactionPageSize + 1;
  const dateBounds = getFilterDateBounds(filters);

  if (dateBounds?.isEmpty) {
    return { groupBy, groups: [], nextOffset: null };
  }

  const scannedRecords: TransactionRecordDbRow[] = [];
  let scanOffset = 0;
  let filteredGroupKeyCount = 0;
  let context = await loadTransactionGroupLoaderContextForRecords(
    dependencies,
    currentLedger,
    scannedRecords,
  );

  while (filteredGroupKeyCount < targetGroupCount) {
    const candidateRecords =
      await dependencies.transactionRepository.listRecords({
        dateEnd: dateBounds?.endIso,
        dateStart: dateBounds?.startIso,
        ledgerId: currentLedger.id,
        limit: transactionRecordScanPageSize,
        memberId: filters.memberId,
        merchantId: filters.merchantId,
        offset: scanOffset,
        recordType: filters.recordType,
      });
    if (candidateRecords.length === 0) break;

    scannedRecords.push(...candidateRecords);
    scanOffset += candidateRecords.length;

    context = await loadTransactionGroupLoaderContextForRecords(
      dependencies,
      currentLedger,
      scannedRecords,
    );
    const filteredRecords = filterTransactionRecords(context, filters);
    const filteredGroupKeys = new Set(
      filteredRecords.map(
        (record) =>
          getTransactionTimeGroupInfo(groupBy, record.transaction_at).key,
      ),
    );
    filteredGroupKeyCount = filteredGroupKeys.size;

    if (candidateRecords.length < transactionRecordScanPageSize) break;
  }

  return buildStep4TransactionGroupPageFromContext(
    context,
    groupBy,
    offset,
    filters,
  );
}

export async function loadStep4TransactionGroupItems(
  dependencies: TransactionReadDependencies<TransactionGroupRepository>,
  currentLedger: CurrentLedger,
  groupBy: TransactionGroupBy,
  groupKey: string,
  offset: number,
  filters: TransactionFilters = defaultTransactionFilters,
): Promise<TransactionMonthPage> {
  return loadStep4TransactionGroupItemsPage(
    dependencies,
    currentLedger,
    groupBy,
    groupKey,
    offset,
    filters,
  );
}

function buildStep4TransactionGroupPageFromContext(
  context: TransactionGroupLoaderContext,
  groupBy: TransactionGroupBy,
  offset: number,
  filters: TransactionFilters,
): TransactionGroupPage {
  const filteredRecords = filterTransactionRecords(context, filters);
  const filteredRecordIds = new Set(filteredRecords.map((record) => record.id));
  const filteredItems = context.items.filter((item) =>
    filteredRecordIds.has(item.transaction_record_id),
  );

  return buildTransactionGroupSummaryPage({
    accounts: context.accounts,
    categories: context.categories,
    currency: context.currentLedger.baseCurrency,
    groupBy,
    items: filteredItems,
    merchants: context.merchants,
    offset,
    pageSize: transactionPageSize,
    records: filteredRecords,
    recorders: context.recorders,
  });
}

function normalizeRpcAmount(value: number | string | null | undefined) {
  const amount = Number(value ?? 0);

  return Number.isFinite(amount) ? String(amount) : "0";
}

async function loadStep4TransactionGroupItemsPage(
  dependencies: TransactionReadDependencies<TransactionGroupRepository>,
  currentLedger: CurrentLedger,
  groupBy: TransactionGroupBy,
  groupKey: string,
  offset: number,
  filters: TransactionFilters,
): Promise<TransactionMonthPage> {
  const safeOffset = Math.max(0, offset);
  const targetCount = safeOffset + transactionPageSize + 1;
  const recordDateBounds = mergeDateBounds(
    getTimeGroupDateBounds(groupBy, groupKey),
    getFilterDateBounds(filters),
  );

  if (
    recordDateBounds?.isEmpty ||
    hasRecordLevelConflict(groupBy, groupKey, filters)
  ) {
    return { groups: [], nextOffset: null };
  }

  const matchingRecords: TransactionRecordDbRow[] = [];
  let scanOffset = 0;

  while (matchingRecords.length < targetCount) {
    const candidateRecords =
      await dependencies.transactionRepository.listRecords({
        dateEnd: recordDateBounds?.endIso,
        dateStart: recordDateBounds?.startIso,
        groupKeyPushDown: { groupBy, groupKey },
        ledgerId: currentLedger.id,
        limit: transactionRecordScanPageSize,
        memberId: filters.memberId,
        merchantId: filters.merchantId,
        offset: scanOffset,
        recordType: filters.recordType,
      });
    if (candidateRecords.length === 0) break;

    const candidateContext = await loadTransactionGroupLoaderContextForRecords(
      dependencies,
      currentLedger,
      candidateRecords,
    );
    const filteredRecords = filterTransactionRecords(candidateContext, filters);
    matchingRecords.push(
      ...filterRecordsByGroup(
        candidateContext,
        filteredRecords,
        groupBy,
        groupKey,
      ),
    );

    scanOffset += candidateRecords.length;
    if (candidateRecords.length < transactionRecordScanPageSize) break;
  }

  const fetchedRecords = matchingRecords.slice(
    safeOffset,
    safeOffset + transactionPageSize + 1,
  );
  const pageRecords = fetchedRecords.slice(0, transactionPageSize);
  const pageContext = await loadTransactionGroupLoaderContextForRecords(
    dependencies,
    currentLedger,
    pageRecords,
  );
  const items = buildTransactionListItemsFromContext(pageRecords, pageContext);

  return {
    groups: groupTransactionItemsByDate(items, currentLedger.baseCurrency),
    nextOffset:
      fetchedRecords.length > transactionPageSize
        ? safeOffset + transactionPageSize
        : null,
  };
}

function filterRecordsByGroup(
  context: TransactionGroupLoaderContext,
  records: TransactionRecordDbRow[],
  groupBy: TransactionGroupBy,
  groupKey: string,
) {
  const { categoryById, itemsByRecordId } =
    getTransactionGroupContextLookups(context);

  return records.filter((record) =>
    recordMatchesGroup({
      categoryById,
      groupBy,
      groupKey,
      items: itemsByRecordId.get(record.id) ?? [],
      record,
    }),
  );
}

function hasRecordLevelConflict(
  groupBy: TransactionGroupBy,
  groupKey: string,
  filters: TransactionFilters,
) {
  if (groupBy === "merchant" && filters.merchantId) {
    return filters.merchantId !== groupKey;
  }
  if (groupBy === "member" && filters.memberId) {
    return filters.memberId !== groupKey;
  }

  return false;
}

type DateBounds = {
  endIso?: string;
  isEmpty?: boolean;
  startIso?: string;
};

function mergeDateBounds(
  first: DateBounds | undefined,
  second: DateBounds | undefined,
): DateBounds | undefined {
  const startIso = maxIso(first?.startIso, second?.startIso);
  const endIso = minIso(first?.endIso, second?.endIso);

  if (!startIso && !endIso) return undefined;

  return {
    endIso,
    isEmpty: Boolean(startIso && endIso && startIso >= endIso),
    startIso,
  };
}

function getFilterDateBounds(
  filters: TransactionFilters,
): DateBounds | undefined {
  return mergeDateBounds(
    filters.dateFrom && isDateKey(filters.dateFrom)
      ? { startIso: getLocalDateStartUtcIso(filters.dateFrom) }
      : undefined,
    filters.dateTo && isDateKey(filters.dateTo)
      ? {
          endIso: getLocalDateStartUtcIso(addDaysToDateKey(filters.dateTo, 1)),
        }
      : undefined,
  );
}

function getTimeGroupDateBounds(
  groupBy: TransactionGroupBy,
  groupKey: string,
): DateBounds | undefined {
  if (groupBy === "year" && /^\d{4}$/.test(groupKey)) {
    const year = Number(groupKey);
    return {
      endIso: getLocalDateStartUtcIso(`${year + 1}-01-01`),
      startIso: getLocalDateStartUtcIso(`${year}-01-01`),
    };
  }

  const quarterMatch = /^(\d{4})-Q([1-4])$/.exec(groupKey);
  if (groupBy === "quarter" && quarterMatch) {
    const year = Number(quarterMatch[1]);
    const quarter = Number(quarterMatch[2]);
    const startMonth = (quarter - 1) * 3 + 1;
    return {
      endIso: getLocalDateStartUtcIso(formatDateKey(year, startMonth + 3, 1)),
      startIso: getLocalDateStartUtcIso(formatDateKey(year, startMonth, 1)),
    };
  }

  if (groupBy === "month" && /^\d{4}-\d{2}$/.test(groupKey)) {
    return getMonthBounds(groupKey);
  }

  if (groupBy === "week" && isDateKey(groupKey)) {
    return {
      endIso: getLocalDateStartUtcIso(addDaysToDateKey(groupKey, 7)),
      startIso: getLocalDateStartUtcIso(groupKey),
    };
  }

  if (groupBy === "day" && isDateKey(groupKey)) {
    return {
      endIso: getLocalDateStartUtcIso(addDaysToDateKey(groupKey, 1)),
      startIso: getLocalDateStartUtcIso(groupKey),
    };
  }

  return undefined;
}

function getLocalDateStartUtcIso(dateKey: string) {
  return new Date(`${dateKey}T00:00:00+09:00`).toISOString();
}

function addDaysToDateKey(dateKey: string, days: number) {
  const [year, month, day] = dateKey.split("-").map(Number);
  const date = new Date(Date.UTC(year, month - 1, day + days));

  return formatDateKey(
    date.getUTCFullYear(),
    date.getUTCMonth() + 1,
    date.getUTCDate(),
  );
}

function formatDateKey(year: number, month: number, day: number) {
  const date = new Date(Date.UTC(year, month - 1, day));

  return `${date.getUTCFullYear()}-${String(date.getUTCMonth() + 1).padStart(
    2,
    "0",
  )}-${String(date.getUTCDate()).padStart(2, "0")}`;
}

function maxIso(left: string | undefined, right: string | undefined) {
  if (!left) return right;
  if (!right) return left;

  return left > right ? left : right;
}

function minIso(left: string | undefined, right: string | undefined) {
  if (!left) return right;
  if (!right) return left;

  return left < right ? left : right;
}
