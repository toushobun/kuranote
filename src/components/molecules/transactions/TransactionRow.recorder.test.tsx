import { cleanup, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it } from "vitest";

import { themeColorTokens } from "theme/themeColorTokens";
import type { TransactionRowItem } from "types/transactions";

import { TransactionRow } from "./TransactionRow";

const item: TransactionRowItem = {
  account_color: "sakura",
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
  recorder_color: "amber",
  recorder_name: "淞文",
  transaction_at: "2026-06-05T03:20:10.000Z",
  type: "expense",
};

afterEach(() => {
  cleanup();
});

describe("TransactionRow 记录人展示", () => {
  it("多人账本使用成员个性色显示账户和记录人", () => {
    render(<TransactionRow item={item} showAccount showRecorder />);

    expect(screen.getByText("日元现金")).toHaveStyle({
      color: themeColorTokens.sakura.chipText,
    });
    expect(screen.getByText("淞文")).toHaveStyle({
      color: themeColorTokens.amber.chipText,
    });
  });

  it("单人账本保留记录人数据但不显示昵称", () => {
    render(
      <TransactionRow item={{ ...item, show_recorder: false }} showRecorder />,
    );

    expect(screen.queryByText("淞文")).not.toBeInTheDocument();
  });
});
