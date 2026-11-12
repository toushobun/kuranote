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

  it("收入类型只展示收入分类，不再出现关联入口", () => {
    render(
      <TransactionItemPickerDrawer
        categoryGroups={[...categoryGroups, incomeGroup]}
        filteredCategoryOptions={[...categoryOptions, incomeCategory]}
        onCategoryToggle={vi.fn()}
        onClose={vi.fn()}
        onGroupSelect={vi.fn()}
        onPickerAdd={() => true}
        onRemoveItem={vi.fn()}
        open
        pickerAmount=""
        pickerCategoryId={incomeCategory.id}
        pickerMode="income"
        pickerErrors={{}}
        selectedCategoryGroup={incomeGroup}
        specialStatusEnabled
      />,
    );

    expect(screen.getByRole("button", { name: "工资" })).toBeVisible();
    expect(
      screen.queryByRole("button", { name: "午餐" }),
    ).not.toBeInTheDocument();
    expect(screen.queryByText("退款关联")).not.toBeInTheDocument();
    expect(screen.queryByText("报销关联")).not.toBeInTheDocument();
  });

  it("切换明细类型时回调一次；禁用特殊状态时只显示支出和收入", () => {
    const onPickerModeChange = vi.fn();
    render(
      <TransactionItemPickerDrawer
        categoryGroups={[...categoryGroups, incomeGroup]}
        filteredCategoryOptions={[...categoryOptions, incomeCategory]}
        onCategoryToggle={vi.fn()}
        onClose={vi.fn()}
        onGroupSelect={vi.fn()}
        onPickerModeChange={onPickerModeChange}
        onPickerAdd={() => true}
        onRemoveItem={vi.fn()}
        open
        pickerAmount=""
        pickerCategoryId="food-lunch"
        pickerErrors={{}}
        selectedCategoryGroup={categoryGroups[0]}
      />,
    );
    fireEvent.click(screen.getByRole("button", { name: "明细类型收入" }));
    expect(onPickerModeChange).toHaveBeenCalledWith("income");
    expect(
      screen.queryByRole("button", { name: "明细类型退款" }),
    ).not.toBeInTheDocument();
    expect(
      screen.queryByRole("button", { name: "明细类型报销" }),
    ).not.toBeInTheDocument();
    expect(
      screen.queryByText("请选择本笔明细的分类。"),
    ).not.toBeInTheDocument();
  });

  it("多账户时仅允许选择支出类型", () => {
    render(
      <TransactionItemPickerDrawer
        categoryGroups={[...categoryGroups, incomeGroup]}
        filteredCategoryOptions={[...categoryOptions, incomeCategory]}
        onCategoryToggle={vi.fn()}
        onClose={vi.fn()}
        onGroupSelect={vi.fn()}
        onPickerAdd={() => true}
        onRemoveItem={vi.fn()}
        open
        multiAccount
        pickerAmount=""
        pickerCategoryId="food-lunch"
        pickerErrors={{}}
        selectedCategoryGroup={categoryGroups[0]}
        specialStatusEnabled
      />,
    );
    expect(screen.getByRole("button", { name: "明细类型支出" })).toBeEnabled();
    for (const name of ["收入", "退款", "报销"]) {
      expect(
        screen.getByRole("button", { name: `明细类型${name}` }),
      ).toBeDisabled();
    }
  });

  it("退款未选择原支出时禁用确认，并提示先选", () => {
    render(
      <TransactionItemPickerDrawer
        categoryGroups={categoryGroups}
        filteredCategoryOptions={categoryOptions}
        onCategoryToggle={vi.fn()}
        onClose={vi.fn()}
        onGroupSelect={vi.fn()}
        onPickerAdd={() => true}
        onRemoveItem={vi.fn()}
        open
        pickerMode="refund"
        pickerAmount=""
        pickerCategoryId="system-refund"
        pickerErrors={{}}
        specialStatusEnabled
        selectedAccountCurrency="JPY"
      />,
    );
    expect(
      screen.getByText("请先选择一笔原支出，再填写金额。"),
    ).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "确定" })).toBeDisabled();
    expect(screen.getByRole("textbox", { name: "核销金额" })).toBeDisabled();
    expect(screen.queryByPlaceholderText("搜索小分类")).not.toBeInTheDocument();
  });

  it("关联提示在抽屉内显示", () => {
    render(
      <TransactionItemPickerDrawer
        categoryGroups={categoryGroups}
        filteredCategoryOptions={categoryOptions}
        linkNotice="退款明细必须与收款账户币种一致，请重新选择。"
        onCategoryToggle={vi.fn()}
        onClose={vi.fn()}
        onGroupSelect={vi.fn()}
        onPickerAdd={() => true}
        onRemoveItem={vi.fn()}
        open
        pickerMode="refund"
        pickerAmount=""
        pickerCategoryId="system-refund"
        pickerErrors={{}}
        specialStatusEnabled
      />,
    );
    expect(
      within(
        screen
          .getByText("退款 / 报销会抵消原支出，不计入收入。")
          .closest(".MuiDrawer-paper") as HTMLElement,
      ).getByRole("alert"),
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
