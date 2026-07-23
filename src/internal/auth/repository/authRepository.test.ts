// @vitest-environment node

import { beforeEach, describe, expect, it, vi } from "vitest";

import { createSupabaseAuthRepository } from "internal/auth/repository/authRepository";
import { RepositoryError } from "internal/shared/errors/appError";
import type { Logger } from "internal/shared/logging/logger";

const auth = {
  exchangeCodeForSession: vi.fn(),
  getUser: vi.fn(),
  resend: vi.fn(),
  signInWithOAuth: vi.fn(),
  signInWithPassword: vi.fn(),
  signOut: vi.fn(),
  signUp: vi.fn(),
  verifyOtp: vi.fn(),
};

function createLogger(): Logger {
  return { error: vi.fn(), info: vi.fn(), warn: vi.fn() };
}

function createRepository(logger = createLogger()) {
  return {
    logger,
    repository: createSupabaseAuthRepository({ auth } as never, logger),
  };
}

beforeEach(() => {
  vi.clearAllMocks();
  auth.exchangeCodeForSession.mockResolvedValue({ error: null });
  auth.getUser.mockResolvedValue({ data: { user: null }, error: null });
  auth.resend.mockResolvedValue({ error: null });
  auth.signInWithOAuth.mockResolvedValue({
    data: { url: "https://accounts.google.test/oauth" },
    error: null,
  });
  auth.signInWithPassword.mockResolvedValue({ error: null });
  auth.signOut.mockResolvedValue({ error: null });
  auth.signUp.mockResolvedValue({ error: null });
  auth.verifyOtp.mockResolvedValue({ error: null });
});

