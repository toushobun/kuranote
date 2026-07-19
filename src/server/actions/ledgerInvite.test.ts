// @vitest-environment node

import { beforeEach, describe, expect, it, vi } from "vitest";

import { createLedgerInvite } from "server/actions/ledgerInvite";
import { ledgerInviteErrorCodes } from "server/errors/ledgerInvite";
import {
  AuthorizationError,
  ConflictError,
} from "server/shared/errors/appError";

const validToken = "a".repeat(64);

const mocks = vi.hoisted(() => ({
  createService: vi.fn(),
  getCurrentLedgerContext: vi.fn(),
  redirect: vi.fn((path: string) => {
    throw new Error(`NEXT_REDIRECT:${path}`);
  }),
  revalidateLedgerMutation: vi.fn(),
  revokeService: vi.fn(),
}));

vi.mock("next/navigation", () => ({
  redirect: mocks.redirect,
}));

vi.mock("lib/ledger/current-ledger", () => ({
  getCurrentLedgerContext: mocks.getCurrentLedgerContext,
}));

vi.mock("server/ledger/adapter/next/revalidateLedger", () => ({
  revalidateLedgerMutation: mocks.revalidateLedgerMutation,
}));

vi.mock("server/shared/context/createServerRequestDependencies", () => ({
  createServerRequestDependencies: vi.fn().mockResolvedValue({}),
}));

vi.mock("server/container", () => ({
  createRequestContainer: () => ({
    ledger: {
      inviteService: {
        create: mocks.createService,
        revoke: mocks.revokeService,
      },
    },
  }),
}));

beforeEach(() => {
  vi.clearAllMocks();
  mocks.getCurrentLedgerContext.mockResolvedValue({
    currentLedger: { id: "current-ledger-id" },
    userId: "user-id",
  });
});

async function expectInviteErrorRedirect(
  formData: FormData,
  expected: { error: string; operation: "create" | "revoke" },
) {
  await expect(createLedgerInvite(formData)).rejects.toThrow("NEXT_REDIRECT:");

  const redirectCall = mocks.redirect.mock.calls.at(-1);
  const url = new URL(String(redirectCall?.[0]), "http://localhost");
  expect(url.pathname).toBe("/ledgers/ledger%2Fid/settings");
  expect(url.searchParams.get("inviteError")).toBe(expected.error);
  expect(url.searchParams.get("inviteErrorKey")).toBeTruthy();
  expect(url.searchParams.get("inviteOperation")).toBe(expected.operation);
}

