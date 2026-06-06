// @vitest-environment jsdom

import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { DashboardHome } from "./DashboardHome";

const data = {
  accountSummary: { accountCount: 2, currency: "JPY", totalBalance: "350000" },
  ledgerName: "家庭账本",
  monthLabel: "2026年6月",
  monthSummary: { balance: "180000", currency: "JPY", expense: "80000", income: "260000" },
  recentTransactions: [],
};

describe("DashboardHome", () => {
  it("显示首页摘要", () => {
    render(<DashboardHome data={data} />);

    expect(screen.getByText("首页")).toBeTruthy();
    expect(screen.getByText("当前账本：家庭账本")).toBeTruthy();
    expect(screen.getByText("2026年6月概况")).toBeTruthy();
    expect(screen.getByText("账户数量")).toBeTruthy();
    expect(screen.getByText("2 个")).toBeTruthy();
    expect(screen.getByText("本月还没有记账记录。")).toBeTruthy();
  });
});
