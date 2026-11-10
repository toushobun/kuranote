import { describeUnsavedFormPage } from "test/unsavedFormPage";
import { setupGuardHistoryMock } from "test/mockGuardHistory";
setupGuardHistoryMock();

import {
  cleanup,
  fireEvent,
  render as rtlRender,
  within,
  screen,
} from "@testing-library/react";
import type { ReactNode } from "react";
import { afterEach, describe, expect, it, vi } from "vitest";
const router = vi.hoisted(() => ({ replace: vi.fn() }));
vi.mock("next/navigation", () => ({ useRouter: () => router }));
import {
  NewTransferTransactionTemplate,
  TransactionPermissionDenied,
  EditTransferTransactionTemplate,
} from "./TransactionFormPage";
import { routePaths } from "config/paths";
import type { TransactionEditRestriction } from "internal/transaction";
import { ConfirmDialogTestProviders } from "test/ConfirmDialogTestProviders";
import { transactionEditRestrictionMessages } from "utils/transactionMessages";
import { useEditTransactionDirty } from "organisms/transactions/EditTransactionDirtyContext/EditTransactionDirtyContext";
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
      const reportDirty = useEditTransactionDirty();
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
          <input
            aria-label="转账临时输入"
            defaultValue=""
            onChange={(event) => reportDirty?.(event.target.value !== "")}
          />
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
const render = (ui: ReactNode, options?: Parameters<typeof rtlRender>[1]) =>
  rtlRender(ui, { wrapper: ConfirmDialogTestProviders, ...options });
describe("\u65B0\u589E\u8BB0\u8D26\u9875\u9762", () => {
  afterEach(() => {
    cleanup();
  });
  const action = vi.fn(async () => ({}));
  describe("NewTransferTransactionTemplate", () => {
    it("显示账户周转标题、转账表单与切换方式", () => {
      const { container } = render(
        <NewTransferTransactionTemplate accountOptions={[]} action={action} />,
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

describeUnsavedFormPage({
  render: () => {
    render(
      <NewTransferTransactionTemplate
        accountOptions={[]}
        action={async () => ({})}
      />,
    );
  },
  change: () =>
    fireEvent.change(screen.getByLabelText("转账临时输入"), {
      target: { value: "转账草稿" },
    }),
  restore: () =>
    fireEvent.change(screen.getByLabelText("转账临时输入"), {
      target: { value: "" },
    }),
});
