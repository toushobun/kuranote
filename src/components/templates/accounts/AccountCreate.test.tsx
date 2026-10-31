import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import type { ComponentProps } from "react";
import { describe, expect, it, vi } from "vitest";

import {
  accountHolderOptionsFixture,
  accountPlaceholderHolderOptionsFixture,
} from "test/mocks/accountHolders";
import type { AccountStateAction } from "types/accounts";

import { AccountCreateTemplate } from "./AccountCreate";

function renderAccountCreate(
  props: Partial<ComponentProps<typeof AccountCreateTemplate>> = {},
) {
  return render(
    <AccountCreateTemplate
      baseCurrency="JPY"
      createAccountAction={vi.fn<AccountStateAction>(async () => ({}))}
      holderOptions={accountHolderOptionsFixture}
      ledgerName="家庭账本"
      placeholderHolderOptions={accountPlaceholderHolderOptionsFixture}
      {...props}
    />,
  );
}

async function submitCashAccount(createAccountAction: AccountStateAction) {
  renderAccountCreate({ createAccountAction });
  fireEvent.change(screen.getByLabelText(/账户名称/), {
    target: { value: "钱包现金" },
  });
  fireEvent.click(screen.getByRole("radio", { name: "现金" }));
  fireEvent.click(screen.getByRole("button", { name: "保存账户" }));
}

describe("AccountCreateTemplate", () => {
  it("显示新增页标题、面包屑与返回账户管理入口", () => {
    renderAccountCreate();

    expect(
      screen.getByRole("heading", { name: "新增账户" }),
    ).toBeInTheDocument();
    expect(
      screen.getByText("账户管理 〉 新增账户 · 家庭账本"),
    ).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "返回账户管理" })).toHaveAttribute(
      "href",
      "/accounts",
    );
  });

  it("带 returnTo 时返回按钮回到来源页", () => {
    const returnTo = "/transactions/new?method=transfer";
    renderAccountCreate({ returnTo });

    expect(screen.getByRole("link", { name: "返回" })).toHaveAttribute(
      "href",
      returnTo,
    );
    expect(screen.queryByRole("link", { name: "返回账户管理" })).toBeNull();
  });

  it("初始货币使用账本本位币", () => {
    renderAccountCreate({ baseCurrency: "CNY" });

    expect(screen.getByRole("combobox", { name: "货币" })).toHaveTextContent(
      "CNY 人民币",
    );
  });

  it("提交新增账户表单", async () => {
    const createAccountAction = vi.fn<AccountStateAction>(async () => ({}));
    await submitCashAccount(createAccountAction);

    await waitFor(() => expect(createAccountAction).toHaveBeenCalledOnce());
    const formData = createAccountAction.mock.calls[0]?.[1];
    expect(formData?.get("name")).toBe("钱包现金");
    expect(formData?.get("type")).toBe("cash");
  });

  it("服务端返回错误时显示失败反馈", async () => {
    await submitCashAccount(
      vi.fn<AccountStateAction>(async () => ({
        error: "账户名称已存在。",
        errorKey: "error-1",
      })),
    );

    expect(await screen.findByText("账户名称已存在。")).toBeInTheDocument();
    expect(screen.getByText("新增账户失败")).toBeInTheDocument();
  });
});
