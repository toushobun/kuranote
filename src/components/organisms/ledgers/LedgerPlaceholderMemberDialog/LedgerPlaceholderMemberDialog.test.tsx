import {
  cleanup,
  fireEvent,
  render,
  screen,
  waitFor,
  within,
} from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";

import { ConfirmDialogTestProviders } from "test/ConfirmDialogTestProviders";
import type {
  LedgerPlaceholderMemberActionState,
  LedgerPlaceholderMemberActions,
} from "types/ledgers";

import { LedgerPlaceholderMemberDialog } from "./LedgerPlaceholderMemberDialog";

afterEach(() => {
  cleanup();
  vi.clearAllMocks();
});

const placeholder = { displayName: "奶奶", id: "placeholder-1" };

function createActions(
  overrides: Partial<LedgerPlaceholderMemberActions> = {},
): LedgerPlaceholderMemberActions {
  const keep = vi.fn(
    async (state: LedgerPlaceholderMemberActionState) => state,
  );
  return { create: keep, delete: keep, rename: keep, ...overrides };
}

function renderDialog(
  props: Partial<Parameters<typeof LedgerPlaceholderMemberDialog>[0]> = {},
) {
  const onClose = vi.fn();
  const onCreateInvite = vi.fn();
  const onOpenInvite = vi.fn();
  render(
    <ConfirmDialogTestProviders>
      <LedgerPlaceholderMemberDialog
        actions={createActions()}
        ledgerId="ledger-1"
        mode="edit"
        onClose={onClose}
        onCreateInvite={onCreateInvite}
        onOpenInvite={onOpenInvite}
        open
        row={{ invite: null, placeholder }}
        {...props}
      />
    </ConfirmDialogTestProviders>,
  );
  return { onClose, onCreateInvite, onOpenInvite };
}

function lastFormData(action: ReturnType<typeof vi.fn>) {
  const calls = action.mock.calls;
  return calls[calls.length - 1]?.[1] as FormData;
}

describe("LedgerPlaceholderMemberDialog 添加", () => {
  it("提交名字后调用创建 Action，成功后关闭并提示", async () => {
    const create = vi.fn(async () => ({
      operation: "create" as const,
      successKey: "success-1",
    }));
    const { onClose } = renderDialog({
      actions: createActions({ create }),
      mode: "create",
      row: null,
    });

    fireEvent.change(screen.getByLabelText(/名字/), {
      target: { value: "奶奶" },
    });
    fireEvent.click(screen.getByRole("button", { name: "添加" }));

    await waitFor(() => expect(create).toHaveBeenCalled());
    const formData = lastFormData(create);
    expect(formData.get("ledgerId")).toBe("ledger-1");
    expect(formData.get("displayName")).toBe("奶奶");
    expect(await screen.findByText("已添加待邀请成员")).toBeInTheDocument();
    expect(onClose).toHaveBeenCalled();
  });

  it("重名时显示 placeholder_name_conflict 文案", async () => {
    const create = vi.fn(async () => ({
      error: "当前账本已有同名的待邀请成员，请换一个名字。",
      errorKey: "error-1",
      operation: "create" as const,
    }));
    const { onClose } = renderDialog({
      actions: createActions({ create }),
      mode: "create",
      row: null,
    });

    fireEvent.change(screen.getByLabelText(/名字/), {
      target: { value: "奶奶" },
    });
    fireEvent.click(screen.getByRole("button", { name: "添加" }));

    expect(await screen.findByText("添加待邀请成员失败")).toBeInTheDocument();
    expect(
      screen.getByText("当前账本已有同名的待邀请成员，请换一个名字。"),
    ).toBeInTheDocument();
    expect(onClose).not.toHaveBeenCalled();
  });
});

