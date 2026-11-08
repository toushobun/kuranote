import { cleanup, render, within } from "@testing-library/react";
import { afterEach, describe, expect, it } from "vitest";

import { accountPageMessages } from "config/accountMessages";
import { routePaths } from "config/paths";

import AccountsLoadingPage from "./loading";

afterEach(() => {
  cleanup();
});

describe("AccountsLoadingPage", () => {
  it("显示账户管理页的加载状态", () => {
    const { container } = render(<AccountsLoadingPage />);

    expect(
      within(container).getByRole("status", { name: "账户数据加载中" }),
    ).toHaveAttribute("aria-busy", "true");
  });

  it("返回按钮、标题与副标题直接显示真实内容", () => {
    const { container } = render(<AccountsLoadingPage />);

    expect(
      within(container).getByRole("link", {
        name: accountPageMessages.backToSettings,
      }),
    ).toHaveAttribute("href", routePaths.settings);
    expect(
      within(container).getByRole("heading", {
        name: accountPageMessages.title,
      }),
    ).toBeInTheDocument();
    expect(
      within(container).getByText(accountPageMessages.subtitle),
    ).toBeInTheDocument();
  });
});
