import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import type { ComponentProps } from "react";
import { describe, expect, it, vi } from "vitest";

import { ConfirmDialogProvider } from "providers/ConfirmDialogProvider/ConfirmDialogProvider";
import {
  accountHolderOptionsFixture,
  accountPlaceholderHolderOptionsFixture,
} from "test/mocks/accountHolders";
import { bankAccountFixture } from "test/mocks/accounts";
import { UserThemeProvider } from "theme/UserThemeProvider";
import type { AccountStateAction } from "types/accounts";

import { AccountEditTemplate } from "./AccountEdit";

function renderAccountEdit(
  props: Partial<ComponentProps<typeof AccountEditTemplate>> = {},
) {
  return render(
    <UserThemeProvider>
      <ConfirmDialogProvider>
        <AccountEditTemplate
          account={bankAccountFixture}
          archiveAccountAction={vi.fn<AccountStateAction>(async () => ({}))}
          baseCurrency="JPY"
          holderOptions={accountHolderOptionsFixture}
          ledgerName="家庭账本"
          placeholderHolderOptions={accountPlaceholderHolderOptionsFixture}
          updateAccountAction={vi.fn<AccountStateAction>(async () => ({}))}
          {...props}
        />
      </ConfirmDialogProvider>
    </UserThemeProvider>,
  );
}

describe("AccountEditTemplate", () => {
  it("显示编辑页标题、面包屑与返回账户管理入口", () => {
    renderAccountEdit();

    expect(
      screen.getByRole("heading", { name: "编辑账户" }),
    ).toBeInTheDocument();
    expect(
      screen.getByText("账户管理 〉 编辑账户 · 家庭账本"),
    ).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "返回账户管理" })).toHaveAttribute(
      "href",
      "/accounts",
    );
  });

  it("保存时提交账户 ID 与修改内容", async () => {
    const updateAccountAction = vi.fn<AccountStateAction>(async () => ({}));
    renderAccountEdit({ updateAccountAction });

    fireEvent.change(screen.getByLabelText(/账户名称/), {
      target: { value: "三菱UFJ" },
    });
    fireEvent.click(screen.getByRole("button", { name: "保存修改" }));

    await waitFor(() => expect(updateAccountAction).toHaveBeenCalledOnce());
    const formData = updateAccountAction.mock.calls[0]?.[1];
    expect(formData?.get("accountId")).toBe(bankAccountFixture.id);
    expect(formData?.get("name")).toBe("三菱UFJ");
  });

  it("保存失败时显示失败反馈", async () => {
    renderAccountEdit({
      updateAccountAction: vi.fn<AccountStateAction>(async () => ({
        error: "账户名称已存在。",
        errorKey: "error-1",
      })),
    });

    fireEvent.click(screen.getByRole("button", { name: "保存修改" }));

    expect(await screen.findByText("账户名称已存在。")).toBeInTheDocument();
    expect(screen.getByText("保存账户失败")).toBeInTheDocument();
  });

  it("删除需确认后才提交该账户的删除，不提交编辑表单", async () => {
    const archiveAccountAction = vi.fn<AccountStateAction>(async () => ({}));
    const updateAccountAction = vi.fn<AccountStateAction>(async () => ({}));
    renderAccountEdit({ archiveAccountAction, updateAccountAction });

    fireEvent.click(screen.getByRole("button", { name: "删除" }));
    expect(archiveAccountAction).not.toHaveBeenCalled();
    fireEvent.click(await screen.findByRole("button", { name: "删除账户" }));

    await waitFor(() => expect(archiveAccountAction).toHaveBeenCalledOnce());
    expect(archiveAccountAction.mock.calls[0]?.[1].get("accountId")).toBe(
      bankAccountFixture.id,
    );
    expect(updateAccountAction).not.toHaveBeenCalled();
  });

  it("删除失败时显示失败反馈", async () => {
    renderAccountEdit({
      archiveAccountAction: vi.fn<AccountStateAction>(async () => ({
        error: "账户删除失败。",
        errorKey: "error-2",
      })),
    });

    fireEvent.click(screen.getByRole("button", { name: "删除" }));
    fireEvent.click(await screen.findByRole("button", { name: "删除账户" }));

    expect(await screen.findByText("账户删除失败。")).toBeInTheDocument();
    expect(screen.getByText("删除账户失败")).toBeInTheDocument();
  });

  it("当前余额可以用金额键盘改成负数并随表单提交", async () => {
    const updateAccountAction = vi.fn<AccountStateAction>(async () => ({}));
    renderAccountEdit({
      account: { ...bankAccountFixture, current_balance: 0 },
      updateAccountAction,
    });

    // 点当前余额唤起金额键盘：0 − 500 后确认。
    fireEvent.focus(screen.getByLabelText("当前余额"));
    for (const name of ["减", "5", "0", "0"]) {
      fireEvent.click(await screen.findByRole("button", { name }));
    }
    fireEvent.click(screen.getByRole("button", { name: "确认" }));

    await waitFor(() =>
      expect(screen.getByLabelText("当前余额")).toHaveValue("-500"),
    );
    fireEvent.click(await screen.findByRole("button", { name: "保存修改" }));

    await waitFor(() => expect(updateAccountAction).toHaveBeenCalledOnce());
    expect(updateAccountAction.mock.calls[0]?.[1].get("targetBalance")).toBe(
      "-500",
    );
  });
});
