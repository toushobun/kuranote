import type { TransactionAmountSummary, TransactionListItem } from "types/transactions";

export type DashboardAmountSummary = TransactionAmountSummary;

export type DashboardAccountSummary = {
  id: string;
  name: string;
  type: string;
  currency: string;
  balance: number | string;
};

export type DashboardRecentTransaction = TransactionListItem;

export type DashboardViewData = {
  hasLedger?: boolean;
  monthLabel: string;
  monthSummary: DashboardAmountSummary;
  accountSummaries: DashboardAccountSummary[];
  recentTransactions: DashboardRecentTransaction[];
};
