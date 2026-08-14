import {
  cleanup,
  fireEvent,
  render,
  within,
  screen,
} from "@testing-library/react";
import { type ReactNode, useState } from "react";
import { afterEach, describe, expect, it, vi } from "vitest";
import {
  NewTransactionTemplate,
  TransactionPermissionDenied,
  EditTransactionTemplate,
  EditTransferTransactionTemplate,
} from "./TransactionFormPage";
import { routePaths } from "config/paths";
import { UserThemeProvider } from "theme/UserThemeProvider";
vi.mock("organisms/transactions/TransactionForm/TransactionForm", () => ({
  TransactionForm: ({
    errorMessage,
    formId,
    initialValues,
    initialType,
    transactionItemSpecialStatusEnabled,
  }: {
    errorMessage: string | null;
    formId?: string;
    initialValues?: {
      type: "expense" | "income";
    };
    initialType?: "expense" | "income";
    transactionItemSpecialStatusEnabled?: boolean;
  }): ReactNode => {
    const [isItemPickerOpen, setIsItemPickerOpen] = useState(false);
    const type = initialValues?.type ?? initialType ?? "expense";
    const label = type === "income" ? "收入" : "支出";
    const itemPicker = (
      <>
        <button onClick={() => setIsItemPickerOpen(true)} type="button">
          添加明细
        </button>
        {isItemPickerOpen && transactionItemSpecialStatusEnabled ? (
          <section aria-label="特殊状态">特殊状态</section>
        ) : null}
      </>
    );
    if (initialValues) {
      return (
        <form id={formId}>
          <div data-testid={`transaction-form-${type}`}>
            <input aria-label={`${label}编辑临时输入`} defaultValue="" />
            <input aria-label={`${label}转换临时输入`} defaultValue="" />
            <input name="type" type="hidden" value={type} />
            {itemPicker}
          </div>
        </form>
      );
    }
    return (
      <div data-testid={`transaction-form-${type}`}>
        <input aria-label={`${label}临时输入`} defaultValue="" />
        <input name="type" type="hidden" value={type} />
        {itemPicker}
        {errorMessage ? <div role="alert">{errorMessage}</div> : null}
      </div>
    );
  },
}));
vi.mock(
  "organisms/transactions/TransferTransactionForm/TransferTransactionForm",
  () => ({
    TransferTransactionForm: ({
      errorMessage,
      formId,
    }: {
      errorMessage: string | null;
      formId?: string;
    }): ReactNode => {
      if (formId?.startsWith("edit-")) {
        return (
          <form data-testid="transfer-transaction-form" id={formId}>
            <input aria-label="转账编辑临时输入" defaultValue="" />
            <input aria-label="转账转换临时输入" defaultValue="" />
          </form>
        );
      }
      return (
        <div data-testid="transfer-transaction-form">
          <input aria-label="转账临时输入" defaultValue="" />
          {errorMessage ? <div role="alert">{errorMessage}</div> : null}
        </div>
      );
    },
  }),
);
vi.mock(
  "organisms/transactions/TransactionAmountKeypadLauncher/TransactionAmountKeypadLauncher",
  () => ({
    TransactionAmountKeypadLauncher: (): ReactNode => null,
  }),
);
vi.mock(
  "organisms/transactions/TransactionFormHeader/TransactionFormHeader",
  () => ({
    TransactionFormHeader: ({
      ledgerName,
      title,
    }: {
      ledgerName?: string;
      title: string;
    }): ReactNode => (
      <div data-testid="transaction-form-header">
        <h1>{title}</h1>
        {ledgerName ? <p>当前账本：{ledgerName}</p> : null}
        <button type="submit">保存</button>
      </div>
    ),
  }),
);
describe("\u65B0\u589E\u8BB0\u8D26\u9875\u9762", () => {
  afterEach(() => {
    cleanup();
  });
  const baseProps = {
    accountOptions: [],
    action: vi.fn(async () => ({})),
    categoryOptions: [],
    errorMessage: null,
    frequentCategoryIds: [],
    ledgerName: "家庭账本",
    merchantOptions: [],
    transactionItemSpecialStatusEnabled: false,
  };
  describe("NewTransactionTemplate", () => {
    it("显示新增记账页面标题", () => {
      const { container } = render(<NewTransactionTemplate {...baseProps} />);
      expect(
        within(container).getByRole("heading", { name: "记一笔" }),
      ).toBeInTheDocument();
    });
    it("显示关闭入口且不显示当前账本名称", () => {
      const { container } = render(<NewTransactionTemplate {...baseProps} />);
      expect(
        within(container).getByRole("link", { name: "关闭" }),
      ).toBeInTheDocument();
      expect(
        within(container).queryByText("当前账本：家庭账本"),
      ).not.toBeInTheDocument();
    });
    it("只显示一套包含转账的记账类型导航", () => {
      const { container } = render(<NewTransactionTemplate {...baseProps} />);
      expect(
        within(container).getAllByRole("group", { name: "记账类型" }),
      ).toHaveLength(1);
      expect(
        within(container).getByRole("button", { name: "转账" }),
      ).toBeInTheDocument();
      expect(
        within(container).getByRole("button", { name: "收支" }),
      ).toBeInTheDocument();
      expect(
        within(container).queryByRole("button", { name: "收入" }),
      ).toBeNull();
      expect(
        within(container).queryByRole("button", { name: "支出" }),
      ).toBeNull();
    });
    it("默认激活支出表单并保留其他类型面板", () => {
      const { container } = render(<NewTransactionTemplate {...baseProps} />);
      expect(
        within(container).getByTestId("transaction-form-expense"),
      ).toBeInTheDocument();
      expect(
        within(container).getByTestId("transaction-form-income"),
      ).toBeInTheDocument();
      expect(
        within(container).getByTestId("transfer-transaction-form"),
      ).toBeInTheDocument();
      expect(
        within(container).getByTestId("transaction-type-slide-panel-expense"),
      ).toHaveAttribute("aria-hidden", "false");
      expect(
        within(container).getByTestId("transaction-type-slide-panel-transfer"),
      ).toHaveAttribute("aria-hidden", "true");
    });
    it("initialType=expense 时激活支出表单", () => {
      const { container } = render(
        <NewTransactionTemplate {...baseProps} initialType="expense" />,
      );
      expect(
        within(container).getByTestId("transaction-type-slide-panel-expense"),
      ).toHaveAttribute("aria-hidden", "false");
    });
    it("initialType=income 时激活收入表单", () => {
      const { container } = render(
        <NewTransactionTemplate {...baseProps} initialType="income" />,
      );
      expect(
        within(container).getByTestId("transaction-type-slide-panel-income"),
      ).toHaveAttribute("aria-hidden", "false");
      expect(
        within(container).getByTestId("transaction-type-slide-panel-expense"),
      ).toHaveAttribute("aria-hidden", "true");
    });
    it("initialType=transfer 时激活转账表单", () => {
      const { container } = render(
        <NewTransactionTemplate {...baseProps} initialType="transfer" />,
      );
      expect(
        within(container).getByTestId("transaction-type-slide-panel-transfer"),
      ).toHaveAttribute("aria-hidden", "false");
      expect(
        within(container).getByTestId("transaction-type-slide-panel-expense"),
      ).toHaveAttribute("aria-hidden", "true");
    });
    it("点击转账 tab 切换到转账面板", () => {
      const { container } = render(<NewTransactionTemplate {...baseProps} />);
      fireEvent.click(within(container).getByRole("button", { name: "转账" }));
      expect(
        within(container).getByTestId("transaction-type-slide-panel-transfer"),
      ).toHaveAttribute("aria-hidden", "false");
      expect(
        within(container).getByTestId("transaction-type-slide-panel-expense"),
      ).toHaveAttribute("aria-hidden", "true");
    });
    it("点击收支 tab 切换回普通记账面板", () => {
      const { container } = render(
        <NewTransactionTemplate {...baseProps} initialType="transfer" />,
      );
      fireEvent.click(within(container).getByRole("button", { name: "收支" }));
      expect(
        within(container).getByTestId("transaction-type-slide-panel-expense"),
      ).toHaveAttribute("aria-hidden", "false");
      expect(
        within(container).getByTestId("transaction-type-slide-panel-transfer"),
      ).toHaveAttribute("aria-hidden", "true");
    });
    it("initialType=income 时切到转账后再回到收支仍显示收入面板", () => {
      const { container } = render(
        <NewTransactionTemplate {...baseProps} initialType="income" />,
      );
      fireEvent.click(within(container).getByRole("button", { name: "转账" }));
      fireEvent.click(within(container).getByRole("button", { name: "收支" }));
      expect(
        within(container).getByTestId("transaction-type-slide-panel-income"),
      ).toHaveAttribute("aria-hidden", "false");
      expect(
        within(container).getByTestId("transaction-type-slide-panel-transfer"),
      ).toHaveAttribute("aria-hidden", "true");
    });
    it("切换类型后保留已挂载表单的输入状态", () => {
      const { container } = render(<NewTransactionTemplate {...baseProps} />);
      fireEvent.change(within(container).getByLabelText("支出临时输入"), {
        target: { value: "保留支出输入" },
      });
      fireEvent.click(within(container).getByRole("button", { name: "转账" }));
      fireEvent.change(within(container).getByLabelText("转账临时输入"), {
        target: { value: "保留转账输入" },
      });
      fireEvent.click(within(container).getByRole("button", { name: "收支" }));
      expect(within(container).getByLabelText("支出临时输入")).toHaveValue(
        "保留支出输入",
      );
    });
    it("传入错误信息时当前表单内显示错误提示", () => {
      const { container } = render(
        <NewTransactionTemplate
          {...baseProps}
          errorMessage="新增记账失败。请稍后重试。"
        />,
      );
      const activePanel = within(container).getByTestId(
        "transaction-type-slide-panel-expense",
      );
      expect(within(activePanel).getByRole("alert")).toBeInTheDocument();
      expect(
        within(activePanel).getByText("新增记账失败。请稍后重试。"),
      ).toBeInTheDocument();
    });
    it("transfer 类型且带错误信息时保持转账表单", () => {
      const { container } = render(
        <NewTransactionTemplate
          {...baseProps}
          initialType="transfer"
          errorMessage="转账失败。请稍后重试。"
        />,
      );
      const activePanel = within(container).getByTestId(
        "transaction-type-slide-panel-transfer",
      );
      expect(activePanel).toHaveAttribute("aria-hidden", "false");
      expect(within(activePanel).getByRole("alert")).toBeInTheDocument();
    });
    it("默认渲染时当前普通表单 hidden type 为 expense", () => {
      const { container } = render(<NewTransactionTemplate {...baseProps} />);
      const activePanel = within(container).getByTestId(
        "transaction-type-slide-panel-expense",
      );
      const hiddenInput = within(activePanel).getByDisplayValue("expense");
      expect(hiddenInput).toHaveAttribute("name", "type");
      expect(hiddenInput).toHaveAttribute("type", "hidden");
    });
    it("账本启用明细特殊状态后新增模板的明细弹层显示特殊状态选择区", () => {
      const { container } = render(
        <NewTransactionTemplate
          {...baseProps}
          transactionItemSpecialStatusEnabled
        />,
      );
      const activePanel = within(container).getByTestId(
        "transaction-type-slide-panel-expense",
      );
      fireEvent.click(
        within(activePanel).getByRole("button", { name: "添加明细" }),
      );
      expect(
        within(activePanel).getByRole("region", { name: "特殊状态" }),
      ).toBeInTheDocument();
    });
    it("initialType=income 时收支 tab 对应收入表单", () => {
      const { container } = render(
        <NewTransactionTemplate {...baseProps} initialType="income" />,
      );
      expect(
        within(container).getByRole("button", { name: "收支" }),
      ).toHaveAttribute("aria-pressed", "true");
      const activePanel = within(container).getByTestId(
        "transaction-type-slide-panel-income",
      );
      const hiddenInput = within(activePanel).getByDisplayValue("income");
      expect(hiddenInput).toHaveAttribute("name", "type");
      expect(hiddenInput).toHaveAttribute("type", "hidden");
    });
  });
  describe("TransactionPermissionDenied", () => {
    it("显示当前操作的权限提示和返回入口", () => {
      const { container } = render(
        <TransactionPermissionDenied operation="create" />,
      );
      expect(within(container).getByRole("alert")).toHaveTextContent(
        "无法新增记账",
      );
      expect(within(container).getByRole("alert")).toHaveTextContent(
        "当前账本角色没有新增记账的权限。",
      );
      expect(
        within(container).getByRole("link", { name: "返回明细" }),
      ).toHaveAttribute("href", "/transactions");
    });
  });
});
describe("EditTransactionTemplate", () => {
  const storageScope = "edit-transaction-template-test";
  function renderWithTheme(ui: ReactNode) {
    return render(
      <UserThemeProvider storageScope={storageScope}>{ui}</UserThemeProvider>,
    );
  }
  afterEach(() => {
    cleanup();
    vi.restoreAllMocks();
  });
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
  ];
  const merchantOptions = [
    {
      id: "00000000-0000-4000-8000-000000001001",
      name: "便利店",
      icon_url: null,
    },
  ];
  function createProps(type: "expense" | "income" = "expense") {
    return {
      accountOptions,
      action: vi.fn(async () => ({})),
      categoryOptions,
      deleteAction: vi.fn(async () => ({})),
      errorMessage: null,
      frequentCategoryIds: categoryOptions.map((category) => category.id),
      initialValues: {
        accountId: accountOptions[0].id,
        items: [
          {
            amount: "1200",
            categoryId: categoryOptions[0].id,
          },
        ],
        merchantId: merchantOptions[0].id,
        note: "编辑前备注",
        transactionAt: "2026-06-05T03:20:10.000Z",
        transactionRecordId: "00000000-0000-4000-8000-000000009001",
        type,
      },
      ledgerName: "家庭账本",
      merchantOptions,
      transactionItemSpecialStatusEnabled: false,
    };
  }
  it("普通编辑页默认显示编辑记账标题", () => {
    const { container } = renderWithTheme(
      <EditTransactionTemplate {...createProps()} />,
    );
    expect(
      within(container).getByRole("heading", { name: "编辑记账" }),
    ).toBeInTheDocument();
  });
  it("普通支出编辑页渲染收支 / 转账切换，并激活支出面板", () => {
    const { container } = renderWithTheme(
      <EditTransactionTemplate {...createProps()} />,
    );
    expect(
      within(container).getByRole("button", { name: "收支" }),
    ).toHaveAttribute("aria-pressed", "true");
    expect(
      within(container).getByRole("button", { name: "转账" }),
    ).toHaveAttribute("aria-pressed", "false");
    expect(
      within(container).getByTestId("transaction-type-slide-panel-expense"),
    ).toHaveAttribute("aria-hidden", "false");
  });
  it("普通收入编辑页渲染收支 / 转账切换，并激活收入面板", () => {
    const { container } = renderWithTheme(
      <EditTransactionTemplate {...createProps("income")} />,
    );
    expect(
      within(container).getByRole("button", { name: "收支" }),
    ).toHaveAttribute("aria-pressed", "true");
    expect(
      within(container).getByRole("button", { name: "转账" }),
    ).toHaveAttribute("aria-pressed", "false");
    expect(
      within(container).getByTestId("transaction-type-slide-panel-income"),
    ).toHaveAttribute("aria-hidden", "false");
  });
  it("普通编辑页显示转账切换 tab", () => {
    const { container } = renderWithTheme(
      <EditTransactionTemplate {...createProps()} />,
    );
    expect(
      within(container).getByRole("button", { name: "转账" }),
    ).toHaveAttribute("aria-pressed", "false");
    expect(
      within(container).getByTestId("transaction-form-expense"),
    ).toBeInTheDocument();
    expect(
      within(container).getByTestId("transfer-transaction-form"),
    ).toBeInTheDocument();
  });
  it("账本启用明细特殊状态后编辑模板的明细弹层显示特殊状态选择区", () => {
    const { container } = renderWithTheme(
      <EditTransactionTemplate
        {...createProps()}
        transactionItemSpecialStatusEnabled
      />,
    );
    const activePanel = within(container).getByTestId(
      "transaction-type-slide-panel-expense",
    );
    fireEvent.click(
      within(activePanel).getByRole("button", { name: "添加明细" }),
    );
    expect(
      within(activePanel).getByRole("region", { name: "特殊状态" }),
    ).toBeInTheDocument();
  });
  it("点击转账 tab 后激活转账编辑面板，并保持编辑记账标题", () => {
    const { container } = renderWithTheme(
      <EditTransactionTemplate {...createProps()} />,
    );
    fireEvent.click(within(container).getByRole("button", { name: "转账" }));
    expect(
      within(container).getByRole("heading", { name: "编辑记账" }),
    ).toBeInTheDocument();
    expect(
      within(container).getByTestId("transaction-type-slide-panel-transfer"),
    ).toHaveAttribute("aria-hidden", "false");
    expect(
      within(container).getByTestId("transaction-type-slide-panel-expense"),
    ).toHaveAttribute("aria-hidden", "true");
  });
  it("普通编辑切换类型后保留已挂载表单输入状态", () => {
    const { container } = renderWithTheme(
      <EditTransactionTemplate {...createProps()} />,
    );
    fireEvent.change(within(container).getByLabelText("支出编辑临时输入"), {
      target: { value: "保留普通编辑输入" },
    });
    fireEvent.click(within(container).getByRole("button", { name: "转账" }));
    fireEvent.click(within(container).getByRole("button", { name: "收支" }));
    expect(within(container).getByLabelText("支出编辑临时输入")).toHaveValue(
      "保留普通编辑输入",
    );
  });
  it("普通编辑页底部显示删除和保存修改按钮，删除前要求确认", () => {
    const requestSubmit = vi
      .spyOn(HTMLFormElement.prototype, "requestSubmit")
      .mockImplementation(() => undefined);
    const { container } = renderWithTheme(
      <EditTransactionTemplate {...createProps()} />,
    );
    const deleteButton = within(container).getByRole("button", {
      name: "删除",
    });
    expect(deleteButton).toBeInTheDocument();
    expect(
      within(container).getByRole("button", { name: "保存修改" }),
    ).toHaveAttribute("form", "edit-expense-transaction-form");
    fireEvent.click(deleteButton);
    const dialog = screen.getByRole("dialog", { name: "删除记账？" });
    expect(
      within(dialog).getByText("删除后这笔记账会从明细页移除，是否继续？"),
    ).toBeInTheDocument();
    fireEvent.click(within(dialog).getByRole("button", { name: "删除" }));
    expect(requestSubmit).toHaveBeenCalledTimes(1);
  });
  it("内容修改后退出时提示保存、放弃或继续编辑", () => {
    const { container } = renderWithTheme(
      <EditTransactionTemplate {...createProps()} />,
    );
    fireEvent.change(within(container).getByLabelText("支出编辑临时输入"), {
      target: { value: "已修改" },
    });
    fireEvent.click(within(container).getByRole("button", { name: "关闭" }));
    expect(
      screen.getByText("修正的内容尚未保存，是否保存？"),
    ).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "放弃修改" })).toHaveAttribute(
      "href",
      routePaths.transactions,
    );
    fireEvent.click(screen.getByRole("button", { name: "继续编辑" }));
    expect(
      screen.getByText("修正的内容尚未保存，是否保存？"),
    ).not.toBeVisible();
  });
  it("未保存提示中点击保存会提交当前编辑表单", () => {
    const requestSubmit = vi
      .spyOn(HTMLFormElement.prototype, "requestSubmit")
      .mockImplementation(() => undefined);
    const { container } = renderWithTheme(
      <EditTransactionTemplate {...createProps()} />,
    );
    fireEvent.change(within(container).getByLabelText("支出编辑临时输入"), {
      target: { value: "已修改" },
    });
    fireEvent.click(within(container).getByRole("button", { name: "关闭" }));
    fireEvent.click(screen.getByRole("button", { name: "保存" }));
    expect(requestSubmit).toHaveBeenCalledTimes(1);
  });
});
describe("EditTransferTransactionTemplate", () => {
  const storageScope = "edit-transfer-template-test";
  function renderWithTheme(ui: ReactNode) {
    return render(
      <UserThemeProvider storageScope={storageScope}>{ui}</UserThemeProvider>,
    );
  }
  afterEach(() => {
    cleanup();
    vi.restoreAllMocks();
  });
  function renderTemplate() {
    return renderWithTheme(
      <EditTransferTransactionTemplate
        accountOptions={[
          {
            id: "00000000-0000-4000-8000-000000000045",
            name: "日元现金",
            currency: "JPY",
          },
        ]}
        action={vi.fn(async () => ({}))}
        categoryOptions={[]}
        deleteAction={vi.fn(async () => ({}))}
        errorMessage={null}
        frequentCategoryIds={[]}
        initialValues={{
          accountId: "00000000-0000-4000-8000-000000000045",
          note: "",
          transactionAt: "2026-06-05T03:20:10.000Z",
          transactionRecordId: "00000000-0000-4000-8000-000000009002",
          transferAmount: "5000",
          transferTargetAccountId: "00000000-0000-4000-8000-000000000046",
          type: "transfer",
        }}
        ledgerName="家庭账本"
        merchantOptions={[]}
        transactionItemSpecialStatusEnabled={false}
      />,
    );
  }
  it("转账编辑页默认激活转账编辑表单，并显示编辑记账标题", () => {
    const { container } = renderTemplate();
    expect(
      within(container).getByRole("heading", { name: "编辑记账" }),
    ).toBeInTheDocument();
    expect(
      within(container).getByTestId("transfer-transaction-form"),
    ).toBeInTheDocument();
    expect(
      within(container).getByTestId("transaction-form-expense"),
    ).toBeInTheDocument();
    expect(
      within(container).getByTestId("transaction-form-income"),
    ).toBeInTheDocument();
    expect(
      within(container).getByRole("button", { name: "收支" }),
    ).toBeInTheDocument();
    expect(
      within(container).getByRole("button", { name: "转账" }),
    ).toHaveAttribute("aria-pressed", "true");
    expect(
      within(container).getByTestId("transaction-type-slide-panel-transfer"),
    ).toHaveAttribute("aria-hidden", "false");
  });
  it("转账编辑页点击收支 tab 后激活支出转换面板", () => {
    const { container } = renderTemplate();
    fireEvent.click(within(container).getByRole("button", { name: "收支" }));
    expect(
      within(container).getByRole("heading", { name: "编辑记账" }),
    ).toBeInTheDocument();
    expect(
      within(container).getByTestId("transaction-type-slide-panel-expense"),
    ).toHaveAttribute("aria-hidden", "false");
    expect(
      within(container).getByTestId("transaction-type-slide-panel-transfer"),
    ).toHaveAttribute("aria-hidden", "true");
  });
  it("转账编辑切换类型后保留已挂载表单输入状态", () => {
    const { container } = renderTemplate();
    fireEvent.change(within(container).getByLabelText("转账转换临时输入"), {
      target: { value: "保留转账编辑输入" },
    });
    fireEvent.click(within(container).getByRole("button", { name: "收支" }));
    fireEvent.click(within(container).getByRole("button", { name: "转账" }));
    expect(within(container).getByLabelText("转账转换临时输入")).toHaveValue(
      "保留转账编辑输入",
    );
  });
  it("转账编辑页底部显示删除和保存修改按钮，删除前要求确认", () => {
    const requestSubmit = vi
      .spyOn(HTMLFormElement.prototype, "requestSubmit")
      .mockImplementation(() => undefined);
    const { container } = renderTemplate();
    const deleteButton = within(container).getByRole("button", {
      name: "删除",
    });
    expect(deleteButton).toBeInTheDocument();
    expect(
      within(container).getByRole("button", { name: "保存修改" }),
    ).toHaveAttribute("form", "edit-transfer-transaction-form");
    fireEvent.click(deleteButton);
    const dialog = screen.getByRole("dialog", { name: "删除记账？" });
    expect(
      within(dialog).getByText("删除后这笔记账会从明细页移除，是否继续？"),
    ).toBeInTheDocument();
    fireEvent.click(within(dialog).getByRole("button", { name: "删除" }));
    expect(requestSubmit).toHaveBeenCalledTimes(1);
  });
  it("转账内容修改后退出时显示未保存提示", () => {
    const { container } = renderTemplate();
    fireEvent.change(within(container).getByLabelText("转账转换临时输入"), {
      target: { value: "已修改" },
    });
    fireEvent.click(within(container).getByRole("button", { name: "关闭" }));
    expect(
      screen.getByText("修正的内容尚未保存，是否保存？"),
    ).toBeInTheDocument();
  });
});
