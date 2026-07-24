import {
  cleanup,
  fireEvent,
  render,
  screen,
  waitFor,
  within,
} from "@testing-library/react";
import { type ReactNode } from "react";
import { afterEach, describe, expect, it, vi } from "vitest";

import { UserThemeProvider } from "theme/UserThemeProvider";
import type {
  LedgerCreateActionState,
  LedgerCreateStateAction,
} from "types/ledgers";

import { LedgerCreateTemplate } from "./LedgerCreate";

const idleAction: LedgerCreateStateAction = async (state) => state;

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

function renderTemplate(action: LedgerCreateStateAction = idleAction) {
  return renderWithUserTheme(
    <LedgerCreateTemplate {...view} createLedgerAction={action} />,
  );
}

describe("LedgerCreateTemplate", () => {
  it("按照设计显示创建表单和默认值", () => {
    const { container } = renderTemplate();

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
    const { container } = renderTemplate();

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
    renderTemplate();

    fireEvent.click(screen.getByLabelText("粉樱"));
    expect(screen.getByLabelText("粉樱")).toBeChecked();

    fireEvent.click(screen.getByRole("button", { name: "清空账本名称" }));
    expect(screen.getByLabelText("账本名称")).toHaveValue("");
  });

  it("创建失败时显示反馈、保留输入且 URL 保持干净", async () => {
    const action = vi.fn(
      async (): Promise<LedgerCreateActionState> => ({
        error: "账本创建失败。请确认内容后稍后重试。",
        errorKey: "create-error-1",
      }),
    );
    renderTemplate(action);

    fireEvent.change(screen.getByLabelText("账本名称"), {
      target: { value: "旅行账本" },
    });
    const currencySelect = screen.getByRole("combobox", {
      name: "默认货币",
    });
    fireEvent.mouseDown(currencySelect);
    fireEvent.click(screen.getByRole("option", { name: "USD 美元" }));
    fireEvent.change(screen.getByLabelText("我的显示名"), {
      target: { value: "旅人" },
    });
    fireEvent.click(screen.getByLabelText("天空蓝"));
    fireEvent.click(screen.getByRole("button", { name: "创建账本" }));

    const alert = await screen.findByRole("alert");
    expect(alert).toHaveTextContent("账本创建失败");
    expect(alert).toHaveTextContent("账本创建失败。请确认内容后稍后重试。");
    expect(screen.getByLabelText("账本名称")).toHaveValue("旅行账本");
    expect(currencySelect).toHaveTextContent("USD 美元");
    expect(screen.getByLabelText("我的显示名")).toHaveValue("旅人");
    expect(screen.getByLabelText("天空蓝")).toBeChecked();
    expect(window.location.search).toBe("");
    expect(window.location.href).not.toContain("errorKey");
  });

  it("相同错误使用新错误标识时会再次展示", async () => {
    let errorCount = 0;
    const action = vi.fn(async (): Promise<LedgerCreateActionState> => {
      errorCount += 1;
      return {
        error: "账本创建失败。请确认内容后稍后重试。",
        errorKey: `create-error-${errorCount}`,
      };
    });
    renderTemplate(action);

    fireEvent.click(screen.getByRole("button", { name: "创建账本" }));
    const firstAlert = await screen.findByRole("alert");
    fireEvent.click(within(firstAlert).getByRole("button", { name: "关闭" }));
    await waitFor(() => {
      expect(screen.queryByRole("alert")).not.toBeInTheDocument();
    });

    fireEvent.click(screen.getByRole("button", { name: "创建账本" }));

    expect(await screen.findByRole("alert")).toHaveTextContent(
      "账本创建失败。请确认内容后稍后重试。",
    );
    expect(action).toHaveBeenCalledTimes(2);
  });
});
