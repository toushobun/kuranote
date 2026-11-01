import { setupGuardHistoryMock } from "test/mockGuardHistory";
setupGuardHistoryMock();

import {
  cleanup,
  fireEvent,
  render,
  within,
  screen,
} from "@testing-library/react";
import { type ReactNode, useEffect, useState } from "react";
import { afterEach, describe, expect, it, vi } from "vitest";
const router = vi.hoisted(() => ({ replace: vi.fn() }));
vi.mock("next/navigation", () => ({ useRouter: () => router }));
import {
  NewTransactionTemplate,
  NewTransferTransactionTemplate,
  TransactionPermissionDenied,
  EditTransferTransactionTemplate,
} from "./TransactionFormPage";
import { routePaths } from "config/paths";
import type { TransactionEditRestriction } from "internal/transaction";
import { ConfirmDialogTestProviders } from "test/ConfirmDialogTestProviders";
import { transactionEditRestrictionMessages } from "utils/transactionMessages";
import { useEditTransactionDirty } from "organisms/transactions/EditTransactionDirtyContext/EditTransactionDirtyContext";
vi.mock("organisms/transactions/TransactionForm/TransactionForm", () => ({
  TransactionForm: ({
    errorMessage,
    initialType,
    onSubmitDisabledChange,
    setupHrefs,
    transactionItemSpecialStatusEnabled,
  }: {
    errorMessage: string | null;
    initialType?: "expense" | "income";
    onSubmitDisabledChange?: (disabled: boolean) => void;
    setupHrefs?: { account: string; merchant: string };
    transactionItemSpecialStatusEnabled?: boolean;
  }): ReactNode => {
    const [isItemPickerOpen, setIsItemPickerOpen] = useState(false);
    useEffect(() => onSubmitDisabledChange?.(false), [onSubmitDisabledChange]);
    const type = initialType ?? "expense";
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
    return (
      <div
        data-add-account-href={setupHrefs?.account}
        data-add-merchant-href={setupHrefs?.merchant}
        data-testid={`transaction-form-${type}`}
      >
        <input aria-label={`${label}临时输入`} defaultValue="" />
        <input name="type" type="hidden" value={type} />
        {itemPicker}
        {errorMessage ? <div role="alert">{errorMessage}</div> : null}
      </div>
    );
  },
}));
// 真实的转账表单在字段变化时经 useEditTransactionDirty 报告未保存。
function TransferEditInput() {
  const markEditDirty = useEditTransactionDirty();
  return (
    <input
      aria-label="转账编辑临时输入"
      defaultValue=""
      onChange={(event) => markEditDirty?.(event.target.value !== "")}
    />
  );
}
vi.mock(
  "organisms/transactions/TransferTransactionForm/TransferTransactionForm",
  () => ({
    TransferTransactionForm: ({
      accountOptions,
      addAccountHref,
      errorMessage,
      formId,
      hideSubmitButton,
      initialValues,
      readOnly,
      sourceType,
    }: {
      accountOptions: { currency: string; name: string }[];
      addAccountHref?: string;
      errorMessage?: string | null;
      formId?: string;
      hideSubmitButton?: boolean;
      initialValues?: { transferAmount: string };
      readOnly?: boolean;
      sourceType?: string;
    }): ReactNode => {
      if (initialValues) {
        return (
          <form
            data-account-options={accountOptions
              .map((account) => `${account.name}（${account.currency}）`)
              .join("、")}
            data-add-account-href={addAccountHref}
            data-read-only={readOnly}
            data-source-type={sourceType}
            data-testid="transfer-transaction-form"
            id={formId}
          >
            <TransferEditInput />
            {hideSubmitButton ? null : <button type="submit">保存修改</button>}
          </form>
        );
      }
      return (
        <div
          data-add-account-href={addAccountHref}
          data-testid="transfer-transaction-form"
        >
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
    multiAccountPaymentEnabled: true,
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
    it("顶部可切换记账方式，当前为标准记账", () => {
      const { container } = render(<NewTransactionTemplate {...baseProps} />);
      fireEvent.click(
        within(container).getByRole("button", { name: "切换方式" }),
      );
      fireEvent.click(screen.getByRole("button", { name: "从商家记账" }));
      expect(router.replace).toHaveBeenCalledWith("/transactions/new");
    });
    it("各页签的添加账户 / 商家入口带着标准记账与对应页签的 returnTo", () => {
      const { container } = render(<NewTransactionTemplate {...baseProps} />);
      const expenseForm = within(container).getByTestId(
        "transaction-form-expense",
      );
      expect(expenseForm).toHaveAttribute(
        "data-add-account-href",
        "/accounts/new?returnTo=%2Ftransactions%2Fnew%3Fmethod%3Dstandard%26type%3Dexpense",
      );
      expect(expenseForm).toHaveAttribute(
        "data-add-merchant-href",
        "/merchants/new?returnTo=%2Ftransactions%2Fnew%3Fmethod%3Dstandard%26type%3Dexpense",
      );
      expect(
        within(container).getByTestId("transaction-form-income"),
      ).toHaveAttribute(
        "data-add-merchant-href",
        "/merchants/new?returnTo=%2Ftransactions%2Fnew%3Fmethod%3Dstandard%26type%3Dincome",
      );
      expect(
        within(container).getByTestId("transfer-transaction-form"),
      ).toHaveAttribute(
        "data-add-account-href",
        "/accounts/new?returnTo=%2Ftransactions%2Fnew%3Fmethod%3Dstandard%26type%3Dtransfer",
      );
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
  describe("NewTransferTransactionTemplate", () => {
    it("显示账户周转标题、转账表单与切换方式", () => {
      const { container } = render(
        <NewTransferTransactionTemplate
          accountOptions={[]}
          action={baseProps.action}
        />,
      );
      expect(
        within(container).getByRole("heading", { name: "账户周转" }),
      ).toBeInTheDocument();
      expect(
        within(container).getByRole("link", { name: "关闭" }),
      ).toHaveAttribute("href", routePaths.transactions);
      expect(
        within(container).queryByRole("group", { name: "记账类型" }),
      ).not.toBeInTheDocument();
      expect(
        within(container).getByTestId("transfer-transaction-form"),
      ).toHaveAttribute(
        "data-add-account-href",
        "/accounts/new?returnTo=%2Ftransactions%2Fnew%3Fmethod%3Dtransfer",
      );
      expect(
        within(container).getByRole("button", { name: "切换方式" }),
      ).toBeInTheDocument();
    });
  });
  describe("TransactionPermissionDenied", () => {
    it("显示新增记账的权限提示和返回入口", () => {
      const { container } = render(<TransactionPermissionDenied />);
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
describe("EditTransferTransactionTemplate", () => {
  afterEach(() => {
    cleanup();
    vi.restoreAllMocks();
  });
  function renderTemplate({
    archivedAccountOptions,
    canDelete = true,
    editRestriction = null,
  }: {
    archivedAccountOptions?: Parameters<
      typeof EditTransferTransactionTemplate
    >[0]["archivedAccountOptions"];
    canDelete?: boolean;
    editRestriction?: TransactionEditRestriction | null;
  } = {}) {
    return render(
      <ConfirmDialogTestProviders>
        <EditTransferTransactionTemplate
          archivedAccountOptions={archivedAccountOptions}
          canDelete={canDelete}
          editRestriction={editRestriction}
          accountOptions={[
            {
              id: "00000000-0000-4000-8000-000000000045",
              name: "日元现金",
              currency: "JPY",
            },
          ]}
          action={vi.fn(async () => ({}))}
          deleteAction={vi.fn(async () => ({}))}
          initialValues={{
            accountId: "00000000-0000-4000-8000-000000000045",
            note: "",
            transactionAt: "2026-06-05T03:20:10.000Z",
            transactionRecordId: "00000000-0000-4000-8000-000000009002",
            transferAmount: "5000",
            transferTargetAccountId: "00000000-0000-4000-8000-000000000046",
            type: "transfer",
          }}
        />
      </ConfirmDialogTestProviders>,
    );
  }
  it("转入账户已归档时并入账户选项，只读详情显示原账户名称与币种", () => {
    const { container } = renderTemplate({
      archivedAccountOptions: [
        {
          currency: "USD",
          id: "00000000-0000-4000-8000-000000000046",
          name: "美元储蓄",
        },
      ],
      editRestriction: "archivedAccount",
    });

    expect(
      within(container).getByTestId("transfer-transaction-form"),
    ).toHaveAttribute(
      "data-account-options",
      "日元现金（JPY）、美元储蓄（USD）",
    );
  });

  it("无修改权限时显示转账的只读详情，不显示保存和删除", () => {
    const { container } = renderTemplate({
      canDelete: false,
      editRestriction: "permission",
    });

    expect(
      within(container).getByRole("heading", { name: "记账详情" }),
    ).toBeInTheDocument();
    expect(within(container).getByRole("alert")).toHaveTextContent(
      transactionEditRestrictionMessages.permission,
    );
    expect(
      within(container).getByTestId("transfer-transaction-form"),
    ).toHaveAttribute("data-read-only", "true");
    expect(
      within(container).queryByRole("button", { name: "保存修改" }),
    ).toBeNull();
    expect(
      within(container).queryByRole("button", { name: "删除" }),
    ).toBeNull();
  });

  it("只显示转账编辑表单，不再提供收支 / 转账切换（#962）", () => {
    const { container } = renderTemplate();
    expect(
      within(container).getByRole("heading", { name: "编辑记账" }),
    ).toBeInTheDocument();
    expect(
      within(container).getByTestId("transfer-transaction-form"),
    ).toHaveAttribute("data-source-type", "transfer");
    expect(
      within(container).queryByRole("button", { name: "收支" }),
    ).toBeNull();
    expect(
      within(container).queryByTestId("transaction-form-expense"),
    ).toBeNull();
  });

  it("保存修改在转账表单内，删除按钮在其下方并要求确认", () => {
    const requestSubmit = vi
      .spyOn(HTMLFormElement.prototype, "requestSubmit")
      .mockImplementation(() => undefined);
    const { container } = renderTemplate();
    const form = within(container).getByTestId("transfer-transaction-form");
    expect(
      within(form).getByRole("button", { name: "保存修改" }),
    ).toBeInTheDocument();
    fireEvent.click(within(container).getByRole("button", { name: "删除" }));
    const dialog = screen.getByRole("dialog", { name: "删除记账？" });
    fireEvent.click(within(dialog).getByRole("button", { name: "删除" }));
    expect(requestSubmit).toHaveBeenCalledTimes(1);
  });

  it("转账内容修改后退出时显示未保存提示", () => {
    const { container } = renderTemplate();
    fireEvent.change(within(container).getByLabelText("转账编辑临时输入"), {
      target: { value: "已修改" },
    });
    fireEvent.click(within(container).getByRole("link", { name: "关闭" }));
    expect(
      screen.getByText("修正的内容尚未保存，是否保存？"),
    ).toBeInTheDocument();
  });
});
