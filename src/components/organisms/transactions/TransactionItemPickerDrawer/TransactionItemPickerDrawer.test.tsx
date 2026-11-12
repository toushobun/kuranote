import {
  cleanup,
  fireEvent,
  render,
  screen,
  within,
} from "@testing-library/react";
import { ThemeProvider } from "@mui/material/styles";
import { afterEach, describe, expect, it, vi } from "vitest";

import { selectedCandidate } from "../TransactionLinkCandidatePanel/transactionLinkCandidateFixtures";
import { pressItemAmountKey as press } from "test/transactionConfirmStep";
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

  function renderLinkedAmount(amount = "3280", candidate = selectedCandidate) {
    const onAmountChange = vi.fn();
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
        pickerMode="reimbursement"
        pickerAmount={amount}
        pickerCategoryId="system-reimbursement"
        pickerErrors={{}}
        specialStatusEnabled
        selectedAccountCurrency="JPY"
        pickerReimbursementCandidate={candidate}
        onPickerAmountChange={onAmountChange}
      />,
    );
    return onAmountChange;
  }
  function openLinkedAmount() {
    const onAmountChange = renderLinkedAmount();
    fireEvent.click(
      screen.getByRole("button", { name: /报销金额 剩余未报/ }),
    );
    return onAmountChange;
  }

  it("已选结清支出时金额留空，金额行仍可打开计算器输入", () => {
    const onAmountChange = renderLinkedAmount("", {
      ...selectedCandidate,
      remainingRefundableAmount: "0",
    });
    expect(screen.getByText("¥0")).toBeVisible();
    expect(screen.getByText("这笔已全额报销")).toBeVisible();
    const row = screen.getByRole("button", { name: /报销金额 剩余未报/ });
    expect(row).toBeEnabled();
    fireEvent.click(row);
    press("7");
    press("确定");
    expect(onAmountChange).toHaveBeenCalledWith("7");
  });

  it("已全额结清时金额零可直接确定，金额行仍有铅笔", () => {
    const onPickerAdd = vi.fn(() => true);
    render(
      <TransactionItemPickerDrawer
        categoryGroups={categoryGroups}
        filteredCategoryOptions={categoryOptions}
        onCategoryToggle={vi.fn()}
        onClose={vi.fn()}
        onGroupSelect={vi.fn()}
        onPickerAdd={onPickerAdd}
        onRemoveItem={vi.fn()}
        open
        pickerMode="refund"
        pickerAmount=""
        pickerCategoryId="system-refund"
        pickerErrors={{}}
        specialStatusEnabled
        selectedAccountCurrency="JPY"
        pickerRefundCandidate={{
          ...selectedCandidate,
          refundedAmount: selectedCandidate.amount,
          remainingRefundableAmount: "0",
        }}
      />,
    );
    expect(screen.getByText("¥0")).toBeVisible();
    expect(screen.getByText("这笔已全额退款")).toBeVisible();
    expect(document.querySelector("svg[data-testid='EditRoundedIcon']")).not.toBeNull();
    fireEvent.click(screen.getByRole("button", { name: "确定" }));
    expect(onPickerAdd).toHaveBeenCalledOnce();
  });

  it("部分退款时金额行显示剩余未退且铅笔常显", () => {
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
        pickerAmount="800"
        pickerCategoryId="system-refund"
        pickerErrors={{}}
        specialStatusEnabled
        selectedAccountCurrency="JPY"
        pickerRefundCandidate={{
          ...selectedCandidate,
          refundedAmount: "2480",
          remainingRefundableAmount: "800",
        }}
      />,
    );
    expect(screen.getByText("剩余未退 ¥800")).toBeVisible();
    expect(document.querySelector("svg[data-testid='EditRoundedIcon']")).not.toBeNull();
  });

  it("金额行打开计算器，只有确认才写入金额", () => {
    const onAmountChange = openLinkedAmount();
    press("清空");
    press("7");
    expect(onAmountChange).not.toHaveBeenCalled();
    press("确定");
    expect(onAmountChange).toHaveBeenCalledOnce();
    expect(onAmountChange).toHaveBeenCalledWith("7");
  });

  it("关闭计算器丢弃草稿，重新打开恢复原金额", async () => {
    const onAmountChange = openLinkedAmount();
    press("清空");
    press("7");
    fireEvent.click(screen.getByRole("button", { name: "关闭金额键盘" }));
    expect(onAmountChange).not.toHaveBeenCalled();
    fireEvent.click(
      await screen.findByRole("button", { name: /报销金额 剩余未报/ }),
    );
    expect(screen.getByLabelText("计算器显示金额")).toHaveTextContent("3280");
  });

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
        pickerAmount="1280"
        pickerCategoryId="system-refund"
        pickerErrors={{}}
        specialStatusEnabled
        selectedAccountCurrency="JPY"
      />,
    );
    expect(screen.getByText("先选择要退款的支出")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "确定" })).toBeDisabled();
    expect(screen.getByText("—")).toBeVisible();
    expect(screen.queryByDisplayValue("1280")).not.toBeInTheDocument();
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
        pickerAmount="1280"
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
