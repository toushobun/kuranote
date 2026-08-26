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
  it("汇总已选择的商家、账户、明细、时间和金额", () => {
    render(
      <TransactionSummarySection
        itemSummaries={itemSummaries}
        selectedAccount={{
          currency: "JPY",
          id: "account-1",
          name: "现金",
        }}
        selectedMerchant={{
          icon_url: null,
          id: "merchant-1",
          name: "便利店",
        }}
        signedTotalAmount="-1200"
        transactionDate="2026-07-20"
        transactionTime="10:30:00"
      />,
    );

    expect(screen.getByText("便利店")).toBeInTheDocument();
    expect(screen.getByText("现金（JPY）")).toBeInTheDocument();
    expect(screen.getByText(/餐饮.*午餐.*1,200/)).toBeInTheDocument();
    expect(screen.getByText("未选择分类 / 未填写金额")).toBeInTheDocument();
    expect(screen.getByText("2026/07/20 10:30:00")).toBeInTheDocument();
    expect(screen.getByText("- ¥ 1200")).toBeInTheDocument();
  });

  it("未选择可选项时显示占位状态", () => {
    render(
      <TransactionSummarySection
        itemSummaries={[]}
        signedTotalAmount="0"
        transactionDate=""
        transactionTime=""
      />,
    );

    expect(screen.getAllByText("未选择")).toHaveLength(3);
  });

  it("部分核销时显示净额、部分核销提示和核销前合计", () => {
    render(
      <TransactionSummarySection
        businessTotalAmount="-300"
        itemSummaries={[{ ...itemSummaries[0], businessNetAmount: "300" }]}
        signedTotalAmount="-1200"
        transactionDate="2026-07-20"
        transactionTime="10:30:00"
      />,
    );

    expect(screen.getByText("净额")).toBeInTheDocument();
    expect(screen.getByText("原金额")).toBeInTheDocument();
    expect(screen.getByText("- 300")).toBeInTheDocument();
    const partialOffsetMessage = screen.getByText(/部分已核销/);
    expect(partialOffsetMessage).toHaveStyle({
      color: "rgba(0, 0, 0, 0.38)",
      fontWeight: "400",
    });
    expect(screen.queryByText(/原金额 - 1,200/)).not.toBeInTheDocument();
    expect(
      screen
        .getByText("净额")
        .compareDocumentPosition(screen.getByText("原金额")) &
        Node.DOCUMENT_POSITION_FOLLOWING,
    ).toBeTruthy();
  });

  it("完全核销的明细显示净额和原金额", () => {
    render(
      <TransactionSummarySection
        businessTotalAmount="0"
        itemSummaries={[{ ...itemSummaries[0], businessNetAmount: "0" }]}
        signedTotalAmount="-1200"
        transactionDate="2026-07-20"
        transactionTime="10:30:00"
      />,
    );

    expect(
      screen.getByText(
        (_, element) =>
          element?.tagName === "P" &&
          element.textContent === "餐饮 / 午餐 / 0（原金额 - 1,200）",
      ),
    ).toBeInTheDocument();
    expect(screen.queryByText(/不计入支出/)).not.toBeInTheDocument();
  });

  it("单条明细核销结余时按收入方向显示净额", () => {
    render(
      <TransactionSummarySection
        businessTotalAmount="1000"
        itemSummaries={[
          {
            ...itemSummaries[0],
            amount: "4000",
            businessNetAmount: "-1000",
          },
        ]}
        selectedAccount={{ currency: "JPY", id: "account-1", name: "现金" }}
        signedTotalAmount="-4000"
        transactionDate="2026-07-20"
        transactionTime="10:30:00"
      />,
    );

    expect(
      screen.getByText(
        (_, element) =>
          element?.tagName === "P" &&
          element.textContent === "餐饮 / 午餐 / + ¥ 1,000（原金额 - ¥ 4,000）",
      ),
    ).toBeInTheDocument();
    expect(screen.queryByText(/- ¥ -1,000/)).not.toBeInTheDocument();
  });
});
