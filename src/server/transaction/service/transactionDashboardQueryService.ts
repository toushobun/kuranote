import type { CurrentLedger } from "lib/ledger/current-ledger";
import type { AccountQueryService } from "server/account/service/accountService";
import type { CategoryQueryService } from "server/category/service/categoryService";
import type { LedgerAccessService } from "server/ledger/service/ledgerAccessService";
import type { MerchantQueryService } from "server/merchant/service/merchantService";
import type { TransactionRepository } from "server/transaction/repository/transactionRepository";
import {
  buildTransactionListItemsFromContext,
  getTransactionGroupContextLookups,
  loadTransactionGroupLoaderContextForRecords,
  type TransactionReadDependencies,
} from "server/transaction/service/transactionContext";
import { calculateTransactionRecordNetAmount } from "server/transaction/util/transactionAmountHelpers";
import {
  AuthenticationError,
  NotFoundError,
} from "server/shared/errors/appError";
import { transactionErrorCodes } from "server/transaction/errors";
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
  function requireUserId(): string {
    if (!currentUserId) {
      throw new AuthenticationError("auth_required", "请先登录。");
    }
    return currentUserId;
  }

  async function requireReadLedger(
    currentLedger: CurrentLedger,
  ): Promise<CurrentLedger> {
    const userId = requireUserId();
    const role = await ledgerAccessService.getActiveMemberRole({
      ledgerId: currentLedger.id,
      userId,
    });

    if (!role) {
      throw new NotFoundError(
        transactionErrorCodes.permissionDenied,
        "账本不存在或您不是该账本成员。",
      );
    }

    return { ...currentLedger, currentUserId: userId, currentUserRole: role };
  }

  function getReadDependencies(): TransactionReadDependencies {
    return {
      accountQueryService,
      categoryQueryService,
      currentUserId: requireUserId(),
      merchantQueryService,
      transactionRepository,
    };
  }

  return {
    async getDashboardData({ currentLedger, dateEnd, dateStart }) {
      const ledger = await requireReadLedger(currentLedger);
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
        getReadDependencies(),
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
