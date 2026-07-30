import type { CurrentLedger } from "internal/ledger";
import type { AccountQueryService } from "internal/account";
import type { CategoryQueryService } from "internal/category";
import type { LedgerAccessService } from "internal/ledger";
import type { MerchantQueryService } from "internal/merchant";
import type {
  TransactionDashboardSummaryItem,
  TransactionRepository,
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
import { calculateTransactionRecordNetAmount } from "internal/transaction/util/transactionAmountHelpers";
import { dashboardRecentTransactionCount } from "@/constants/dashboard";
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
      for (const items of monthItemsByRecordId.values()) {
        const netAmount = calculateTransactionRecordNetAmount(
          items,
          categoryById,
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
          limit: 100,
        });

      return {
        monthSummary,
        recentTransactions: buildTransactionListItemsFromContext(
          recentRecords,
          recentContext,
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
    tagNames: [],
  };
}
