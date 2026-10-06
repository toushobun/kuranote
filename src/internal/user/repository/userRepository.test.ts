// @vitest-environment node

import { describe, expect, it, vi } from "vitest";

import { userErrorMessages } from "internal/user/errors";
import { createSupabaseMock } from "test/supabaseMock";

import {
  ConflictError,
  RepositoryError,
} from "internal/shared/errors/appError";
import type { Logger } from "internal/shared/logging/logger";
import { createSupabaseUserRepository } from "internal/user/repository/userRepository";

const userId = "00000000-0000-4000-8000-000000000031";
const profileRow = {
  avatar_url: "https://example.com/avatar.png",
  display_name: "淞文",
  email: "user@example.com",
  id: userId,
  status: "active",
  theme_key: "amberWarmth",
  transaction_color_scheme: "expense_green_income_red",
};

function createLogger(): Logger {
  return { error: vi.fn(), info: vi.fn(), warn: vi.fn() };
}

describe("createSupabaseUserRepository.findById", () => {
  it("把 app_user 行转换为用户资料", async () => {
    const supabase = createSupabaseMock({
      queryResponses: [{ data: profileRow }],
    });
    const repository = createSupabaseUserRepository(
      supabase.client as never,
      createLogger(),
    );

    await expect(repository.findById(userId)).resolves.toEqual({
      avatarUrl: "https://example.com/avatar.png",
      displayName: "淞文",
      email: "user@example.com",
      id: userId,
      status: "active",
      themeKey: "amberWarmth",
      transactionColorScheme: "expense_green_income_red",
    });
    expect(supabase.queries[0].table).toBe("app_user");
    expect(supabase.queries[0].calls).toContainEqual({
      args: ["id", userId],
      method: "eq",
    });
  });

  it("用户不存在时返回 null", async () => {
    const supabase = createSupabaseMock({ queryResponses: [{ data: null }] });
    const repository = createSupabaseUserRepository(
      supabase.client as never,
      createLogger(),
    );

    await expect(repository.findById(userId)).resolves.toBeNull();
  });

  it("查询失败时记录安全字段并抛出 RepositoryError", async () => {
    const logger = createLogger();
    const supabase = createSupabaseMock({
      queryResponses: [
        { error: { code: "08006", message: "connection refused" } },
      ],
    });
    const repository = createSupabaseUserRepository(
      supabase.client as never,
      logger,
    );

    await expect(repository.findById(userId)).rejects.toBeInstanceOf(
      RepositoryError,
    );
    expect(logger.error).toHaveBeenCalledWith(
      "[user] failed to load user profile",
      { code: "08006", message: "connection refused", userId },
    );
  });

  it("数据库状态异常时不向上层返回未识别值", async () => {
    const supabase = createSupabaseMock({
      queryResponses: [{ data: { ...profileRow, status: "unexpected" } }],
    });
    const repository = createSupabaseUserRepository(
      supabase.client as never,
      createLogger(),
    );

    await expect(repository.findById(userId)).rejects.toBeInstanceOf(
      RepositoryError,
    );
  });

  it("数据库收支配色异常时记录警告并回退默认值", async () => {
    const logger = createLogger();
    const supabase = createSupabaseMock({
      queryResponses: [
        { data: { ...profileRow, transaction_color_scheme: "unexpected" } },
      ],
    });
    const repository = createSupabaseUserRepository(
      supabase.client as never,
      logger,
    );

    await expect(repository.findById(userId)).resolves.toMatchObject({
      transactionColorScheme: "expense_green_income_red",
    });
    expect(logger.warn).toHaveBeenCalledWith(
      "[user] invalid transaction color scheme in user profile",
      { userId },
    );
  });

  it("数据库主题 key 异常时记录警告并回退默认主题", async () => {
    const logger = createLogger();
    const supabase = createSupabaseMock({
      queryResponses: [{ data: { ...profileRow, theme_key: "unexpected" } }],
    });
    const repository = createSupabaseUserRepository(
      supabase.client as never,
      logger,
    );

    await expect(repository.findById(userId)).resolves.toMatchObject({
      themeKey: "amberWarmth",
    });
    expect(logger.warn).toHaveBeenCalledWith(
      "[user] invalid theme key in user profile",
      { userId },
    );
  });
});