describe("createLedgerInvite", () => {
  it("ledgerId 为空时跳到账本列表并返回创建失败", async () => {
    await expect(createLedgerInvite(new FormData())).rejects.toThrow(
      "NEXT_REDIRECT:/ledgers?inviteError=create_failed",
    );

    expect(mocks.createService).not.toHaveBeenCalled();
  });

  it("创建失败时回到账本设置页并携带错误码", async () => {
    mocks.createService.mockRejectedValue(
      new AuthorizationError(
        ledgerInviteErrorCodes.permissionDenied,
        "没有权限",
      ),
    );
    const formData = new FormData();
    formData.set("ledgerId", "ledger/id");
    formData.set("role", "admin");

    await expectInviteErrorRedirect(formData, {
      error: ledgerInviteErrorCodes.permissionDenied,
      operation: "create",
    });
  });

  it("创建成功时通过 fragment 回传邀请信息，避免 token 进入查询参数和 Referer", async () => {
    mocks.createService.mockResolvedValue({
      inviteId: "invite-id",
      role: "viewer",
      token: validToken,
    });
    const formData = new FormData();
    formData.set("ledgerId", "ledger-id");
    formData.set("role", "viewer");

    await expect(createLedgerInvite(formData)).rejects.toThrow(
      `NEXT_REDIRECT:/ledgers/ledger-id/settings#inviteId=invite-id&inviteRole=viewer&inviteToken=${validToken}`,
    );
    expect(mocks.createService).toHaveBeenCalledWith({
      ledgerId: "ledger-id",
      role: "viewer",
      userId: "user-id",
    });
    expect(mocks.revalidateLedgerMutation).toHaveBeenCalledWith([
      "/ledgers/ledger-id/settings",
    ]);
  });

  it("创建 RPC 返回畸形 token 时按创建失败处理", async () => {
    mocks.createService.mockResolvedValue({
      inviteId: "invite-id",
      role: "member",
      token: "invalid-token",
    });
    const formData = new FormData();
    formData.set("ledgerId", "ledger/id");
    formData.set("role", "member");

    await expectInviteErrorRedirect(formData, {
      error: ledgerInviteErrorCodes.createFailed,
      operation: "create",
    });
    expect(mocks.revalidateLedgerMutation).not.toHaveBeenCalled();
  });

  it.each(["owner", "unknown"])("拒绝非法邀请角色 %s", async (role) => {
    const formData = new FormData();
    formData.set("ledgerId", "ledger/id");
    formData.set("role", role);
    await expectInviteErrorRedirect(formData, {
      error: ledgerInviteErrorCodes.inviteRoleInvalid,
      operation: "create",
    });
    expect(mocks.createService).not.toHaveBeenCalled();
  });

  it("拒绝已废弃的替换操作", async () => {
    const formData = new FormData();
    formData.set("intent", "replace");
    formData.set("ledgerId", "ledger/id");
    formData.set("inviteId", "invite-id");

    await expectInviteErrorRedirect(formData, {
      error: ledgerInviteErrorCodes.createFailed,
      operation: "create",
    });
    expect(mocks.createService).not.toHaveBeenCalled();
    expect(mocks.revokeService).not.toHaveBeenCalled();
  });

  it("撤销缺少 inviteId 时回到账本设置页", async () => {
    const formData = new FormData();
    formData.set("intent", "revoke");
    formData.set("ledgerId", "ledger/id");

    await expectInviteErrorRedirect(formData, {
      error: ledgerInviteErrorCodes.revokeFailed,
      operation: "revoke",
    });
    expect(mocks.revokeService).not.toHaveBeenCalled();
  });

  it("撤销失败时携带稳定错误码返回设置页", async () => {
    mocks.revokeService.mockRejectedValue(
      new ConflictError(ledgerInviteErrorCodes.inviteUsed, "已使用"),
    );
    const formData = new FormData();
    formData.set("intent", "revoke");
    formData.set("ledgerId", "ledger/id");
    formData.set("inviteId", "invite-1");

    await expectInviteErrorRedirect(formData, {
      error: ledgerInviteErrorCodes.inviteUsed,
      operation: "revoke",
    });
    expect(mocks.revokeService).toHaveBeenCalledWith({
      inviteId: "invite-1",
      ledgerId: "ledger/id",
      userId: "user-id",
    });
  });

  it("撤销成功后刷新设置页并返回成功参数", async () => {
    mocks.revokeService.mockResolvedValue(undefined);
    const formData = new FormData();
    formData.set("intent", "revoke");
    formData.set("ledgerId", "ledger-id");
    formData.set("inviteId", "invite-1");

    await expect(createLedgerInvite(formData)).rejects.toThrow(
      "NEXT_REDIRECT:/ledgers/ledger-id/settings?inviteResult=revoked",
    );
    expect(mocks.revokeService).toHaveBeenCalledWith({
      inviteId: "invite-1",
      ledgerId: "ledger-id",
      userId: "user-id",
    });
    expect(mocks.revalidateLedgerMutation).toHaveBeenCalledWith([
      "/ledgers/ledger-id/settings",
    ]);
  });

  it("Service 抛出非 AppError 时向上抛出", async () => {
    mocks.createService.mockRejectedValue(new Error("boom"));
    const formData = new FormData();
    formData.set("ledgerId", "ledger-id");
    formData.set("role", "member");

    await expect(createLedgerInvite(formData)).rejects.toThrow("boom");
  });
});
