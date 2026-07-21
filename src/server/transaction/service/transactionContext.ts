import type { CurrentLedger } from "lib/ledger/current-ledger";
import { canModifyTransaction } from "lib/ledger/permissions";
import type { AccountQueryService } from "server/account/service/accountService";
import type { CategoryQueryService } from "server/category/service/categoryService";
import type {
  AccountOptionDbRow,
  AppUserSummaryDbRow,
  CategorySummaryDbRow,
  MerchantSummaryDbRow,
  TransactionItemDbRow,
  TransactionRecordDbRow,
} from "server/db-types";
import { buildTransactionListItem } from "server/transaction/util/buildTransactionListItem";
import type { MerchantQueryService } from "server/merchant/service/merchantService";
import type { TransactionRepository } from "server/transaction/repository/transactionRepository";
import type { TransactionListItem } from "types/transactions";

import {
  groupItemsByRecordId,
  groupRawTagsByRecordId,
} from "server/transaction/util/grouping/tagUtils";
import {
  type RawTagAssignment,
  type TransactionGroupLoaderContext,
} from "server/transaction/util/grouping/types";

export type TransactionReadDependencies = {
  accountQueryService: AccountQueryService;
  categoryQueryService: CategoryQueryService;
  currentUserId: string;
  merchantQueryService: MerchantQueryService;
  transactionRepository: TransactionRepository;
};

export type TransactionGroupContextLookups = {
  accountById: Map<string, AccountOptionDbRow>;
  categoryById: Map<string, CategorySummaryDbRow>;
  itemsByRecordId: Map<string, TransactionItemDbRow[]>;
  merchantById: Map<string, MerchantSummaryDbRow>;
  recorderById: Map<string, AppUserSummaryDbRow>;
  tagsByRecordId: Map<string, RawTagAssignment[]>;
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
    itemsByRecordId: groupItemsByRecordId(context.items),
    merchantById: new Map(
      context.merchants.map((merchant) => [merchant.id, merchant] as const),
    ),
    recorderById: new Map(
      context.recorders.map((user) => [user.id, user] as const),
    ),
    tagsByRecordId: groupRawTagsByRecordId(context.tagAssignments),
  };

  contextLookupsCache.set(context, lookups);
  return lookups;
}

export async function loadTransactionGroupLoaderContext(
  dependencies: TransactionReadDependencies,
  currentLedger: CurrentLedger,
): Promise<TransactionGroupLoaderContext> {
  const records = await dependencies.transactionRepository.listRecords({
    ledgerId: currentLedger.id,
    recordType: "all",
  });
  return loadTransactionGroupLoaderContextForRecords(
    dependencies,
    currentLedger,
    records,
  );
}

export async function loadTransactionGroupLoaderContextForRecords(
  dependencies: TransactionReadDependencies,
  currentLedger: CurrentLedger,
  records: TransactionRecordDbRow[],
): Promise<TransactionGroupLoaderContext> {
  const currentUserId = dependencies.currentUserId;
  const recordIds = records.map((record) => record.id);

  if (recordIds.length === 0) {
    return {
      accountColorById: new Map(),
      accounts: [],
      categories: [],
      currentLedger,
      currentUserId,
      items: [],
      merchants: [],
      records: [],
      recorders: [],
      showRecorder: false,
      tagAssignments: [],
      tagById: new Map<string, string>(),
    };
  }

  const items = await dependencies.transactionRepository.listItems(
    currentLedger.id,
    recordIds,
  );
  const accountIds = [...new Set(items.map((item) => item.account_id))];
  const categoryIds = [
    ...new Set(
      items
        .map((item) => item.category_id)
        .filter((categoryId): categoryId is string => categoryId !== null),
    ),
  ];
  const merchantIds = [
    ...new Set(
      records
        .map((record) => record.merchant_id)
        .filter((merchantId): merchantId is string => merchantId !== null),
    ),
  ];
  const recorderIds = [
    ...new Set(
      records
        .map((record) => record.created_by)
        .filter((id): id is string => typeof id === "string"),
    ),
  ];

  const [accountContext, categories, merchants, recorders, tagAssignments] =
    await Promise.all([
      dependencies.accountQueryService.getTransactionContext({
        accountIds,
        ledgerId: currentLedger.id,
        userId: currentUserId,
      }),
      dependencies.categoryQueryService.findSummariesByIds({
        categoryIds,
        ledgerId: currentLedger.id,
        userId: currentUserId,
      }),
      dependencies.merchantQueryService.findSummariesByIds({
        ledgerId: currentLedger.id,
        merchantIds,
      }),
      dependencies.transactionRepository.findUserSummaries(
        currentLedger.id,
        recorderIds,
      ),
      dependencies.transactionRepository.listTagAssignments(
        currentLedger.id,
        recordIds,
      ),
    ]);
  const tags = await dependencies.transactionRepository.listTagsByIds(
    currentLedger.id,
    tagAssignments.map((assignment) => assignment.tag_id),
  );
  const tagById = new Map(tags.map((tag) => [tag.id, tag.name]));

  return {
    accountColorById: accountContext.accountColorById,
    accounts: accountContext.accounts,
    categories,
    currentLedger,
    currentUserId,
    items,
    merchants,
    records,
    recorders,
    showRecorder: accountContext.showRecorder,
    tagAssignments,
    tagById,
  };
}

export function buildTransactionListItemsFromContext(
  records: TransactionRecordDbRow[],
  context: TransactionGroupLoaderContext,
): TransactionListItem[] {
  const lookups = getTransactionGroupContextLookups(context);
  const tagNamesByRecordId = new Map<string, string[]>();

  for (const record of records) {
    const recordTags = lookups.tagsByRecordId.get(record.id) ?? [];
    const names = recordTags
      .map((assignment) => context.tagById.get(assignment.tag_id))
      .filter((name): name is string => Boolean(name));

    if (names.length > 0) tagNamesByRecordId.set(record.id, names);
  }

  return records.map((record) =>
    buildTransactionListItem({
      accountById: lookups.accountById,
      accountColorById: context.accountColorById,
      canEdit: context.currentUserId
        ? canModifyTransaction({
            createdBy: record.created_by ?? null,
            role: context.currentLedger.currentUserRole,
            userId: context.currentUserId,
          })
        : false,
      categoryById: lookups.categoryById,
      fallbackCurrency: context.currentLedger.baseCurrency,
      merchantById: lookups.merchantById,
      record,
      recorderById: lookups.recorderById,
      recordItems: lookups.itemsByRecordId.get(record.id) ?? [],
      showRecorder: context.showRecorder ?? true,
      tagNamesByRecordId,
    }),
  );
}
