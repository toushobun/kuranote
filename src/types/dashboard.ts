import type { TransactionListItem } from "types/transactions";

export type DashboardAmountSummary = {
  income: string;
  expense: string;
  balance: string;
  currency: string;
};

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
