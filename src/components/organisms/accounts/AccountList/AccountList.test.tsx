import { cleanup, render, within } from "@testing-library/react";
import { afterEach, describe, expect, it } from "vitest";

import type { Account } from "types/accounts";

import { AccountList } from "./AccountList";

afterEach(() => {
  cleanup();
});

const baseAccount: Account = {
  id: "00000000-0000-4000-8000-000000000001",
  name: "三菱UFJ银行",
  type: "bank",
  currency: "JPY",
  initial_balance: 100000,
  current_balance: 85000,
  sort_order: 1,
  created_at: "2026-01-01T00:00:00.000Z",
  has_transactions: false,
  holders: [],
};

const baseProps = {
  accounts: [],
};

describe("AccountList", () => {
  it("没有账户时显示空状态提示", () => {
    const { container } = render(<AccountList {...baseProps} />);

    expect(within(container).getByText("还没有账户")).toBeInTheDocument();
  });

  it("可自定义空状态提示", () => {
    const { container } = render(
      <AccountList
        {...baseProps}
        emptyDescription="请切换其他账户类型。"
        emptyTitle="该类型下还没有账户"
      />,
    );

    expect(
      within(container).getByText("该类型下还没有账户"),
    ).toBeInTheDocument();
    expect(
      within(container).getByText("请切换其他账户类型。"),
    ).toBeInTheDocument();
  });

  it("有账户时显示账户名称", () => {
    const { container } = render(
      <AccountList {...baseProps} accounts={[baseAccount]} />,
    );

    expect(within(container).getByText("三菱UFJ银行")).toBeInTheDocument();
  });

  it("有多个账户时全部显示", () => {
    const account2: Account = {
      ...baseAccount,
      id: "00000000-0000-4000-8000-000000000002",
      name: "PayPay",
      type: "e_money",
      sort_order: 2,
    };
    const { container } = render(
      <AccountList {...baseProps} accounts={[baseAccount, account2]} />,
    );

    expect(within(container).getByText("三菱UFJ银行")).toBeInTheDocument();
    expect(within(container).getByText("PayPay")).toBeInTheDocument();
  });

  it("能管理账户时点账户进入编辑账户页", () => {
    const { container } = render(
      <AccountList {...baseProps} accounts={[baseAccount]} />,
    );

    expect(within(container).getByRole("link")).toHaveAttribute(
      "href",
      `/accounts/${baseAccount.id}/edit`,
    );
  });

  it("不能管理账户时账户卡片不是链接", () => {
    const { container } = render(
      <AccountList
        {...baseProps}
        accounts={[baseAccount]}
        canManageAccounts={false}
      />,
    );

    expect(within(container).queryByRole("link")).toBeNull();
  });
});
