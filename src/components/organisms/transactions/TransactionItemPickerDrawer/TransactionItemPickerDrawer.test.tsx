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

  it("左列选大分类、右列选小分类", () => {
    const onCategoryToggle = vi.fn();
    const onGroupSelect = vi.fn();

    render(
      <ThemeProvider theme={theme}>
        <TransactionItemPickerDrawer
          categoryGroups={categoryGroups}
          filteredCategoryOptions={categoryOptions}
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

    const expectedItemRadius = `${designTokens.radius.item}px`;
    expect(
      getComputedStyle(screen.getByRole("button", { name: "餐饮" }))
        .borderRadius,
    ).toBe(expectedItemRadius);
    expect(
      getComputedStyle(screen.getByRole("button", { name: "午餐" }))
        .borderRadius,
    ).toBe(expectedItemRadius);

    fireEvent.click(screen.getByRole("button", { name: "午餐" }));
    expect(onCategoryToggle).toHaveBeenCalledWith("food-lunch");

    fireEvent.click(screen.getByRole("button", { name: "交通" }));
    expect(onGroupSelect).toHaveBeenLastCalledWith("traffic");
  });

  it.each([
    {
      type: "income",
      group: incomeGroup,
      enabledGroup: "餐饮",
    },
    {
      type: "expense",
      group: categoryGroups[0],
      enabledGroup: "收入",
    },
  ] as const)("多账户时禁用 $type 分类", ({ type, group, enabledGroup }) => {
    render(
      <TransactionItemPickerDrawer
        categoryGroups={[...categoryGroups, incomeGroup]}
        filteredCategoryOptions={[...categoryOptions, incomeCategory]}
        disabledCategoryType={type}
        onCategoryToggle={vi.fn()}
        onClose={vi.fn()}
        onGroupSelect={vi.fn()}
        onPickerAdd={() => true}
        onRemoveItem={vi.fn()}
        open
        pickerAmount=""
        pickerCategoryId=""
        pickerErrors={{}}
        selectedCategoryGroup={group}
      />,
    );

    expect(screen.getByRole("button", { name: group.name })).toBeDisabled();
    expect(
      screen.getByRole("button", { name: group.categories[0].name }),
    ).toBeDisabled();
    expect(screen.getByRole("button", { name: enabledGroup })).toBeEnabled();
    expect(
      screen.getByText("多个账户时，收入和支出不能混在一起。"),
    ).toBeInTheDocument();
  });

  function renderIncomeDrawer(linkNotice?: string | null) {
    render(
      <TransactionItemPickerDrawer
        categoryGroups={[incomeGroup]}
        filteredCategoryOptions={[incomeCategory]}
        linkNotice={linkNotice}
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
  it("点确定后调用添加回调并关闭抽屉", () => {
    const onPickerAdd = vi.fn(() => true);
    const onClose = vi.fn();
    render(
      <ThemeProvider theme={theme}>
        <TransactionItemPickerDrawer
          categoryGroups={categoryGroups}
          filteredCategoryOptions={categoryOptions}
          onCategoryToggle={vi.fn()}
          onGroupSelect={vi.fn()}
          onPickerAdd={onPickerAdd}
          onRemoveItem={vi.fn()}
          onClose={onClose}
          open
          pickerAmount=""
          pickerCategoryId="food-lunch"
          pickerErrors={{}}
          selectedCategoryGroup={categoryGroups[0]}
        />
      </ThemeProvider>,
    );
    fireEvent.click(screen.getByRole("button", { name: "确定" }));
    expect(onPickerAdd).toHaveBeenCalledOnce();
    expect(onClose).toHaveBeenCalledOnce();
  });
});
