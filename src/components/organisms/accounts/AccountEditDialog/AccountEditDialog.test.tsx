import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import type { ReactNode } from "react";
import { afterEach, describe, expect, it, vi } from "vitest";

import { UserThemeProvider } from "theme/UserThemeProvider";
import type { Account } from "types/accounts";

import { AccountEditDialog } from "./AccountEditDialog";

afterEach(() => {
  cleanup();
  vi.clearAllMocks();
  window.localStorage.clear();
  document.documentElement.removeAttribute("data-user-theme");
});

function renderWithUserTheme(children: ReactNode) {
  return render(
    <UserThemeProvider storageScope="account-edit-dialog-test">
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
  archiveAccountAction: vi.fn(async () => {}),
  holderOptions: [],
  onClose: vi.fn(),
  open: true,
  updateAccountAction: vi.fn(async () => {}),
};

function closeByKeyboard() {
  fireEvent.keyDown(screen.getByRole("dialog"), { key: "Escape" });
}

function renderDialog(onClose: () => void) {
  renderWithUserTheme(<AccountEditDialog {...baseProps} onClose={onClose} />);
}

describe("AccountEditDialog", () => {
  it("未修改时关闭弹窗不显示未保存确认", () => {
    const onClose = vi.fn();
    renderDialog(onClose);

    closeByKeyboard();

    expect(onClose).toHaveBeenCalledOnce();
    expect(screen.queryByText("尚未保存")).toBeNull();
  });

  it("有修改时关闭弹窗显示未保存确认", async () => {
    const onClose = vi.fn();
    renderDialog(onClose);

    fireEvent.change(screen.getByLabelText("账户名称"), {
      target: { value: "三菱UFJ 银行" },
    });
    closeByKeyboard();

    expect(await screen.findByText("尚未保存")).toBeInTheDocument();
    expect(onClose).not.toHaveBeenCalled();
  });

  it("放弃修改后关闭编辑弹窗", async () => {
    const onClose = vi.fn();
    renderDialog(onClose);

    fireEvent.change(screen.getByLabelText("账户名称"), {
      target: { value: "三菱UFJ 银行" },
    });
    closeByKeyboard();
    fireEvent.click(await screen.findByRole("button", { name: "放弃修改" }));

    expect(onClose).toHaveBeenCalledOnce();
  });
});
