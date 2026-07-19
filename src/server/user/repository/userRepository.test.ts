// @vitest-environment node

import { describe, expect, it, vi } from "vitest";

import { createSupabaseMock } from "test/supabaseMock";

import { RepositoryError } from "server/shared/errors/appError";
import type { Logger } from "server/shared/logging/logger";
import { createSupabaseUserRepository } from "server/user/repository/userRepository";

const userId = "00000000-0000-4000-8000-000000000031";
const profileRow = {
  avatar_url: "https://example.com/avatar.png",
  display_name: "淞文",
  email: "user@example.com",
  id: userId,
  status: "active",
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
