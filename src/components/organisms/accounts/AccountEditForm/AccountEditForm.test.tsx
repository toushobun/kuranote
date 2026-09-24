import {
  cleanup,
  fireEvent,
  render,
  screen,
  waitFor,
  within,
} from "@testing-library/react";
import type { ReactNode } from "react";
import { afterEach, describe, expect, it, vi } from "vitest";

import { ConfirmDialogProvider } from "providers/ConfirmDialogProvider/ConfirmDialogProvider";
import { UserThemeProvider } from "theme/UserThemeProvider";
import { createPlaceholderAccountHolder } from "test/mocks/accountHolders";
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
      <ConfirmDialogProvider>{children}</ConfirmDialogProvider>
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
    expect(within(container).getByLabelText("当前余额")).toHaveValue("85000");
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

  it("点击删除并确认后提交独立的删除表单而非编辑表单", async () => {
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
    fireEvent.click(within(dialog).getByRole("button", { name: "删除账户" }));

    await waitFor(() => {
      expect(submittedFormIds).toEqual([getAccountArchiveFormId(account.id)]);
    });
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

    expect(within(container).getByLabelText("当前余额")).toHaveValue("85000");

    fireEvent.mouseDown(
      within(container).getByRole("combobox", { name: "货币" }),
    );
    fireEvent.click(screen.getByRole("option", { name: "USD 美元" }));
    expect(screen.getByText("$")).toBeInTheDocument();

    expect(within(container).getByLabelText("当前余额")).toHaveValue("85000");
  });
});

