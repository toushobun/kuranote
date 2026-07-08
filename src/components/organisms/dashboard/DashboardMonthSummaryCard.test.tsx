import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

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

  it("无账本时显示创建账本表单并保留插图位", () => {
    render(
      <DashboardMonthSummaryCard
        accounts={[]}
        createLedgerAction={vi.fn(async () => {})}
        hasLedger={false}
        monthLabel="2026年5月"
      />,
    );

    expect(screen.getByText("等待创建账本")).toBeTruthy();
    expect(screen.getByText("还没有账本，暂时无法显示账户余额")).toBeTruthy();
    expect(screen.getByLabelText(/账本名称/)).toHaveValue("家庭账本");
    expect(screen.getByDisplayValue("JPY")).toHaveAttribute(
      "name",
      "baseCurrency",
    );
    expect(
      screen.getByRole("button", { name: "创建第一个账本" }),
    ).toBeEnabled();
    expect(
      screen.getByTestId("dashboard-no-ledger-account-illustration-slot"),
    ).toBeTruthy();
  });

  it("无账本创建失败时显示错误提示", () => {
    render(
      <DashboardMonthSummaryCard
        accounts={[]}
        createLedgerAction={vi.fn(async () => {})}
        createLedgerErrorMessage="账本创建失败。请稍后重试。"
        hasLedger={false}
        monthLabel="2026年5月"
      />,
    );

    expect(screen.getByRole("alert")).toHaveTextContent(
      "账本创建失败。请稍后重试。",
    );
  });
});
