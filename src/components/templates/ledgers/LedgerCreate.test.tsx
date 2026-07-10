import {
  cleanup,
  fireEvent,
  render,
  screen,
  within,
} from "@testing-library/react";
import { type ReactNode } from "react";
import { afterEach, describe, expect, it, vi } from "vitest";

import { UserThemeProvider } from "theme/UserThemeProvider";

import { LedgerCreateTemplate } from "./LedgerCreate";

const routerReplaceMock = vi.hoisted(() => vi.fn());

vi.mock("next/navigation", () => ({
  useRouter: () => ({ replace: routerReplaceMock }),
}));

afterEach(() => {
  cleanup();
  vi.clearAllMocks();
  window.localStorage.clear();
  document.documentElement.removeAttribute("data-user-theme");
  window.history.replaceState(null, "", "/ledgers/new");
});

function renderWithUserTheme(children: ReactNode) {
  return render(
    <UserThemeProvider storageScope="ledger-create-template-test">
      {children}
    </UserThemeProvider>,
  );
}

const view = {
  backHref: "/ledgers",
  defaults: {
    baseCurrency: "JPY",
    displayColor: "amber" as const,
    displayName: "DENG SONGWEN",
    ledgerName: "家庭账本",
  },
};

describe("LedgerCreateTemplate", () => {
  it("按照设计显示创建表单和默认值", () => {
    const { container } = renderWithUserTheme(
      <LedgerCreateTemplate
        {...view}
        createLedgerAction={vi.fn(async () => {})}
        errorMessage={null}
      />,
    );

    expect(
      within(container).getByRole("heading", { name: "创建新账本" }),
    ).toBeInTheDocument();
    expect(screen.getByLabelText("账本名称")).toHaveValue("家庭账本");
    expect(screen.getByLabelText("默认货币")).toHaveTextContent("JPY 日元");
    expect(screen.getByLabelText("我的显示名")).toHaveValue("DENG SONGWEN");
    expect(
      screen.getByRole("radiogroup", { name: "我的个性色" }),
    ).toBeInTheDocument();
    expect(screen.getByLabelText("琥珀橙")).toBeChecked();
  });

  it("显示系统自动初始化内容和操作按钮", () => {
    const { container } = renderWithUserTheme(
      <LedgerCreateTemplate
        {...view}
        createLedgerAction={vi.fn(async () => {})}
        errorMessage={null}
      />,
    );

    expect(within(container).getByText("默认账户：现金")).toBeInTheDocument();
    expect(
      within(container).getByText(
        "默认分类：工资收入、其他收入、饮食、住房、出行等",
      ),
    ).toBeInTheDocument();
    expect(
      within(container).getByText("当前用户将成为账本所有者"),
    ).toBeInTheDocument();

    const backLinks = within(container).getAllByRole("link", { name: "返回" });
    expect(backLinks).toHaveLength(2);
    backLinks.forEach((backLink) => {
      expect(backLink).toHaveAttribute("href", "/ledgers");
    });

    expect(
      within(container).getByRole("button", { name: "创建账本" }),
    ).toBeInTheDocument();
  });

  it("可以选择其他个性色并清空账本名称", () => {
    renderWithUserTheme(
      <LedgerCreateTemplate
        {...view}
        createLedgerAction={vi.fn(async () => {})}
        errorMessage={null}
      />,
    );

    fireEvent.click(screen.getByLabelText("粉樱"));
    expect(screen.getByLabelText("粉樱")).toBeChecked();

    fireEvent.click(screen.getByRole("button", { name: "清空账本名称" }));
    expect(screen.getByLabelText("账本名称")).toHaveValue("");
  });

  it("传入错误信息时显示失败反馈", () => {
    renderWithUserTheme(
      <LedgerCreateTemplate
        {...view}
        createLedgerAction={vi.fn(async () => {})}
        errorKey="error-key-1"
        errorMessage="账本创建失败。请稍后重试。"
      />,
    );

    expect(screen.getByRole("alert")).toBeInTheDocument();
    expect(screen.getByText("账本创建失败。请稍后重试。")).toBeInTheDocument();
  });
});
