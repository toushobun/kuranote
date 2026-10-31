import {
  fireEvent,
  render,
  screen,
  waitFor,
  within,
} from "@testing-library/react";
import type { ComponentProps } from "react";
import { describe, expect, it, vi } from "vitest";

import {
  accountHolderOptionsFixture,
  accountPlaceholderHolderOptionsFixture,
} from "test/mocks/accountHolders";

import { AccountForm } from "./AccountForm";

function renderAccountForm(
  props: Partial<ComponentProps<typeof AccountForm>> = {},
) {
  const action = vi.fn(async (formData: FormData) => {
    void formData;
  });
  render(
    <AccountForm
      action={action}
      defaultCurrency="JPY"
      holderOptions={accountHolderOptionsFixture}
      placeholderHolderOptions={accountPlaceholderHolderOptionsFixture}
      {...props}
    />,
  );
  return { action };
}

function getPreview() {
  return screen.getByTestId("account-form-preview");
}

function fillCreditCard() {
  fireEvent.change(screen.getByLabelText(/账户名称/), {
    target: { value: "楽天カード" },
  });
  fireEvent.click(screen.getByRole("radio", { name: "信用卡" }));
  fireEvent.change(screen.getByLabelText("初始金额"), {
    target: { value: "-12800" },
  });
  fireEvent.click(screen.getByRole("checkbox", { name: "妻子" }));
}

describe("AccountForm", () => {
  it("初始状态的预览显示占位名称与当前货币的 0 余额", () => {
    renderAccountForm();

    const preview = within(getPreview());
    expect(preview.getByText("账户名称")).toBeInTheDocument();
    expect(preview.getByText("未设置持有人")).toBeInTheDocument();
    expect(preview.getByText("¥0")).toBeInTheDocument();
  });

  it("预览随名称、类型、金额与持有人实时更新", () => {
    renderAccountForm();

    fillCreditCard();

    const preview = within(getPreview());
    expect(preview.getByText("楽天カード")).toBeInTheDocument();
    expect(preview.getByText("信用卡")).toBeInTheDocument();
    expect(preview.getByText("-¥12,800")).toBeInTheDocument();
    expect(preview.getByText("妻子")).toBeInTheDocument();
  });

  it("切换货币时预览与金额符号一起改变", () => {
    renderAccountForm();

    fireEvent.mouseDown(screen.getByRole("combobox", { name: "货币" }));
    fireEvent.click(screen.getByRole("option", { name: "USD 美元" }));

    expect(within(getPreview()).getByText("$0.00")).toBeInTheDocument();
    expect(screen.getByLabelText("初始金额")).toHaveAttribute(
      "data-amount-currency",
      "USD",
    );
  });

  it("提交名称、类型、货币、初始金额与持有人", async () => {
    const { action } = renderAccountForm();

    fillCreditCard();
    fireEvent.click(screen.getByRole("button", { name: "保存账户" }));

    await waitFor(() => expect(action).toHaveBeenCalledOnce());
    const formData = action.mock.calls[0]?.[0];
    expect(formData?.get("name")).toBe("楽天カード");
    expect(formData?.get("type")).toBe("credit_card");
    expect(formData?.get("currency")).toBe("JPY");
    expect(formData?.get("initialBalance")).toBe("-12800");
    expect(formData?.getAll("holderUserIds")).toEqual([
      accountHolderOptionsFixture[1]?.user_id,
    ]);
    expect(formData?.get("holderPlaceholderId")).toBeNull();
    expect(formData?.get("returnTo")).toBeNull();
  });

  it("未选择账户类型时由浏览器校验拦截提交", () => {
    renderAccountForm();

    expect(screen.getByRole("radio", { name: "现金" })).toBeRequired();
  });

  it("没有 returnTo 时取消回到账户管理", () => {
    renderAccountForm();
    expect(screen.getByRole("link", { name: "取消" })).toHaveAttribute(
      "href",
      "/accounts",
    );
  });

  it("带 returnTo 时取消回到来源页并随表单提交", async () => {
    const returnTo = "/transactions/new?method=standard";
    const { action } = renderAccountForm({ returnTo });

    expect(screen.getByRole("link", { name: "取消" })).toHaveAttribute(
      "href",
      returnTo,
    );
    fillCreditCard();
    fireEvent.click(screen.getByRole("button", { name: "保存账户" }));

    await waitFor(() => expect(action).toHaveBeenCalledOnce());
    expect(action.mock.calls[0]?.[0].get("returnTo")).toBe(returnTo);
  });

  it("提交中按钮显示加载且不可再次点击", () => {
    renderAccountForm({ pending: true });

    expect(screen.getByLabelText("保存中").closest("button")).toBeDisabled();
  });
});
