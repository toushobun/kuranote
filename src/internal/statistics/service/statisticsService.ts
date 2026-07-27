import type { CurrentLedger } from "lib/ledger/current-ledger";
import {
  requireActiveLedgerMemberRole,
  type LedgerAccessService,
} from "internal/ledger";
import {
  AuthenticationError,
  NotFoundError,
} from "internal/shared/errors/appError";
import type {
  DashboardAccountSummaryRecord,
  StatisticsRepository,
} from "internal/statistics/repository/statisticsRepository";
import { buildStatisticsViewData } from "internal/statistics/util/statistics";
import { getDashboardDateRange } from "internal/statistics/util/dashboardDateRange";
import type { TransactionDashboardQueryService } from "internal/transaction";
import type { DashboardViewData } from "types/dashboard";
import type { StatisticsViewData } from "types/statistics";
import { getMonthBounds, normalizeMonth } from "utils/transactions";

export interface StatisticsService {
  getDashboard(input: { ledgerId: string }): Promise<DashboardViewData>;
  getMonthly(input: {
    ledgerId: string;
    month?: string | null;
  }): Promise<StatisticsViewData>;
}

type StatisticsServiceDependencies = {
  currentUserId: string | null;
  ledgerAccessService: LedgerAccessService;
  now?: () => Date;
  statisticsRepository: StatisticsRepository;
  transactionDashboardQueryService: TransactionDashboardQueryService;
};

export function createStatisticsService({
  currentUserId,
  ledgerAccessService,
  now = () => new Date(),
  statisticsRepository,
  transactionDashboardQueryService,
}: StatisticsServiceDependencies): StatisticsService {
  function requireUserId(): string {
    if (!currentUserId) {
      throw new AuthenticationError("auth_required", "请先登录。");
    }
    return currentUserId;
  }

  async function requireLedger(ledgerId: string): Promise<CurrentLedger> {
    const userId = requireUserId();
    const [role, ledger] = await Promise.all([
      requireActiveLedgerMemberRole(ledgerAccessService, { ledgerId, userId }),
      statisticsRepository.findLedger(ledgerId),
    ]);

    if (!ledger) {
      throw new NotFoundError(
        "ledger_invalid",
        "账本不存在、已归档或您无法访问。",
      );
    }

    return {
      baseCurrency: ledger.baseCurrency,
      currentUserId: userId,
      currentUserRole: role,
      id: ledger.id,
      name: ledger.name,
    };
  }

  return {
    async getDashboard({ ledgerId }) {
      const ledger = await requireLedger(ledgerId);
      const { monthEndIso, monthLabel, monthStartIso } =
        getDashboardDateRange(now());
      const [transactionData, accounts] = await Promise.all([
        transactionDashboardQueryService.getDashboardData({
          currentLedger: ledger,
          dateEnd: monthEndIso,
          dateStart: monthStartIso,
        }),
        statisticsRepository.listDashboardAccounts(ledger.id),
      ]);

      return {
        accountSummaries: sortDashboardAccountsByRecentUse(
          accounts,
          transactionData.recentlyUsedAccountIds,
        )
          .slice(0, 5)
          .map((account) => ({
            balance: account.currentBalance,
            currency: account.currency,
            id: account.id,
            name: account.name,
            type: account.type,
          })),
        hasLedger: true,
        monthLabel,
        monthSummary: transactionData.monthSummary,
        recentTransactions: transactionData.recentTransactions,
      };
    },

    async getMonthly({ ledgerId, month }) {
      const ledger = await requireLedger(ledgerId);
      const normalizedMonth = normalizeMonth(month);
      const { endIso, startIso } = getMonthBounds(normalizedMonth);
      const source = await statisticsRepository.loadMonthlySource({
        dateEnd: endIso,
        dateStart: startIso,
        ledgerId: ledger.id,
      });

      return buildStatisticsViewData({
        ...source,
        currency: ledger.baseCurrency,
        ledgerName: ledger.name,
        month: normalizedMonth,
      });
    },
  };
}

function sortDashboardAccountsByRecentUse(
  accounts: DashboardAccountSummaryRecord[],
  recentlyUsedAccountIds: string[],
) {
  const recentIndexByAccountId = new Map(
    recentlyUsedAccountIds.map((id, index) => [id, index] as const),
  );

  return [...accounts].sort((a, b) => {
    const aIndex = recentIndexByAccountId.get(a.id) ?? Number.MAX_SAFE_INTEGER;
    const bIndex = recentIndexByAccountId.get(b.id) ?? Number.MAX_SAFE_INTEGER;

    if (aIndex !== bIndex) return aIndex - bIndex;
    if (a.sortOrder !== b.sortOrder) return a.sortOrder - b.sortOrder;

    return a.createdAt.localeCompare(b.createdAt);
  });
}
