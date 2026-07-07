import {
  cleanup,
  fireEvent,
  render,
  screen,
  waitFor,
  within,
} from "@testing-library/react";
import { StrictMode, type ReactNode } from "react";
import { afterEach, describe, expect, it, vi } from "vitest";

import { routePaths } from "config/paths";
import { UserThemeProvider } from "theme/UserThemeProvider";

import { AccountsTemplate } from "./Accounts";

const routerReplaceMock = vi.hoisted(() => vi.fn());

vi.mock("next/navigation", () => ({
  useRouter: () => ({ replace: routerReplaceMock }),
}));

afterEach(() => {
  cleanup();
  vi.clearAllMocks();
  window.localStorage.clear();
  document.documentElement.removeAttribute("data-user-theme");
  window.history.replaceState(null, "", "/");
});

function renderWithUserTheme(children: ReactNode) {
  return render(
    <UserThemeProvider storageScope="accounts-template-test">
      {children}
    </UserThemeProvider>,
  );
}

const baseProps = {
  accounts: [],
  archiveAccountAction: vi.fn(async () => {}),
  baseCurrency: "JPY",
  createAccountAction: vi.fn(async () => {}),
  errorMessage: null,
  holderOptions: [],
  ledgerName: "家庭账本",
  updateAccountAction: vi.fn(async () => {}),
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
      within(container).getByRole("link", { name: "返回" }),
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

  it("显示账户页面专用背景", () => {
    const { container } = renderWithUserTheme(
      <AccountsTemplate {...baseProps} />,
    );

    expect(
      within(container).getByTestId("accounts-page-background"),
    ).toBeInTheDocument();
  });

  it("传入错误信息时显示错误反馈弹窗", () => {
    renderWithUserTheme(
      <AccountsTemplate
        {...baseProps}
        errorKey="error-key-1"
        errorMessage="账户新增失败。"
      />,
    );

    expect(screen.getByRole("alert")).toBeInTheDocument();
    expect(screen.getByText("账户操作失败")).toBeInTheDocument();
    expect(screen.getByText("账户新增失败。")).toBeInTheDocument();
  });

  it("无错误信息时不显示错误反馈弹窗", () => {
    const { container } = renderWithUserTheme(
      <AccountsTemplate {...baseProps} />,
    );

    expect(within(container).queryByRole("alert")).toBeNull();
  });

  it("关闭错误弹窗后再次收到相同错误信息也会重新弹出", () => {
    window.history.replaceState(
      null,
      "",
      "/accounts?error=create_failed&errorKey=error-key-1",
    );
    const { rerender } = renderWithUserTheme(
      <AccountsTemplate
        {...baseProps}
        errorKey="error-key-1"
        errorMessage="账户新增失败。"
      />,
    );

    expect(screen.getByText("账户新增失败。")).toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: "关闭" }));

    expect(routerReplaceMock).toHaveBeenCalledWith("/accounts", {
      scroll: false,
    });

    rerender(
      <UserThemeProvider storageScope="accounts-template-test">
        <AccountsTemplate {...baseProps} errorKey={null} errorMessage={null} />
      </UserThemeProvider>,
    );

    window.history.replaceState(
      null,
      "",
      "/accounts?error=create_failed&errorKey=error-key-2",
    );
    rerender(
      <UserThemeProvider storageScope="accounts-template-test">
        <AccountsTemplate
          {...baseProps}
          errorKey="error-key-2"
          errorMessage="账户新增失败。"
        />
      </UserThemeProvider>,
    );

    expect(screen.getByRole("alert")).toBeInTheDocument();
    expect(screen.getByText("账户新增失败。")).toBeInTheDocument();
  });

  it("相同错误信息但 errorKey 不同时，会各自入队并叠加显示", () => {
    const { rerender } = renderWithUserTheme(
      <AccountsTemplate
        {...baseProps}
        errorKey="error-key-1"
        errorMessage="账户新增失败。"
      />,
    );

    rerender(
      <UserThemeProvider storageScope="accounts-template-test">
        <AccountsTemplate
          {...baseProps}
          errorKey="error-key-2"
          errorMessage="账户新增失败。"
        />
      </UserThemeProvider>,
    );

    expect(screen.getAllByRole("alert")).toHaveLength(2);
    expect(screen.getAllByText("账户新增失败。")).toHaveLength(2);
  });

  it("StrictMode 下同一个 errorKey 的 effect 重复执行也只入队一次", () => {
    render(
      <StrictMode>
        <UserThemeProvider storageScope="accounts-template-test">
          <AccountsTemplate
            {...baseProps}
            errorKey="error-key-1"
            errorMessage="账户新增失败。"
          />
        </UserThemeProvider>
      </StrictMode>,
    );

    expect(screen.getAllByRole("alert")).toHaveLength(1);
  });

  it("多条错误反馈可以叠加显示，互不覆盖", () => {
    const { rerender } = renderWithUserTheme(
      <AccountsTemplate
        {...baseProps}
        errorKey="error-key-1"
        errorMessage="账户新增失败。"
      />,
    );

    rerender(
      <UserThemeProvider storageScope="accounts-template-test">
        <AccountsTemplate
          {...baseProps}
          errorKey="error-key-2"
          errorMessage="账户更新失败。请确认账户名称是否重复，或稍后重试。"
        />
      </UserThemeProvider>,
    );

    expect(screen.getAllByRole("alert")).toHaveLength(2);
    expect(screen.getByText("账户新增失败。")).toBeInTheDocument();
    expect(
      screen.getByText("账户更新失败。请确认账户名称是否重复，或稍后重试。"),
    ).toBeInTheDocument();
  });

  it("关闭其中一条错误反馈时，其他仍在队列中的反馈不受影响", () => {
    const { rerender } = renderWithUserTheme(
      <AccountsTemplate
        {...baseProps}
        errorKey="error-key-1"
        errorMessage="账户新增失败。"
      />,
    );

    rerender(
      <UserThemeProvider storageScope="accounts-template-test">
        <AccountsTemplate
          {...baseProps}
          errorKey="error-key-2"
          errorMessage="账户更新失败。请确认账户名称是否重复，或稍后重试。"
        />
      </UserThemeProvider>,
    );

    fireEvent.click(screen.getAllByRole("button", { name: "关闭" })[0]);

    expect(screen.queryByText("账户新增失败。")).toBeNull();
    expect(
      screen.getByText("账户更新失败。请确认账户名称是否重复，或稍后重试。"),
    ).toBeInTheDocument();
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
      <UserThemeProvider storageScope="accounts-template-test">
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

  it("点击新增按钮后显示新增账户弹窗", () => {
    const { container } = renderWithUserTheme(
      <AccountsTemplate {...baseProps} />,
    );

    const createButton = within(container).getByRole("button", {
      name: "新增账户",
    });

    expect(createButton).toHaveClass("MuiButton-root");
    expect(createButton).not.toHaveClass("MuiFab-root");

    fireEvent.click(createButton);

    expect(
      screen.getByRole("heading", { name: "新增账户" }),
    ).toBeInTheDocument();
  });

  it("新增账户弹窗打开时保存成功会关闭弹窗并显示新增成功反馈", async () => {
    const { container, rerender } = renderWithUserTheme(
      <AccountsTemplate {...baseProps} />,
    );

    fireEvent.click(
      within(container).getByRole("button", { name: "新增账户" }),
    );
    expect(
      screen.getByRole("heading", { name: "新增账户" }),
    ).toBeInTheDocument();

    window.history.replaceState(null, "", "/accounts?result=created");
    rerender(
      <UserThemeProvider storageScope="accounts-template-test">
        <AccountsTemplate {...baseProps} saveResult="created" />
      </UserThemeProvider>,
    );

    await waitFor(() => {
      expect(
        screen.queryByRole("heading", { name: "新增账户" }),
      ).not.toBeInTheDocument();
    });
    expect(screen.getByRole("status")).toHaveTextContent("新增成功");
  });

  it("编辑账户弹窗打开时保存成功会关闭弹窗并显示保存成功反馈", async () => {
    const account = {
      id: "00000000-0000-4000-8000-000000000001",
      name: "三菱UFJ银行",
      type: "bank" as const,
      currency: "JPY",
      initial_balance: 100000,
      current_balance: 85000,
      sort_order: 1,
      created_at: "2026-01-01T00:00:00.000Z",
      holders: [],
    };
    const { container, rerender } = renderWithUserTheme(
      <AccountsTemplate {...baseProps} accounts={[account]} />,
    );

    fireEvent.click(within(container).getByText("三菱UFJ银行"));
    expect(
      screen.getByRole("heading", { name: "编辑账户" }),
    ).toBeInTheDocument();

    window.history.replaceState(null, "", "/accounts?result=updated");
    rerender(
      <UserThemeProvider storageScope="accounts-template-test">
        <AccountsTemplate
          {...baseProps}
          accounts={[account]}
          saveResult="updated"
        />
      </UserThemeProvider>,
    );

    await waitFor(() => {
      expect(
        screen.queryByRole("heading", { name: "编辑账户" }),
      ).not.toBeInTheDocument();
    });
    await waitFor(() => {
      expect(screen.getByRole("status")).toHaveTextContent("保存成功");
    });
  });
});
