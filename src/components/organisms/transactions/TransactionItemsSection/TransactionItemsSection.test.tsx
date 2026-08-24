import { fireEvent, render, screen } from "@testing-library/react";
import { createRef } from "react";
import { describe, expect, it, vi } from "vitest";

import type { TransactionItemSummary } from "../TransactionForm/TransactionForm.types";
import { TransactionItemsSection } from "./TransactionItemsSection";

const itemsFieldRef = createRef<HTMLDivElement>();
const itemSummaries: TransactionItemSummary[] = [
  {
    amount: "1200",
    categoryId: "category-lunch",
    id: 1,
    specialStatus: "pendingReimbursement",
    category: {
      id: "category-lunch",
      name: "午餐",
      parentId: "category-food",
      parentName: "餐饮",
      type: "expense",
    },
  },
  {
    amount: "800",
    categoryId: "",
    id: 2,
  },
];

function renderSection(
  overrides: Partial<Parameters<typeof TransactionItemsSection>[0]> = {},
) {
  const props: Parameters<typeof TransactionItemsSection>[0] = {
    hasCategoryOptions: true,
    itemSummaries: [],
    itemsFieldRef,
    onOpenItem: vi.fn(),
    onOpenSheet: vi.fn(),
    onUpdateItem: vi.fn(),
    selectedAccountCurrency: "JPY",
    selectedType: "expense",
    signedTotalAmount: "-2000",
    ...overrides,
  };

  render(<TransactionItemsSection {...props} />);
  return props;
}

describe("TransactionItemsSection", () => {
  it("没有明细时显示错误并按分类可用状态控制追加按钮", () => {
    const props = renderSection({
      fieldError: "请至少添加一条明细。",
      hasCategoryOptions: false,
    });

    expect(screen.getByText("消费明细")).toBeInTheDocument();
    expect(screen.getByText("请至少添加一条明细。")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "添加明细" })).toBeDisabled();

    fireEvent.click(screen.getByRole("button", { name: "添加明细" }));
    expect(props.onOpenSheet).not.toHaveBeenCalled();
  });

  it("显示分类、未选择状态、金额和合计，并打开对应明细", () => {
    const props = renderSection({ itemSummaries });

    expect(screen.getByText("消费明细（2）")).toBeInTheDocument();
    expect(screen.getByText(/大分类.*餐饮/)).toBeInTheDocument();
    expect(screen.getByText(/小分类.*午餐/)).toBeInTheDocument();
    expect(screen.getByText("请选择分类")).toBeInTheDocument();
    expect(screen.getByText("待报销")).toBeInTheDocument();
    expect(screen.getByText(/合计.*2000/)).toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: "编辑明细 1 分类" }));
    expect(props.onOpenItem).toHaveBeenCalledWith(1);
  });

  it("核销结余明细在编辑区域显示倒赚状态", () => {
    renderSection({
      itemSummaries: [
        {
          ...itemSummaries[0],
          specialStatus: "reimbursementSurplus",
        },
      ],
    });

    expect(screen.getByText("已倒赚")).toBeInTheDocument();
    expect(screen.queryByText("已结清")).not.toBeInTheDocument();
  });

  it("既有明细提交乐观锁版本字段", () => {
    renderSection({
      itemSummaries: [
        {
          ...itemSummaries[0],
          expectedUpdatedAt: "2026-08-21T01:00:00.000Z",
          persistedId: "transaction-item-1",
        },
      ],
    });

    expect(
      document.querySelector(
        'input[name="itemExpectedUpdatedAt__transaction-item-1"]',
      ),
    ).toHaveValue("2026-08-21T01:00:00.000Z");
  });

  it("修改隐藏金额输入并可通过显示按钮聚焦输入框", () => {
    const props = renderSection({ itemSummaries: [itemSummaries[0]] });
    const input = screen.getByRole("textbox", { name: "明细 1 金额" });

    fireEvent.change(input, { target: { value: "1350" } });
    expect(props.onUpdateItem).toHaveBeenCalledWith(1, { amount: "1350" });

    fireEvent.click(screen.getByRole("button", { name: "编辑明细 1 金额" }));
    expect(input).toHaveFocus();
  });

  it("部分核销的支出明细仍显示原始金额且不增加说明行", () => {
    renderSection({
      itemSummaries: [
        {
          ...itemSummaries[0],
          amount: "5000",
          businessNetAmount: "1000",
        },
      ],
      signedTotalAmount: "-5000",
    });

    const editAmountButton = screen.getByRole("button", {
      name: "编辑明细 1 金额",
    });
    const amountInput = screen.getByRole("textbox", {
      name: "明细 1 金额",
    });
    expect(editAmountButton).toHaveTextContent("- ¥ 5,000");
    expect(editAmountButton).not.toHaveTextContent("不计入");
    expect(editAmountButton).not.toHaveTextContent("部分已核销");
    expect(editAmountButton.querySelector(".MuiTypography-root")).toBeNull();
    expect(amountInput).toHaveValue("5000");
    expect(screen.getByText("待报销")).toBeInTheDocument();
    fireEvent.click(editAmountButton);
    expect(amountInput).toHaveFocus();
  });

  it("已核销的退款收入明细仍显示原始金额和业务标签", () => {
    renderSection({
      itemSummaries: [
        {
          amount: "2000",
          businessNetAmount: "0",
          businessStatus: {
            incomeLinkRole: "refund",
            offsetComposition: {
              refundAmount: "0",
              reimbursementAmount: "0",
            },
            settlementStatus: null,
          },
          category: {
            id: "category-refund",
            name: "退款收入",
            parentId: null,
            parentName: null,
            type: "income",
          },
          categoryId: "category-refund",
          id: 3,
        },
      ],
      selectedType: "income",
      signedTotalAmount: "2000",
    });

    const editAmountButton = screen.getByRole("button", {
      name: "编辑明细 1 金额",
    });
    expect(editAmountButton).toHaveTextContent("+ ¥ 2,000");
    expect(editAmountButton).not.toHaveTextContent("不计入");
    expect(editAmountButton).not.toHaveTextContent("部分已核销");
    expect(editAmountButton.querySelector(".MuiTypography-root")).toBeNull();
    expect(screen.getByText("退款收入")).toBeInTheDocument();
  });

  it("点击追加按钮时打开明细选择器", () => {
    const props = renderSection();

    fireEvent.click(screen.getByRole("button", { name: "添加明细" }));

    expect(props.onOpenSheet).toHaveBeenCalledOnce();
  });
});
