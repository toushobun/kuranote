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

const baseProps = {
  accounts: [],
  archiveAccountAction: vi.fn(async () => ({})),
  baseCurrency: "JPY",
  createAccountAction: vi.fn(async () => ({})),
  initialErrorMessage: null,
  holderOptions: [],
  ledgerName: "家庭账本",
  updateAccountAction: vi.fn(async () => ({})),
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

  it("传入错误信息时显示错误反馈弹窗", () => {
    renderWithUserTheme(
      <AccountsTemplate
        {...baseProps}
        initialErrorKey="error-key-1"
        initialErrorMessage="账户新增失败。"
      />,
    );

    expect(screen.getByRole("alert")).toBeInTheDocument();
    expect(screen.getByText("账户操作失败")).toBeInTheDocument();
    expect(screen.getByText("账户新增失败。")).toBeInTheDocument();
  });

  it("Server Action 返回错误状态时弹窗且不修改当前 URL", async () => {
    window.history.replaceState(null, "", "/accounts?tab=all");
    const createAccountAction = vi.fn(async () => ({
      error: "账户新增失败。",
      errorKey: "action-error-key-1",
    }));
    const { container } = renderWithUserTheme(
      <AccountsTemplate
        {...baseProps}
        createAccountAction={createAccountAction}
      />,
    );

    fireEvent.click(
      within(container).getByRole("button", { name: "新增账户" }),
    );
    fireEvent.submit(document.querySelector("form") as HTMLFormElement);

    await waitFor(() => {
      expect(screen.getByText("账户新增失败。")).toBeInTheDocument();
    });
    const alert = screen.getByRole("alert");
    const dialog = screen.getByRole("dialog");
    expect(alert).toBeVisible();
    expect(dialog).toBeVisible();
    expect(container).not.toContainElement(alert);
    expect(
      Number(getComputedStyle(alert.closest(".MuiSnackbar-root")!).zIndex),
    ).toBeGreaterThan(
      Number(getComputedStyle(dialog.closest(".MuiModal-root")!).zIndex),
    );
    expect(createAccountAction).toHaveBeenCalled();
    expect(routerReplaceMock).not.toHaveBeenCalled();
    expect(`${window.location.pathname}${window.location.search}`).toBe(
      "/accounts?tab=all",
    );
  });

  it("无错误信息时不显示错误反馈弹窗", () => {
    const { container } = renderWithUserTheme(
      <AccountsTemplate {...baseProps} />,
    );

    expect(within(container).queryByRole("alert")).toBeNull();
  });

  it("关闭错误弹窗后再次收到相同错误信息也会重新弹出", () => {
    window.history.replaceState(null, "", "/accounts?tab=all");
    const { rerender } = renderWithUserTheme(
      <AccountsTemplate
        {...baseProps}
        initialErrorKey="error-key-1"
        initialErrorMessage="账户新增失败。"
      />,
    );

    expect(screen.getByText("账户新增失败。")).toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: "关闭" }));

    expect(routerReplaceMock).not.toHaveBeenCalled();

    rerender(
      <UserThemeProvider>
        <AccountsTemplate
          {...baseProps}
          initialErrorKey={null}
          initialErrorMessage={null}
        />
      </UserThemeProvider>,
    );

    window.history.replaceState(null, "", "/accounts?tab=all");
    rerender(
      <UserThemeProvider>
        <AccountsTemplate
          {...baseProps}
          initialErrorKey="error-key-2"
          initialErrorMessage="账户新增失败。"
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
        initialErrorKey="error-key-1"
        initialErrorMessage="账户新增失败。"
      />,
    );

    rerender(
      <UserThemeProvider>
        <AccountsTemplate
          {...baseProps}
          initialErrorKey="error-key-2"
          initialErrorMessage="账户新增失败。"
        />
      </UserThemeProvider>,
    );

    expect(screen.getAllByRole("alert")).toHaveLength(2);
    expect(screen.getAllByText("账户新增失败。")).toHaveLength(2);
  });

  it("StrictMode 下同一个 errorKey 的 effect 重复执行也只入队一次", () => {
    render(
      <StrictMode>
        <UserThemeProvider>
          <AccountsTemplate
            {...baseProps}
            initialErrorKey="error-key-1"
            initialErrorMessage="账户新增失败。"
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
        initialErrorKey="error-key-1"
        initialErrorMessage="账户新增失败。"
      />,
    );

    rerender(
      <UserThemeProvider>
        <AccountsTemplate
          {...baseProps}
          initialErrorKey="error-key-2"
          initialErrorMessage="账户更新失败。请确认账户名称是否重复，或稍后重试。"
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
        initialErrorKey="error-key-1"
        initialErrorMessage="账户新增失败。"
      />,
    );

    rerender(
      <UserThemeProvider>
        <AccountsTemplate
          {...baseProps}
          initialErrorKey="error-key-2"
          initialErrorMessage="账户更新失败。请确认账户名称是否重复，或稍后重试。"
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
      <UserThemeProvider>
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
      <UserThemeProvider>
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

  describe("通过参数打开新增弹框", () => {
    const returnTo = "/transactions/new?type=expense";

    function renderWithCreateParam(
      props: Partial<React.ComponentProps<typeof AccountsTemplate>> = {},
    ) {
      window.history.replaceState(
        null,
        "",
        `/accounts?create=1&returnTo=${encodeURIComponent(returnTo)}`,
      );
      return renderWithUserTheme(
        <AccountsTemplate
          {...baseProps}
          openCreateDialog
          returnTo={returnTo}
          {...props}
        />,
      );
    }

    function getReturnToInput() {
      return document.querySelector<HTMLInputElement>('input[name="returnTo"]');
    }

    function cancelCreateDialog() {
      fireEvent.click(screen.getByRole("button", { name: "取消" }));
    }

    async function reopenCreateDialogFromButton(container: HTMLElement) {
      await waitFor(() =>
        expect(screen.queryByRole("heading", { name: "新增账户" })).toBeNull(),
      );
      fireEvent.click(
        within(container).getByRole("button", { name: "新增账户" }),
      );
      expect(
        screen.getByRole("heading", { name: "新增账户" }),
      ).toBeInTheDocument();
    }

    it("带参数进入时打开新增弹框并清除参数", () => {
      renderWithCreateParam();

      expect(
        screen.getByRole("heading", { name: "新增账户" }),
      ).toBeInTheDocument();
      expect(routerReplaceMock).toHaveBeenCalledExactlyOnceWith("/accounts", {
        scroll: false,
      });
    });

    it("未保存直接关闭时回到 returnTo", () => {
      renderWithCreateParam();

      cancelCreateDialog();

      expect(routerPushMock).toHaveBeenCalledExactlyOnceWith(returnTo);
    });

    it("关闭后从页面按钮再次新增时不带 returnTo，关闭也不再跳转", async () => {
      const { container } = renderWithCreateParam();
      cancelCreateDialog();
      routerPushMock.mockClear();

      await reopenCreateDialogFromButton(container);

      expect(getReturnToInput()).toBeNull();
      cancelCreateDialog();
      expect(routerPushMock).not.toHaveBeenCalled();
    });

    it("新增表单提交合法的 returnTo", () => {
      renderWithCreateParam();

      expect(getReturnToInput()).toHaveValue(returnTo);
    });

    it("没有 returnTo 时不提交返回路径，关闭时停留在账户页", () => {
      renderWithCreateParam({ returnTo: null });

      expect(getReturnToInput()).toBeNull();
      cancelCreateDialog();
      expect(routerPushMock).not.toHaveBeenCalled();
    });

    it("没有管理权限时不打开新增弹框", () => {
      renderWithCreateParam({ canManageAccounts: false });

      expect(screen.queryByRole("heading", { name: "新增账户" })).toBeNull();
    });

    it("不带参数时不打开新增弹框也不清除参数", () => {
      renderWithUserTheme(<AccountsTemplate {...baseProps} />);

      expect(screen.queryByRole("heading", { name: "新增账户" })).toBeNull();
      expect(routerReplaceMock).not.toHaveBeenCalled();
    });

    it("只带 returnTo 不带打开参数时，按钮打开的弹框不带 returnTo", () => {
      const { container } = renderWithUserTheme(
        <AccountsTemplate {...baseProps} returnTo={returnTo} />,
      );

      fireEvent.click(
        within(container).getByRole("button", { name: "新增账户" }),
      );

      expect(getReturnToInput()).toBeNull();
      cancelCreateDialog();
      expect(routerPushMock).not.toHaveBeenCalled();
    });
  });
});
