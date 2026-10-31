import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { accountFormMessages } from "config/accountMessages";
import { routePaths } from "config/paths";

import AccountCreateLoading from "./loading";

describe("AccountCreateLoading", () => {
  it("显示新增账户页的加载状态", () => {
    render(<AccountCreateLoading />);

    expect(
      screen.getByRole("status", { name: accountFormMessages.loading }),
    ).toHaveAttribute("aria-busy", "true");
  });

  it("返回按钮与标题直接显示真实内容", () => {
    render(<AccountCreateLoading />);

    expect(
      screen.getByRole("link", { name: accountFormMessages.backToAccounts }),
    ).toHaveAttribute("href", routePaths.accounts);
    expect(
      screen.getByRole("heading", { name: accountFormMessages.createTitle }),
    ).toBeInTheDocument();
  });
});
