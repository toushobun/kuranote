import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { createDashboardRecentTransaction } from "@/test/mocks/dashboard";
import { dashboardRecentTransactionCount } from "@/constants/dashboard";

import { DashboardRecentTransactions } from "./DashboardRecentTransactions";

describe("DashboardRecentTransactions", () => {
  it("没有记录时显示空状态", () => {
    render(<DashboardRecentTransactions hasLedger transactions={[]} />);

    expect(screen.getByText("近期记录")).toBeInTheDocument();
    expect(screen.getByText("还没有记账记录。")).toBeInTheDocument();
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

  it("传入转账记录时保留并显示在近期记录中", () => {
    render(
      <DashboardRecentTransactions
        hasLedger
        transactions={[
          createDashboardRecentTransaction({
            account_name: "日元现金 → 日本银行卡",
            categoryItems: [],
            merchant_icon_url: null,
            merchant_name: null,
            note: "账户转账",
            type: "transfer",
          }),
        ]}
      />,
    );

    expect(screen.getByText("账户周转")).toBeInTheDocument();
    expect(screen.getByText("日元现金 → 日本银行卡")).toBeInTheDocument();
    expect(screen.getByText("账户转账")).toBeInTheDocument();
    expect(screen.queryByText(/餐饮/)).toBeNull();
  });

  it("只显示统一常量指定的近期记录条数", () => {
    const transactions = Array.from(
      { length: dashboardRecentTransactionCount + 1 },
      (_, index) =>
        createDashboardRecentTransaction({
          id: `transaction-${index + 1}`,
          merchant_name: `商家${index + 1}`,
        }),
    );

    render(
      <DashboardRecentTransactions hasLedger transactions={transactions} />,
    );

    for (let index = 1; index <= dashboardRecentTransactionCount; index += 1) {
      expect(screen.getByText(`商家${index}`)).toBeInTheDocument();
    }
    expect(
      screen.queryByText(`商家${dashboardRecentTransactionCount + 1}`),
    ).toBeNull();
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
