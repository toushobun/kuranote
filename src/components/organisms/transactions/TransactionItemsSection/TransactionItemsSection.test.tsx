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

  it("修改隐藏金额输入并可通过显示按钮聚焦输入框", () => {
    const props = renderSection({ itemSummaries: [itemSummaries[0]] });
    const input = screen.getByRole("textbox", { name: "明细 1 金额" });

    fireEvent.change(input, { target: { value: "1350" } });
    expect(props.onUpdateItem).toHaveBeenCalledWith(1, { amount: "1350" });

    fireEvent.click(screen.getByRole("button", { name: "编辑明细 1 金额" }));
    expect(input).toHaveFocus();
  });

  it("以业务净额为主并弱化显示原金额和原始合计", () => {
    renderSection({
      businessTotalAmount: "-300",
      itemSummaries: [
        {
          ...itemSummaries[0],
          businessNetAmount: "300",
        },
      ],
      signedTotalAmount: "-1200",
    });

    expect(
      screen.getByRole("button", { name: "编辑明细 1 金额" }),
    ).toHaveTextContent("300");
    expect(screen.getByText(/原金额.*1200/)).toBeInTheDocument();
    expect(screen.getByText(/原始合计.*1200/)).toBeInTheDocument();
    expect(screen.getByText(/业务净额.*300/)).toBeInTheDocument();
  });

  it("点击追加按钮时打开明细选择器", () => {
    const props = renderSection();

    fireEvent.click(screen.getByRole("button", { name: "添加明细" }));

    expect(props.onOpenSheet).toHaveBeenCalledOnce();
  });
});
