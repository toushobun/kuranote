import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { accountFormMessages } from "config/accountMessages";
import { routePaths } from "config/paths";

import AccountEditLoading from "./loading";

describe("AccountEditLoading", () => {
  it("显示编辑账户页的加载状态", () => {
    render(<AccountEditLoading />);

    expect(
      screen.getByRole("status", { name: accountFormMessages.editLoading }),
    ).toHaveAttribute("aria-busy", "true");
  });

  it("返回按钮与标题直接显示真实内容", () => {
    render(<AccountEditLoading />);

    expect(
      screen.getByRole("link", { name: accountFormMessages.backToAccounts }),
    ).toHaveAttribute("href", routePaths.accounts);
    expect(
      screen.getByRole("heading", { name: accountFormMessages.editTitle }),
    ).toBeInTheDocument();
  });
});