describe("余额调整", () => {
  it("实时显示增减差值，恢复原余额后隐藏备注", () => {
    renderWithUserTheme(<AccountEditForm {...baseProps} />);
    const balance = screen.getByLabelText("当前余额");
    expect(balance).toBeEnabled();
    expect(screen.queryByLabelText("余额调整备注")).not.toBeInTheDocument();
    fireEvent.change(balance, { target: { value: "87500" } });
    expect(screen.getByText("将增加 2,500")).toBeInTheDocument();
    expect(screen.getByLabelText("余额调整备注")).not.toBeRequired();
    fireEvent.change(balance, { target: { value: "82500" } });
    expect(screen.getByText("将减少 2,500")).toBeInTheDocument();
    fireEvent.change(balance, { target: { value: "85000" } });
    expect(screen.queryByLabelText("余额调整备注")).not.toBeInTheDocument();
  });
  it("余额未变化时不提交目标余额，实际修改后才提交", () => {
    const { container } = renderWithUserTheme(
      <AccountEditForm {...baseProps} />,
    );
    const form = container.querySelector<HTMLFormElement>("form")!;
    const balance = screen.getByLabelText("当前余额");

    expect(new FormData(form).has("targetBalance")).toBe(false);

    fireEvent.change(balance, { target: { value: "87500" } });
    expect(new FormData(form).get("targetBalance")).toBe("87500");

    fireEvent.change(balance, { target: { value: "85000" } });
    expect(new FormData(form).has("targetBalance")).toBe(false);
  });
  it.each(["85000", "", "1.001"])(
    "余额暂时变为 %s 后恢复调整仍保留备注",
    (temporaryBalance) => {
      const { container } = renderWithUserTheme(
        <AccountEditForm {...baseProps} />,
      );
      const balance = screen.getByLabelText("当前余额");
      fireEvent.change(balance, { target: { value: "87500" } });
      fireEvent.change(screen.getByLabelText("余额调整备注"), {
        target: { value: "盘点差额" },
      });
      fireEvent.change(balance, { target: { value: temporaryBalance } });
      expect(screen.queryByLabelText("余额调整备注")).not.toBeInTheDocument();
      const form = container.querySelector("form")!;
      expect(new FormData(form).has("balanceAdjustmentNote")).toBe(false);
      fireEvent.change(balance, { target: { value: "82500" } });
      expect(screen.getByLabelText("余额调整备注")).toHaveValue("盘点差额");
      expect(new FormData(form).get("balanceAdjustmentNote")).toBe("盘点差额");
    },
  );
  it("无效余额禁止保存", () => {
    renderWithUserTheme(<AccountEditForm {...baseProps} />);
    fireEvent.change(screen.getByLabelText("当前余额"), {
      target: { value: "1.001" },
    });
    expect(screen.getByRole("button", { name: "保存修改" })).toBeDisabled();
  });
  it("弹窗未关闭时账户余额被外部改变，重新校准基准而不是沿用旧快照", () => {
    const { container, rerender } = render(
      <UserThemeProvider storageScope="account-edit-form-test">
        <ConfirmDialogProvider>
          <AccountEditForm {...baseProps} />
        </ConfirmDialogProvider>
      </UserThemeProvider>,
    );
    const form = container.querySelector<HTMLFormElement>("form")!;
    expect(screen.getByLabelText("当前余额")).toHaveValue("85000");
    expect(new FormData(form).has("targetBalance")).toBe(false);

    rerender(
      <UserThemeProvider storageScope="account-edit-form-test">
        <ConfirmDialogProvider>
          <AccountEditForm
            {...baseProps}
            account={{ ...account, current_balance: 90000 }}
          />
        </ConfirmDialogProvider>
      </UserThemeProvider>,
    );

    expect(screen.getByLabelText("当前余额")).toHaveValue("90000");
    expect(screen.queryByLabelText("余额调整备注")).not.toBeInTheDocument();
    expect(new FormData(form).has("targetBalance")).toBe(false);
  });

  describe("占位持有人", () => {
    const placeholderHolder = createPlaceholderAccountHolder();
    const placeholderId = placeholderHolder.placeholder_id;
    const placeholderAccount: Account = {
      ...account,
      holders: [placeholderHolder],
    };

    function submittedHolders(container: HTMLElement) {
      const formData = new FormData(
        container.querySelector<HTMLFormElement>("form")!,
      );
      return {
        placeholderIds: formData.getAll("holderPlaceholderId"),
        userIds: formData.getAll("holderUserIds"),
      };
    }

    it("编辑占位持有的账户、不改持有人直接保存时仍提交该占位 ID", () => {
      const { container } = renderWithUserTheme(
        <AccountEditForm
          {...baseProps}
          account={placeholderAccount}
          placeholderHolderOptions={[
            { display_name: "奶奶", placeholder_id: placeholderId },
          ]}
        />,
      );

      expect(submittedHolders(container)).toEqual({
        placeholderIds: [placeholderId],
        userIds: [],
      });
    });

    it("当前占位暂不在候选中时仍补入选项并原样提交", () => {
      const { container } = renderWithUserTheme(
        <AccountEditForm {...baseProps} account={placeholderAccount} />,
      );

      expect(screen.getByLabelText("奶奶（待邀请）")).toBeChecked();
      expect(submittedHolders(container)).toEqual({
        placeholderIds: [placeholderId],
        userIds: [],
      });
    });

    it("可以从占位切换为真实成员或无持有人", () => {
      const memberId = "00000000-0000-4000-8000-000000000041";
      const { container } = renderWithUserTheme(
        <AccountEditForm
          {...baseProps}
          account={placeholderAccount}
          holderOptions={[
            { display_name: "淞文", email: null, user_id: memberId },
          ]}
          placeholderHolderOptions={[
            { display_name: "奶奶", placeholder_id: placeholderId },
          ]}
        />,
      );

      fireEvent.click(screen.getByLabelText("淞文"));
      expect(submittedHolders(container)).toEqual({
        placeholderIds: [],
        userIds: [memberId],
      });

      fireEvent.click(screen.getByLabelText("淞文"));
      expect(submittedHolders(container)).toEqual({
        placeholderIds: [],
        userIds: [],
      });
    });
  });
});
