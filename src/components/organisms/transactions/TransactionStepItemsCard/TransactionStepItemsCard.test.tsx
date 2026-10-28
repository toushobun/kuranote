import { screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import {
  renderEntryComponent,
  clickEntryButton as click,
} from "test/transactionStepFlow";
import { itemsStepFixture } from "test/mocks/transactionItemsStep";
import { TransactionStepItemsCard } from "./TransactionStepItemsCard";
describe("TransactionStepItemsCard", () => {
  it("紧凑行展示分类图标、自动标签与待报销，并分开处理编辑金额和删除", () => {
    const onEdit = vi.fn(),
      onAmount = vi.fn(),
      onRemove = vi.fn();
    renderEntryComponent(
      <TransactionStepItemsCard
        items={[
          {
            id: 1,
            categoryId: "lunch",
            amount: "",
            category: {
              ...itemsStepFixture.categoryOptions[0],
              iconName: "🍴",
            },
            specialStatus: "pendingReimbursement",
          },
        ]}
        automaticItemIds={[1]}
        currency="JPY"
        expenseTotal={0}
        incomeTotal={0}
        hasCategoryOptions
        onAdd={vi.fn()}
        onEdit={onEdit}
        onAmount={onAmount}
        onRemove={onRemove}
      />,
    );
    expect(screen.getByText("🍴")).toBeInTheDocument();
    expect(screen.getByText("自动")).toBeInTheDocument();
    expect(screen.getByText("待报销")).toBeInTheDocument();
    click("编辑明细 1 分类");
    expect(onEdit).toHaveBeenCalledWith(1);
    click("编辑明细 1 金额");
    expect(onAmount).toHaveBeenCalledWith(1);
    click("删除明细 1");
    expect(onRemove).toHaveBeenCalledWith(1);
  });
});
