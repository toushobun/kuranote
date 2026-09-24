// @vitest-environment node

import { describe, expect, it, vi } from "vitest";

import { createSupabaseLedgerInvitePreviewRepository } from "internal/ledger/repository/ledgerInvitePreviewRepository";
import type { Logger } from "internal/shared/logging/logger";
import type { AuthenticatedSupabaseClient } from "internal/shared/supabase/authenticatedClient";

function createSupabaseStub(result: { data: unknown; error: unknown }) {
  return {
    rpc: vi.fn().mockResolvedValue(result),
  } as unknown as AuthenticatedSupabaseClient;
}

function createLoggerStub() {
  return {
    error: vi.fn(),
    info: vi.fn(),
    warn: vi.fn(),
  } as Logger;
}

describe("createSupabaseLedgerInvitePreviewRepository", () => {
  it("返回邀请预览查询的第一条记录", async () => {
    const row = {
      invite_role: "member",
      invite_status: "pending",
      inviter_name: "邀请人",
      is_placeholder_bound: true,
      ledger_name: "家庭账本",
      placeholder_display_name: "小明",
    };
    const supabase = createSupabaseStub({ data: [row], error: null });
    const logger = createLoggerStub();
    const repository = createSupabaseLedgerInvitePreviewRepository(
      supabase,
      logger,
    );

    await expect(repository.findByToken("token-1")).resolves.toEqual(row);
    expect(supabase.rpc).toHaveBeenCalledWith("get_ledger_invite_preview", {
      p_token: "token-1",
    });
  });

  it("逐列校验类型，类型不符的列按 null 处理", async () => {
    const repository = createSupabaseLedgerInvitePreviewRepository(
      createSupabaseStub({
        data: [
          {
            claimed_by: "00000000-0000-4000-8000-000000000031",
            invite_role: 1,
            invite_status: "valid",
            inviter_name: null,
            is_placeholder_bound: "true",
            ledger_name: "家庭账本",
            placeholder_display_name: 42,
          },
        ],
        error: null,
      }),
      createLoggerStub(),
    );

    await expect(repository.findByToken("token-1")).resolves.toEqual({
      invite_role: null,
      invite_status: "valid",
      inviter_name: null,
      is_placeholder_bound: null,
      ledger_name: "家庭账本",
      placeholder_display_name: null,
    });
  });

  it.each([[], null, { ledger_name: "家庭账本" }, ["row"]])(
    "查询结果为 %j 时返回 null",
    async (data) => {
      const repository = createSupabaseLedgerInvitePreviewRepository(
        createSupabaseStub({ data, error: null }),
        createLoggerStub(),
      );

      await expect(repository.findByToken("token-1")).resolves.toBeNull();
    },
  );

  it("查询失败时记录安全信息并抛出稳定 RepositoryError", async () => {
    const databaseError = {
      code: "PGRST500",
      message: "relation ledger_invite does not exist",
    };
    const supabase = createSupabaseStub({ data: null, error: databaseError });
    const logger = createLoggerStub();
    const repository = createSupabaseLedgerInvitePreviewRepository(
      supabase,
      logger,
    );

    await expect(repository.findByToken("token-1")).rejects.toMatchObject({
      code: "ledger_invite_preview_load_failed",
      message: "邀请信息加载失败，请稍后重试。",
    });
    expect(logger.error).toHaveBeenCalledWith(
      "[ledgerInvite] failed to load invite preview",
      { databaseCode: "PGRST500" },
    );
  });
});
