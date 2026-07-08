import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { createDashboardRecentTransaction } from "@/test/mocks/dashboard";

import { DashboardRecentTransactions } from "./DashboardRecentTransactions";

describe("DashboardRecentTransactions", () => {
  it("没有记录时显示空状态", () => {
    render(<DashboardRecentTransactions hasLedger transactions={[]} />);

    expect(screen.getByText("近期记录")).toBeInTheDocument();
    expect(screen.getByText("本月还没有记账记录。")).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "查看全部" })).toBeInTheDocument();
  });

  it("有记录时显示交易行", () => {
    render(
      <DashboardRecentTransactions
        hasLedger
        transactions={[createDashboardRecentTransaction()]}
      />,
    );

    expect(screen.getByText("便利店")).toBeInTheDocument();
    expect(screen.getByText(/餐饮/)).toBeInTheDocument();
    expect(screen.queryByText(/饮食 > 餐饮/)).toBeNull();
    expect(screen.getByText(/测试备注/)).toBeInTheDocument();
  });

  it("无账本时显示创建账本后的记录提示并保留插图位", () => {
    render(<DashboardRecentTransactions hasLedger={false} transactions={[]} />);

    expect(screen.getByText("需先创建账本")).toBeInTheDocument();
    expect(screen.queryByRole("link", { name: "查看全部" })).toBeNull();
    expect(
      screen.getByText("创建账本后，你的近期记录会显示在这里"),
    ).toBeInTheDocument();
    expect(
      screen.getByTestId("dashboard-no-ledger-recent-illustration-slot"),
    ).toBeInTheDocument();
  });
});
