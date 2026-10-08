import {
  cleanup,
  fireEvent,
  render,
  screen,
  within,
} from "@testing-library/react";
import { ThemeProvider } from "@mui/material/styles";
import type { ComponentProps } from "react";
import { afterEach, describe, expect, it, vi } from "vitest";

import {
  currentLedgerErrorCodes,
  currentLedgerErrorMessages,
  type LedgerWithMemberCount,
} from "internal/ledger";
import {
  createLedgerSetupWizardLauncherActionMocks,
  getCurrentStepItem,
} from "organisms/ledgers/LedgerSetupWizard/ledgerSetupWizardTestUtils";
import { ConfirmDialogTestProviders } from "test/ConfirmDialogTestProviders";
import { createLedgerSetupProgressFixture } from "test/mocks/ledgerSetup";
import { designTokens, theme } from "theme/theme";

import { LedgersTemplate } from "./Ledgers";

const routerReplaceMock = vi.hoisted(() => vi.fn());

vi.mock("next/navigation", () => ({
  useRouter: () => ({ refresh: vi.fn(), replace: routerReplaceMock }),
}));

const updateCurrentLedgerAction = vi.fn(async () => {});

const ledgers: LedgerWithMemberCount[] = [
  {
    id: "00000000-0000-4000-8000-000000000001",
    name: "家庭账本",
    baseCurrency: "JPY",
    currentUserRole: "owner",
    memberCount: 2,
  },
  {
    id: "00000000-0000-4000-8000-000000000002",
    name: "旅行账本",
    baseCurrency: "JPY",
    currentUserRole: "admin",
    memberCount: 1,
  },
];

const defaultProps: ComponentProps<typeof LedgersTemplate> = {
  currentLedgerId: "00000000-0000-4000-8000-000000000001",
  errorMessage: null,
  ledgers,
  setupWizardActions: createLedgerSetupWizardLauncherActionMocks(),
  switchResult: null,
  updateCurrentLedgerAction,
};

function renderTemplate(
  overrides: Partial<ComponentProps<typeof LedgersTemplate>> = {},
) {
  return render(
    <ThemeProvider theme={theme}>
      <ConfirmDialogTestProviders>
        <LedgersTemplate {...defaultProps} {...overrides} />
      </ConfirmDialogTestProviders>
    </ThemeProvider>,
  );
}

/** 有创建中账本时的渲染：「新增账本」「继续创建」都打开该账本的向导（只有「新增账本」提示）。 */
function renderWithSetupInProgress() {
  const progress = createLedgerSetupProgressFixture({
    name: "爸妈账本",
    step: 2,
  });
  const setupWizardActions =
    createLedgerSetupWizardLauncherActionMocks(progress);
  renderTemplate({
    setupInProgress: { name: progress.setup.name, step: progress.setup.step },
    setupWizardActions,
  });
  return setupWizardActions;
}

afterEach(() => {
  cleanup();
  vi.clearAllMocks();
  window.history.replaceState(null, "", "/");
});

