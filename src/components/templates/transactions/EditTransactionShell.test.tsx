import { setupGuardHistoryMock } from "test/mockGuardHistory";
setupGuardHistoryMock();

vi.mock("next/navigation", () => import("test/mocks/navigation"));
import {
  cleanup,
  fireEvent,
  render,
  screen,
  within,
} from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";

import { routePaths } from "config/paths";
import { createErrorState } from "internal/shared/adapter/next/actionState";
import {
  transactionActionErrorMessages,
  transactionErrorCodes,
  transactionLinkedEditErrorTitles,
  type TransactionEditRestriction,
} from "internal/transaction";
import { UserThemeProvider } from "theme/UserThemeProvider";
import type { TransactionStateAction } from "types/transactions";
import { transactionEditRestrictionMessages } from "utils/transactionMessages";

import { useEditTransactionDirty } from "organisms/transactions/EditTransactionDirtyContext/EditTransactionDirtyContext";

import { EditTransactionShell } from "./EditTransactionShell";
import { useLinkedTransactionEditAction } from "./useLinkedTransactionEditAction";

const saveFormId = "edit-test-form";

// 外框只负责顶栏、删除与各类弹框；编辑表单用一个带保存按钮的简单表单代替。
function ShellHarness({
  action = vi.fn(async () => ({})),
  canDelete = true,
  deleteAction = vi.fn(async () => ({})),
  editRestriction = null,
  hasLinkedIncomeItems = false,
}: {
  action?: TransactionStateAction;
  canDelete?: boolean;
  deleteAction?: TransactionStateAction;
  editRestriction?: TransactionEditRestriction | null;
  hasLinkedIncomeItems?: boolean;
}) {
  const editAction = useLinkedTransactionEditAction(action);
  return (
    <EditTransactionShell
      canDelete={canDelete}
      deleteAction={deleteAction}
      editAction={editAction}
      editRestriction={editRestriction}
      hasLinkedIncomeItems={hasLinkedIncomeItems}
      saveFormId={saveFormId}
      transactionRecordId="00000000-0000-4000-8000-000000009001"
    >
      <form action={editAction.formAction} id={saveFormId}>
        <DirtyReportingInput />
        <input aria-label="未报告的输入" defaultValue="" />
        <button type="submit">保存修改</button>
      </form>
    </EditTransactionShell>
  );
}

// 像小票 / 转账表单一样，在交易字段变化时经 useEditTransactionDirty 报告。
function DirtyReportingInput() {
  const markEditDirty = useEditTransactionDirty();
  return (
    <input
      aria-label="编辑临时输入"
      defaultValue=""
      name="note"
      onChange={(event) => markEditDirty?.(event.target.value !== "")}
    />
  );
}

function renderShell(props: Parameters<typeof ShellHarness>[0] = {}) {
  return render(
    <UserThemeProvider>
      <ShellHarness {...props} />
    </UserThemeProvider>,
  );
}

const syncConfirmationMessage = "请确认同步修改关联数据。";
const linkedDeleteForbiddenMessage =
  "该交易包含已关联的退款 / 报销明细，请先解除关联后再删除。";
// errorKey 每次失败都是新的随机值，分支只看 errorCode。
function linkedSyncConfirmationState() {
  return {
    ...createErrorState(syncConfirmationMessage),
    errorCode: transactionErrorCodes.linkedSyncConfirmationRequired,
  };
}
function linkedDeleteForbiddenState() {
  return {
    ...createErrorState(linkedDeleteForbiddenMessage),
    errorCode: transactionErrorCodes.linkedDeleteForbidden,
  };
}
// 弹框关闭动画结束前背景会被 aria-hidden，按钮需等待重新可访问后再点击。
async function clickSave(container: HTMLElement) {
  fireEvent.click(
    await within(container).findByRole("button", { name: "保存修改" }),
  );
}
async function clickDelete(container: HTMLElement) {
  fireEvent.click(
    await within(container).findByRole("button", { name: "删除" }),
  );
  fireEvent.click(
    within(await screen.findByRole("dialog", { name: "删除记账？" })).getByRole(
      "button",
      { name: "删除" },
    ),
  );
}

