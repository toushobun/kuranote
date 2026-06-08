import { cleanup, render, within } from "@testing-library/react";
import type { ReactNode } from "react";
import { afterEach, describe, expect, it, vi } from "vitest";

import type { TransactionDateGroup } from "types/transactions";

import { TransactionGroupList } from "./TransactionGroupList";

vi.mock("molecules/transactions/TransactionRow", () => ({
  TransactionRow: ({
    item,
  }: {
    item: { id: string; merchant_name: string | null };
  }): ReactNode => (
    <div data-testid={`row-${item.id}`}>
      {item.merchant_name ?? "未指定商家"}
    </div>
  ),
}));

afterEach(() => {
  cleanup();
});

function makeGroup(
  overrides?: Partial<TransactionDateGroup>,
): TransactionDateGroup {
  return {
    date: "2026-06-05",
    label: "06/05 周五",
    summary: {
      currency: "JPY",
      income: "0",
      expense: "1200",
      balance: "-1200",
    },
    items: [
      {
        id: "00000000-0000-4000-8000-000000009001",
        type: "expense",
        transaction_at: "2026-06-05T03:20:10.000Z",
        amount: "1200",
        account_name: "日元现金",
        account_currency: "JPY",
        categoryItems: [
          { categoryName: "餐饮", parentCategoryName: null, amount: "1200" },
        ],
        merchant_name: "便利店",
        merchant_icon_url: null,
        note: null,
        recorder_name: null,
        created_at: "2026-06-05T03:20:10.000Z",
      },
    ],
    ...overrides,
  };
}

describe("TransactionGroupList", () => {
  it("显示分组日期标签", () => {
    const { container } = render(
      <TransactionGroupList groups={[makeGroup()]} />,
    );

    expect(within(container).getByText("06/05 周五")).toBeTruthy();
  });

  it("显示分组内的记账记录", () => {
    const { container } = render(
      <TransactionGroupList groups={[makeGroup()]} />,
    );

    expect(
      within(container).getByTestId("row-00000000-0000-4000-8000-000000009001"),
    ).toBeTruthy();
  });

  it("显示多个分组", () => {
    const group2 = makeGroup({ date: "2026-06-01", label: "06/01 周一" });
    const { container } = render(
      <TransactionGroupList groups={[makeGroup(), group2]} />,
    );

    expect(within(container).getByText("06/05 周五")).toBeTruthy();
    expect(within(container).getByText("06/01 周一")).toBeTruthy();
  });

  it("分组汇总结余为负数时金额有对应样式标识", () => {
    const { container } = render(
      <TransactionGroupList groups={[makeGroup()]} />,
    );

    // 结余为 -1200，以带符号格式显示
    expect(within(container).getByText("-1,200")).toBeTruthy();
  });
});
