import { afterEach, describe, expect, it, vi } from "vitest";
import {
  cleanup,
  fireEvent,
  render,
  screen,
  waitFor,
  within,
} from "@testing-library/react";
import { UserThemeProvider } from "theme/UserThemeProvider";
import { ConfirmDialogProvider } from "providers/ConfirmDialogProvider/ConfirmDialogProvider";
import { BalanceAdjustmentEditForm } from "./BalanceAdjustmentEditForm";
import type {
  BalanceAdjustmentEditInitialValues,
  TransactionEditRestriction,
} from "internal/transaction";
import { transactionEditRestrictionMessages } from "utils/transactionMessages";
const initialValues: BalanceAdjustmentEditInitialValues = {
  type: "balance_adjustment",
  accountId: "account",
  accountName: "现金",
  currency: "JPY",
  signedDelta: "-2500",
  transactionRecordId: "record",
  transactionAt: "2026-09-14T00:00:00",
  note: "盘点",
  accountArchived: false,
};
afterEach(cleanup);
function setup(
  archived = false,
  {
    canDelete = true,
    editRestriction = null,
  }: {
    canDelete?: boolean;
    editRestriction?: TransactionEditRestriction | null;
  } = {},
) {
  const action = vi.fn(async () => ({}));
  const deleteAction = vi.fn(async () => ({}));
  render(
    <UserThemeProvider>
      <ConfirmDialogProvider>
        <BalanceAdjustmentEditForm
          initialValues={{ ...initialValues, accountArchived: archived }}
          action={action}
          canDelete={canDelete}
          deleteAction={deleteAction}
          editRestriction={editRestriction}
        />
      </ConfirmDialogProvider>
    </UserThemeProvider>,
  );
  return { action, deleteAction };
}
describe("BalanceAdjustmentEditForm", () => {
  it("账户和金额只读，保存只提交时间备注", async () => {
    const { action } = setup();
    expect(screen.getByLabelText("账户")).toHaveAttribute("readonly");
    expect(screen.getByLabelText("调整金额")).toHaveAttribute("readonly");
    fireEvent.change(screen.getByLabelText("备注（选填）"), {
      target: { value: "新备注" },
    });
    fireEvent.click(screen.getByRole("button", { name: "保存修改" }));
    await waitFor(() => expect(action).toHaveBeenCalledOnce());
    const form = (action.mock.calls[0] as unknown as [unknown, FormData])[1];
    expect(form.get("note")).toBe("新备注");
    expect(form.has("accountId")).toBe(false);
    expect(form.has("signedDelta")).toBe(false);
  });
  it("复用共享的日期时间选择器修改交易时间，提交组合后的值", async () => {
    const { action } = setup();
    fireEvent.click(screen.getByRole("button", { name: "选择记账时间" }));
    fireEvent.click(
      await screen.findByRole("button", { name: "2026年9月20日" }),
    );
    fireEvent.click(screen.getByRole("button", { name: "完成" }));
    await waitFor(() =>
      expect(screen.queryByRole("grid", { name: "记账日期" })).toBeNull(),
    );
    fireEvent.click(screen.getByRole("button", { name: "保存修改" }));
    await waitFor(() => expect(action).toHaveBeenCalledOnce());
    const form = (action.mock.calls[0] as unknown as [unknown, FormData])[1];
    expect(form.get("transactionAt")).toBe("2026-09-20T00:00:00");
  });
  it("删除须二次确认，取消不提交", async () => {
    const { deleteAction } = setup();
    fireEvent.click(screen.getByRole("button", { name: "删除" }));
    expect(
      screen.getByText("删除后将按原调整金额反向冲销账户余额。确定删除吗？"),
    ).toBeInTheDocument();
    expect(deleteAction).not.toHaveBeenCalled();
    fireEvent.click(
      within(screen.getByRole("dialog")).getByRole("button", { name: "取消" }),
    );
    expect(deleteAction).not.toHaveBeenCalled();
  });
  it("无修改权限时显示只读详情：提示原因，字段禁用，没有保存和删除", () => {
    const { action } = setup(false, {
      canDelete: false,
      editRestriction: "permission",
    });
    expect(screen.getByRole("alert")).toHaveTextContent(
      transactionEditRestrictionMessages.permission,
    );
    expect(screen.getByLabelText("备注（选填）")).toBeDisabled();
    expect(screen.getByRole("button", { name: "选择记账时间" })).toBeDisabled();
    expect(screen.queryByRole("button", { name: "保存修改" })).toBeNull();
    expect(screen.queryByRole("button", { name: "删除" })).toBeNull();
    expect(action).not.toHaveBeenCalled();
  });
  it("归档账户禁止删除但允许保存", () => {
    setup(true);
    expect(
      screen.getByText("该账户已归档，无法撤销余额调整"),
    ).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "删除" })).toBeDisabled();
    expect(screen.getByRole("button", { name: "保存修改" })).toBeEnabled();
  });
});