describe("createSupabaseAuthRepository", () => {
  it("邮箱密码登录成功时返回 true，认证错误时返回 false", async () => {
    const { repository } = createRepository();

    await expect(
      repository.signInWithPassword({
        email: "user@example.test",
        password: "password-1234",
      }),
    ).resolves.toBe(true);

    auth.signInWithPassword.mockResolvedValueOnce({
      error: { code: "invalid_credentials", message: "invalid" },
    });
    await expect(
      repository.signInWithPassword({
        email: "user@example.test",
        password: "wrong-password",
      }),
    ).resolves.toBe(false);
  });

  it("登录调用抛异常时记录安全日志并转换 RepositoryError", async () => {
    const { logger, repository } = createRepository();
    auth.signInWithPassword.mockRejectedValue(new Error("network failed"));

    await expect(
      repository.signInWithPassword({
        email: "user@example.test",
        password: "password-1234",
      }),
    ).rejects.toBeInstanceOf(RepositoryError);
    expect(logger.error).toHaveBeenCalledWith(
      "[auth] password sign-in crashed",
      { errorName: "Error" },
    );
    expect(JSON.stringify(vi.mocked(logger.error).mock.calls)).not.toContain(
      "network failed",
    );
  });

  it("注册时把显示名写入 Auth metadata 并映射弱密码错误", async () => {
    const { repository } = createRepository();

    await expect(
      repository.signUp({
        displayName: "山田太郎",
        email: "user@example.test",
        password: "password-1234",
      }),
    ).resolves.toEqual({ ok: true });
    expect(auth.signUp).toHaveBeenCalledWith({
      email: "user@example.test",
      options: { data: { display_name: "山田太郎" } },
      password: "password-1234",
    });

    auth.signUp.mockResolvedValueOnce({
      error: { code: "weak_password", message: "weak" },
    });
    await expect(
      repository.signUp({
        displayName: "山田太郎",
        email: "user@example.test",
        password: "password",
      }),
    ).resolves.toEqual({ ok: false, reason: "weak_password" });
  });

  it.each([
    ["user_already_exists", "duplicate_email"],
    ["invalid_email", "invalid_email"],
    ["signup_disabled", "signup_disabled"],
    ["over_email_send_rate_limit", "rate_limited"],
    ["unexpected", "failed"],
  ] as const)("映射注册错误 %s", async (code, reason) => {
    const { repository } = createRepository();
    auth.signUp.mockResolvedValueOnce({ error: { code, message: code } });

    await expect(
      repository.signUp({
        displayName: "山田太郎",
        email: "user@example.test",
        password: "password-1234",
      }),
    ).resolves.toEqual({ ok: false, reason });
  });

  it("读取当前用户时只返回认证模块需要的安全字段", async () => {
    const { repository } = createRepository();
    auth.getUser.mockResolvedValue({
      data: {
        user: {
          email: "user@example.test",
          id: "00000000-0000-4000-8000-000000000031",
          user_metadata: {
            display_name: "  山田太郎  ",
            secret_profile_value: "ignore",
          },
        },
      },
      error: null,
    });

    await expect(repository.getCurrentUser()).resolves.toEqual({
      displayName: "山田太郎",
      email: "user@example.test",
      id: "00000000-0000-4000-8000-000000000031",
    });
  });

  it.each([
    [{ name: "AuthSessionMissingError", status: 400 }, undefined],
    [{ code: "session_not_found", name: "AuthApiError" }, "session_not_found"],
    [{ code: "invalid_jwt", name: "AuthApiError" }, "invalid_jwt"],
  ])("明确的未登录错误返回 null", async (error, expectedCode) => {
    const { logger, repository } = createRepository();
    auth.getUser.mockResolvedValueOnce({ data: { user: null }, error });

    await expect(repository.getCurrentUser()).resolves.toBeNull();
    expect(logger.warn).toHaveBeenCalledWith(
      "[auth] session is unavailable or invalid",
      {
        code: expectedCode,
        errorName: error.name,
      },
    );
  });

  it("未知 getUser 返回错误转换为 RepositoryError，不伪装成未登录", async () => {
    const { logger, repository } = createRepository();
    auth.getUser.mockResolvedValueOnce({
      data: { user: null },
      error: {
        code: "service_unavailable",
        message: "private upstream details",
        name: "AuthApiError",
      },
    });

    await expect(repository.getCurrentUser()).rejects.toBeInstanceOf(
      RepositoryError,
    );
    expect(logger.error).toHaveBeenCalledWith(
      "[auth] session user lookup failed",
      { code: "service_unavailable", errorName: "AuthApiError" },
    );
    expect(JSON.stringify(vi.mocked(logger.error).mock.calls)).not.toContain(
      "private upstream details",
    );
  });

  it("OTP 发送、重发和验证使用 Supabase Auth 对应接口", async () => {
    const { repository } = createRepository();

    await expect(
      repository.resendSignUpOtp("user@example.test"),
    ).resolves.toEqual({ ok: true });
    expect(auth.resend).toHaveBeenCalledWith({
      email: "user@example.test",
      type: "signup",
    });

    await expect(
      repository.verifySignUpOtp({
        email: "user@example.test",
        token: "012345",
      }),
    ).resolves.toBe(true);
    expect(auth.verifyOtp).toHaveBeenCalledWith({
      email: "user@example.test",
      token: "012345",
      type: "signup",
    });
  });

  it("Google OAuth 启动和 callback 兑换返回安全结果", async () => {
    const { repository } = createRepository();

    await expect(
      repository.startGoogleOAuth("https://kuranote.test/auth/callback"),
    ).resolves.toBe("https://accounts.google.test/oauth");
    expect(auth.signInWithOAuth).toHaveBeenCalledWith({
      options: { redirectTo: "https://kuranote.test/auth/callback" },
      provider: "google",
    });

    await expect(repository.exchangeOAuthCode("oauth-code")).resolves.toBe(
      true,
    );
  });

  it("Supabase 返回错误时日志只保留错误码，不记录原始消息", async () => {
    const { logger, repository } = createRepository();
    auth.exchangeCodeForSession.mockResolvedValueOnce({
      error: { code: "bad_oauth_code", message: "private oauth details" },
    });
    auth.signInWithOAuth.mockResolvedValueOnce({
      data: { url: null },
      error: { code: "provider_failed", message: "private provider details" },
    });

    await expect(repository.exchangeOAuthCode("oauth-code")).resolves.toBe(
      false,
    );
    await expect(
      repository.startGoogleOAuth("https://kuranote.test/auth/callback"),
    ).resolves.toBeNull();

    expect(logger.warn).toHaveBeenNthCalledWith(
      1,
      "[auth] OAuth code exchange failed",
      { code: "bad_oauth_code" },
    );
    expect(logger.warn).toHaveBeenNthCalledWith(
      2,
      "[auth] Google OAuth start failed",
      { code: "provider_failed" },
    );
    expect(
      JSON.stringify((logger.warn as ReturnType<typeof vi.fn>).mock.calls),
    ).not.toContain("private");
  });

  it("登出返回错误也不会阻止清理后的页面跳转", async () => {
    const { logger, repository } = createRepository();
    auth.signOut.mockResolvedValue({
      error: { code: "signout_failed", message: "failed" },
    });

    await expect(repository.signOut()).resolves.toBeUndefined();
    expect(logger.warn).toHaveBeenCalledWith(
      "[auth] sign-out returned an error",
      { code: "signout_failed" },
    );
  });
});
