import {
  cleanup,
  fireEvent,
  render,
  screen,
  within,
} from "@testing-library/react";
import { ThemeProvider } from "@mui/material/styles";
import { afterEach, describe, expect, it, vi } from "vitest";

import { designTokens, theme } from "theme/theme";
import type { TransactionCategoryOption } from "types/transactions";

import type { CategoryPickerGroup } from "../TransactionForm/TransactionForm.types";
import { TransactionItemPickerDrawer } from "./TransactionItemPickerDrawer";

const categoryOptions: TransactionCategoryOption[] = [
  {
    id: "food-lunch",
    name: "午餐",
    parentId: "food",
    parentName: "餐饮",
    type: "expense",
  },
  {
    id: "food-dinner",
    name: "晚餐",
    parentId: "food",
    parentName: "餐饮",
    type: "expense",
  },
  {
    id: "traffic-train",
    name: "电车",
    parentId: "traffic",
    parentName: "交通",
    type: "expense",
  },
];

const categoryGroups: CategoryPickerGroup[] = [
  { categories: categoryOptions.slice(0, 2), id: "food", name: "餐饮" },
  { categories: categoryOptions.slice(2), id: "traffic", name: "交通" },
];

const incomeCategory: TransactionCategoryOption = {
  id: "income-salary",
  name: "工资",
  parentId: "income",
  parentName: "收入",
  type: "income",
};
const incomeGroup: CategoryPickerGroup = {
  categories: [incomeCategory],
  id: "income",
  name: "收入",
};