describe("LedgersTemplate", () => {
  it("显示账本管理页标题和新增账本入口", () => {
    const { container } = renderTemplate();

    expect(
      within(container).getByRole("heading", { name: "账本管理" }),
    ).toBeInTheDocument();
    const createButton = within(container).getByRole("button", {
      name: /新增账本/,
    });

    expect(getComputedStyle(createButton).borderRadius).toBe(
      `${designTokens.radius.full}px`,
    );
    expect(getComputedStyle(createButton).fontWeight).toBe("700");
    expect(getComputedStyle(createButton).minHeight).toBe("40px");
  });

  it("点击「新增账本」打开创建账本向导", async () => {
    renderTemplate();

    fireEvent.click(screen.getByRole("button", { name: /新增账本/ }));

    const dialog = await screen.findByRole("dialog", { name: "创建账本" });
    expect(defaultProps.setupWizardActions.loadWizard).toHaveBeenCalledTimes(1);
    expect(
      within(dialog).getByRole("heading", { name: "先给账本起个名字吧" }),
    ).toBeInTheDocument();
  });

  it("有创建中账本时显示「创建中」条目，不提供切换使用与账本设置入口", () => {
    renderWithSetupInProgress();

    const item = screen.getByRole("region", { name: "爸妈账本（创建中）" });
    expect(within(item).getByText("爸妈账本")).toBeInTheDocument();
    expect(within(item).getByText("创建中")).toBeInTheDocument();
    expect(within(item).getByText("进行到第 2 步 · 账户")).toBeInTheDocument();
    expect(within(item).queryByText("切换使用")).not.toBeInTheDocument();
    expect(within(item).queryByRole("link")).not.toBeInTheDocument();
    expect(
      screen.queryByRole("button", { name: "切换到爸妈账本" }),
    ).not.toBeInTheDocument();
  });

  it("点击「继续创建」打开该账本的向导，不显示提示", async () => {
    const setupWizardActions = renderWithSetupInProgress();

    fireEvent.click(screen.getByRole("button", { name: "继续创建爸妈账本" }));

    const dialog = await screen.findByRole("dialog", { name: "创建账本" });
    expect(setupWizardActions.loadWizard).toHaveBeenCalledTimes(1);
    expect(getCurrentStepItem()).toHaveTextContent("账户");
    expect(
      within(dialog).queryByText("你有一个账本还没创建完，请先继续创建。"),
    ).not.toBeInTheDocument();
  });

  it("有创建中账本时「新增账本」同样打开该账本的向导并提示", async () => {
    renderWithSetupInProgress();

    fireEvent.click(screen.getByRole("button", { name: /新增账本/ }));

    const dialog = await screen.findByRole("dialog", { name: "创建账本" });
    expect(
      within(dialog).getByText("你有一个账本还没创建完，请先继续创建。"),
    ).toBeInTheDocument();
  });

  it("显示当前账本摘要", () => {
    const { container } = renderTemplate();

    const currentSection = within(container).getByRole("region", {
      name: "当前账本",
    });

    expect(within(currentSection).getByText("家庭账本")).toBeInTheDocument();
    expect(within(currentSection).getByText("成员")).toBeInTheDocument();
    expect(within(currentSection).getByText("2 人")).toBeInTheDocument();
    expect(within(currentSection).getByText("默认货币")).toBeInTheDocument();
    expect(within(currentSection).getByText("JPY")).toBeInTheDocument();
    expect(within(currentSection).getByText("我的角色")).toBeInTheDocument();
    expect(within(currentSection).getByText("所有者")).toBeInTheDocument();
  });

  it("账本列表显示账本名称和当前使用状态", () => {
    const { container } = renderTemplate();

    expect(within(container).getAllByText("家庭账本").length).toBeGreaterThan(
      0,
    );
    expect(within(container).getByText("旅行账本")).toBeInTheDocument();
    expect(within(container).getAllByText("使用中").length).toBeGreaterThan(0);
  });

  it("非当前账本显示切换按钮并提交目标账本 ID", () => {
    renderTemplate();

    const switchButton = screen.getByRole("button", {
      name: "切换到旅行账本",
    });
    const switchForm = switchButton.closest("form");
    const ledgerIdInput = switchForm?.querySelector('input[name="ledgerId"]');

    expect(switchButton).toHaveTextContent("切换使用");
    expect(switchButton.closest("a")).toBeNull();
    expect(switchForm).not.toBeNull();
    expect(ledgerIdInput).toHaveValue("00000000-0000-4000-8000-000000000002");
    expect(
      screen.queryByRole("button", { name: "切换到家庭账本" }),
    ).not.toBeInTheDocument();
    expect(
      screen.getByText(
        "点击「切换使用」可切换当前账本，点击卡片可进入账本设置。",
      ),
    ).toBeInTheDocument();
  });

  it("切换账本提交中保留迁移前的背景色和进度指示器颜色", async () => {
    const pendingAction = vi.fn(() => new Promise<void>(() => {}));
    renderTemplate({ updateCurrentLedgerAction: pendingAction });

    fireEvent.click(screen.getByRole("button", { name: "切换到旅行账本" }));

    const progress = await screen.findByRole("progressbar", {
      name: "正在切换到旅行账本",
    });
    const switchButton = progress.closest("button");

    expect(switchButton).toBeDisabled();
    expect(getComputedStyle(switchButton!).background).toBe(
      "var(--user-theme-fab-bg)",
    );
    expect(getComputedStyle(switchButton!).backgroundColor).toBe(
      "rgba(0, 0, 0, 0.12)",
    );
    expect(getComputedStyle(switchButton!).color).toBe("rgba(0, 0, 0, 0.26)");
    expect(getComputedStyle(progress).color).toBe("rgba(0, 0, 0, 0.26)");
  });

  it("点击账本列表项进入账本设置页", () => {
    renderTemplate();

    expect(
      screen.getByRole("link", { name: "进入旅行账本设置" }),
    ).toHaveAttribute(
      "href",
      "/ledgers/00000000-0000-4000-8000-000000000002/settings",
    );
  });

  it("切换成功后显示新当前账本名称", () => {
    renderTemplate({
      currentLedgerId: "00000000-0000-4000-8000-000000000002",
      switchResult: "switched",
    });

    expect(screen.getByText("切换成功")).toBeInTheDocument();
    expect(screen.getByText("已切换至「旅行账本」。")).toBeInTheDocument();
  });

  it("切换失败后显示错误反馈", async () => {
    renderTemplate({
      errorKey: "switch-error-1",
      errorMessage:
        currentLedgerErrorMessages[currentLedgerErrorCodes.updateFailed],
    });

    expect(await screen.findByText("账本切换失败")).toBeInTheDocument();
    expect(
      screen.getByText(
        currentLedgerErrorMessages[currentLedgerErrorCodes.updateFailed],
      ),
    ).toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: "关闭" }));
    expect(routerReplaceMock).not.toHaveBeenCalled();
  });

  it("无账本时显示空状态", () => {
    const { container } = renderTemplate({
      currentLedgerId: "",
      ledgers: [],
    });

    expect(within(container).getByText("你还没有任何账本")).toBeInTheDocument();

    fireEvent.click(
      within(container).getAllByRole("button", { name: /新增账本/ })[1],
    );
    expect(defaultProps.setupWizardActions.loadWizard).toHaveBeenCalledTimes(1);
  });
});
