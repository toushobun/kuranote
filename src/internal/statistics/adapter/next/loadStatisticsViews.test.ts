// @vitest-environment node

import { beforeEach, describe, expect, it, vi } from "vitest";

import {
  loadDashboardView,
  loadStatisticsView,
} from "internal/statistics/adapter/next/loadStatisticsViews";

const mocks = vi.hoisted(() => ({
  createRequestContainer: vi.fn(),
  createServerRequestDependencies: vi.fn(),
  getCurrentLedgerContext: vi.fn(),
  getCurrentLedgerOrRedirect: vi.fn(),
  getDashboard: vi.fn(),
  getMonthly: vi.fn(),
}));

vi.mock("lib/ledger/current-ledger", () => ({
  getCurrentLedgerContext: mocks.getCurrentLedgerContext,
  getCurrentLedgerOrRedirect: mocks.getCurrentLedgerOrRedirect,
}));

vi.mock("internal/shared/context/createServerRequestDependencies", () => ({
  createServerRequestDependencies: mocks.createServerRequestDependencies,
}));

vi.mock("internal/container", () => ({
  createRequestContainer: mocks.createRequestContainer,
}));

const ledger = {
  baseCurrency: "JPY",
  currentUserId: "00000000-0000-4000-8000-000000000031",
  currentUserRole: "owner" as const,
  id: "00000000-0000-4000-8000-000000000032",
  name: "家庭账本",
};

beforeEach(() => {
  vi.clearAllMocks();
  mocks.createServerRequestDependencies.mockResolvedValue({});
  mocks.createRequestContainer.mockReturnValue({
    statistics: {
      service: {
        getDashboard: mocks.getDashboard,
        getMonthly: mocks.getMonthly,
      },
    },
  });
});

describe("Statistics SSR adapter", () => {
  it("没有可访问账本时返回空 Dashboard 且不创建业务依赖", async () => {
    mocks.getCurrentLedgerContext.mockResolvedValue({
      currentLedger: null,
      email: "user@example.com",
      ledgers: [],
      userId: ledger.currentUserId,
    });

    await expect(loadDashboardView()).resolves.toMatchObject({
      accountSummaries: [],
      hasLedger: false,
      monthSummary: { currency: "JPY" },
      recentTransactions: [],
    });
    expect(mocks.createServerRequestDependencies).not.toHaveBeenCalled();
  });

  it("Dashboard 只将服务端 current ledger 传给 Statistics Service", async () => {
    mocks.getCurrentLedgerContext.mockResolvedValue({
      currentLedger: ledger,
      email: "user@example.com",
      ledgers: [ledger],
      userId: ledger.currentUserId,
    });
    mocks.getDashboard.mockResolvedValue({
      accountSummaries: [],
      hasLedger: true,
      monthLabel: "2026年6月",
      monthSummary: {
        balance: "0",
        currency: "JPY",
        expense: "0",
        income: "0",
      },
      recentTransactions: [],
    });

    await loadDashboardView();

    expect(mocks.getDashboard).toHaveBeenCalledWith({ ledgerId: ledger.id });
  });

  it("月度统计使用重定向边界解析出的当前账本", async () => {
    mocks.getCurrentLedgerOrRedirect.mockResolvedValue(ledger);
    mocks.getMonthly.mockResolvedValue({ month: "2026-06" });

    await loadStatisticsView("2026-06");

    expect(mocks.getMonthly).toHaveBeenCalledWith({
      ledgerId: ledger.id,
      month: "2026-06",
    });
  });
});
