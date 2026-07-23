"use server";

import {
  getCurrentLedgerContext,
  getCurrentLedgerOrRedirect,
} from "lib/ledger/current-ledger";
import { createRequestContainer } from "internal/container";
import { createServerRequestDependencies } from "internal/shared/context/createServerRequestDependencies";
import { getDashboardDateRange } from "internal/statistics/util/dashboardDateRange";
import type { DashboardViewData } from "types/dashboard";
import { createTransactionAmountSummary } from "utils/transactions";

async function getStatisticsService() {
  const dependencies = await createServerRequestDependencies();
  return createRequestContainer(dependencies).statistics.service;
}

export async function loadDashboardView(): Promise<DashboardViewData> {
  const context = await getCurrentLedgerContext();

  if (!context.currentLedger) {
    return {
      accountSummaries: [],
      hasLedger: false,
      monthLabel: getDashboardDateRange().monthLabel,
      monthSummary: createTransactionAmountSummary("JPY"),
      recentTransactions: [],
    };
  }

  return (await getStatisticsService()).getDashboard({
    ledgerId: context.currentLedger.id,
  });
}

export async function loadStatisticsView(month?: string | null) {
  const currentLedger = await getCurrentLedgerOrRedirect();

  return (await getStatisticsService()).getMonthly({
    ledgerId: currentLedger.id,
    month,
  });
}
