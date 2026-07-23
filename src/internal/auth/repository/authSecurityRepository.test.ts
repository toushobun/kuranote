// @vitest-environment node

import { describe, expect, it, vi } from "vitest";

import {
  createSupabaseMock,
  type SupabaseMockResponse,
} from "test/supabaseMock";

import { createSupabaseAuthSecurityRepository } from "internal/auth/repository/authSecurityRepository";
import { RepositoryError } from "internal/shared/errors/appError";
import type { Logger } from "internal/shared/logging/logger";

function createLogger(): Logger {
  return { error: vi.fn(), info: vi.fn(), warn: vi.fn() };
}

function createRepository(options: {
  listUsers?: ReturnType<typeof vi.fn>;
  queryResponses?: Partial<SupabaseMockResponse>[];
}) {
  const supabase = createSupabaseMock({
    queryResponses: options.queryResponses,
  });
  const listUsers =
    options.listUsers ??
    vi.fn().mockResolvedValue({
      data: { nextPage: null, users: [] },
      error: null,
    });
  const logger = createLogger();
  const client = {
    ...supabase.client,
    auth: { admin: { listUsers } },
  };

  return {
    listUsers,
    logger,
    repository: createSupabaseAuthSecurityRepository(
      logger,
      () => client as never,
    ),
    supabase,
  };
}

describe("createSupabaseAuthSecurityRepository", () => {
  it("分页检查注册邮箱，匹配时返回不可用", async () => {
    const listUsers = vi
      .fn()
      .mockResolvedValueOnce({
        data: {
          nextPage: 2,
          users: [{ email: "other@example.test" }],
        },
        error: null,
      })
      .mockResolvedValueOnce({
        data: {
          nextPage: null,
          users: [{ email: " User@Example.Test " }],
        },
        error: null,
      });
    const { repository } = createRepository({ listUsers });

    await expect(
      repository.isRegisterEmailAvailable("user@example.test"),
    ).resolves.toBe(false);
    expect(listUsers).toHaveBeenNthCalledWith(1, {
      page: 1,
      perPage: 1000,
    });
    expect(listUsers).toHaveBeenNthCalledWith(2, {
      page: 2,
      perPage: 1000,
    });
  });

  it("邮箱不存在时返回可用", async () => {
    const { repository } = createRepository({});

    await expect(
      repository.isRegisterEmailAvailable("user@example.test"),
    ).resolves.toBe(true);
  });

  it("管理员用户查询失败时记录错误并转换 RepositoryError", async () => {
    const listUsers = vi.fn().mockResolvedValue({
      data: { nextPage: null, users: [] },
      error: { code: "service_error", message: "private details" },
    });
    const { logger, repository } = createRepository({ listUsers });

    await expect(
      repository.isRegisterEmailAvailable("user@example.test"),
    ).rejects.toBeInstanceOf(RepositoryError);
    expect(logger.error).toHaveBeenCalledWith(
      "[auth] failed to list users for email availability",
      { code: "service_error" },
    );
  });

  it("管理员查询抛异常时转换 RepositoryError 且不记录原始消息", async () => {
    const listUsers = vi
      .fn()
      .mockRejectedValue(new Error("private network details"));
    const { logger, repository } = createRepository({ listUsers });

    await expect(
      repository.isRegisterEmailAvailable("user@example.test"),
    ).rejects.toBeInstanceOf(RepositoryError);
    expect(logger.error).toHaveBeenCalledWith(
      "[auth] register email availability query crashed",
      { errorName: "Error" },
    );
    expect(JSON.stringify(vi.mocked(logger.error).mock.calls)).not.toContain(
      "private network details",
    );
  });

  it("按邮箱维度读取成功发送时间并保留查询边界", async () => {
    const { repository, supabase } = createRepository({
      queryResponses: [
        {
          data: [
            { created_at: "2026-07-19T00:00:00.000Z" },
            { created_at: "2026-07-19T00:01:00.000Z" },
          ],
        },
      ],
    });

    await expect(
      repository.listSuccessfulSendTimes({
        dimension: "email_hash",
        hash: "email-hash",
        limit: 11,
        purpose: "signup",
        since: "2026-07-18T00:00:00.000Z",
      }),
    ).resolves.toEqual([
      "2026-07-19T00:00:00.000Z",
      "2026-07-19T00:01:00.000Z",
    ]);
    expect(supabase.queries[0].table).toBe("auth_otp_attempt");
    expect(supabase.queries[0].calls).toContainEqual({
      args: ["email_hash", "email-hash"],
      method: "eq",
    });
    expect(supabase.queries[0].calls).toContainEqual({
      args: [11],
      method: "limit",
    });
  });

  it("邮箱可用性限流查询只读取当前 IP 的 availability_check", async () => {
    const { repository, supabase } = createRepository({
      queryResponses: [{ data: [] }],
    });

    await repository.listAvailabilityCheckTimes({
      ipHash: "ip-hash",
      limit: 101,
      purpose: "signup",
      since: "2026-07-19T00:00:00.000Z",
    });

    expect(supabase.queries[0].calls).toContainEqual({
      args: ["attempt_type", "availability_check"],
      method: "eq",
    });
    expect(supabase.queries[0].calls).toContainEqual({
      args: ["ip_hash", "ip-hash"],
      method: "eq",
    });
  });

  it("记录 attempt 时从领域字段转换为数据库字段", async () => {
    const { repository, supabase } = createRepository({
      queryResponses: [{}],
    });

    await repository.recordAttempt({
      attemptType: "send",
      emailHash: "email-hash",
      ipHash: "ip-hash",
      purpose: "signup",
      result: "success",
    });

    expect(supabase.queries[0].calls).toContainEqual({
      args: [
        {
          attempt_type: "send",
          email_hash: "email-hash",
          ip_hash: "ip-hash",
          purpose: "signup",
          result: "success",
        },
      ],
      method: "insert",
    });
  });

  it("读取最近发送和失败次数时使用独立查询", async () => {
    const { repository, supabase } = createRepository({
      queryResponses: [
        { data: { created_at: "2026-07-19T00:00:00.000Z" } },
        { count: 3 },
      ],
    });

    await expect(
      repository.findLatestSuccessfulSendAt({
        emailHash: "email-hash",
        purpose: "signup",
        since: "2026-07-18T00:00:00.000Z",
      }),
    ).resolves.toBe("2026-07-19T00:00:00.000Z");
    await expect(
      repository.countVerifyFailuresAfter({
        emailHash: "email-hash",
        since: "2026-07-19T00:00:00.000Z",
      }),
    ).resolves.toBe(3);
    expect(supabase.queries).toHaveLength(2);
  });

  it("数据库返回异常行结构时不向 Service 传递脏数据", async () => {
    const { repository } = createRepository({
      queryResponses: [{ data: [{ created_at: 123 }] }],
    });

    await expect(
      repository.listSuccessfulSendTimes({
        dimension: "ip_hash",
        hash: "ip-hash",
        limit: 101,
        purpose: "signup",
        since: "2026-07-18T00:00:00.000Z",
      }),
    ).rejects.toBeInstanceOf(RepositoryError);
  });
});
