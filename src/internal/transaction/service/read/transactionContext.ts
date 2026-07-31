import type { CurrentLedger } from "internal/ledger";
import { canModifyTransaction } from "internal/ledger";
import type { AccountQueryService } from "internal/account";
import type { CategoryQueryService } from "internal/category";
import type { TransactionRecordDbRow } from "internal/db-types";
import { buildTransactionListItem } from "internal/transaction/util/buildTransactionListItem";
import type { MerchantQueryService } from "internal/merchant";
import type { TransactionContextRepository } from "internal/transaction/repository/transactionRepository";
import type { TransactionListItem } from "types/transactions";

import { getTransactionGroupContextLookups } from "internal/transaction/util/grouping/contextLookups";
import type { TransactionGroupLoaderContext } from "internal/transaction/util/grouping/types";

type TransactionReadBaseDependencies = {
  accountQueryService: AccountQueryService;
  categoryQueryService: CategoryQueryService;
  currentUserId: string;
  merchantQueryService: MerchantQueryService;
};

export type TransactionReadDependencies<
  TRepository = TransactionContextRepository,
> = TransactionReadBaseDependencies & {
  transactionRepository: TRepository;
};

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

  const [accountContext, categories, merchants, recorders] = await Promise.all([
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
  ]);
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
  };
}

export function buildTransactionListItemsFromContext(
  records: TransactionRecordDbRow[],
  context: TransactionGroupLoaderContext,
): TransactionListItem[] {
  const lookups = getTransactionGroupContextLookups(context);
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
    }),
  );
}
