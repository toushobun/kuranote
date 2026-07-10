import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { createDashboardAccountSummary } from "@/test/mocks/dashboard";

import { DashboardMonthSummaryCard } from "./DashboardMonthSummaryCard";

describe("DashboardMonthSummaryCard", () => {
  it("显示账户余额汇总", () => {
    render(
      <DashboardMonthSummaryCard
        accounts={[createDashboardAccountSummary()]}
        hasLedger
        monthLabel="2026年5月"
      />,
    );

    expect(screen.getByText("2026年5月")).toBeTruthy();
    expect(screen.getByText("账户余额")).toBeTruthy();
    expect(screen.getByText("现金钱包")).toBeTruthy();
    expect(screen.getByText("¥2,580")).toBeTruthy();
  });

  it("无账本时显示创建账本入口并保留插图位", () => {
    render(
      <DashboardMonthSummaryCard
        accounts={[]}
        hasLedger={false}
        monthLabel="2026年5月"
      />,
    );

    expect(screen.getByText("等待创建账本")).toBeTruthy();
    expect(screen.getByText("还没有账本，暂时无法显示账户余额")).toBeTruthy();
    expect(
      screen.getByRole("link", { name: "创建第一个账本" }),
    ).toHaveAttribute("href", "/ledgers/new");
    expect(
      screen.getByTestId("dashboard-no-ledger-account-illustration-slot"),
    ).toBeTruthy();
  });
});
