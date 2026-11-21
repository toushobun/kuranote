import { dashboardRecentAccountHistoryLimit } from "internal/transaction/service/read/recentUsage";
import type { CurrentLedger } from "internal/ledger";
import type { AccountQueryService } from "internal/account";
import type { CategoryQueryService } from "internal/category";
import type { LedgerAccessService } from "internal/ledger";
import type { MerchantQueryService } from "internal/merchant";
import type {
  TransactionDashboardRepository,
  TransactionDashboardSummaryItem,
} from "internal/transaction/repository/transactionRepository";
import {
  buildTransactionListItemsFromContext,
  loadTransactionGroupLoaderContextForRecords,
} from "internal/transaction/service/read/transactionContext";
import {
  getTransactionReadDependencies,
  requireTransactionReadLedger,
  type TransactionReadAccessDependencies,
} from "internal/transaction/service/read/transactionReadAccess";
import { defaultTransactionFilters } from "internal/transaction/entity/transactionGrouping";
import {
  addSignedAmount,
  calculateRecordNetAmount,
} from "utils/transactionRecordAmounts";
import { dashboardRecentTransactionCount } from "@/constants/recentUsage";
import type {
  TransactionAmountSummary,
  TransactionListItem,
} from "internal/transaction/service/read/transactionReadModels";
import { createTransactionAmountSummary } from "utils/transactions";
import { convertLedgerAmount } from "utils/exchangeRate";

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
  transactionRepository: TransactionDashboardRepository;
};

export function createTransactionDashboardQueryService({
  accountQueryService,
  categoryQueryService,
  currentUserId,
  ledgerAccessService,
  merchantQueryService,
  transactionRepository,
}: TransactionDashboardQueryServiceDependencies): TransactionDashboardQueryService {
  const readAccessDependencies: TransactionReadAccessDependencies<TransactionDashboardRepository> =
    {
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
      const monthSource = await transactionRepository.loadDashboardMonthSource({
        dateEnd,
        dateStart,
        ledgerId: ledger.id,
      });
      const categoryById = new Map(
        monthSource.categories.map((category) => [category.id, category]),
      );
      const monthItemsByRecordId = new Map<
        string,
        TransactionDashboardSummaryItem[]
      >();

      for (const item of monthSource.items) {
        const items =
          monthItemsByRecordId.get(item.transaction_record_id) ?? [];
        items.push(item);
        monthItemsByRecordId.set(item.transaction_record_id, items);
      }

      const monthSummary = createTransactionAmountSummary(ledger.baseCurrency);
      const recordById = new Map(
        (monthSource.records ?? []).map((record) => [record.id, record]),
      );
      for (const [recordId, items] of monthItemsByRecordId) {
        const record = recordById.get(recordId);
        const netAmount = calculateRecordNetAmount(items, categoryById);
        if (
          record?.record_currency &&
          record.record_currency !== ledger.baseCurrency
        ) {
          monthSummary.hasForeignCurrency = true;
        }
        const converted = convertLedgerAmount(
          netAmount,
          record?.ledger_rate ?? null,
        );
        if (converted === null) {
          monthSummary.missingRateCount =
            (monthSummary.missingRateCount ?? 0) + 1;
        } else {
          addSignedAmount(monthSummary, converted);
        }
      }

      const recentRecords = await transactionRepository.listRecords({
        includeAttachmentCount: true,
        ledgerId: ledger.id,
        limit: dashboardRecentTransactionCount,
        recordType: "all",
      });
      const recentContext = await loadTransactionGroupLoaderContextForRecords(
        getTransactionReadDependencies(readAccessDependencies),
        ledger,
        recentRecords,
      );

      const recentlyUsedAccountIds =
        await transactionRepository.loadDashboardRecentlyUsedAccountIds({
          ledgerId: ledger.id,
          limit: dashboardRecentAccountHistoryLimit,
        });

      return {
        monthSummary,
        recentTransactions: buildTransactionListItemsFromContext(
          recentRecords,
          recentContext,
          defaultTransactionFilters,
        ).map(toDashboardRecentTransaction),
        recentlyUsedAccountIds,
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
  };
}
