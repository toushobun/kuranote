import { cleanup, fireEvent, render, within } from "@testing-library/react";
import { afterEach, describe, expect, it } from "vitest";

import type { Account } from "types/accounts";

import { AccountSummaryCard } from "./AccountSummaryCard";

afterEach(() => {
  cleanup();
});

const accounts: Account[] = [
  {
    id: "00000000-0000-4000-8000-000000000001",
    name: "三菱UFJ银行",
    type: "bank",
    currency: "JPY",
    initial_balance: 100000,
    current_balance: 85000,
    sort_order: 1,
    created_at: "2026-01-01T00:00:00.000Z",
    holders: [
      {
        id: "holder-1",
        user_id: "user-1",
        display_name: "张三",
        email: "zhangsan@example.com",
        display_color: "sky",
        role: "owner",
        share_ratio: null,
      },
    ],
  },
  {
    id: "00000000-0000-4000-8000-000000000002",
    name: "PayPay",
    type: "e_money",
    currency: "JPY",
    initial_balance: 0,
    current_balance: 3200,
    sort_order: 2,
    created_at: "2026-01-02T00:00:00.000Z",
    holders: [],
  },
];

describe("AccountSummaryCard", () => {
  it("显示账户总余额", () => {
    const { container } = render(
      <AccountSummaryCard accounts={accounts} baseCurrency="JPY" />,
    );

    expect(within(container).getByText("账户总余额")).toBeInTheDocument();
    expect(within(container).getByLabelText("¥88,200")).toBeInTheDocument();
  });

  it("点击小眼睛后隐藏和恢复账户总余额", () => {
    const { container } = render(
      <AccountSummaryCard accounts={accounts} baseCurrency="JPY" />,
    );

    fireEvent.click(
      within(container).getByRole("button", { name: "隐藏余额" }),
    );

    expect(within(container).queryByLabelText("¥88,200")).toBeNull();
    expect(within(container).getByText("******")).toBeInTheDocument();
    expect(
      within(container).getByRole("button", { name: "显示余额" }),
    ).toBeInTheDocument();

    fireEvent.click(
      within(container).getByRole("button", { name: "显示余额" }),
    );

    expect(within(container).getByLabelText("¥88,200")).toBeInTheDocument();
  });

  it("显示账户数量和持有人数量", () => {
    const { container } = render(
      <AccountSummaryCard accounts={accounts} baseCurrency="JPY" />,
    );

    expect(within(container).getByText("2 个")).toBeInTheDocument();
    expect(within(container).getByText("1 位")).toBeInTheDocument();
  });

  it("存在外币账户时总余额只统计本位币账户并展示说明", () => {
    const accountsWithForeignCurrency: Account[] = [
      ...accounts,
      {
        id: "00000000-0000-4000-8000-000000000003",
        name: "美元账户",
        type: "bank",
        currency: "USD",
        initial_balance: 0,
        current_balance: 500,
        sort_order: 3,
        created_at: "2026-01-03T00:00:00.000Z",
        holders: [],
      },
    ];

    const { container } = render(
      <AccountSummaryCard
        accounts={accountsWithForeignCurrency}
        baseCurrency="JPY"
      />,
    );

    expect(within(container).getByLabelText("¥88,200")).toBeInTheDocument();
    expect(
      within(container).getByText("外币账户未计入总余额，暂不支持汇率换算。"),
    ).toBeInTheDocument();
  });

  it("不存在外币账户时不展示说明", () => {
    const { container } = render(
      <AccountSummaryCard accounts={accounts} baseCurrency="JPY" />,
    );

    expect(
      within(container).queryByText("外币账户未计入总余额，暂不支持汇率换算。"),
    ).toBeNull();
  });
});