describe("createSupabaseUserRepository.updateProfile", () => {
  it("只更新传入字段和审计用户并返回新资料", async () => {
    const updatedRow = { ...profileRow, display_name: "新昵称" };
    const supabase = createSupabaseMock({
      queryResponses: [{ data: updatedRow }],
    });
    const repository = createSupabaseUserRepository(
      supabase.client as never,
      createLogger(),
    );

    await expect(
      repository.updateProfile({
        displayName: "新昵称",
        updatedBy: userId,
        userId,
      }),
    ).resolves.toEqual({
      avatarUrl: "https://example.com/avatar.png",
      displayName: "新昵称",
      email: "user@example.com",
      id: userId,
      status: "active",
      themeKey: "amberWarmth",
      transactionColorScheme: "expense_green_income_red",
    });
    expect(supabase.queries[0].calls).toContainEqual({
      args: [{ display_name: "新昵称", updated_by: userId }],
      method: "update",
    });
    expect(supabase.queries[0].calls).toContainEqual({
      args: ["status", "active"],
      method: "eq",
    });
  });

  it("更新收支配色方案字段", async () => {
    const supabase = createSupabaseMock({
      queryResponses: [
        {
          data: {
            ...profileRow,
            transaction_color_scheme: "expense_red_income_green",
          },
        },
      ],
    });
    const repository = createSupabaseUserRepository(
      supabase.client as never,
      createLogger(),
    );

    await repository.updateProfile({
      transactionColorScheme: "expense_red_income_green",
      updatedBy: userId,
      userId,
    });

    expect(supabase.queries[0].calls).toContainEqual({
      args: [
        {
          transaction_color_scheme: "expense_red_income_green",
          updated_by: userId,
        },
      ],
      method: "update",
    });
  });

  it("更新主题 key 字段", async () => {
    const supabase = createSupabaseMock({
      queryResponses: [{ data: { ...profileRow, theme_key: "sakuraStory" } }],
    });
    const repository = createSupabaseUserRepository(
      supabase.client as never,
      createLogger(),
    );

    await expect(
      repository.updateProfile({
        themeKey: "sakuraStory",
        updatedBy: userId,
        userId,
      }),
    ).resolves.toMatchObject({ themeKey: "sakuraStory" });
    expect(supabase.queries[0].calls).toContainEqual({
      args: [{ theme_key: "sakuraStory", updated_by: userId }],
      method: "update",
    });
    expect(supabase.queries[0].calls).toContainEqual({
      args: ["status", "active"],
      method: "eq",
    });
  });

  it("更新目标不存在时返回 null", async () => {
    const supabase = createSupabaseMock({ queryResponses: [{ data: null }] });
    const repository = createSupabaseUserRepository(
      supabase.client as never,
      createLogger(),
    );

    await expect(
      repository.updateProfile({ avatarUrl: null, updatedBy: userId, userId }),
    ).resolves.toBeNull();
  });

  it("更新结果的数据库收支配色异常时回退默认值", async () => {
    const logger = createLogger();
    const supabase = createSupabaseMock({
      queryResponses: [
        {
          data: { ...profileRow, transaction_color_scheme: "unexpected" },
        },
      ],
    });
    const repository = createSupabaseUserRepository(
      supabase.client as never,
      logger,
    );

    await expect(
      repository.updateProfile({
        transactionColorScheme: "expense_red_income_green",
        updatedBy: userId,
        userId,
      }),
    ).resolves.toMatchObject({
      transactionColorScheme: "expense_green_income_red",
    });
    expect(logger.warn).toHaveBeenCalledWith(
      "[user] invalid transaction color scheme in user profile",
      { userId },
    );
  });

  it("更新失败时记录错误并抛出 RepositoryError", async () => {
    const logger = createLogger();
    const supabase = createSupabaseMock({
      queryResponses: [{ error: { code: "42501", message: "RLS denied" } }],
    });
    const repository = createSupabaseUserRepository(
      supabase.client as never,
      logger,
    );

    await expect(
      repository.updateProfile({
        displayName: "新昵称",
        updatedBy: userId,
        userId,
      }),
    ).rejects.toBeInstanceOf(RepositoryError);
    expect(logger.error).toHaveBeenCalledWith(
      "[user] failed to update user profile",
      { code: "42501", message: "RLS denied", userId },
    );
  });
});

const ledgerId = "00000000-0000-4000-8000-000000000101";
const otherLedgerId = "00000000-0000-4000-8000-000000000102";

describe("createSupabaseUserRepository.listCurrentLedgerDisplayNames", () => {
  it("把 RPC 结果转换为账本昵称列表", async () => {
    const supabase = createSupabaseMock({
      rpcResponse: {
        data: [
          { display_name: "爸爸", ledger_id: ledgerId, ledger_name: "家庭" },
        ],
      },
    });
    const repository = createSupabaseUserRepository(
      supabase.client as never,
      createLogger(),
    );

    await expect(repository.listCurrentLedgerDisplayNames()).resolves.toEqual([
      { displayName: "爸爸", ledgerId, ledgerName: "家庭" },
    ]);
    expect(supabase.rpc).toHaveBeenCalledWith(
      "list_current_user_ledger_display_names",
    );
  });

  it("没有账本时返回空数组", async () => {
    const supabase = createSupabaseMock({ rpcResponse: { data: null } });
    const repository = createSupabaseUserRepository(
      supabase.client as never,
      createLogger(),
    );

    await expect(repository.listCurrentLedgerDisplayNames()).resolves.toEqual(
      [],
    );
  });

  it("查询失败时记录错误并抛出 RepositoryError", async () => {
    const logger = createLogger();
    const supabase = createSupabaseMock({
      rpcResponse: { error: { code: "XX000", message: "boom" } },
    });
    const repository = createSupabaseUserRepository(
      supabase.client as never,
      logger,
    );

    await expect(repository.listCurrentLedgerDisplayNames()).rejects.toThrow(
      new RepositoryError(
        "user_ledger_display_names_load_failed",
        userErrorMessages.ledgerDisplayNamesLoadFailed,
      ),
    );
    expect(logger.error).toHaveBeenCalledWith(
      "[user] failed to load ledger display names",
      { code: "XX000", message: "boom" },
    );
  });

  it("返回行格式异常时抛出 RepositoryError", async () => {
    const supabase = createSupabaseMock({
      rpcResponse: { data: [{ ledger_id: ledgerId }] },
    });
    const repository = createSupabaseUserRepository(
      supabase.client as never,
      createLogger(),
    );

    await expect(
      repository.listCurrentLedgerDisplayNames(),
    ).rejects.toBeInstanceOf(RepositoryError);
  });
});

