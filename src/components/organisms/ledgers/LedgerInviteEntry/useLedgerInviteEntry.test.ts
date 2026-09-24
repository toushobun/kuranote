import { act, renderHook, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

import type { PendingLedgerInvite } from "types/ledgers";

import { useLedgerInviteEntry } from "./useLedgerInviteEntry";

const pendingInvite: PendingLedgerInvite = {
  createdAt: "2026-07-20T01:00:00.000Z",
  id: "invite-1",
  placeholderId: "placeholder-1",
  role: "viewer",
  token: "selected-token",
};

describe("useLedgerInviteEntry", () => {
  beforeEach(() => {
    window.history.replaceState(null, "", "/settings/ledger");
    Object.defineProperty(navigator, "clipboard", {
      configurable: true,
      value: { writeText: vi.fn().mockResolvedValue(undefined) },
    });
  });

  it("初始 token 会打开草稿并生成完整邀请链接", () => {
    const { result } = renderHook(() =>
      useLedgerInviteEntry({ actionState: {}, initialToken: "initial token" }),
    );

    expect(result.current.draftOpen).toBe(true);
    expect(result.current.draftToken).toBe("initial token");
    expect(result.current.draftLink).toBe(
      `${window.location.origin}/invite/initial%20token`,
    );
  });

  it("消费 hash 中的新邀请 token 和角色并清理地址栏", async () => {
    window.history.replaceState(
      null,
      "",
      "/settings/ledger#inviteRole=admin&inviteToken=hash-token",
    );

    const { result } = renderHook(() =>
      useLedgerInviteEntry({ actionState: {}, initialToken: null }),
    );

    await waitFor(() => expect(result.current.created).toBe(true));
    expect(result.current.draftOpen).toBe(true);
    expect(result.current.draftRole).toBe("admin");
    expect(result.current.draftToken).toBe("hash-token");
    expect(window.location.hash).toBe("");
  });

  it("绑定邀请的 fragment 带 placeholderId 时记录草稿目标，仅用于页面反馈", async () => {
    window.history.replaceState(
      null,
      "",
      "/settings/ledger#inviteRole=member&inviteToken=hash-token&placeholderId=placeholder-1",
    );

    const { result } = renderHook(() =>
      useLedgerInviteEntry({ actionState: {}, initialToken: null }),
    );

    await waitFor(() => expect(result.current.created).toBe(true));
    expect(result.current.draftPlaceholderId).toBe("placeholder-1");
    expect(window.location.hash).toBe("");
  });

  it("为已有待邀请成员打开草稿时记录目标，重新打开邀请成员时清除目标与名字", () => {
    const { result } = renderHook(() =>
      useLedgerInviteEntry({ actionState: {}, initialToken: null }),
    );

    act(() => result.current.openNewDraft("placeholder-1"));
    expect(result.current.draftOpen).toBe(true);
    expect(result.current.draftPlaceholderId).toBe("placeholder-1");

    act(() => result.current.openNewDraft());
    expect(result.current.draftPlaceholderId).toBeNull();
    act(() => result.current.setDraftName("小明"));
    expect(result.current.draftName).toBe("小明");

    act(() => result.current.openNewDraft());
    expect(result.current.draftName).toBe("");
  });

  it.each(["invite", "create"] as const)(
    "%s 失败时保持草稿打开，便于修改后重试",
    (operation) => {
      const { result } = renderHook(() =>
        useLedgerInviteEntry({
          actionState: {
            error: "邀请成员失败。",
            errorKey: `error-${operation}`,
            operation,
          },
          initialToken: null,
        }),
      );

      expect(result.current.draftOpen).toBe(true);
      expect(result.current.managementError).toEqual({
        message: "邀请成员失败。",
        operation,
      });
    },
  );

  it("只消费一次带 errorKey 的管理错误", () => {
    const { result, rerender } = renderHook(
      ({ errorKey }) =>
        useLedgerInviteEntry({
          actionState: {
            error: "邀请撤销失败。",
            errorKey,
            operation: "revoke",
          },
          initialToken: null,
        }),
      { initialProps: { errorKey: "error-1" } },
    );

    expect(result.current.managementError).toEqual({
      message: "邀请撤销失败。",
      operation: "revoke",
    });

    act(() => result.current.closeManagementError());
    rerender({ errorKey: "error-1" });
    expect(result.current.managementError).toBeNull();

    rerender({ errorKey: "error-2" });
    expect(result.current.managementError).toEqual({
      message: "邀请撤销失败。",
      operation: "revoke",
    });
  });

  it("复制链接成功和失败时切换对应反馈", async () => {
    const writeText = vi.fn().mockResolvedValue(undefined);
    Object.defineProperty(navigator, "clipboard", {
      configurable: true,
      value: { writeText },
    });
    const { result } = renderHook(() =>
      useLedgerInviteEntry({ actionState: {}, initialToken: "token-1" }),
    );

    await act(async () => result.current.copyLink(result.current.draftLink));
    expect(writeText).toHaveBeenCalledWith(
      `${window.location.origin}/invite/token-1`,
    );
    expect(result.current.copied).toBe(true);
    expect(result.current.copyFailed).toBe(false);

    writeText.mockRejectedValueOnce(new Error("clipboard denied"));
    await act(async () => result.current.copyLink(result.current.draftLink));
    expect(result.current.copied).toBe(false);
    expect(result.current.copyFailed).toBe(true);
  });

  it("选择待处理邀请时生成详情链接", () => {
    const { result } = renderHook(() =>
      useLedgerInviteEntry({ actionState: {}, initialToken: null }),
    );

    act(() => result.current.selectInvite(pendingInvite));

    expect(result.current.selectedInvite).toEqual(pendingInvite);
    expect(result.current.selectedToken).toBe("selected-token");
    expect(result.current.selectedLink).toBe(
      `${window.location.origin}/invite/selected-token`,
    );
  });
});
