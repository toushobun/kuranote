// @vitest-environment node

import { beforeEach, describe, expect, it, vi } from "vitest";

import { createSupabaseAuthRepository } from "internal/auth/repository/authRepository";
import { RepositoryError } from "internal/shared/errors/appError";
import type { Logger } from "internal/shared/logging/logger";

const auth = {
  exchangeCodeForSession: vi.fn(),
  getUser: vi.fn(),
  getUserIdentities: vi.fn(),
  linkIdentity: vi.fn(),
  resend: vi.fn(),
  signInWithOAuth: vi.fn(),
  signInWithOtp: vi.fn(),
  signInWithPassword: vi.fn(),
  signOut: vi.fn(),
  signUp: vi.fn(),
  unlinkIdentity: vi.fn(),
  updateUser: vi.fn(),
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
  auth.getUserIdentities.mockResolvedValue({
    data: { identities: [] },
    error: null,
  });
  auth.linkIdentity.mockResolvedValue({
    data: { provider: "google", url: "https://accounts.google.test/link" },
    error: null,
  });
  auth.resend.mockResolvedValue({ error: null });
  auth.signInWithOAuth.mockResolvedValue({
    data: { url: "https://accounts.google.test/oauth" },
    error: null,
  });
  auth.signInWithOtp.mockResolvedValue({ error: null });
  auth.signInWithPassword.mockResolvedValue({ error: null });
  auth.signOut.mockResolvedValue({ error: null });
  auth.signUp.mockResolvedValue({ error: null });
  auth.unlinkIdentity.mockResolvedValue({ data: {}, error: null });
  auth.updateUser.mockResolvedValue({ error: null });
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

  describe("修改密码", () => {
    it("只向已存在账号发送邮箱验证码，并映射发送限流", async () => {
      const { repository } = createRepository();

      await expect(
        repository.sendPasswordChangeOtp("user@example.test"),
      ).resolves.toBe("sent");
      expect(auth.signInWithOtp).toHaveBeenCalledWith({
        email: "user@example.test",
        options: { shouldCreateUser: false },
      });

      auth.signInWithOtp.mockResolvedValueOnce({
        error: { code: "over_email_send_rate_limit", message: "raw" },
      });
      await expect(
        repository.sendPasswordChangeOtp("user@example.test"),
      ).resolves.toBe("rate_limited");
    });

    it("以 email 类型校验验证码，并映射错误或过期与校验限流", async () => {
      const { repository } = createRepository();
      const input = { email: "user@example.test", token: "123456" };

      auth.verifyOtp.mockResolvedValueOnce({
        data: { user: { id: "user-1" } },
        error: null,
      });
      await expect(repository.verifyPasswordChangeOtp(input)).resolves.toEqual({
        status: "verified",
        userId: "user-1",
      });
      expect(auth.verifyOtp).toHaveBeenCalledWith({ ...input, type: "email" });

      auth.verifyOtp.mockResolvedValueOnce({
        error: { code: "otp_expired", message: "raw" },
      });
      await expect(repository.verifyPasswordChangeOtp(input)).resolves.toEqual({
        status: "invalid",
      });

      auth.verifyOtp.mockResolvedValueOnce({
        error: { code: "over_request_rate_limit", message: "raw" },
      });
      await expect(repository.verifyPasswordChangeOtp(input)).resolves.toEqual({
        status: "rate_limited",
      });
    });

    it("更新密码并映射弱密码与新旧密码相同", async () => {
      const { repository } = createRepository();

      await expect(repository.updatePassword("newpass123")).resolves.toBe(
        "updated",
      );
      expect(auth.updateUser).toHaveBeenCalledWith({ password: "newpass123" });

      auth.updateUser.mockResolvedValueOnce({
        error: { code: "weak_password", message: "raw" },
      });
      await expect(repository.updatePassword("newpass123")).resolves.toBe(
        "weak_password",
      );

      auth.updateUser.mockResolvedValueOnce({
        error: { code: "same_password", message: "raw" },
      });
      await expect(repository.updatePassword("newpass123")).resolves.toBe(
        "same_password",
      );
    });

    it("未知错误或异常记录错误码后转换为 RepositoryError，不泄露原始消息", async () => {
      const { logger, repository } = createRepository();
      auth.signInWithOtp.mockResolvedValueOnce({
        error: { code: "unexpected_failure", message: "raw send" },
      });
      auth.verifyOtp.mockRejectedValueOnce(new Error("raw verify"));
      auth.updateUser.mockResolvedValueOnce({
        error: { code: "unexpected_failure", message: "raw update" },
      });

      await expect(
        repository.sendPasswordChangeOtp("user@example.test"),
      ).rejects.toMatchObject({
        code: "password_change_otp_send_failed",
        message: "验证码发送失败，请稍后再试。",
      });
      await expect(
        repository.verifyPasswordChangeOtp({
          email: "user@example.test",
          token: "123456",
        }),
      ).rejects.toBeInstanceOf(RepositoryError);
      await expect(
        repository.updatePassword("newpass123"),
      ).rejects.toMatchObject({ code: "password_update_failed" });

      expect(logger.error).toHaveBeenCalledWith(
        "[auth] password change OTP send failed",
        { code: "unexpected_failure" },
      );
      expect(logger.error).toHaveBeenCalledWith(
        "[auth] password change OTP verification crashed",
        { errorName: "Error" },
      );
      expect(JSON.stringify(vi.mocked(logger.error).mock.calls)).not.toMatch(
        /raw/,
      );
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

  describe("账号绑定", () => {
    const googleIdentityRow = {
      id: "google-sub-123",
      identity_data: {
        email: " user.google@gmail.test ",
        sub: "google-sub-123",
      },
      identity_id: "00000000-0000-4000-8000-000000000042",
      provider: "google",
      user_id: "00000000-0000-4000-8000-000000000031",
    };
    const googleIdentity = {
      email: "user.google@gmail.test",
      id: "google-sub-123",
      identityId: "00000000-0000-4000-8000-000000000042",
      provider: "google",
      userId: "00000000-0000-4000-8000-000000000031",
    };

    it("读取当前用户的登录身份并只保留安全字段", async () => {
      const { repository } = createRepository();
      auth.getUserIdentities.mockResolvedValue({
        data: {
          identities: [
            googleIdentityRow,
            {
              id: "email-row",
              identity_data: {},
              identity_id: "00000000-0000-4000-8000-000000000041",
              provider: "email",
              user_id: "00000000-0000-4000-8000-000000000031",
            },
          ],
        },
        error: null,
      });

      await expect(repository.listCurrentUserIdentities()).resolves.toEqual([
        googleIdentity,
        {
          email: null,
          id: "email-row",
          identityId: "00000000-0000-4000-8000-000000000041",
          provider: "email",
          userId: "00000000-0000-4000-8000-000000000031",
        },
      ]);
    });

    it("会话失效时返回 null，其他错误转换为 RepositoryError", async () => {
      const { logger, repository } = createRepository();
      auth.getUserIdentities.mockResolvedValueOnce({
        data: null,
        error: { name: "AuthSessionMissingError", message: "missing" },
      });

      await expect(repository.listCurrentUserIdentities()).resolves.toBeNull();

      auth.getUserIdentities.mockResolvedValueOnce({
        data: null,
        error: { code: "unexpected_failure", message: "private details" },
      });
      await expect(
        repository.listCurrentUserIdentities(),
      ).rejects.toMatchObject({
        code: "identity_load_failed",
        message: "账号绑定状态读取失败，请稍后重试。",
      });
      expect(
        JSON.stringify((logger.error as ReturnType<typeof vi.fn>).mock.calls),
      ).not.toContain("private details");
    });

    it("以 linkIdentity 开始绑定 Google 并返回授权地址", async () => {
      const { repository } = createRepository();

      await expect(
        repository.startGoogleIdentityLink(
          "https://kuranote.test/auth/callback?source=link",
        ),
      ).resolves.toBe("https://accounts.google.test/link");
      expect(auth.linkIdentity).toHaveBeenCalledWith({
        options: {
          redirectTo: "https://kuranote.test/auth/callback?source=link",
        },
        provider: "google",
      });
    });

    it("开始绑定失败时只记录错误码并转换为 RepositoryError", async () => {
      const { logger, repository } = createRepository();
      auth.linkIdentity.mockResolvedValueOnce({
        data: { provider: "google", url: null },
        error: { code: "manual_linking_disabled", message: "private details" },
      });

      await expect(
        repository.startGoogleIdentityLink("https://kuranote.test/cb"),
      ).rejects.toMatchObject({
        code: "google_identity_link_start_failed",
        message: "暂时无法连接 Google，请稍后再试。",
      });
      expect(logger.error).toHaveBeenCalledWith(
        "[auth] Google identity link start failed",
        { code: "manual_linking_disabled" },
      );

      auth.linkIdentity.mockRejectedValueOnce(new Error("network failed"));
      await expect(
        repository.startGoogleIdentityLink("https://kuranote.test/cb"),
      ).rejects.toBeInstanceOf(RepositoryError);
    });

    it("以 identity_id 解除绑定并映射 Supabase 稳定错误码", async () => {
      const { repository } = createRepository();

      await expect(repository.unlinkIdentity(googleIdentity)).resolves.toBe(
        "unlinked",
      );
      expect(auth.unlinkIdentity).toHaveBeenCalledWith(
        expect.objectContaining({
          identity_id: "00000000-0000-4000-8000-000000000042",
          provider: "google",
        }),
      );

      for (const [code, result] of [
        ["single_identity_not_deletable", "single_identity"],
        ["identity_not_found", "identity_not_found"],
        ["email_conflict_identity_not_deletable", "email_conflict"],
      ] as const) {
        auth.unlinkIdentity.mockResolvedValueOnce({
          data: null,
          error: { code, message: "private" },
        });
        await expect(repository.unlinkIdentity(googleIdentity)).resolves.toBe(
          result,
        );
      }
    });

    it("解除绑定的未知错误或异常转换为 RepositoryError", async () => {
      const { repository } = createRepository();
      auth.unlinkIdentity.mockResolvedValueOnce({
        data: null,
        error: { code: "unexpected_failure", message: "private" },
      });

      await expect(
        repository.unlinkIdentity(googleIdentity),
      ).rejects.toMatchObject({
        code: "identity_unlink_failed",
        message: "解除绑定失败，请稍后再试。",
      });

      auth.unlinkIdentity.mockRejectedValueOnce(new Error("network failed"));
      await expect(
        repository.unlinkIdentity(googleIdentity),
      ).rejects.toBeInstanceOf(RepositoryError);
    });
  });
});