describe("LedgerPlaceholderMemberDialog 详情", () => {
  it("改名提交占位 ID 与新名字，成功后保持弹框", async () => {
    const rename = vi.fn(async () => ({
      operation: "rename" as const,
      successKey: "success-rename",
    }));
    const { onClose } = renderDialog({ actions: createActions({ rename }) });

    fireEvent.change(screen.getByLabelText(/修改名字/), {
      target: { value: "外婆" },
    });
    fireEvent.click(screen.getByRole("button", { name: "保存名字" }));

    await waitFor(() => expect(rename).toHaveBeenCalled());
    const formData = lastFormData(rename);
    expect(formData.get("placeholderId")).toBe(placeholder.id);
    expect(formData.get("displayName")).toBe("外婆");
    expect(await screen.findByText("名字已更新")).toBeInTheDocument();
    expect(onClose).not.toHaveBeenCalled();
  });

  it("删除需二次确认并说明绑定链接会失效，确认后提交", async () => {
    const remove = vi.fn(async () => ({
      operation: "delete" as const,
      successKey: "success-delete",
    }));
    const { onClose } = renderDialog({
      actions: createActions({ delete: remove }),
    });

    fireEvent.click(screen.getByRole("button", { name: /删除待邀请成员/ }));
    const confirmDialog = await screen.findByRole("dialog", {
      name: "删除待邀请成员？",
    });
    expect(
      within(confirmDialog).getByText(/绑定的邀请链接也会同时失效/),
    ).toBeInTheDocument();
    expect(remove).not.toHaveBeenCalled();

    fireEvent.click(
      within(confirmDialog).getByRole("button", { name: "删除" }),
    );

    await waitFor(() => expect(remove).toHaveBeenCalled());
    const formData = lastFormData(remove);
    expect(formData.get("ledgerId")).toBe("ledger-1");
    expect(formData.get("placeholderId")).toBe(placeholder.id);
    await waitFor(() => expect(onClose).toHaveBeenCalled());
  });

  it("被账户引用时显示先更换持有人的提示", async () => {
    const remove = vi.fn(async () => ({
      error:
        "该待邀请成员仍是账户持有人，请先把相关账户的持有人改为其他人或无持有人后再删除。",
      errorKey: "error-in-use",
      operation: "delete" as const,
    }));
    renderDialog({ actions: createActions({ delete: remove }) });

    fireEvent.click(screen.getByRole("button", { name: /删除待邀请成员/ }));
    fireEvent.click(
      within(
        await screen.findByRole("dialog", { name: "删除待邀请成员？" }),
      ).getByRole("button", { name: "删除" }),
    );

    expect(await screen.findByText("删除待邀请成员失败")).toBeInTheDocument();
    expect(
      screen.getByText(/持有人改为其他人或无持有人后再删除/),
    ).toBeInTheDocument();
  });

  it("没有邀请时提供生成入口，有邀请时提供查看入口", () => {
    const invite = {
      createdAt: "2026-09-01T00:00:00.000Z",
      id: "invite-1",
      placeholderId: placeholder.id,
      role: "member" as const,
      token: "token",
    };
    const { onCreateInvite } = renderDialog();

    fireEvent.click(screen.getByRole("button", { name: /生成专属邀请链接/ }));
    expect(onCreateInvite).toHaveBeenCalledWith(placeholder.id);

    cleanup();
    const { onOpenInvite } = renderDialog({ row: { invite, placeholder } });
    expect(
      screen.queryByRole("button", { name: /生成专属邀请链接/ }),
    ).toBeNull();
    fireEvent.click(screen.getByRole("button", { name: /查看邀请链接/ }));
    expect(onOpenInvite).toHaveBeenCalledWith(invite);
  });

  it("只读模式不显示任何管理入口", () => {
    renderDialog({ actions: null });

    expect(screen.getByText("奶奶")).toBeInTheDocument();
    expect(screen.queryByLabelText(/修改名字/)).toBeNull();
    expect(screen.queryByRole("button", { name: /删除/ })).toBeNull();
    expect(screen.queryByRole("button", { name: /邀请/ })).toBeNull();
  });

  it("只读模式下不能打开添加弹框", () => {
    renderDialog({ actions: null, mode: "create", row: null });

    expect(screen.queryByRole("dialog")).toBeNull();
  });
});
