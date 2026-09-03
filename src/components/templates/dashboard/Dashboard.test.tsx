import { render, screen } from "@testing-library/react";
import { ThemeProvider } from "@mui/material/styles";
import { describe, expect, it } from "vitest";

import {
  createDashboardViewData,
  createNoLedgerDashboardViewData,
} from "@/test/mocks/dashboard";
import { designTokens, theme } from "theme/theme";

import { DashboardTemplate } from "./Dashboard";

describe("DashboardTemplate", () => {
  it("首页账户和快捷操作图标使用共通小圆角", () => {
    render(
      <ThemeProvider theme={theme}>
        <DashboardTemplate data={createDashboardViewData()} />
      </ThemeProvider>,
    );

    const accountIcon = screen.getByText("现金钱包").previousElementSibling;
    const quickActionIcon = screen.getByText("快速记账").previousElementSibling;

    const expectedRadius = `${designTokens.radius.sm}px`;

    expect(getComputedStyle(accountIcon as Element).borderRadius).toBe(
      expectedRadius,
    );
    expect(getComputedStyle(quickActionIcon as Element).borderRadius).toBe(
      expectedRadius,
    );
  });

  it("显示首页手账模块", () => {
    render(<DashboardTemplate data={createDashboardViewData()} />);

    expect(screen.getByText("早呀，今天也好好记录")).toBeInTheDocument();
    expect(screen.getByText("每一张小票，都是生活的线索")).toBeInTheDocument();
    expect(screen.getByText("本月收入")).toBeInTheDocument();
    expect(screen.getByText("本月支出")).toBeInTheDocument();
    expect(screen.getByText("账户余额")).toBeInTheDocument();
    expect(screen.getByText("现金钱包")).toBeInTheDocument();
    expect(screen.getByText("快速记账")).toBeInTheDocument();
    expect(screen.getByText("拍照记账")).toBeInTheDocument();
    expect(screen.getAllByText("敬请期待")).toHaveLength(2);
    expect(screen.getByText("近期记录")).toBeInTheDocument();
    expect(screen.getByText("还没有记账记录。")).toBeInTheDocument();
  });

  it("显示首页顶部猫咪插画头图装饰层", () => {
    const { container } = render(
      <DashboardTemplate data={createDashboardViewData()} />,
    );

    expect(
      screen.getByTestId("dashboard-fullscreen-frame"),
    ).toBeInTheDocument();
    expect(
      screen.getByTestId("dashboard-hero-illustration"),
    ).toBeInTheDocument();
    expect(container.querySelectorAll("img")).toHaveLength(0);
  });

  it("按照指定顺序展示首页模块", () => {
    const { container } = render(
      <DashboardTemplate data={createDashboardViewData()} />,
    );

    const content = container.textContent ?? "";
    const labels = [
      "早呀，今天也好好记录",
      "本月收入",
      "账户余额",
      "快速记账",
      "近期记录",
    ];
    const positions = labels.map((label) => content.indexOf(label));

    expect(positions.every((position) => position >= 0)).toBe(true);
    expect([...positions].sort((a, b) => a - b)).toEqual(positions);
  });

  it("无账本时按真实首页结构显示创建引导", () => {
    render(<DashboardTemplate data={createNoLedgerDashboardViewData()} />);

    expect(screen.getByText("先创建你的第一个账本")).toBeInTheDocument();
    expect(
      screen.getByText("创建账本后，就可以开始记录家庭收支了"),
    ).toBeInTheDocument();
    expect(screen.getAllByText("—")).toHaveLength(3);
    expect(screen.getByText("等待创建账本")).toBeInTheDocument();
    expect(
      screen.getByText("还没有账本，暂时无法显示账户余额"),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("link", { name: "创建第一个账本" }),
    ).toHaveAttribute("href", "/ledgers/new");
    expect(screen.getAllByText("需先创建账本")).toHaveLength(3);
    expect(screen.queryByRole("link", { name: "查看全部" })).toBeNull();
    expect(
      screen.getByText("创建账本后，你的近期记录会显示在这里"),
    ).toBeInTheDocument();
    expect(
      screen.getByTestId("dashboard-no-ledger-account-illustration-slot"),
    ).toBeInTheDocument();
    expect(
      screen.getByTestId("dashboard-no-ledger-recent-illustration-slot"),
    ).toBeInTheDocument();
  });
});
