// @vitest-environment node

import { beforeEach, describe, expect, it, vi } from "vitest";

import { createLedgerInvite } from "internal/ledger/adapter/next/actions/ledgerInvite";
import { ledgerInviteErrorCodes } from "internal/ledger/errors/ledgerInvite";
import {
  AuthorizationError,
  ConflictError,
} from "internal/shared/errors/appError";

const validToken = "a".repeat(64);

const mocks = vi.hoisted(() => ({
  createDependencies: vi.fn(),
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

vi.mock("internal/ledger/adapter/next/currentLedger", () => ({
  getCurrentLedgerContext: mocks.getCurrentLedgerContext,
}));

vi.mock("internal/ledger/adapter/next/revalidateLedger", () => ({
  revalidateLedgerMutation: mocks.revalidateLedgerMutation,
}));

vi.mock("internal/shared/context/createServerRequestDependencies", () => ({
  createServerRequestDependencies: mocks.createDependencies,
}));

vi.mock("internal/container", () => ({
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
  mocks.createDependencies.mockResolvedValue({});
  mocks.getCurrentLedgerContext.mockResolvedValue({
    currentLedger: { id: "current-ledger-id" },
    userId: "user-id",
  });
});

async function runAction(formData: FormData) {
  return createLedgerInvite({}, formData);
}

function expectErrorState(
  state: Awaited<ReturnType<typeof runAction>>,
  expected: { message: string; operation: "create" | "revoke" },
) {
  expect(state).toEqual({
    error: expected.message,
    errorKey: expect.any(String),
    operation: expected.operation,
  });
  expect(mocks.redirect).not.toHaveBeenCalled();
  expect(mocks.revalidateLedgerMutation).not.toHaveBeenCalled();
}

describe("createLedgerInvite", () => {
  it("ledgerId 为空时在当前页返回创建失败状态", async () => {
    const state = await runAction(new FormData());

    expectErrorState(state, {
      message: "邀请链接生成失败，请稍后重试。",
      operation: "create",
    });
    expect(mocks.createService).not.toHaveBeenCalled();
  });

  it("创建 Service 返回 AppError 时直接使用安全消息", async () => {
    mocks.createService.mockRejectedValueOnce(
      new AuthorizationError(
        ledgerInviteErrorCodes.permissionDenied,
        "只有账本所有者或管理员可以管理邀请。",
      ),
    );
    const formData = new FormData();
    formData.set("ledgerId", "ledger/id");
    formData.set("role", "admin");

    const state = await runAction(formData);

    expectErrorState(state, {
      message: "只有账本所有者或管理员可以管理邀请。",
      operation: "create",
    });
  });

  it("创建成功时通过 fragment 回传邀请信息且 URL 不含错误参数", async () => {
    mocks.createService.mockResolvedValueOnce({
      inviteId: "invite-id",
      role: "viewer",
      token: validToken,
    });
    const formData = new FormData();
    formData.set("ledgerId", "ledger-id");
    formData.set("role", "viewer");

    await expect(runAction(formData)).rejects.toThrow(
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
    const redirectTarget = String(mocks.redirect.mock.calls.at(-1)?.[0]);
    expect(redirectTarget).not.toContain("inviteError");
    expect(redirectTarget).not.toContain("errorKey");
  });

  it("创建 RPC 返回畸形 token 时在当前页返回创建失败状态", async () => {
    mocks.createService.mockResolvedValueOnce({
      inviteId: "invite-id",
      role: "member",
      token: "invalid-token",
    });
    const formData = new FormData();
    formData.set("ledgerId", "ledger/id");
    formData.set("role", "member");

    const state = await runAction(formData);

    expectErrorState(state, {
      message: "邀请链接生成失败，请稍后重试。",
      operation: "create",
    });
  });

  it.each(["owner", "unknown"])("拒绝非法邀请角色 %s", async (role) => {
    const formData = new FormData();
    formData.set("ledgerId", "ledger/id");
    formData.set("role", role);

    const state = await runAction(formData);

    expectErrorState(state, {
      message: "请选择有效的邀请权限。",
      operation: "create",
    });
    expect(mocks.createService).not.toHaveBeenCalled();
  });

  it("拒绝已废弃的替换操作", async () => {
    const formData = new FormData();
    formData.set("intent", "replace");
    formData.set("ledgerId", "ledger/id");
    formData.set("inviteId", "invite-id");

    const state = await runAction(formData);

    expectErrorState(state, {
      message: "邀请链接生成失败，请稍后重试。",
      operation: "create",
    });
    expect(mocks.createService).not.toHaveBeenCalled();
    expect(mocks.revokeService).not.toHaveBeenCalled();
  });

  it("撤销缺少 inviteId 时在当前页返回撤销失败状态", async () => {
    const formData = new FormData();
    formData.set("intent", "revoke");
    formData.set("ledgerId", "ledger/id");

    const state = await runAction(formData);

    expectErrorState(state, {
      message: "邀请撤销失败，请稍后重试。",
      operation: "revoke",
    });
    expect(mocks.revokeService).not.toHaveBeenCalled();
  });

  it("撤销 Service 返回 AppError 时直接使用安全消息", async () => {
    mocks.revokeService.mockRejectedValueOnce(
      new ConflictError(
        ledgerInviteErrorCodes.inviteUsed,
        "该邀请链接已经被使用，无法撤销。",
      ),
    );
    const formData = new FormData();
    formData.set("intent", "revoke");
    formData.set("ledgerId", "ledger/id");
    formData.set("inviteId", "invite-1");

    const state = await runAction(formData);

    expectErrorState(state, {
      message: "该邀请链接已经被使用，无法撤销。",
      operation: "revoke",
    });
    expect(mocks.revokeService).toHaveBeenCalledWith({
      inviteId: "invite-1",
      ledgerId: "ledger/id",
      userId: "user-id",
    });
  });

  it("撤销成功后只携带成功参数返回设置页", async () => {
    mocks.revokeService.mockResolvedValueOnce(undefined);
    const formData = new FormData();
    formData.set("intent", "revoke");
    formData.set("ledgerId", "ledger-id");
    formData.set("inviteId", "invite-1");

    await expect(runAction(formData)).rejects.toThrow(
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
    const redirectTarget = String(mocks.redirect.mock.calls.at(-1)?.[0]);
    expect(redirectTarget).not.toContain("inviteError");
    expect(redirectTarget).not.toContain("errorKey");
  });

  it("非 AppError 返回安全提示并记录服务端日志", async () => {
    const consoleError = vi
      .spyOn(console, "error")
      .mockImplementation(() => {});
    mocks.createService.mockRejectedValueOnce(new Error("boom"));
    const formData = new FormData();
    formData.set("ledgerId", "ledger-id");
    formData.set("role", "member");

    const state = await runAction(formData);

    expectErrorState(state, {
      message: "邀请链接生成失败，请稍后重试。",
      operation: "create",
    });
    expect(consoleError).toHaveBeenCalledWith(
      "[ledger] ledger invite action failed unexpectedly",
      { errorName: "Error", operation: "create" },
    );
    consoleError.mockRestore();
  });

  it("依赖初始化失败时返回安全提示且不调用 Service", async () => {
    const consoleError = vi
      .spyOn(console, "error")
      .mockImplementation(() => {});
    mocks.createDependencies.mockRejectedValueOnce(new Error("unavailable"));
    const formData = new FormData();
    formData.set("ledgerId", "ledger-id");
    formData.set("role", "member");

    const state = await runAction(formData);

    expectErrorState(state, {
      message: "邀请链接生成失败，请稍后重试。",
      operation: "create",
    });
    expect(mocks.createService).not.toHaveBeenCalled();
    expect(consoleError).toHaveBeenCalledWith(
      "[ledger] ledger invite action failed unexpectedly",
      { errorName: "Error", operation: "create" },
    );
    consoleError.mockRestore();
  });
});
