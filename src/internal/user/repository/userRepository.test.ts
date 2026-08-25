// @vitest-environment node

import { describe, expect, it, vi } from "vitest";

import { createSupabaseMock } from "test/supabaseMock";

import { RepositoryError } from "internal/shared/errors/appError";
import type { Logger } from "internal/shared/logging/logger";
import { createSupabaseUserRepository } from "internal/user/repository/userRepository";

const userId = "00000000-0000-4000-8000-000000000031";
const profileRow = {
  avatar_url: "https://example.com/avatar.png",
  display_name: "淞文",
  email: "user@example.com",
  id: userId,
  status: "active",
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
