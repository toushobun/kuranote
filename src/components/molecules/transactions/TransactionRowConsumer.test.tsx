import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import type { TransactionRowItem } from "types/transactions";

import { TransactionRow } from "./TransactionRow";

function createItem(
  overrides: Partial<TransactionRowItem> = {},
): TransactionRowItem {
  return {
    account_currency: "JPY",
    account_name: "日元现金",
    amount: "1200",
    categoryItems: [
      {
        amount: "1200",
        categoryName: "餐饮",
        categoryType: "expense",
        parentCategoryName: "饮食",
      },
    ],
    id: "00000000-0000-4000-8000-000000009001",
    merchant_icon_url: null,
    merchant_name: "便利店",
    note: null,
    transaction_at: "2026-09-08T01:00:00.000Z",
    type: "expense",
    ...overrides,
  };
}

describe("TransactionRow consumers", () => {
  it("最多显示两个消费者昵称并将其余折叠为 +N", () => {
    render(
      <TransactionRow
        item={createItem({
          consumers: [
            { color: "jade", id: "1", name: "淞文" },
            { color: "sakura", id: "2", name: "秋爽" },
            { color: "sky", id: "3", name: "宝宝" },
            { color: "amber", id: "4", name: "家人" },
          ],
        })}
        showRecorder
      />,
    );

    expect(screen.getByTestId("transaction-consumers")).toHaveTextContent(
      "淞文、秋爽+2",
    );
    expect(screen.queryByText("宝宝")).toBeNull();
    expect(screen.queryByText("家人")).toBeNull();
  });

  it("show_consumers 为 false 时隐藏消费者", () => {
    render(
      <TransactionRow
        item={createItem({
          consumers: [{ color: "jade", id: "1", name: "淞文" }],
          show_consumers: false,
        })}
        showRecorder
      />,
    );

    expect(screen.queryByTestId("transaction-consumers")).toBeNull();
  });

  it("兼容没有消费者字段的旧展示数据", () => {
    render(<TransactionRow item={createItem()} showRecorder />);

    expect(screen.queryByTestId("transaction-consumers")).toBeNull();
    expect(screen.getByText("便利店")).toBeInTheDocument();
  });
});
