import type { ReactElement } from "react";
import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  DashboardTemplate: vi.fn(() => null),
  launcherActions: { loadWizard: vi.fn(), wizard: {} },
  loadDashboardView: vi.fn(),
  loadLedgerSetupInProgressSummary: vi.fn(),
}));

vi.mock("internal/statistics/adapter/next/loadStatisticsViews", () => ({
  loadDashboardView: mocks.loadDashboardView,
}));
vi.mock("internal/ledger/adapter/next/loadLedgerSetupWizard", () => ({
  loadLedgerSetupInProgressSummary: mocks.loadLedgerSetupInProgressSummary,
}));
vi.mock(
  "internal/ledger/adapter/next/ledgerSetupWizardLauncherActions",
  () => ({
    ledgerSetupWizardLauncherActions: mocks.launcherActions,
  }),
);
vi.mock("templates/dashboard/Dashboard", () => ({
  DashboardTemplate: mocks.DashboardTemplate,
}));

import DashboardPage from "./page";

describe("DashboardPage", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.loadLedgerSetupInProgressSummary.mockResolvedValue({
      name: "我们家",
      step: 2,
    });
  });

  it("没有已完成账本时读取创建中账本并传给首页", async () => {
    const data = { hasLedger: false };
    mocks.loadDashboardView.mockResolvedValue(data);

    const element = (await DashboardPage()) as ReactElement<{
      data: unknown;
      setupInProgress: unknown;
      setupWizardActions: unknown;
    }>;

    expect(mocks.loadLedgerSetupInProgressSummary).toHaveBeenCalledTimes(1);
    expect(element.props).toEqual({
      data,
      setupInProgress: { name: "我们家", step: 2 },
      setupWizardActions: mocks.launcherActions,
    });
  });

  it("有已完成账本时不读取创建中账本", async () => {
    const data = { hasLedger: true };
    mocks.loadDashboardView.mockResolvedValue(data);

    const element = (await DashboardPage()) as ReactElement<{
      setupInProgress: unknown;
    }>;

    expect(mocks.loadLedgerSetupInProgressSummary).not.toHaveBeenCalled();
    expect(element.props.setupInProgress).toBeNull();
  });
});
