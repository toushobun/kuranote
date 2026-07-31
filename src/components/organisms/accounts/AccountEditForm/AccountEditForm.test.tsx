import {
  cleanup,
  fireEvent,
  render,
  screen,
  within,
} from "@testing-library/react";
import type { ReactNode } from "react";
import { afterEach, describe, expect, it, vi } from "vitest";

import { UserThemeProvider } from "theme/UserThemeProvider";
import type { Account } from "types/accounts";

import { AccountEditForm, getAccountArchiveFormId } from "./AccountEditForm";

afterEach(() => {
  cleanup();
  window.localStorage.clear();
  document.documentElement.removeAttribute("data-user-theme");
});

function renderWithUserTheme(children: ReactNode) {
  return render(
    <UserThemeProvider storageScope="account-edit-form-test">
      {children}
    </UserThemeProvider>,
  );
}

const account: Account = {
  id: "00000000-0000-4000-8000-000000000001",
  name: "三菱UFJ银行",
  type: "bank",
  currency: "JPY",
  initial_balance: 100000,
  current_balance: 85000,
  sort_order: 1,
  created_at: "2026-01-01T00:00:00.000Z",
  holders: [],
};

const baseProps = {
  account,
  holderOptions: [],
  updateAccountAction: vi.fn(async () => {}),
};

describe("AccountEditForm", () => {
  it("显示编辑账户标题和当前余额", () => {
    const { container } = renderWithUserTheme(
      <AccountEditForm {...baseProps} />,
    );

    expect(
      within(container).getByRole("heading", { name: "编辑账户" }),
    ).toBeInTheDocument();
    expect(within(container).getByLabelText("当前余额")).toHaveValue("¥85,000");
  });

  it("显示插图预留位", () => {
    const { container } = renderWithUserTheme(
      <AccountEditForm
        {...baseProps}
        illustrationSlot={<div data-testid="illustration-slot" />}
      />,
    );

    expect(
      within(container).getByTestId("illustration-slot"),
    ).toBeInTheDocument();
  });

  it("未传入删除账户回调时操作区只显示保存修改", () => {
    const { container } = renderWithUserTheme(
      <AccountEditForm {...baseProps} />,
    );

    expect(
      within(container).getByRole("button", { name: "保存修改" }),
    ).toBeInTheDocument();
    expect(
      within(container).queryByRole("button", { name: "删除" }),
    ).toBeNull();
  });

  it("传入删除账户回调时操作区左侧显示删除按钮", () => {
    const archiveAccountAction = vi.fn(async () => {});
    const { container } = renderWithUserTheme(
      <AccountEditForm
        {...baseProps}
        archiveAccountAction={archiveAccountAction}
      />,
    );

    expect(
      within(container).getByRole("button", { name: "删除" }),
    ).toBeInTheDocument();
  });

  it("点击删除并确认后提交独立的删除表单而非编辑表单", () => {
    const submittedFormIds: (string | undefined)[] = [];
    vi.spyOn(HTMLFormElement.prototype, "requestSubmit").mockImplementation(
      function (this: HTMLFormElement) {
        submittedFormIds.push(this.id || undefined);
      },
    );
    const archiveAccountAction = vi.fn(async () => {});
    const { container } = renderWithUserTheme(
      <AccountEditForm
        {...baseProps}
        archiveAccountAction={archiveAccountAction}
      />,
    );

    fireEvent.click(within(container).getByRole("button", { name: "删除" }));

    const dialog = screen.getByRole("dialog");
    fireEvent.click(within(dialog).getByRole("button", { name: "删除" }));

    expect(submittedFormIds).toEqual([getAccountArchiveFormId(account.id)]);
  });

  it("点击关闭按钮时触发 onCancel", async () => {
    const onCancel = vi.fn();
    const { container } = renderWithUserTheme(
      <AccountEditForm {...baseProps} onCancel={onCancel} />,
    );

    within(container).getByRole("button", { name: "关闭" }).click();

    expect(onCancel).toHaveBeenCalledTimes(1);
  });

  it("切换货币时当前余额的货币标识实时更新", () => {
    const { container } = renderWithUserTheme(
      <AccountEditForm {...baseProps} />,
    );

    expect(within(container).getByLabelText("当前余额")).toHaveValue("¥85,000");

    fireEvent.mouseDown(
      within(container).getByRole("combobox", { name: "货币" }),
    );
    fireEvent.click(screen.getByRole("option", { name: "USD 美元" }));

    expect(within(container).getByLabelText("当前余额")).toHaveValue(
      "$85,000.00",
    );
  });
});