describe("TransactionItemPickerDrawer", () => {
  afterEach(() => cleanup());

  it("按服务端提供的动态顺序显示常用快捷并可选择", () => {
    const onCategoryToggle = vi.fn();
    const onGroupSelect = vi.fn();

    render(
      <ThemeProvider theme={theme}>
        <TransactionItemPickerDrawer
          categoryGroups={categoryGroups}
          filteredCategoryOptions={categoryOptions}
          frequentCategoryIds={["traffic-train", "food-lunch"]}
          onAmountChange={vi.fn()}
          onCategoryToggle={onCategoryToggle}
          onClose={vi.fn()}
          onGroupSelect={onGroupSelect}
          onPickerAdd={() => true}
          onRemoveItem={vi.fn()}
          open
          pickerAmount=""
          pickerCategoryId=""
          pickerErrors={{}}
          selectedCategoryGroup={categoryGroups[0]}
        />
      </ThemeProvider>,
    );

    const trainShortcut = screen.getByRole("button", {
      name: "交通 · 电车",
    });
    const lunchShortcut = screen.getByRole("button", {
      name: "餐饮 · 午餐",
    });
    expect(trainShortcut.compareDocumentPosition(lunchShortcut)).toBe(
      Node.DOCUMENT_POSITION_FOLLOWING,
    );
    fireEvent.click(screen.getByRole("button", { name: "选择更多分类" }));
    const expectedItemRadius = `${designTokens.radius.item}px`;
    expect(
      getComputedStyle(screen.getByRole("button", { name: "餐饮" }))
        .borderRadius,
    ).toBe(expectedItemRadius);
    expect(
      getComputedStyle(screen.getByRole("button", { name: "午餐" }))
        .borderRadius,
    ).toBe(expectedItemRadius);

    fireEvent.click(trainShortcut);
    expect(onGroupSelect).toHaveBeenCalledWith("traffic");
    expect(onCategoryToggle).toHaveBeenCalledWith("traffic-train");
  });

  it("多账户付款时收入分类与对应常用快捷不可选，支出分类照常可选", () => {
    render(
      <TransactionItemPickerDrawer
        categoryGroups={[...categoryGroups, incomeGroup]}
        filteredCategoryOptions={[...categoryOptions, incomeCategory]}
        frequentCategoryIds={["income-salary", "food-lunch"]}
        incomeCategoriesDisabled
        onAmountChange={vi.fn()}
        onCategoryToggle={vi.fn()}
        onClose={vi.fn()}
        onGroupSelect={vi.fn()}
        onPickerAdd={() => true}
        onRemoveItem={vi.fn()}
        open
        pickerAmount=""
        pickerCategoryId=""
        pickerErrors={{}}
        selectedCategoryGroup={incomeGroup}
      />,
    );

    expect(screen.getByRole("button", { name: "收入 · 工资" })).toHaveAttribute(
      "aria-disabled",
      "true",
    );
    expect(
      screen.getByRole("button", { name: "餐饮 · 午餐" }),
    ).not.toHaveAttribute("aria-disabled");
    fireEvent.click(screen.getByRole("button", { name: "选择更多分类" }));
    expect(screen.getByRole("button", { name: "收入" })).toBeDisabled();
    expect(screen.getByRole("button", { name: "工资" })).toBeDisabled();
    expect(screen.getByRole("button", { name: "餐饮" })).toBeEnabled();
    expect(
      screen.getByText("多账户付款时只能添加支出明细。"),
    ).toBeInTheDocument();
  });

  function renderIncomeDrawer(linkNotice?: string | null) {
    render(
      <TransactionItemPickerDrawer
        categoryGroups={[incomeGroup]}
        filteredCategoryOptions={[incomeCategory]}
        frequentCategoryIds={[]}
        linkNotice={linkNotice}
        onAmountChange={vi.fn()}
        onCategoryToggle={vi.fn()}
        onClose={vi.fn()}
        onGroupSelect={vi.fn()}
        onPickerAdd={() => true}
        onRemoveItem={vi.fn()}
        open
        pickerAmount="1500"
        pickerCategoryId={incomeCategory.id}
        pickerErrors={{}}
        selectedAccountCurrency="JPY"
        selectedCategoryGroup={incomeGroup}
        specialStatusEnabled
      />,
    );
  }

  it("收入明细在特殊状态开启时渲染报销单选入口", () => {
    renderIncomeDrawer();

    expect(screen.getByText("报销关联")).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: "选择报销明细" }),
    ).toBeInTheDocument();
    expect(screen.queryByRole("alert")).not.toBeInTheDocument();
  });

  it("关联提示在抽屉内显示，不被遮罩挡住", () => {
    renderIncomeDrawer("退款明细必须与收款账户币种一致，请重新选择。");

    const drawerPaper = screen
      .getByText("退款关联")
      .closest(".MuiDrawer-paper");
    expect(drawerPaper).not.toBeNull();
    expect(
      within(drawerPaper as HTMLElement).getByRole("alert"),
    ).toHaveTextContent("退款明细必须与收款账户币种一致，请重新选择。");
  });

  it("既有待报销母项保持勾选且不可修改", () => {
    const onSpecialStatusChange = vi.fn();
    render(
      <TransactionItemPickerDrawer
        categoryGroups={categoryGroups}
        editingItemId={1}
        filteredCategoryOptions={categoryOptions}
        frequentCategoryIds={[]}
        onAmountChange={vi.fn()}
        onCategoryToggle={vi.fn()}
        onClose={vi.fn()}
        onGroupSelect={vi.fn()}
        onPickerAdd={() => true}
        onRemoveItem={vi.fn()}
        onSpecialStatusChange={onSpecialStatusChange}
        open
        pickerAmount="1200"
        pickerCategoryId="food-lunch"
        pickerErrors={{}}
        pickerSpecialStatus="pendingReimbursement"
        selectedCategoryGroup={categoryGroups[0]}
        specialStatusEnabled
        specialStatusLocked
      />,
    );

    const checkbox = screen.getByRole("checkbox", { name: "待报销" });
    expect(checkbox).toBeChecked();
    expect(checkbox).toBeDisabled();
    fireEvent.click(checkbox);
    expect(onSpecialStatusChange).not.toHaveBeenCalled();
  });

  it.each([
    { label: "已结清", specialStatus: "reimbursed" },
    { label: "核销结余", specialStatus: "reimbursementSurplus" },
  ] as const)("既有$label母项不显示待报销复选框", ({ specialStatus }) => {
    render(
      <TransactionItemPickerDrawer
        categoryGroups={categoryGroups}
        editingItemId={1}
        filteredCategoryOptions={categoryOptions}
        frequentCategoryIds={[]}
        onAmountChange={vi.fn()}
        onCategoryToggle={vi.fn()}
        onClose={vi.fn()}
        onGroupSelect={vi.fn()}
        onPickerAdd={() => true}
        onRemoveItem={vi.fn()}
        onSpecialStatusChange={vi.fn()}
        open
        pickerAmount="1200"
        pickerCategoryId="food-lunch"
        pickerErrors={{}}
        pickerSpecialStatus={specialStatus}
        selectedCategoryGroup={categoryGroups[0]}
        specialStatusEnabled
        specialStatusLocked
      />,
    );

    expect(
      screen.queryByRole("checkbox", { name: "待报销" }),
    ).not.toBeInTheDocument();
  });
});
