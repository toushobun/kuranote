import {
  cleanup,
  fireEvent,
  render,
  screen,
  within,
} from "@testing-library/react";
import type { ComponentProps } from "react";
import { afterEach, describe, expect, it, vi } from "vitest";

import type { LedgerWithMemberCount } from "lib/ledger/current-ledger";

import { LedgersTemplate } from "./Ledgers";

const routerReplaceMock = vi.hoisted(() => vi.fn());

vi.mock("next/navigation", () => ({
  useRouter: () => ({ replace: routerReplaceMock }),
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
  switchResult: null,
  updateCurrentLedgerAction,
};

function renderTemplate(
  overrides: Partial<ComponentProps<typeof LedgersTemplate>> = {},
) {
  return render(<LedgersTemplate {...defaultProps} {...overrides} />);
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
    expect(
      within(container).getByRole("link", { name: /新增账本/ }),
    ).toHaveAttribute("href", "/ledgers/new");
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
      errorMessage: "账本切换失败，请稍后重试。",
    });

    expect(await screen.findByText("账本切换失败")).toBeInTheDocument();
    expect(screen.getByText("账本切换失败，请稍后重试。")).toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: "关闭" }));
    expect(routerReplaceMock).not.toHaveBeenCalled();
  });

  it("无账本时显示空状态", () => {
    const { container } = renderTemplate({
      currentLedgerId: "",
      ledgers: [],
    });

    expect(within(container).getByText("你还没有任何账本")).toBeInTheDocument();
  });
});
