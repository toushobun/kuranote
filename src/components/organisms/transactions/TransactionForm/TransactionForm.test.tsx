import {
  cleanup,
  fireEvent,
  render,
  screen,
  within,
} from "@testing-library/react";
import { createTheme } from "@mui/material/styles";
import { type ReactNode, useState, type ComponentProps } from "react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { routePaths } from "config/paths";
import { bottomNavigationLayout } from "organisms/navigation/bottomNavigationLayout";
import { appZIndex } from "theme/zIndex";
import { transactionFormValidationMessages } from "utils/transactionMessages";
import {
  drawerFooterSx,
  itemPickerDrawerPaperSx,
  itemPickerDrawerSx,
} from "../TransactionItemPickerDrawer/TransactionItemPickerDrawer";
import {
  TransactionForm,
  type TransactionFormInitialValues,
} from "./TransactionForm";
vi.mock("next/link", () => ({
  default: ({
    children,
    href,
    ...props
  }: {
    children: ReactNode;
    href: string;
  }) => (
    <a href={href} {...props}>
      {children}
    </a>
  ),
}));
describe("TransactionForm", () => {
  const accountOptions = [
    {
      id: "00000000-0000-4000-8000-000000000045",
      name: "日元现金",
      currency: "JPY",
    },
  ];
  const categoryOptions = [
    {
      id: "00000000-0000-4000-8000-000000005072",
      name: "餐饮",
      parentId: "00000000-0000-4000-8000-000000005001",
      parentName: "食材/调料",
      type: "expense" as const,
    },
    {
      id: "00000000-0000-4000-8000-000000005074",
      name: "日用品",
      parentId: "00000000-0000-4000-8000-000000005001",
      parentName: "食材/调料",
      type: "expense" as const,
    },
    {
      id: "00000000-0000-4000-8000-000000005075",
      name: "电车",
      parentId: "00000000-0000-4000-8000-000000005002",
      parentName: "交通出行",
      type: "expense" as const,
    },
    {
      id: "00000000-0000-4000-8000-000000005073",
      name: "工资",
      parentId: "00000000-0000-4000-8000-000000005003",
      parentName: "固定收入",
      type: "income" as const,
    },
  ];
  const merchantOptions = [
    {
      id: "00000000-0000-4000-8000-000000001001",
      name: "便利店",
      icon_url: null,
    },
  ];
  afterEach(() => {
    cleanup();
    vi.useRealTimers();
  });
  function renderForm(
    props: Partial<React.ComponentProps<typeof TransactionForm>> = {},
  ) {
    const action = vi.fn(async () => undefined);
    const view = render(
      <TransactionForm
        action={action}
        accountOptions={accountOptions}
        categoryOptions={categoryOptions}
        merchantOptions={merchantOptions}
        {...props}
      />,
    );
    return { action, ...view };
  }
  function getCombobox(container: HTMLElement, name: string) {
    return within(container).getByRole("combobox", { name });
  }
  function openSheet(container: HTMLElement, expandCategoryList = true) {
    fireEvent.click(
      within(container).getByRole("button", {
        hidden: true,
        name: "添加明细",
      }),
    );
    if (expandCategoryList) {
      fireEvent.click(screen.getByRole("button", { name: "选择更多分类" }));
    }
  }
  function clickSheetAddButton() {
    fireEvent.click(screen.getByRole("button", { name: "确定" }));
  }
  function addItemViaSheet(
    container: HTMLElement,
    categoryName: string,
    amount: string,
  ) {
    if (!screen.queryByRole("heading", { name: "添加明细" })) {
      openSheet(container);
    }
    const categoryListToggle = screen.queryByRole("button", {
      name: "选择更多分类",
    });
    if (categoryListToggle) fireEvent.click(categoryListToggle);
    fireEvent.click(screen.getByRole("button", { name: categoryName }));
    fireEvent.change(screen.getByRole("textbox", { name: "金额" }), {
      target: { value: amount },
    });
    clickSheetAddButton();
  }
  function getSubmittedTransactionAt(container: HTMLElement) {
    const input = container.querySelector<HTMLInputElement>(
      'input[name="transactionAt"]',
    );
    if (!input) throw new Error("发生时间提交字段不存在");
    return input.value;
  }
  function createInitialValues(): TransactionFormInitialValues {
    return {
      accountId: accountOptions[0].id,
      items: [{ amount: "1200", categoryId: categoryOptions[0].id }],
      merchantId: merchantOptions[0].id,
      note: "",
      transactionAt: "2026-06-05T03:20:10.000Z",
      transactionRecordId: "00000000-0000-4000-8000-000000009001",
      type: "expense" as const,
    };
  }
  function formatExpectedDateTimeParts(value: string) {
    const date = new Date(value);
    const pad = (part: number) => String(part).padStart(2, "0");
    const dateValue = `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`;
    const timeValue = `${pad(date.getHours())}:${pad(date.getMinutes())}:${pad(date.getSeconds())}`;
    return { dateValue, timeValue };
  }
  it("显示移动端记账顶部操作区", () => {
    const { container } = renderForm({ ledgerName: "家庭账本" });
    expect(
      within(container).getByRole("heading", { name: "新增记账" }),
    ).toBeInTheDocument();
    expect(
      within(container)
        .getByRole("link", { name: "关闭" })
        .getAttribute("href"),
    ).toBe(routePaths.transactions);
    expect(
      within(container).getByRole("button", { name: "保存" }),
    ).toBeInTheDocument();
  });
  it("传入错误信息时显示 Alert", () => {
    const errorMessage = "保存失败，请稍后重试。";
    renderForm({ errorMessage });
    expect(screen.getByText(errorMessage)).toBeInTheDocument();
  });
  it("编辑模式下回填发生日期和时间", () => {
    const transactionAt = "2026-06-05T03:20:10.000Z";
    const expected = formatExpectedDateTimeParts(transactionAt);
    const { container } = renderForm({
      initialValues: createInitialValues(),
    });
    expect(
      within(container).getByRole("button", { name: "选择记账时间" }),
    ).toHaveTextContent(expected.timeValue);
    expect(getSubmittedTransactionAt(container)).toBe(
      `${expected.dateValue}T${expected.timeValue}`,
    );
  });
  it("时刻默认开启并保留具体时间", () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date(2026, 5, 10, 9, 8, 7));
    const { container } = renderForm();
    expect(getSubmittedTransactionAt(container)).toBe("2026-06-10T09:08:07");
    expect(
      within(container).getByRole("button", { name: "选择记账时间" }),
    ).toHaveTextContent("09:08:07");
  });
  it("账户选项中显示币种", () => {
    const { container } = renderForm();
    fireEvent.mouseDown(getCombobox(container, "账户"));
    expect(screen.getByText("日元现金（JPY）")).toBeInTheDocument();
  });
  it("分类列表默认收起并可互斥切换展开和收起状态", () => {
    const { container } = renderForm();
    openSheet(container, false);
    expect(
      screen.getByRole("heading", { name: "添加明细" }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: "选择更多分类" }),
    ).toHaveAttribute("aria-expanded", "false");
    expect(screen.queryByRole("button", { name: "收起分类列表" })).toBeNull();
    expect(screen.queryByRole("button", { name: "食材/调料" })).toBeNull();

    fireEvent.click(screen.getByRole("button", { name: "选择更多分类" }));
    expect(
      screen.getByRole("button", { name: "收起分类列表" }),
    ).toHaveAttribute("aria-expanded", "true");
    expect(screen.queryByRole("button", { name: "选择更多分类" })).toBeNull();
    expect(
      screen.getByRole("button", { name: "食材/调料" }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: "固定收入" }),
    ).toBeInTheDocument();
    expect(screen.queryByTestId("DragIndicatorRoundedIcon")).toBeNull();
    expect(screen.queryByRole("button", { name: "添加大分类" })).toBeNull();
    expect(screen.queryByRole("button", { name: "添加小分类" })).toBeNull();
    expect(screen.queryByRole("link", { name: "排序" })).toBeNull();
    expect(
      screen.getByRole("textbox", { name: "搜索小分类" }),
    ).toBeInTheDocument();
    expect(screen.queryByText("特殊标记")).toBeNull();
    expect(screen.getByRole("button", { name: "确定" })).toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: "收起分类列表" }));
    expect(
      screen.getByRole("button", { name: "选择更多分类" }),
    ).toHaveAttribute("aria-expanded", "false");
    expect(screen.queryByRole("button", { name: "收起分类列表" })).toBeNull();
  });
  it("金额输入框位于搜索和分类选择器上方", () => {
    const { container } = renderForm();
    openSheet(container, false);
    const amountInput = screen.getByRole("textbox", { name: "金额" });
    const searchInput = screen.getByRole("textbox", { name: "搜索小分类" });
    const categoryToggle = screen.getByRole("button", {
      name: "选择更多分类",
    });
    expect(amountInput.compareDocumentPosition(searchInput)).toBe(
      Node.DOCUMENT_POSITION_FOLLOWING,
    );
    expect(searchInput.compareDocumentPosition(categoryToggle)).toBe(
      Node.DOCUMENT_POSITION_FOLLOWING,
    );
  });
  it("分类列表按收支类型分组且不提供分类管理入口", () => {
    const { container } = renderForm();
    openSheet(container);
    const expenseGroup = screen.getByRole("button", { name: "交通出行" });
    const incomeLabel = screen.getByText("收入分类");
    expect(screen.getByText("支出分类")).toBeInTheDocument();
    expect(expenseGroup.compareDocumentPosition(incomeLabel)).toBe(
      Node.DOCUMENT_POSITION_FOLLOWING,
    );
    expect(
      screen.getByRole("button", { name: "食材/调料 · 餐饮" }),
    ).toBeInTheDocument();
    expect(
      screen.queryByRole("button", { name: "固定收入 · 工资" }),
    ).toBeNull();

    fireEvent.click(screen.getByRole("button", { name: "固定收入" }));
    expect(
      screen.getByRole("button", { name: "固定收入 · 工资" }),
    ).toBeInTheDocument();
    expect(
      screen.queryByRole("button", { name: "食材/调料 · 餐饮" }),
    ).toBeNull();
    expect(screen.queryByRole("button", { name: "添加大分类" })).toBeNull();
    expect(screen.queryByRole("button", { name: "添加小分类" })).toBeNull();
    expect(screen.queryByRole("link", { name: "排序" })).toBeNull();
  });
  it("搜索小分类后同步筛选父子分类并可选中", () => {
    const { container } = renderForm();
    openSheet(container);
    fireEvent.change(screen.getByRole("textbox", { name: "搜索小分类" }), {
      target: { value: "电车" },
    });
    expect(
      screen.getByRole("button", { name: "交通出行" }),
    ).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "食材/调料" })).toBeNull();
    fireEvent.click(screen.getByRole("button", { name: "电车" }));
    expect(screen.getByRole("button", { name: "电车" })).toHaveAttribute(
      "aria-pressed",
      "true",
    );
    expect(screen.getByTestId("CheckRoundedIcon")).toBeInTheDocument();
    expect(screen.queryByText(/已选：/)).toBeNull();
  });
  it("可使用完整拼音和拼音首字母搜索小分类", () => {
    const { container } = renderForm();
    openSheet(container);
    const searchInput = screen.getByRole("textbox", { name: "搜索小分类" });
    fireEvent.change(searchInput, { target: { value: "canyin" } });
    expect(screen.getByRole("button", { name: "餐饮" })).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "电车" })).toBeNull();
    fireEvent.change(searchInput, { target: { value: "dc" } });
    expect(screen.getByRole("button", { name: "电车" })).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "餐饮" })).toBeNull();
    fireEvent.click(screen.getByRole("button", { name: "清空搜索" }));
    expect(searchInput).toHaveValue("");
    expect(screen.getByRole("button", { name: "餐饮" })).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "清空搜索" })).toBeNull();
  });
  it("添加明细弹框层级高于底部导航并为 safe-area 预留底部空间", () => {
    const theme = createTheme();
    expect(itemPickerDrawerSx.zIndex).toBe(appZIndex.bottomSheet);
    expect(itemPickerDrawerSx.zIndex).toBeGreaterThan(
      bottomNavigationLayout.navigationZIndex,
    );
    expect(itemPickerDrawerSx.zIndex).toBeLessThan(appZIndex.snackbar);
    // 防止未来通过 paper bottom offset 避让底部导航，导致弹框和导航之间出现空隙。
    expect("bottom" in itemPickerDrawerPaperSx).toBe(false);
    expect(drawerFooterSx.pb(theme)).toBe(
      `calc(${theme.spacing(2)} + ${bottomNavigationLayout.safeAreaPaddingBottom})`,
    );
  });
  it("切换大分类后右侧显示对应的小分类", () => {
    const { container } = renderForm();
    openSheet(container);
    fireEvent.click(screen.getByRole("button", { name: "交通出行" }));
    expect(screen.getByRole("button", { name: "电车" })).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "餐饮" })).toBeNull();
    expect(screen.getByRole("button", { name: "交通出行" })).toHaveAttribute(
      "aria-pressed",
      "true",
    );
    expect(screen.queryByText(/已选：/)).toBeNull();
  });
  it("切换大分类和小分类时保留已输入金额", () => {
    const { container } = renderForm();
    openSheet(container);
    const amountInput = screen.getByRole("textbox", { name: "金额" });
    fireEvent.change(amountInput, { target: { value: "286" } });
    fireEvent.click(screen.getByRole("button", { name: "餐饮" }));
    fireEvent.click(screen.getByRole("button", { name: "日用品" }));
    expect(amountInput).toHaveValue("286");
    fireEvent.click(screen.getByRole("button", { name: "交通出行" }));
    fireEvent.click(screen.getByRole("button", { name: "电车" }));
    expect(amountInput).toHaveValue("286");
  });
  it("追加明细后合计同步更新", () => {
    const { container } = renderForm();
    openSheet(container);
    addItemViaSheet(container, "餐饮", "286");
    addItemViaSheet(container, "日用品", "45");
    expect(within(container).getByText("消费明细（2）")).toBeInTheDocument();
    expect(within(container).getByText("本次合计")).toBeInTheDocument();
    expect(within(container).getByText("合计 - 331")).toBeInTheDocument();
  });
  it("点击明细分类可在同一弹框更新原明细", () => {
    const { container } = renderForm();
    openSheet(container);
    addItemViaSheet(container, "餐饮", "286");
    const editCategoryButton = container.querySelector<HTMLButtonElement>(
      'button[aria-label="编辑明细 1 分类"]',
    );
    if (!editCategoryButton) throw new Error("明细分类编辑按钮不存在");
    fireEvent.click(editCategoryButton);
    expect(
      screen.getByRole("heading", { name: "编辑明细" }),
    ).toBeInTheDocument();
    expect(screen.getByRole("textbox", { name: "金额" })).toHaveValue("286");
    fireEvent.change(screen.getByRole("textbox", { name: "金额" }), {
      target: { value: "320" },
    });
    fireEvent.click(screen.getByRole("button", { name: "保存修改" }));
    expect(within(container).getByText("消费明细（1）")).toBeInTheDocument();
    expect(
      container.querySelector('button[aria-label="编辑明细 1 金额"]'),
    ).toHaveTextContent("320");
    expect(
      within(container).queryByRole("button", { name: "删除明细 1" }),
    ).toBeNull();
    expect(within(container).getByText("合计 - 320")).toBeInTheDocument();
  });
  it("编辑明细时默认展开分类列表", () => {
    const { container } = renderForm();
    openSheet(container);
    addItemViaSheet(container, "餐饮", "286");
    const editCategoryButton = container.querySelector<HTMLButtonElement>(
      'button[aria-label="编辑明细 1 分类"]',
    );
    if (!editCategoryButton) throw new Error("明细分类编辑按钮不存在");
    fireEvent.click(editCategoryButton);
    expect(
      screen.getByRole("button", { name: "收起分类列表" }),
    ).toHaveAttribute("aria-expanded", "true");
    expect(screen.getByRole("button", { name: "餐饮" })).toHaveAttribute(
      "aria-pressed",
      "true",
    );
  });
  it("启用后回填、取消并重新勾选待报销", () => {
    const initialValues = createInitialValues();
    initialValues.items = [
      {
        ...initialValues.items[0],
        specialStatus: "pendingReimbursement",
      },
    ];
    const { container } = renderForm({
      initialValues,
      transactionItemSpecialStatusEnabled: true,
    });

    expect(within(container).getByText("合计 - ¥ 1200")).toBeInTheDocument();
    expect(
      container.querySelector<HTMLInputElement>(
        'input[name="itemSpecialStatus"]',
      )?.value,
    ).toBe("pendingReimbursement");

    fireEvent.click(
      within(container).getByRole("button", { name: "编辑明细 1 分类" }),
    );
    const checkbox = screen.getByRole("checkbox", { name: "待报销" });
    expect(checkbox).toBeChecked();
    fireEvent.click(checkbox);
    fireEvent.click(checkbox);
    fireEvent.click(screen.getByRole("button", { name: "保存修改" }));

    expect(
      container.querySelector<HTMLInputElement>(
        'input[name="itemSpecialStatus"]',
      )?.value,
    ).toBe("pendingReimbursement");
  });
  it("收入明细和合计显示正号与账户币种", () => {
    const { container } = renderForm({ initialType: "income" });
    fireEvent.mouseDown(getCombobox(container, "账户"));
    fireEvent.click(screen.getByText("日元现金（JPY）"));
    openSheet(container);
    fireEvent.click(screen.getByRole("button", { name: "固定收入" }));
    addItemViaSheet(container, "工资", "68.9");
    expect(
      container.querySelector('button[aria-label="编辑明细 1 金额"]'),
    ).toHaveTextContent("+ ¥ 68.9");
    expect(within(container).getByText("合计 + ¥ 68.9")).toBeInTheDocument();
  });
  it("未选小分类时点击追加显示错误提示", () => {
    const { container } = renderForm();
    openSheet(container);
    fireEvent.change(screen.getByRole("textbox", { name: "金额" }), {
      target: { value: "500" },
    });
    clickSheetAddButton();
    expect(
      screen.getByText(transactionFormValidationMessages.categoryRequired),
    ).toBeInTheDocument();
  });
  it("保存前汇总显示商家、账户和明细", () => {
    const { container } = renderForm();
    fireEvent.mouseDown(getCombobox(container, "商家"));
    fireEvent.click(screen.getByText("便利店"));
    fireEvent.mouseDown(getCombobox(container, "账户"));
    fireEvent.click(screen.getByText("日元现金（JPY）"));
    openSheet(container);
    addItemViaSheet(container, "餐饮", "1200");
    expect(within(container).getByText("保存前汇总")).toBeInTheDocument();
    expect(within(container).getAllByText("便利店")).toHaveLength(2);
    expect(within(container).getAllByText("日元现金（JPY）")).toHaveLength(2);
    expect(
      within(container).getByText("食材/调料 / 餐饮 / 1200"),
    ).toBeInTheDocument();
    expect(
      within(container).getAllByText("- ¥ 1200", { exact: true }),
    ).toHaveLength(2);
  });
  it("时间字段显示在保存前汇总上面", () => {
    const { container } = renderForm();
    const dateTimeButton = within(container).getByRole("button", {
      name: "选择记账时间",
    });
    const summaryHeading = within(container).getByText("保存前汇总");
    expect(dateTimeButton.compareDocumentPosition(summaryHeading)).toBe(4);
  });
  it("没有账户时保存按钮不可用", () => {
    const { container } = renderForm({ accountOptions: [] });
    expect(
      within(container).getByRole("button", { name: "保存" }),
    ).toHaveProperty("disabled", true);
    expect(
      within(container).getByRole("button", { name: "保存记账" }),
    ).toHaveProperty("disabled", true);
  });
  it("商家下拉显示占位项和商家名称", () => {
    const { container } = renderForm();
    fireEvent.mouseDown(getCombobox(container, "商家"));
    expect(screen.getByText("请选择商家")).toBeInTheDocument();
    expect(screen.getByText("便利店")).toBeInTheDocument();
  });
  it("initialType=income 时，hidden type 应为 income", () => {
    const { container } = renderForm({ initialType: "income" });
    const typeInput =
      container.querySelector<HTMLInputElement>('input[name="type"]');
    expect(typeInput?.value).toBe("income");
  });
  it("initialType 从 expense 切换为 income 后，hidden type 应为 income", () => {
    const action = vi.fn(async () => undefined);
    const baseProps = {
      action,
      accountOptions,
      categoryOptions,
      merchantOptions,
    };
    const { container, rerender } = render(
      <TransactionForm {...baseProps} initialType="expense" />,
    );
    rerender(<TransactionForm {...baseProps} initialType="income" />);
    const typeInput =
      container.querySelector<HTMLInputElement>('input[name="type"]');
    expect(typeInput?.value).toBe("income");
  });
  it("initialType income 再切换回 expense 后，hidden type 应为 expense", () => {
    const action = vi.fn(async () => undefined);
    const baseProps = {
      action,
      accountOptions,
      categoryOptions,
      merchantOptions,
    };
    const { container, rerender } = render(
      <TransactionForm {...baseProps} initialType="expense" />,
    );
    rerender(<TransactionForm {...baseProps} initialType="income" />);
    rerender(<TransactionForm {...baseProps} initialType="expense" />);
    const typeInput =
      container.querySelector<HTMLInputElement>('input[name="type"]');
    expect(typeInput?.value).toBe("expense");
  });
});
describe("TransactionForm \u7F16\u8F91\u7C7B\u578B\u5207\u6362", () => {
  const accountOptions = [
    {
      id: "00000000-0000-4000-8000-000000000045",
      name: "日元现金",
      currency: "JPY",
    },
  ];
  const expenseCategoryId = "00000000-0000-4000-8000-000000005072";
  const incomeCategoryId = "00000000-0000-4000-8000-000000005073";
  const categoryOptions = [
    {
      id: expenseCategoryId,
      name: "餐饮",
      parentId: "00000000-0000-4000-8000-000000005001",
      parentName: "食材/调料",
      type: "expense" as const,
    },
    {
      id: incomeCategoryId,
      name: "工资",
      parentId: "00000000-0000-4000-8000-000000005003",
      parentName: "固定收入",
      type: "income" as const,
    },
  ];
  const merchantOptions = [
    {
      id: "00000000-0000-4000-8000-000000001001",
      name: "便利店",
      icon_url: null,
    },
  ];
  afterEach(() => {
    cleanup();
  });
  function renderForm(
    props: Partial<ComponentProps<typeof TransactionForm>> = {},
  ) {
    return render(
      <TransactionForm
        action={vi.fn(async () => undefined)}
        accountOptions={accountOptions}
        categoryOptions={categoryOptions}
        merchantOptions={merchantOptions}
        {...props}
      />,
    );
  }
  function renderEditFormWithTypeSwitch(
    baseInitialValues: TransactionFormInitialValues,
  ) {
    function Wrapper() {
      const [activeType, setActiveType] = useState<"expense" | "income">(
        baseInitialValues.type,
      );
      const currentInitialValues: TransactionFormInitialValues =
        activeType === baseInitialValues.type
          ? baseInitialValues
          : { ...baseInitialValues, type: activeType, items: [] };
      const typeNavigation = (
        <div>
          <button
            aria-pressed={activeType === "expense"}
            onClick={() => setActiveType("expense")}
          >
            支出
          </button>
          <button
            aria-pressed={activeType === "income"}
            onClick={() => setActiveType("income")}
          >
            收入
          </button>
        </div>
      );
      return (
        <TransactionForm
          key={activeType}
          action={vi.fn(async () => undefined)}
          accountOptions={accountOptions}
          categoryOptions={categoryOptions}
          merchantOptions={merchantOptions}
          initialValues={currentInitialValues}
          typeNavigation={typeNavigation}
        />
      );
    }
    return render(<Wrapper />);
  }
  function createInitialValues(
    type: "expense" | "income" = "expense",
  ): TransactionFormInitialValues {
    return {
      accountId: accountOptions[0].id,
      items: [
        {
          amount: type === "expense" ? "1200" : "300000",
          categoryId: type === "expense" ? expenseCategoryId : incomeCategoryId,
        },
      ],
      merchantId: merchantOptions[0].id,
      note: "编辑前备注",
      transactionAt: "2026-06-05T03:20:10.000Z",
      transactionRecordId: "00000000-0000-4000-8000-000000009001",
      type,
    };
  }
  function getHiddenInput(container: HTMLElement, name: string) {
    const input = container.querySelector<HTMLInputElement>(
      `input[name="${name}"]`,
    );
    if (!input) throw new Error(`${name} hidden input 不存在`);
    return input;
  }
  function getSubmittedCategoryIds(container: HTMLElement) {
    return Array.from(
      container.querySelectorAll<HTMLInputElement>(
        'input[name="itemCategoryId"]',
      ),
    ).map((input) => input.value);
  }
  function openSheet(container: HTMLElement) {
    fireEvent.click(
      within(container).getByRole("button", {
        hidden: true,
        name: "添加明细",
      }),
    );
    fireEvent.click(screen.getByRole("button", { name: "选择更多分类" }));
  }
  function clickSheetAddButton() {
    fireEvent.click(screen.getByRole("button", { name: "确定" }));
  }
  function addItemViaSheet(
    container: HTMLElement,
    categoryName: string,
    amount: string,
  ) {
    if (!screen.queryByRole("heading", { name: "添加明细" })) {
      openSheet(container);
    }
    const categoryListToggle = screen.queryByRole("button", {
      name: "选择更多分类",
    });
    if (categoryListToggle) fireEvent.click(categoryListToggle);
    fireEvent.click(screen.getByRole("button", { name: categoryName }));
    fireEvent.change(screen.getByRole("textbox", { name: "金额" }), {
      target: { value: amount },
    });
    clickSheetAddButton();
  }
  it("编辑支出时 hidden type 默认为 expense", () => {
    const { container } = renderForm({
      initialValues: createInitialValues(),
    });
    expect(getHiddenInput(container, "type").value).toBe("expense");
  });
  it("编辑收入时 hidden type 默认为 income", () => {
    const { container } = renderForm({
      initialValues: createInitialValues("income"),
    });
    expect(getHiddenInput(container, "type").value).toBe("income");
  });
  it("编辑收入时不显示报销和退款关联选择器", () => {
    const { container } = renderForm({
      initialValues: createInitialValues("income"),
      transactionItemSpecialStatusEnabled: true,
    });

    openSheet(container);

    expect(screen.queryByText("报销关联")).not.toBeInTheDocument();
    expect(screen.queryByText("退款关联")).not.toBeInTheDocument();
  });
  it("编辑支出点击收入后 hidden type 变为 income，且旧支出分类不会继续提交", () => {
    const { container } = renderEditFormWithTypeSwitch(createInitialValues());
    expect(getSubmittedCategoryIds(container)).toEqual([expenseCategoryId]);
    fireEvent.click(within(container).getByRole("button", { name: "收入" }));
    expect(getHiddenInput(container, "type").value).toBe("income");
    expect(getSubmittedCategoryIds(container)).toEqual([]);
  });
  it("编辑收入点击支出后 hidden type 变为 expense，且旧收入分类不会继续提交", () => {
    const { container } = renderEditFormWithTypeSwitch(
      createInitialValues("income"),
    );
    expect(getSubmittedCategoryIds(container)).toEqual([incomeCategoryId]);
    fireEvent.click(within(container).getByRole("button", { name: "支出" }));
    expect(getHiddenInput(container, "type").value).toBe("expense");
    expect(getSubmittedCategoryIds(container)).toEqual([]);
  });
  it("明细抽屉同时显示支出和收入分类，可混合追加", () => {
    const { container } = renderForm({
      initialValues: createInitialValues(),
    });
    openSheet(container);
    expect(
      screen.getByRole("button", { name: "食材/调料" }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: "固定收入" }),
    ).toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: "固定收入" }));
    addItemViaSheet(container, "工资", "300000");
    expect(getSubmittedCategoryIds(container)).toEqual([
      expenseCategoryId,
      incomeCategoryId,
    ]);
  });
  it("编辑切换到支出后弹框显示所有分类，可追加支出明细", () => {
    const { container } = renderEditFormWithTypeSwitch(
      createInitialValues("income"),
    );
    fireEvent.click(within(container).getByRole("button", { name: "支出" }));
    openSheet(container);
    expect(
      screen.getByRole("button", { name: "食材/调料" }),
    ).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "餐饮" })).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: "固定收入" }),
    ).toBeInTheDocument();
    addItemViaSheet(container, "餐饮", "800");
    expect(getSubmittedCategoryIds(container)).toEqual([expenseCategoryId]);
  });
  it("新增记账可同时添加支出和收入明细，两者均会提交", () => {
    const { container } = renderForm();
    openSheet(container);
    addItemViaSheet(container, "餐饮", "500");
    openSheet(container);
    fireEvent.click(screen.getByRole("button", { name: "固定收入" }));
    addItemViaSheet(container, "工资", "300000");
    expect(getSubmittedCategoryIds(container)).toEqual([
      expenseCategoryId,
      incomeCategoryId,
    ]);
  });
});
describe("TransactionForm \u660E\u7EC6\u4E0E\u6821\u9A8C", () => {
  const accountOptions = [
    {
      id: "11111111-1111-4111-8111-111111111111",
      name: "日元现金",
      currency: "JPY",
    },
  ];
  const merchantOptions = [
    {
      id: "22222222-2222-4222-8222-222222222222",
      name: "便利店",
      icon_url: null,
    },
  ];
  const expenseCategories = [
    {
      id: "33333333-3333-4333-8333-333333333331",
      name: "餐饮",
      parentId: "33333333-3333-4333-8333-333333333330",
      parentName: "食材/调料",
      type: "expense" as const,
    },
    {
      id: "33333333-3333-4333-8333-333333333332",
      name: "日用品",
      parentId: "33333333-3333-4333-8333-333333333330",
      parentName: "食材/调料",
      type: "expense" as const,
    },
  ];
  const incomeCategories = [
    {
      id: "44444444-4444-4444-8444-444444444441",
      name: "工资",
      parentId: "44444444-4444-4444-8444-444444444440",
      parentName: "固定收入",
      type: "income" as const,
    },
  ];
  afterEach(() => cleanup());
  function renderForm(
    props: Partial<React.ComponentProps<typeof TransactionForm>> = {},
  ) {
    return render(
      <TransactionForm
        action={vi.fn(async () => undefined)}
        accountOptions={accountOptions}
        categoryOptions={[...expenseCategories, ...incomeCategories]}
        merchantOptions={merchantOptions}
        {...props}
      />,
    );
  }
  function openSheet(container: HTMLElement) {
    fireEvent.click(
      within(container).getByRole("button", {
        hidden: true,
        name: "添加明细",
      }),
    );
    fireEvent.click(screen.getByRole("button", { name: "选择更多分类" }));
  }
  function clickSheetAddButton() {
    fireEvent.click(screen.getByRole("button", { name: "确定" }));
  }
  function addItemViaSheet(
    container: HTMLElement,
    categoryName: string,
    amount: string,
  ) {
    if (!screen.queryByRole("heading", { name: "添加明细" })) {
      openSheet(container);
    }
    const categoryListToggle = screen.queryByRole("button", {
      name: "选择更多分类",
    });
    if (categoryListToggle) fireEvent.click(categoryListToggle);
    fireEvent.click(screen.getByRole("button", { name: categoryName }));
    fireEvent.change(screen.getByRole("textbox", { name: "金额" }), {
      target: { value: amount },
    });
    clickSheetAddButton();
  }
  const trafficCategories = [
    {
      id: "33333333-3333-4333-8333-333333333341",
      name: "电车",
      parentId: "33333333-3333-4333-8333-333333333340",
      parentName: "交通出行",
      type: "expense" as const,
    },
  ];
  it("小数明细合计正确舍入显示，不出现浮点精度问题", () => {
    const { container } = renderForm();
    openSheet(container);
    addItemViaSheet(container, "餐饮", "0.10");
    addItemViaSheet(container, "日用品", "0.20");
    expect(within(container).getByText("合计 - 0.3")).toBeInTheDocument();
  });
  it("打开添加明细时金额默认是空，显式输入 0 可追加", () => {
    const { container } = renderForm();
    openSheet(container);
    expect(screen.getByRole("textbox", { name: "金额" })).toHaveProperty(
      "value",
      "",
    );
    fireEvent.click(screen.getByRole("button", { name: "餐饮" }));
    fireEvent.change(screen.getByRole("textbox", { name: "金额" }), {
      target: { value: "0" },
    });
    clickSheetAddButton();
    expect(
      screen.queryByText(transactionFormValidationMessages.amountInvalid),
    ).toBeNull();
    expect(container.querySelector('input[name="itemAmount"]')).toHaveValue(
      "0",
    );
  });
  it("分类列表为空时保存按钮不可用", () => {
    const { container } = renderForm({ categoryOptions: [] });
    expect(
      within(container).getByRole("button", { name: "保存记账" }),
    ).toBeDisabled();
  });
  it("编辑已有明细后明细在列表中的顺序不变", () => {
    const { container } = renderForm();
    addItemViaSheet(container, "餐饮", "100");
    addItemViaSheet(container, "日用品", "200");
    const itemInputsBefore = Array.from(
      container.querySelectorAll<HTMLInputElement>(
        'input[name="itemCategoryId"]',
      ),
    ).map((input) => input.value);
    expect(itemInputsBefore[0]).toBe(expenseCategories[0].id);
    expect(itemInputsBefore[1]).toBe(expenseCategories[1].id);
    // 打开第一条明细进行编辑，修改金额（同类型），不改变分类
    fireEvent.click(screen.getByLabelText("编辑明细 1 分类"));
    fireEvent.change(screen.getByRole("textbox", { name: "金额" }), {
      target: { value: "150" },
    });
    fireEvent.click(screen.getByRole("button", { name: "保存修改" }));
    const itemInputsAfter = Array.from(
      container.querySelectorAll<HTMLInputElement>(
        'input[name="itemCategoryId"]',
      ),
    ).map((input) => input.value);
    expect(itemInputsAfter[0]).toBe(expenseCategories[0].id);
    expect(itemInputsAfter[1]).toBe(expenseCategories[1].id);
  });
  it("搜索状态下选择其他大分类的小分类后清空搜索仍显示该大分类", () => {
    const allCategories = [
      ...expenseCategories,
      ...incomeCategories,
      ...trafficCategories,
    ];
    const { container } = renderForm({ categoryOptions: allCategories });
    openSheet(container);
    // 搜索"电车"，命中交通出行大分类
    fireEvent.change(screen.getByRole("textbox", { name: "搜索小分类" }), {
      target: { value: "电车" },
    });
    // 右侧显示的电车按钮存在（交通出行大分类下）
    expect(screen.getByRole("button", { name: "电车" })).toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: "电车" }));
    // 清空搜索
    fireEvent.change(screen.getByRole("textbox", { name: "搜索小分类" }), {
      target: { value: "" },
    });
    // 左侧大分类应显示交通出行为选中状态（完全一致名称以避免与快捷分类 chip 冲突）
    expect(
      screen.getByRole("button", { name: "交通出行" }),
    ).toBeInTheDocument();
    // 右侧应仍显示电车（交通出行下的小分类）
    expect(screen.getByRole("button", { name: "电车" })).toBeInTheDocument();
  });
});
