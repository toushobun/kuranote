import type { TransactionDashboardQueryService } from "internal/transaction";

type TransactionDashboardData = Awaited<
  ReturnType<TransactionDashboardQueryService["getDashboardData"]>
>;

export type DashboardViewData = {
  accountSummaries: {
    balance: number | string;
    currency: string;
    id: string;
    name: string;
    type: string;
  }[];
  hasLedger?: boolean;
  monthLabel: string;
  monthSummary: TransactionDashboardData["monthSummary"];
  recentTransactions: TransactionDashboardData["recentTransactions"];
};