describe("createSupabaseUserRepository.updateCurrentDisplayName", () => {
  it("以新昵称与勾选账本调用 RPC，无冲突时返回成功", async () => {
    const supabase = createSupabaseMock({ rpcResponse: { data: [] } });
    const repository = createSupabaseUserRepository(
      supabase.client as never,
      createLogger(),
    );

    await expect(
      repository.updateCurrentDisplayName({
        displayName: "新昵称",
        syncLedgerIds: [ledgerId],
      }),
    ).resolves.toEqual({ ok: true });
    expect(supabase.rpc).toHaveBeenCalledWith(
      "update_current_user_display_name",
      { p_display_name: "新昵称", p_sync_ledger_ids: [ledgerId] },
    );
  });

  it("返回冲突账本列表", async () => {
    const supabase = createSupabaseMock({
      rpcResponse: {
        data: [
          {
            error_code: "display_name_placeholder_conflict",
            ledger_id: otherLedgerId,
            ledger_name: "旅行",
          },
        ],
      },
    });
    const repository = createSupabaseUserRepository(
      supabase.client as never,
      createLogger(),
    );

    await expect(
      repository.updateCurrentDisplayName({
        displayName: "新昵称",
        syncLedgerIds: [otherLedgerId],
      }),
    ).resolves.toEqual({
      conflicts: [
        {
          code: "display_name_placeholder_conflict",
          ledgerId: otherLedgerId,
          ledgerName: "旅行",
        },
      ],
      ok: false,
    });
  });

  it.each([
    "auth_required",
    "display_name_required",
    "display_name_too_long",
    "ledger_permission_denied",
    "user_inactive",
  ] as const)("RPC detail %s 转换为业务错误码", async (code) => {
    const supabase = createSupabaseMock({
      rpcResponse: {
        error: { code: "42501", details: code, message: "denied" },
      },
    });
    const repository = createSupabaseUserRepository(
      supabase.client as never,
      createLogger(),
    );

    await expect(
      repository.updateCurrentDisplayName({
        displayName: "新昵称",
        syncLedgerIds: [],
      }),
    ).resolves.toEqual({ code, ok: false });
  });

  it("死锁时抛出可重试的并发冲突", async () => {
    const supabase = createSupabaseMock({
      rpcResponse: { error: { code: "40P01", message: "deadlock" } },
    });
    const repository = createSupabaseUserRepository(
      supabase.client as never,
      createLogger(),
    );

    await expect(
      repository.updateCurrentDisplayName({
        displayName: "新昵称",
        syncLedgerIds: [],
      }),
    ).rejects.toBeInstanceOf(ConflictError);
  });

  it("未知错误时记录错误并抛出 RepositoryError", async () => {
    const logger = createLogger();
    const supabase = createSupabaseMock({
      rpcResponse: { error: { code: "XX000", message: "boom" } },
    });
    const repository = createSupabaseUserRepository(
      supabase.client as never,
      logger,
    );

    await expect(
      repository.updateCurrentDisplayName({
        displayName: "新昵称",
        syncLedgerIds: [],
      }),
    ).rejects.toThrow(
      new RepositoryError(
        "user_display_name_update_failed",
        userErrorMessages.displayNameUpdateFailed,
      ),
    );
    expect(logger.error).toHaveBeenCalledWith(
      "[user] failed to update display name",
      { code: "XX000", message: "boom" },
    );
  });

  it("返回未知冲突码时抛出 RepositoryError", async () => {
    const supabase = createSupabaseMock({
      rpcResponse: {
        data: [
          { error_code: "unknown", ledger_id: ledgerId, ledger_name: "家庭" },
        ],
      },
    });
    const repository = createSupabaseUserRepository(
      supabase.client as never,
      createLogger(),
    );

    await expect(
      repository.updateCurrentDisplayName({
        displayName: "新昵称",
        syncLedgerIds: [ledgerId],
      }),
    ).rejects.toBeInstanceOf(RepositoryError);
  });
});
