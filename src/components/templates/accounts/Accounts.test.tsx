import {
  cleanup,
  fireEvent,
  render,
  screen,
  within,
} from "@testing-library/react";
import type { ReactNode } from "react";
import { afterEach, describe, expect, it, vi } from "vitest";

import { routePaths } from "config/paths";
import { UserThemeProvider } from "theme/UserThemeProvider";

import { AccountsTemplate } from "./Accounts";

const routerReplaceMock = vi.hoisted(() => vi.fn());
const routerPushMock = vi.hoisted(() => vi.fn());

vi.mock("next/navigation", () => ({
  useRouter: () => ({ push: routerPushMock, replace: routerReplaceMock }),
}));

afterEach(() => {
  cleanup();
  vi.clearAllMocks();
  document.documentElement.removeAttribute("data-user-theme");
  window.history.replaceState(null, "", "/");
});

function renderWithUserTheme(children: ReactNode) {
  return render(<UserThemeProvider>{children}</UserThemeProvider>);
}

const bankAccount = {
  id: "00000000-0000-4000-8000-000000000001",
  name: "三菱UFJ银行",
  type: "bank" as const,
  currency: "JPY",
  initial_balance: 100000,
  current_balance: 85000,
  sort_order: 1,
  created_at: "2026-01-01T00:00:00.000Z",
  has_transactions: false,
  holders: [],
};

const baseProps = {
  accounts: [],
  baseCurrency: "JPY",
};

describe("AccountsTemplate", () => {
  it("显示账户页面标题", () => {
    const { container } = renderWithUserTheme(
      <AccountsTemplate {...baseProps} />,
    );

    expect(
      within(container).getByRole("heading", { name: "账户管理" }),
    ).toBeInTheDocument();
  });

  it("不显示当前账本名称", () => {
    const { container } = renderWithUserTheme(
      <AccountsTemplate {...baseProps} />,
    );

    expect(within(container).queryByText("当前账本：家庭账本")).toBeNull();
  });

  it("返回按钮指向我的页面", () => {
    const { container } = renderWithUserTheme(
      <AccountsTemplate {...baseProps} />,
    );

    expect(
      within(container).getByRole("link", { name: "返回设置" }),
    ).toHaveAttribute("href", routePaths.settings);
  });

  it("不显示重复的管理设置按钮", () => {
    const { container } = renderWithUserTheme(
      <AccountsTemplate {...baseProps} />,
    );

    expect(
      within(container).queryByRole("link", { name: "管理设置" }),
    ).toBeNull();
  });

  it("显示设置类页面共用背景", () => {
    const { container } = renderWithUserTheme(
      <AccountsTemplate {...baseProps} />,
    );

    expect(
      within(container).getByTestId("settings-page-background"),
    ).toHaveStyle({
      background: "var(--user-theme-page-bg)",
      inset: "0",
      position: "fixed",
    });
  });

  it("保存修改成功后显示反馈并清除结果参数", () => {
    window.history.replaceState(null, "", "/accounts?result=updated");
    renderWithUserTheme(
      <AccountsTemplate {...baseProps} saveResult="updated" />,
    );

    expect(screen.getByRole("status")).toHaveTextContent("保存成功");
    expect(screen.getByText("账户修改已保存。")).toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: "关闭" }));

    expect(routerReplaceMock).toHaveBeenCalledWith("/accounts", {
      scroll: false,
    });
  });

  it("新增账户成功后显示新增成功反馈", () => {
    window.history.replaceState(null, "", "/accounts?result=created");
    renderWithUserTheme(
      <AccountsTemplate {...baseProps} saveResult="created" />,
    );

    expect(screen.getByRole("status")).toHaveTextContent("新增成功");
    expect(screen.getByText("账户已创建。")).toBeInTheDocument();
  });

  it("删除账户成功后显示删除成功反馈", () => {
    window.history.replaceState(null, "", "/accounts?result=archived");
    renderWithUserTheme(
      <AccountsTemplate {...baseProps} saveResult="archived" />,
    );

    expect(screen.getByRole("status")).toHaveTextContent("删除成功");
    expect(
      screen.getByText("账户已删除，历史记录不会被删除。"),
    ).toBeInTheDocument();
  });

  it("弹窗已挂载时收到新的删除结果也会弹出反馈", () => {
    const { container, rerender } = renderWithUserTheme(
      <AccountsTemplate {...baseProps} />,
    );

    expect(within(container).queryByRole("status")).toBeNull();

    window.history.replaceState(null, "", "/accounts?result=archived");
    rerender(
      <UserThemeProvider>
        <AccountsTemplate {...baseProps} saveResult="archived" />
      </UserThemeProvider>,
    );

    expect(screen.getByRole("status")).toHaveTextContent("删除成功");
  });

  it("没有账户时显示空状态提示", () => {
    const { container } = renderWithUserTheme(
      <AccountsTemplate {...baseProps} />,
    );

    expect(within(container).getByText("还没有账户")).toBeInTheDocument();
  });

  it("显示账户总览", () => {
    const { container } = renderWithUserTheme(
      <AccountsTemplate {...baseProps} />,
    );

    expect(within(container).getByText("账户总余额")).toBeInTheDocument();
    expect(within(container).getByText("0 个")).toBeInTheDocument();
  });

  it("新增按钮链接到新增账户页面", () => {
    const { container } = renderWithUserTheme(
      <AccountsTemplate {...baseProps} />,
    );

    const createButton = within(container).getByRole("link", {
      name: "新增账户",
    });

    expect(createButton).toHaveClass("MuiButton-root");
    expect(createButton).toHaveAttribute("href", routePaths.accountsNew);
  });

  it("没有管理权限时不显示新增按钮", () => {
    const { container } = renderWithUserTheme(
      <AccountsTemplate {...baseProps} canManageAccounts={false} />,
    );

    expect(
      within(container).queryByRole("link", { name: "新增账户" }),
    ).toBeNull();
  });

  it("点账户卡片进入编辑账户页", () => {
    const { container } = renderWithUserTheme(
      <AccountsTemplate {...baseProps} accounts={[bankAccount]} />,
    );

    expect(
      within(container).getByRole("link", { name: /三菱UFJ银行/ }),
    ).toHaveAttribute("href", `/accounts/${bankAccount.id}/edit`);
  });
});
