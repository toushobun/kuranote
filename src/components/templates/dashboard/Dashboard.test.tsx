import { fireEvent, render, screen, within } from "@testing-library/react";
import { ThemeProvider } from "@mui/material/styles";
import type { ComponentProps } from "react";
import { describe, expect, it, vi } from "vitest";

import {
  createDashboardViewData,
  createNoLedgerDashboardViewData,
} from "@/test/mocks/dashboard";
import { createLedgerSetupWizardLauncherActionMocks } from "organisms/ledgers/LedgerSetupWizard/ledgerSetupWizardTestUtils";
import { ConfirmDialogTestProviders } from "test/ConfirmDialogTestProviders";
import { createLedgerSetupProgressFixture } from "test/mocks/ledgerSetup";
import type { LedgerSetupProgress } from "types/ledgers";
import { designTokens, theme } from "theme/theme";

import { DashboardTemplate } from "./Dashboard";

vi.mock("next/navigation", () => ({
  useRouter: () => ({ refresh: vi.fn() }),
}));

const inProgressNotice = "你有一个账本还没创建完，请先继续创建。";

function renderDashboard(
  props: Partial<ComponentProps<typeof DashboardTemplate>> = {},
  progress: LedgerSetupProgress | null = null,
) {
  const setupWizardActions =
    createLedgerSetupWizardLauncherActionMocks(progress);
  const view = render(
    <ThemeProvider theme={theme}>
      <ConfirmDialogTestProviders>
        <DashboardTemplate
          data={createDashboardViewData()}
          setupWizardActions={setupWizardActions}
          {...props}
        />
      </ConfirmDialogTestProviders>
    </ThemeProvider>,
  );

  return { ...view, setupWizardActions };
}

describe("DashboardTemplate", () => {
  it("首页账户和快捷操作图标使用共通小圆角", () => {
    renderDashboard();

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
    renderDashboard();

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
    const { container } = renderDashboard();

    expect(
      screen.getByTestId("dashboard-fullscreen-frame"),
    ).toBeInTheDocument();
    expect(
      screen.getByTestId("dashboard-hero-illustration"),
    ).toBeInTheDocument();
    expect(container.querySelectorAll("img")).toHaveLength(0);
  });

  it("按照指定顺序展示首页模块", () => {
    const { container } = renderDashboard();

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
    const { setupWizardActions } = renderDashboard({
      data: createNoLedgerDashboardViewData(),
    });

    expect(screen.getByText("先创建你的第一个账本")).toBeInTheDocument();
    expect(
      screen.getByText("创建账本后，就可以开始记录家庭收支了"),
    ).toBeInTheDocument();
    expect(screen.getAllByText("—")).toHaveLength(3);
    expect(screen.getByText("等待创建账本")).toBeInTheDocument();
    expect(
      screen.getByText("还没有账本，暂时无法显示账户余额"),
    ).toBeInTheDocument();
    const createLedgerButton = screen.getByRole("button", {
      name: "创建第一个账本",
    });
    expect(getComputedStyle(createLedgerButton).borderRadius).toBe(
      `${designTokens.radius.lg}px`,
    );
    expect(
      screen.queryByRole("region", { name: /还没创建完/ }),
    ).not.toBeInTheDocument();
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

    // 「创建第一个账本」打开创建账本向导。
    fireEvent.click(createLedgerButton);
    expect(setupWizardActions.loadWizard).toHaveBeenCalledTimes(1);
  });

  it("无已完成账本且有创建中账本时显示继续创建卡片与新的欢迎语", async () => {
    const { container, setupWizardActions } = renderDashboard(
      {
        data: createNoLedgerDashboardViewData(),
        setupInProgress: { name: "我们家", step: 2 },
      },
      createLedgerSetupProgressFixture({ name: "我们家", step: 2 }),
    );

    expect(screen.getByText("你的账本还差一点")).toBeInTheDocument();
    expect(
      screen.getByText("完成创建后，就可以开始记录家庭收支了"),
    ).toBeInTheDocument();
    expect(screen.queryByText("先创建你的第一个账本")).not.toBeInTheDocument();

    const card = screen.getByRole("region", { name: "「我们家」还没创建完" });
    expect(within(card).getByText("进行到第 2 步 · 账户")).toBeInTheDocument();
    expect(within(card).getByText("第 2 / 6 步")).toBeInTheDocument();

    // 继续创建卡片位于欢迎区下方、其他区块上方。
    const content = container.textContent ?? "";
    const positions = [
      "你的账本还差一点",
      "「我们家」还没创建完",
      "本月收入",
      "账户余额",
    ].map((label) => content.indexOf(label));
    expect([...positions].sort((a, b) => a - b)).toEqual(positions);

    // 其余区块保持无账本空状态。
    expect(screen.getByText("等待创建账本")).toBeInTheDocument();

    // 「继续创建」：恢复该账本，不显示「还没创建完」提示。
    fireEvent.click(within(card).getByRole("button", { name: "继续创建" }));
    expect(setupWizardActions.loadWizard).toHaveBeenCalledTimes(1);
    const dialog = await screen.findByRole("dialog", { name: "创建账本" });
    expect(
      within(dialog).queryByText(inProgressNotice),
    ).not.toBeInTheDocument();
  });

  it("有创建中账本时「创建第一个账本」打开该账本的向导并提示", async () => {
    renderDashboard(
      {
        data: createNoLedgerDashboardViewData(),
        setupInProgress: { name: "我们家", step: 2 },
      },
      createLedgerSetupProgressFixture({ name: "我们家", step: 2 }),
    );

    fireEvent.click(screen.getByRole("button", { name: "创建第一个账本" }));

    const dialog = await screen.findByRole("dialog", { name: "创建账本" });
    expect(within(dialog).getByText(inProgressNotice)).toBeInTheDocument();
  });

  it("有已完成账本时不显示继续创建卡片", () => {
    renderDashboard({ setupInProgress: { name: "我们家", step: 2 } });

    expect(screen.getByText("早呀，今天也好好记录")).toBeInTheDocument();
    expect(
      screen.queryByRole("region", { name: /还没创建完/ }),
    ).not.toBeInTheDocument();
  });
});
