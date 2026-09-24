// @vitest-environment node

import { beforeEach, describe, expect, it, vi } from "vitest";

import { createLedgerInvite } from "internal/ledger/adapter/next/actions/ledgerInvite";
import {
  getLedgerInviteErrorMessage,
  ledgerInviteErrorCodes,
} from "internal/ledger/errors/ledgerInvite";
import { getLedgerPlaceholderMemberErrorMessage } from "internal/ledger/errors/ledgerPlaceholderMember";
import {
  AuthorizationError,
  ConflictError,
} from "internal/shared/errors/appError";

const validToken = "a".repeat(64);
const placeholderId = "00000000-0000-4000-8000-000000000051";

const mocks = vi.hoisted(() => ({
  createDependencies: vi.fn(),
  createService: vi.fn(),
  getCurrentLedgerContext: vi.fn(),
  redirect: vi.fn((path: string) => {
    throw new Error(`NEXT_REDIRECT:${path}`);
  }),
  inviteMemberService: vi.fn(),
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
        inviteMember: mocks.inviteMemberService,
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

function formDataWith(values: Record<string, string>) {
  const formData = new FormData();
  for (const [key, value] of Object.entries(values)) {
    formData.set(key, value);
  }
  return formData;
}

function expectErrorState(
  state: Awaited<ReturnType<typeof runAction>>,
  expected: {
    message: string;
    operation: "create" | "invite" | "revoke";
    revalidated?: boolean;
  },
) {
  expect(state).toEqual({
    error: expected.message,
    errorKey: expect.any(String),
    operation: expected.operation,
  });
  expect(mocks.redirect).not.toHaveBeenCalled();
  if (!expected.revalidated) {
    expect(mocks.revalidateLedgerMutation).not.toHaveBeenCalled();
  }
}

const createdInvite = {
  inviteId: "invite-id",
  placeholderId,
  role: "viewer",
  token: validToken,
};
const createdFragment = `NEXT_REDIRECT:/ledgers/ledger-id/settings#inviteId=invite-id&inviteRole=viewer&inviteToken=${validToken}&placeholderId=${placeholderId}`;

describe("createLedgerInvite 邀请成员（intent=invite）", () => {
  function inviteForm(values: Record<string, string> = {}) {
    return formDataWith({
      displayName: "  小明 ",
      intent: "invite",
      ledgerId: "ledger-id",
      role: "viewer",
      ...values,
    });
  }

  it("成功时调用编排方法并通过 fragment 回传新链接", async () => {
    mocks.inviteMemberService.mockResolvedValueOnce(createdInvite);

    await expect(runAction(inviteForm())).rejects.toThrow(createdFragment);
    expect(mocks.inviteMemberService).toHaveBeenCalledWith({
      displayName: "小明",
      ledgerId: "ledger-id",
      role: "viewer",
      userId: "user-id",
    });
    expect(mocks.createService).not.toHaveBeenCalled();
    // 新增了待邀请成员，账户持有人与导入候选一并刷新。
    expect(mocks.revalidateLedgerMutation).toHaveBeenCalledWith([
      "/ledgers/ledger-id/settings",
      "/settings/data/import",
    ]);
  });

  it.each([
    ["名字为空", { displayName: "   " }, "placeholder_name_invalid"],
    ["名字过长", { displayName: "a".repeat(101) }, "placeholder_name_too_long"],
  ])("%s时返回权威文案且不调用 Service", async (_label, values, code) => {
    const state = await runAction(inviteForm(values));

    expectErrorState(state, {
      message: getLedgerPlaceholderMemberErrorMessage(code)!,
      operation: "invite",
    });
    expect(mocks.inviteMemberService).not.toHaveBeenCalled();
  });

  it.each(["owner", "unknown"])(
    "角色 %s 非法时不调用 Service",
    async (role) => {
      const state = await runAction(inviteForm({ role }));

      expectErrorState(state, {
        message: "请选择有效的邀请权限。",
        operation: "invite",
      });
      expect(mocks.inviteMemberService).not.toHaveBeenCalled();
    },
  );

  it("重名时返回引导文案，不刷新列表", async () => {
    const message = getLedgerInviteErrorMessage(
      ledgerInviteErrorCodes.inviteMemberNameConflict,
    )!;
    mocks.inviteMemberService.mockRejectedValueOnce(
      new ConflictError(
        ledgerInviteErrorCodes.inviteMemberNameConflict,
        message,
      ),
    );

    expectErrorState(await runAction(inviteForm()), {
      message,
      operation: "invite",
    });
  });

  it("第 2 步失败时返回部分成功文案，并刷新成员列表让新行出现", async () => {
    const message = "已添加「小明」，但邀请链接生成失败，请在列表中重新生成。";
    mocks.inviteMemberService.mockRejectedValueOnce(
      new ConflictError(ledgerInviteErrorCodes.inviteMemberLinkFailed, message),
    );

    expectErrorState(await runAction(inviteForm()), {
      message,
      operation: "invite",
      revalidated: true,
    });
    expect(mocks.revalidateLedgerMutation).toHaveBeenCalledWith([
      "/ledgers/ledger-id/settings",
      "/settings/data/import",
    ]);
  });

  it("非 AppError 返回安全提示并记录服务端日志", async () => {
    const consoleError = vi
      .spyOn(console, "error")
      .mockImplementation(() => {});
    mocks.inviteMemberService.mockRejectedValueOnce(new Error("boom"));

    expectErrorState(await runAction(inviteForm()), {
      message: "邀请链接生成失败，请稍后重试。",
      operation: "invite",
    });
    expect(consoleError).toHaveBeenCalledWith(
      "[ledger] ledger invite action failed unexpectedly",
      { errorName: "Error", operation: "invite" },
    );
    consoleError.mockRestore();
  });
});

describe("createLedgerInvite 重新生成链接（intent=create）", () => {
  function regenerateForm(values: Record<string, string> = {}) {
    return formDataWith({
      intent: "create",
      ledgerId: "ledger-id",
      placeholderId: ` ${placeholderId} `,
      role: "viewer",
      ...values,
    });
  }

  it("解析 placeholderId 并通过 fragment 回传新链接", async () => {
    mocks.createService.mockResolvedValueOnce(createdInvite);

    await expect(runAction(regenerateForm())).rejects.toThrow(createdFragment);
    expect(mocks.createService).toHaveBeenCalledWith({
      ledgerId: "ledger-id",
      placeholderId,
      role: "viewer",
      userId: "user-id",
    });
    expect(mocks.inviteMemberService).not.toHaveBeenCalled();
    expect(mocks.revalidateLedgerMutation).toHaveBeenCalledWith([
      "/ledgers/ledger-id/settings",
    ]);
    const redirectTarget = String(mocks.redirect.mock.calls.at(-1)?.[0]);
    expect(redirectTarget).not.toContain("inviteError");
    expect(redirectTarget).not.toContain("errorKey");
  });

  it("未指定 intent 时按重新生成处理", async () => {
    mocks.createService.mockResolvedValueOnce(createdInvite);
    const formData = regenerateForm();
    formData.delete("intent");

    await expect(runAction(formData)).rejects.toThrow(createdFragment);
  });

  it.each([
    ["缺少 placeholderId", { placeholderId: "" }, "placeholder_required"],
    [
      "placeholderId 非法",
      { placeholderId: "not-a-uuid" },
      "placeholder_not_found",
    ],
    ["角色非法", { role: "owner" }, "invite_role_invalid"],
  ])("%s时返回失败状态且不调用 Service", async (_label, values, code) => {
    const state = await runAction(regenerateForm(values));

    expectErrorState(state, {
      message: getLedgerInviteErrorMessage(code)!,
      operation: "create",
    });
    expect(mocks.createService).not.toHaveBeenCalled();
  });

  it.each([
    [
      new ConflictError(
        ledgerInviteErrorCodes.placeholderInvitePending,
        getLedgerInviteErrorMessage(
          ledgerInviteErrorCodes.placeholderInvitePending,
        )!,
      ),
    ],
    [
      new AuthorizationError(
        ledgerInviteErrorCodes.permissionDenied,
        "只有账本所有者或管理员可以管理邀请。",
      ),
    ],
  ])("Service 抛出 %s 时直接使用安全消息", async (error) => {
    mocks.createService.mockRejectedValueOnce(error);

    expectErrorState(await runAction(regenerateForm()), {
      message: error.message,
      operation: "create",
    });
  });

  it("RPC 返回畸形 token 时在当前页返回创建失败状态", async () => {
    mocks.createService.mockResolvedValueOnce({
      ...createdInvite,
      token: "invalid-token",
    });

    expectErrorState(await runAction(regenerateForm()), {
      message: "邀请链接生成失败，请稍后重试。",
      operation: "create",
      revalidated: true,
    });
  });

  it("依赖初始化失败时返回安全提示且不调用 Service", async () => {
    const consoleError = vi
      .spyOn(console, "error")
      .mockImplementation(() => {});
    mocks.createDependencies.mockRejectedValueOnce(new Error("unavailable"));

    expectErrorState(await runAction(regenerateForm()), {
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

describe("createLedgerInvite", () => {
  it("ledgerId 为空时在当前页返回创建失败状态", async () => {
    const state = await runAction(new FormData());

    expectErrorState(state, {
      message: "邀请链接生成失败，请稍后重试。",
      operation: "create",
    });
    expect(mocks.createService).not.toHaveBeenCalled();
  });

  it("拒绝已废弃的替换操作", async () => {
    const formData = formDataWith({
      intent: "replace",
      inviteId: "invite-id",
      ledgerId: "ledger/id",
    });

    const state = await runAction(formData);

    expectErrorState(state, {
      message: "邀请链接生成失败，请稍后重试。",
      operation: "create",
    });
    expect(mocks.createService).not.toHaveBeenCalled();
    expect(mocks.inviteMemberService).not.toHaveBeenCalled();
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
});
