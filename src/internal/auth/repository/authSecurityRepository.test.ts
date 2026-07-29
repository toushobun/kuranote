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
  queryResponses?: Partial<SupabaseMockResponse>[];
  rpc?: ReturnType<typeof vi.fn>;
  rpcResponse?: Partial<SupabaseMockResponse>;
}) {
  const supabase = createSupabaseMock({
    queryResponses: options.queryResponses,
    rpcResponse: options.rpcResponse,
  });
  const rpc = options.rpc ?? supabase.rpc;
  const logger = createLogger();
  const client = {
    ...supabase.client,
    rpc,
  };

  return {
    logger,
    repository: createSupabaseAuthSecurityRepository(
      logger,
      () => client as never,
    ),
    rpc,
    supabase,
  };
}

describe("createSupabaseAuthSecurityRepository", () => {
  it("注册邮箱已存在时返回不可用", async () => {
    const { repository, rpc } = createRepository({
      rpcResponse: { data: true },
    });

    await expect(
      repository.isRegisterEmailAvailable(" User@Example.Test "),
    ).resolves.toBe(false);
    expect(rpc).toHaveBeenCalledWith("is_email_registered", {
      p_email: "user@example.test",
    });
  });

  it("邮箱不存在时返回可用", async () => {
    const { repository } = createRepository({
      rpcResponse: { data: false },
    });

    await expect(
      repository.isRegisterEmailAvailable("user@example.test"),
    ).resolves.toBe(true);
  });

  it("邮箱查询失败时记录错误并转换 RepositoryError", async () => {
    const { logger, repository } = createRepository({
      rpcResponse: {
        error: { code: "service_error", message: "private details" },
      },
    });

    await expect(
      repository.isRegisterEmailAvailable("user@example.test"),
    ).rejects.toMatchObject({
      code: "register_email_check_failed",
      message: "邮箱可用性检查失败，请稍后重试。",
      name: RepositoryError.name,
    });
    expect(logger.error).toHaveBeenCalledWith(
      "[auth] failed to check register email availability",
      { code: "service_error" },
    );
  });

  it("邮箱查询抛异常时转换 RepositoryError 且不记录原始消息", async () => {
    const rpc = vi.fn().mockRejectedValue(new Error("private network details"));
    const { logger, repository } = createRepository({ rpc });

    await expect(
      repository.isRegisterEmailAvailable("user@example.test"),
    ).rejects.toMatchObject({
      code: "register_email_check_failed",
      message: "邮箱可用性检查失败，请稍后重试。",
      name: RepositoryError.name,
    });
    expect(logger.error).toHaveBeenCalledWith(
      "[auth] register email availability query crashed",
      { errorName: "Error" },
    );
    expect(JSON.stringify(vi.mocked(logger.error).mock.calls)).not.toContain(
      "private network details",
    );
  });

  it("邮箱查询返回非布尔值时不误判为可用", async () => {
    const { repository } = createRepository({
      rpcResponse: { data: null },
    });

    await expect(
      repository.isRegisterEmailAvailable("user@example.test"),
    ).rejects.toMatchObject({
      code: "register_email_check_failed",
      message: "邮箱可用性检查失败，请稍后重试。",
      name: RepositoryError.name,
    });
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