describe("EditTransactionShell", () => {
  afterEach(() => {
    cleanup();
    vi.restoreAllMocks();
  });

  it("可编辑时显示编辑记账标题，不显示限制原因", () => {
    const { container } = renderShell();

    expect(
      within(container).getByRole("heading", { name: "编辑记账" }),
    ).toBeInTheDocument();
    expect(within(container).queryByRole("alert")).toBeNull();
  });

  it.each(["permission", "archivedAccount", "linked"] as const)(
    "限制原因为 %s 时显示记账详情标题和对应文案",
    (reason) => {
      const { container } = renderShell({
        canDelete: false,
        editRestriction: reason,
      });

      expect(
        within(container).getByRole("heading", { name: "记账详情" }),
      ).toBeInTheDocument();
      const alert = within(container).getByRole("alert");
      expect(alert).toHaveTextContent(transactionEditRestrictionMessages.title);
      expect(alert).toHaveTextContent(
        transactionEditRestrictionMessages[reason],
      );
      expect(
        within(container).queryByRole("button", { name: "删除" }),
      ).toBeNull();
    },
  );

  it("删除按钮在编辑表单下方，删除前要求确认", () => {
    const requestSubmit = vi
      .spyOn(HTMLFormElement.prototype, "requestSubmit")
      .mockImplementation(() => undefined);
    const { container } = renderShell();
    const saveButton = within(container).getByRole("button", {
      name: "保存修改",
    });
    const deleteButton = within(container).getByRole("button", {
      name: "删除",
    });

    expect(
      saveButton.compareDocumentPosition(deleteButton) &
        Node.DOCUMENT_POSITION_FOLLOWING,
    ).toBeTruthy();
    fireEvent.click(deleteButton);
    const dialog = screen.getByRole("dialog", { name: "删除记账？" });
    expect(
      within(dialog).getByText("删除后这笔记账会从明细页移除，是否继续？"),
    ).toBeInTheDocument();
    fireEvent.click(within(dialog).getByRole("button", { name: "删除" }));
    expect(requestSubmit).toHaveBeenCalledTimes(1);
  });

  it("有删除权限时只读详情仍可删除", () => {
    const { container } = renderShell({ editRestriction: "archivedAccount" });

    expect(
      within(container).getByRole("button", { name: "删除" }),
    ).toBeInTheDocument();
  });

  it("子项关联交易的删除确认说明会提示自动解除关联的影响", () => {
    const { container } = renderShell({ hasLinkedIncomeItems: true });

    fireEvent.click(within(container).getByRole("button", { name: "删除" }));

    expect(
      within(screen.getByRole("dialog", { name: "删除记账？" })).getByText(
        "删除后这笔记账会从明细页移除，并解除退款 / 报销关联，目标支出的核销净额会相应变化。是否继续？",
      ),
    ).toBeInTheDocument();
  });

  it("后端返回同步确认 errorCode 时弹层，确认后携带 confirmSync 重新提交", async () => {
    const action = vi
      .fn()
      .mockResolvedValueOnce(linkedSyncConfirmationState())
      .mockResolvedValueOnce({});
    const { container } = renderShell({ action });

    await clickSave(container);
    const dialog = await screen.findByRole("dialog", {
      name: "同步修改关联数据？",
    });
    expect(action).toHaveBeenCalledTimes(1);

    fireEvent.click(within(dialog).getByRole("button", { name: "同步修改" }));
    await vi.waitFor(() => expect(action).toHaveBeenCalledTimes(2));
    const confirmedFormData = action.mock.calls[1]?.[1] as FormData;
    expect(confirmedFormData.get("confirmSync")).toBe("true");
  });

  it("取消关联同步确认时不再次提交", async () => {
    const action = vi.fn(async () => linkedSyncConfirmationState());
    const { container } = renderShell({ action });

    await clickSave(container);
    const dialog = await screen.findByRole("dialog", {
      name: "同步修改关联数据？",
    });
    fireEvent.click(within(dialog).getByRole("button", { name: "取消" }));

    expect(action).toHaveBeenCalledTimes(1);
    expect(dialog).not.toBeVisible();
  });

  it("取消同步确认后再次保存仍返回同一错误码时确认框再次弹出", async () => {
    const action = vi.fn(async () => linkedSyncConfirmationState());
    const { container } = renderShell({ action });

    await clickSave(container);
    const firstDialog = await screen.findByRole("dialog", {
      name: "同步修改关联数据？",
    });
    fireEvent.click(within(firstDialog).getByRole("button", { name: "取消" }));
    await vi.waitFor(() => expect(firstDialog).not.toBeVisible());

    await clickSave(container);
    await vi.waitFor(() => expect(action).toHaveBeenCalledTimes(2));
    await vi.waitFor(() =>
      expect(
        screen.getByRole("dialog", { name: "同步修改关联数据？" }),
      ).toBeVisible(),
    );
    expect(screen.queryByText("保存失败")).not.toBeInTheDocument();
  });

  it("errorKey 与业务码同值但没有 errorCode 时按普通保存失败处理", async () => {
    const action = vi.fn(async () => ({
      error: syncConfirmationMessage,
      errorKey: transactionErrorCodes.linkedSyncConfirmationRequired,
    }));
    const { container } = renderShell({ action });

    await clickSave(container);

    expect(await screen.findByText("保存失败")).toBeInTheDocument();
    expect(
      screen.queryByRole("dialog", { name: "同步修改关联数据？" }),
    ).not.toBeInTheDocument();
  });

  it("删除已关联明细被拒绝时提示先解除关联", async () => {
    const deleteAction = vi.fn(async () => linkedDeleteForbiddenState());
    const { container } = renderShell({ deleteAction });

    await clickDelete(container);

    expect(
      await screen.findByText(transactionLinkedEditErrorTitles.deleteForbidden),
    ).toBeInTheDocument();
    expect(screen.getByText(linkedDeleteForbiddenMessage)).toBeInTheDocument();
  });

  it("关闭失败弹框后再次删除被拒绝时失败弹框再次弹出", async () => {
    const deleteAction = vi.fn(async () => linkedDeleteForbiddenState());
    const { container } = renderShell({ deleteAction });

    await clickDelete(container);
    const firstTitle = await screen.findByText(
      transactionLinkedEditErrorTitles.deleteForbidden,
    );
    fireEvent.click(
      within(firstTitle.closest('[role="alert"]') as HTMLElement).getByRole(
        "button",
        { name: "关闭" },
      ),
    );
    await vi.waitFor(() =>
      expect(
        screen.queryByText(transactionLinkedEditErrorTitles.deleteForbidden),
      ).not.toBeVisible(),
    );

    await clickDelete(container);
    await vi.waitFor(() => expect(deleteAction).toHaveBeenCalledTimes(2));
    // 第一次的弹框可能仍在退出动画中，等待再次进入可见状态。
    await vi.waitFor(() =>
      expect(
        screen.getByText(transactionLinkedEditErrorTitles.deleteForbidden),
      ).toBeVisible(),
    );
  });

  it("删除失败但没有 errorCode 时显示通用删除失败标题", async () => {
    const deleteAction = vi.fn(async () => ({
      error: transactionActionErrorMessages.voidFailed,
      errorKey: transactionErrorCodes.linkedDeleteForbidden,
    }));
    const { container } = renderShell({ deleteAction });

    await clickDelete(container);

    expect(await screen.findByText("删除失败")).toBeInTheDocument();
    expect(
      screen.queryByText(transactionLinkedEditErrorTitles.deleteForbidden),
    ).not.toBeInTheDocument();
  });

  it("未修改时返回直接回到明细", () => {
    const { container } = renderShell();

    expect(
      within(container).getByRole("link", { name: "关闭" }),
    ).toHaveAttribute("href", routePaths.transactions);
  });

  it("没有经表单报告变化的输入不算未保存", () => {
    const { container } = renderShell();
    fireEvent.change(within(container).getByLabelText("未报告的输入"), {
      target: { value: "搜索关键字" },
    });

    expect(
      within(container).getByRole("link", { name: "关闭" }),
    ).toHaveAttribute("href", routePaths.transactions);
  });

  it("内容修改后退出时提示保存、放弃或继续编辑", () => {
    const { container } = renderShell();
    fireEvent.change(within(container).getByLabelText("编辑临时输入"), {
      target: { value: "已修改" },
    });
    fireEvent.click(within(container).getByRole("link", { name: "关闭" }));
    expect(
      screen.getByText("修正的内容尚未保存，是否保存？"),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: "放弃修改" }),
    ).toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: "继续编辑" }));
    expect(
      screen.getByText("修正的内容尚未保存，是否保存？"),
    ).not.toBeVisible();
  });

  it("未保存提示中点击保存会提交编辑表单", () => {
    const requestSubmit = vi
      .spyOn(HTMLFormElement.prototype, "requestSubmit")
      .mockImplementation(() => undefined);
    const { container } = renderShell();
    fireEvent.change(within(container).getByLabelText("编辑临时输入"), {
      target: { value: "已修改" },
    });
    fireEvent.click(within(container).getByRole("link", { name: "关闭" }));
    fireEvent.click(screen.getByRole("button", { name: "保存" }));
    expect(requestSubmit).toHaveBeenCalledTimes(1);
    expect(requestSubmit.mock.contexts[0]).toHaveProperty("id", saveFormId);
  });
});
