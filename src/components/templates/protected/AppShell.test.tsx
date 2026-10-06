import { cleanup, render, within } from "@testing-library/react";
import type { ReactNode } from "react";
import { renderToString } from "react-dom/server";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { getUserThemeCssVariables } from "theme/userThemeCssVariables";

import { AppShell } from "./AppShell";

let mockedPathname = "/dashboard";

vi.mock("next/navigation", () => ({
  usePathname: () => mockedPathname,
}));

vi.mock("next/link", () => ({
  default: ({
    children,
    href,
    ...props
  }: {
    children: ReactNode;
    href: string;
  }) => (
    <a href={href} {...props}>
      {children}
    </a>
  ),
}));

afterEach(() => {
  cleanup();
});

function createAppShell(themeKey: "amberWarmth" | "lavenderDream") {
  return (
    <AppShell
      themeKey={themeKey}
      transactionColorScheme="expense_green_income_red"
    >
      <div>内容</div>
    </AppShell>
  );
}

function renderAppShell() {
  return render(createAppShell("amberWarmth"));
}

describe("AppShell", () => {
  beforeEach(() => {
    mockedPathname = "/dashboard";
  });

  it("/transactions 时明细导航为选中状态", () => {
    mockedPathname = "/transactions";
    const { container } = renderAppShell();

    expect(
      within(container)
        .getByRole("link", { name: "明细" })
        .getAttribute("aria-current"),
    ).toBe("page");
  });

  it("/transactions/new 时明细导航不是选中状态", () => {
    mockedPathname = "/transactions/new";
    const { container } = renderAppShell();

    expect(
      within(container)
        .getByRole("link", { name: "明细" })
        .getAttribute("aria-current"),
    ).toBeNull();
  });

  it("服务端渲染首帧即输出用户主题的 CSS 变量，而不是默认主题", () => {
    const markup = renderToString(createAppShell("lavenderDream"));
    const lavenderAccent = getUserThemeCssVariables(
      "lavenderDream",
      "expense_green_income_red",
    )["--user-theme-bottom-nav-active"];
    const amberAccent = getUserThemeCssVariables(
      "amberWarmth",
      "expense_green_income_red",
    )["--user-theme-bottom-nav-active"];

    expect(lavenderAccent).not.toBe(amberAccent);
    expect(markup).toContain(
      `--user-theme-bottom-nav-active:${lavenderAccent}`,
    );
    expect(markup).not.toContain(
      `--user-theme-bottom-nav-active:${amberAccent}`,
    );
  });

  it("新增记录按钮链接到新增记账页面", () => {
    const { container } = renderAppShell();

    expect(
      within(container).getByLabelText("新增记录").getAttribute("href"),
    ).toBe("/transactions/new");
  });
});
