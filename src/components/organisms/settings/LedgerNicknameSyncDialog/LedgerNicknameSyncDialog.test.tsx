import {
  cleanup,
  fireEvent,
  render,
  screen,
  within,
} from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";

import {
  familyLedgerId,
  profileLedgerDisplayNames,
  tripLedgerId,
} from "test/userProfileFixtures";

import { LedgerNicknameSyncDialog } from "./LedgerNicknameSyncDialog";

afterEach(() => {
  cleanup();
});

function renderDialog(
  props: Partial<Parameters<typeof LedgerNicknameSyncDialog>[0]> = {},
) {
  const handlers = {
    onClose: vi.fn(),
    onConfirm: vi.fn(),
    onOnlyPersonal: vi.fn(),
    onSelectAll: vi.fn(),
    onSelectNone: vi.fn(),
    onToggle: vi.fn(),
  };
  render(
    <LedgerNicknameSyncDialog
      displayName="新昵称"
      ledgers={profileLedgerDisplayNames}
      open
      pending={false}
      selectedLedgerIds={new Set([familyLedgerId])}
      {...handlers}
      {...props}
    />,
  );
  return handlers;
}

describe("LedgerNicknameSyncDialog", () => {
  it("显示标题、新昵称说明，以及每个账本的名称和当前昵称", () => {
    renderDialog();

    expect(
      screen.getByRole("dialog", { name: "是否同步修改以下账本中的昵称？" }),
    ).toBeInTheDocument();
    expect(screen.getByText(/改为「新昵称」/)).toBeInTheDocument();

    const list = screen.getByRole("list", { name: "同步昵称的账本" });
    expect(within(list).getByText("家庭账本")).toBeInTheDocument();
    expect(within(list).getByText("当前昵称：爸爸")).toBeInTheDocument();
    expect(within(list).getAllByRole("checkbox")).toHaveLength(3);
  });

  it("按传入的勾选状态显示复选框", () => {
    renderDialog();

    expect(screen.getByRole("checkbox", { name: /家庭账本/ })).toBeChecked();
    expect(
      screen.getByRole("checkbox", { name: /北海道旅行/ }),
    ).not.toBeChecked();
  });

  it("点击账本行、全选、全不选时通知调用方", () => {
    const handlers = renderDialog();

    fireEvent.click(screen.getByText("北海道旅行"));
    fireEvent.click(screen.getByRole("button", { name: "全选" }));
    fireEvent.click(screen.getByRole("button", { name: "全不选" }));

    expect(handlers.onToggle).toHaveBeenCalledWith(tripLedgerId);
    expect(handlers.onSelectAll).toHaveBeenCalledOnce();
    expect(handlers.onSelectNone).toHaveBeenCalledOnce();
  });

  it("提供仅修改个人昵称与确定两个操作", () => {
    const handlers = renderDialog();

    fireEvent.click(screen.getByRole("button", { name: "仅修改个人昵称" }));
    fireEvent.click(screen.getByRole("button", { name: "确定" }));

    expect(handlers.onOnlyPersonal).toHaveBeenCalledOnce();
    expect(handlers.onConfirm).toHaveBeenCalledOnce();
  });

  it("提交中禁用所有操作", () => {
    renderDialog({ pending: true });

    for (const name of ["全选", "全不选", "仅修改个人昵称", "确定"]) {
      expect(screen.getByRole("button", { name })).toBeDisabled();
    }
  });
});
