import type { CurrentLedger } from "lib/ledger/current-ledger";
import type { AccountQueryService } from "internal/account";
import type { CategoryQueryService } from "internal/category";
import type { LedgerAccessService } from "internal/ledger";
import type { MerchantQueryService } from "internal/merchant";
import type { TransactionRepository } from "internal/transaction/repository/transactionRepository";
import {
  buildTransactionListItemsFromContext,
  getTransactionGroupContextLookups,
  loadTransactionGroupLoaderContextForRecords,
} from "internal/transaction/service/transactionContext";
import {
  getTransactionReadDependencies,
  requireTransactionReadLedger,
  type TransactionReadAccessDependencies,
} from "internal/transaction/service/transactionReadAccess";
import { calculateTransactionRecordNetAmount } from "internal/transaction/util/transactionAmountHelpers";
import type {
  TransactionAmountSummary,
  TransactionListItem,
} from "types/transactions";
import {
  addTransactionAmount,
  createTransactionAmountSummary,
} from "utils/transactions";

export type TransactionDashboardData = {
  monthSummary: TransactionAmountSummary;
  recentTransactions: TransactionListItem[];
  recentlyUsedAccountIds: string[];
};

export interface TransactionDashboardQueryService {
  getDashboardData(input: {
    currentLedger: CurrentLedger;
    dateEnd: string;
    dateStart: string;
  }): Promise<TransactionDashboardData>;
}

type TransactionDashboardQueryServiceDependencies = {
  accountQueryService: AccountQueryService;
  categoryQueryService: CategoryQueryService;
  currentUserId: string | null;
  ledgerAccessService: LedgerAccessService;
  merchantQueryService: MerchantQueryService;
  transactionRepository: TransactionRepository;
};

export function createTransactionDashboardQueryService({
  accountQueryService,
  categoryQueryService,
  currentUserId,
  ledgerAccessService,
  merchantQueryService,
  transactionRepository,
}: TransactionDashboardQueryServiceDependencies): TransactionDashboardQueryService {
  const readAccessDependencies: TransactionReadAccessDependencies = {
    accountQueryService,
    categoryQueryService,
    currentUserId,
    ledgerAccessService,
    merchantQueryService,
    transactionRepository,
  };

  return {
    async getDashboardData({ currentLedger, dateEnd, dateStart }) {
      const ledger = await requireTransactionReadLedger(
        readAccessDependencies,
        currentLedger,
      );
      const records = await transactionRepository.listRecords({
        dateEnd,
        dateStart,
        ledgerId: ledger.id,
        recordType: "all",
      });
      const normalRecords = records.filter(
        (record) => record.type === "normal",
      );
      const context = await loadTransactionGroupLoaderContextForRecords(
        getTransactionReadDependencies(readAccessDependencies),
        ledger,
        normalRecords,
      );
      const lookups = getTransactionGroupContextLookups(context);
      const monthSummary = createTransactionAmountSummary(ledger.baseCurrency);

      for (const record of normalRecords) {
        const netAmount = calculateTransactionRecordNetAmount(
          lookups.itemsByRecordId.get(record.id) ?? [],
          lookups.categoryById,
        );

        if (!Number.isFinite(netAmount) || netAmount === 0) continue;

        addTransactionAmount(
          monthSummary,
          netAmount > 0 ? "income" : "expense",
          String(Math.abs(netAmount)),
        );
      }

      const recentRecords = await transactionRepository.listRecords({
        ledgerId: ledger.id,
        limit: 100,
        recordType: "all",
      });
      const recentItems = await transactionRepository.listItems(
        ledger.id,
        recentRecords.map((record) => record.id),
      );
      const accountIdsByRecordId = new Map<string, string[]>();

      for (const item of recentItems) {
        const accountIds =
          accountIdsByRecordId.get(item.transaction_record_id) ?? [];
        accountIds.push(item.account_id);
        accountIdsByRecordId.set(item.transaction_record_id, accountIds);
      }

      const recentlyUsedAccountIds = new Set<string>();
      for (const record of recentRecords) {
        for (const accountId of accountIdsByRecordId.get(record.id) ?? []) {
          recentlyUsedAccountIds.add(accountId);
        }
      }

      return {
        monthSummary,
        recentTransactions: buildTransactionListItemsFromContext(
          normalRecords.slice(0, 5),
          context,
        ).map(toDashboardRecentTransaction),
        recentlyUsedAccountIds: [...recentlyUsedAccountIds],
      };
    },
  };
}

/** Dashboard 迁移只复用交易权限与数据构建，不改变原有可见字段。 */
function toDashboardRecentTransaction(
  item: TransactionListItem,
): TransactionListItem {
  return {
    ...item,
    account_color: null,
    recorder_color: null,
    recorder_name: null,
    show_recorder: true,
    tagNames: [],
  };
}
