import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { TransactionSummarySection } from "./TransactionSummarySection";

const itemSummaries = [
  {
    amount: "1200",
    categoryId: "category-lunch",
    id: 1,
    category: {
      id: "category-lunch",
      name: "午餐",
      parentId: "category-food",
      parentName: "餐饮",
      type: "expense" as const,
    },
  },
  {
    amount: "",
    categoryId: "",
    id: 2,
  },
];

describe("TransactionSummarySection", () => {
  it("汇总已选择的商家、账户、明细、标签、时间和金额", () => {
    render(
      <TransactionSummarySection
        itemSummaries={itemSummaries}
        selectedAccount={{ currency: "JPY", id: "account-1", name: "现金" }}
        selectedMerchant={{ icon_url: null, id: "merchant-1", name: "便利店" }}
        selectedTagNames={["日常", "食品"]}
        signedTotalAmount="-1200"
        transactionDate="2026-07-20"
        transactionTime="10:30:00"
      />,
    );

    expect(screen.getByText("便利店")).toBeInTheDocument();
    expect(screen.getByText("现金（JPY）")).toBeInTheDocument();
    expect(screen.getByText(/餐饮.*午餐.*1200/)).toBeInTheDocument();
    expect(screen.getByText("未选择分类 / 未填写金额")).toBeInTheDocument();
    expect(screen.getByText("日常、食品")).toBeInTheDocument();
    expect(screen.getByText(/2026.*07.*20.*10:30/)).toBeInTheDocument();
    expect(screen.getByText(/1,200/)).toBeInTheDocument();
  });

  it("未选择可选项时显示占位状态", () => {
    render(
      <TransactionSummarySection
        itemSummaries={[]}
        selectedTagNames={[]}
        signedTotalAmount="0"
        transactionDate=""
        transactionTime=""
      />,
    );

    expect(screen.getAllByText("未选择")).toHaveLength(3);
    expect(screen.getByText("请选择日期和时间")).toBeInTheDocument();
  });
});
