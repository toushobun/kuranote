// @vitest-environment node

import { beforeEach, describe, expect, it, vi } from "vitest";

import { turnstileTokenMaxLength } from "internal/auth/entity/auth";
import { registerOtpMessages } from "internal/auth/errors";
import type { AuthRepository } from "internal/auth/repository/authRepository";
import type { AuthSecurityRepository } from "internal/auth/repository/authSecurityRepository";
import type { TurnstileRepository } from "internal/auth/repository/turnstileRepository";
import { createAuthService } from "internal/auth/service/authService";
import {
  AuthenticationError,
  ConflictError,
  RateLimitError,
  RepositoryError,
  ValidationError,
} from "internal/shared/errors/appError";
import type { Logger } from "internal/shared/logging/logger";
import type { UserDisplayNameSyncService } from "internal/user";

const now = new Date("2026-07-19T12:00:00.000Z");
const userId = "00000000-0000-4000-8000-000000000031";
const authUser = {
  displayName: "山田太郎",
  email: "user@example.test",
  id: userId,
};

function minutesBefore(minutes: number): string {
  return new Date(now.getTime() - minutes * 60 * 1000).toISOString();
}

function createFixture() {
  const authRepository = {
    exchangeOAuthCode: vi.fn().mockResolvedValue(true),
    getCurrentUser: vi.fn().mockResolvedValue(authUser),
    resendSignUpOtp: vi.fn().mockResolvedValue({ ok: true }),
    signInWithPassword: vi.fn().mockResolvedValue(true),
    signOut: vi.fn().mockResolvedValue(undefined),
    signUp: vi.fn().mockResolvedValue({ ok: true }),
    startGoogleOAuth: vi
      .fn()
      .mockResolvedValue("https://accounts.google.test/oauth"),
    verifySignUpOtp: vi.fn().mockResolvedValue(true),
  };
  const authSecurityRepository = {
    countVerifyFailuresAfter: vi.fn().mockResolvedValue(0),
    findLatestSuccessfulSendAt: vi.fn().mockResolvedValue(minutesBefore(5)),
    isRegisterEmailAvailable: vi.fn().mockResolvedValue(true),
    listAvailabilityCheckTimes: vi.fn().mockResolvedValue([]),
    listSuccessfulSendTimes: vi.fn().mockResolvedValue([]),
    recordAttempt: vi.fn().mockResolvedValue(undefined),
  };
  const syncDisplayName = vi.fn().mockResolvedValue(undefined);
  const createUserDisplayNameSyncService = vi.fn(
    (): UserDisplayNameSyncService => ({ syncDisplayName }),
  );
  const turnstileRepository = {
    verify: vi.fn().mockResolvedValue(true),
  };
  const isGoogleAuthEnabled = vi.fn(() => true);
  const logger: Logger = { error: vi.fn(), info: vi.fn(), warn: vi.fn() };
  const service = createAuthService({
    authRepository: authRepository as unknown as AuthRepository,
    authSecurityRepository:
      authSecurityRepository as unknown as AuthSecurityRepository,
    createUserDisplayNameSyncService,
    isGoogleAuthEnabled,
    logger,
    now: () => now,
    turnstileRepository: turnstileRepository as unknown as TurnstileRepository,
  });

  return {
    authRepository,
    authSecurityRepository,
    createUserDisplayNameSyncService,
    isGoogleAuthEnabled,
    logger,
    service,
    syncDisplayName,
    turnstileRepository,
  };
}

beforeEach(() => vi.clearAllMocks());

describe("AuthService login / session", () => {
  it("登录字段为空时在 Service 独立校验且不调用 Repository", async () => {
    const fixture = createFixture();

    await expect(
      fixture.service.login({ email: "", password: "" }),
    ).rejects.toMatchObject({
      code: "login_fields_required",
      message: "请输入邮箱和密码。",
    });
    expect(fixture.authRepository.signInWithPassword).not.toHaveBeenCalled();
  });

  it("账号密码错误时抛出 AuthenticationError", async () => {
    const fixture = createFixture();
    fixture.authRepository.signInWithPassword.mockResolvedValue(false);

    await expect(
      fixture.service.login({
        email: "user@example.test",
        password: "wrong-password",
      }),
    ).rejects.toBeInstanceOf(AuthenticationError);
  });

  it("Session 读取和登出只通过 Auth Repository", async () => {
    const fixture = createFixture();

    await expect(fixture.service.getSession()).resolves.toEqual({
      authenticated: true,
      user: authUser,
    });
    await expect(fixture.service.logout()).resolves.toBeUndefined();
    expect(fixture.authRepository.signOut).toHaveBeenCalledOnce();
  });
});

describe("AuthService register email availability", () => {
  it("邮箱格式无效时不访问 service-role Repository", async () => {
    const fixture = createFixture();

    await expect(
      fixture.service.checkRegisterEmailAvailability({
        email: "not-email",
        ipHash: "ip-hash",
      }),
    ).rejects.toBeInstanceOf(ValidationError);
    expect(
      fixture.authSecurityRepository.isRegisterEmailAvailable,
    ).not.toHaveBeenCalled();
  });

  it("无法识别可信 IP 时直接拒绝并记录日志", async () => {
    const fixture = createFixture();

    await expect(
      fixture.service.checkRegisterEmailAvailability({
        email: "user@example.test",
        ipHash: null,
      }),
    ).rejects.toMatchObject({ code: "trusted_ip_unavailable" });
    expect(fixture.logger.warn).toHaveBeenCalledWith(
      "[auth] trusted IP hash is unavailable",
    );
  });

  it("命中每分钟 10 次限制时抛出带 Retry-After 的 RateLimitError", async () => {
    const fixture = createFixture();
    fixture.authSecurityRepository.listAvailabilityCheckTimes.mockResolvedValue(
      Array.from({ length: 10 }, (_, index) =>
        new Date(now.getTime() - (index + 1) * 1000).toISOString(),
      ),
    );

    await expect(
      fixture.service.checkRegisterEmailAvailability({
        email: "user@example.test",
        ipHash: "ip-hash",
      }),
    ).rejects.toMatchObject({
      code: "email_availability_rate_limited",
      details: { retryAfterSeconds: 50 },
    });
    expect(
      fixture.authSecurityRepository.isRegisterEmailAvailable,
    ).not.toHaveBeenCalled();
  });

  it("邮箱不可用也记录 availability_check success，避免泄露查询结果到记录类型", async () => {
    const fixture = createFixture();
    fixture.authSecurityRepository.isRegisterEmailAvailable.mockResolvedValue(
      false,
    );

    await expect(
      fixture.service.checkRegisterEmailAvailability({
        email: "user@example.test",
        ipHash: "ip-hash",
      }),
    ).resolves.toEqual({ available: false });
    expect(fixture.authSecurityRepository.recordAttempt).toHaveBeenCalledWith(
      expect.objectContaining({
        attemptType: "availability_check",
        result: "success",
      }),
    );
  });

  it("邮箱查询失败时尽力记录 failed 后继续抛出原应用错误", async () => {
    const fixture = createFixture();
    const error = new RepositoryError("email_check_failed", "检查失败");
    fixture.authSecurityRepository.isRegisterEmailAvailable.mockRejectedValue(
      error,
    );

    await expect(
      fixture.service.checkRegisterEmailAvailability({
        email: "user@example.test",
        ipHash: "ip-hash",
      }),
    ).rejects.toBe(error);
    expect(fixture.authSecurityRepository.recordAttempt).toHaveBeenCalledWith(
      expect.objectContaining({ result: "failed" }),
    );
  });
});

describe("AuthService requestRegisterOtp", () => {
  const validInput = {
    displayName: "山田太郎",
    email: "user@example.test",
    ipHash: "ip-hash",
    isResend: false,
    password: "password-1234",
    passwordConfirm: "password-1234",
    remoteIp: "203.0.113.10",
    turnstileToken: "turnstile-token",
  } as const;

  it("Turnstile token 超长时在访问限流库和外部验证前拒绝", async () => {
    const fixture = createFixture();

    await expect(
      fixture.service.requestRegisterOtp({
        ...validInput,
        turnstileToken: "x".repeat(turnstileTokenMaxLength + 1),
      }),
    ).rejects.toMatchObject({
      code: "turnstile_failed",
      message: registerOtpMessages.turnstileFailed,
    });
    expect(
      fixture.authSecurityRepository.listSuccessfulSendTimes,
    ).not.toHaveBeenCalled();
    expect(fixture.turnstileRepository.verify).not.toHaveBeenCalled();
  });

  it("最近 60 秒内已成功发送时返回精确冷却秒数并记录 blocked", async () => {
    const fixture = createFixture();
    fixture.authSecurityRepository.listSuccessfulSendTimes
      .mockResolvedValueOnce([minutesBefore(0.5)])
      .mockResolvedValueOnce([]);

    await expect(
      fixture.service.requestRegisterOtp(validInput),
    ).rejects.toMatchObject({
      code: "otp_send_rate_limited",
      details: { retryAfterSeconds: 30 },
    });
    expect(fixture.authSecurityRepository.recordAttempt).toHaveBeenCalledWith(
      expect.objectContaining({ attemptType: "send", result: "blocked" }),
    );
    expect(fixture.turnstileRepository.verify).not.toHaveBeenCalled();
  });

  it("Turnstile 失败时不检查邮箱或调用 Supabase Auth", async () => {
    const fixture = createFixture();
    fixture.turnstileRepository.verify.mockResolvedValue(false);

    await expect(
      fixture.service.requestRegisterOtp(validInput),
    ).rejects.toMatchObject({
      code: "turnstile_failed",
      message: registerOtpMessages.turnstileFailed,
    });
    expect(
      fixture.authSecurityRepository.isRegisterEmailAvailable,
    ).not.toHaveBeenCalled();
    expect(fixture.authRepository.signUp).not.toHaveBeenCalled();
  });

  it("首次发送前确认邮箱可用，成功后记录 send success", async () => {
    const fixture = createFixture();

    await expect(
      fixture.service.requestRegisterOtp(validInput),
    ).resolves.toEqual({ retryAfterSeconds: 60 });
    expect(
      fixture.authSecurityRepository.isRegisterEmailAvailable,
    ).toHaveBeenCalledWith("user@example.test");
    expect(fixture.authRepository.signUp).toHaveBeenCalledWith(
      expect.objectContaining({
        displayName: "山田太郎",
        email: "user@example.test",
      }),
    );
    expect(fixture.authSecurityRepository.recordAttempt).toHaveBeenCalledWith(
      expect.objectContaining({ attemptType: "send", result: "success" }),
    );
  });

  it("邮箱已存在时不调用 signUp", async () => {
    const fixture = createFixture();
    fixture.authSecurityRepository.isRegisterEmailAvailable.mockResolvedValue(
      false,
    );

    await expect(
      fixture.service.requestRegisterOtp(validInput),
    ).rejects.toMatchObject({ code: "email_exists" });
    expect(fixture.authRepository.signUp).not.toHaveBeenCalled();
  });

  it("重发只校验邮箱并调用 resend，不要求昵称密码", async () => {
    const fixture = createFixture();

    await fixture.service.requestRegisterOtp({
      ...validInput,
      displayName: "",
      isResend: true,
      password: "",
      passwordConfirm: "",
    });

    expect(
      fixture.authSecurityRepository.isRegisterEmailAvailable,
    ).not.toHaveBeenCalled();
    expect(fixture.authRepository.resendSignUpOtp).toHaveBeenCalledWith(
      "user@example.test",
    );
    expect(fixture.authRepository.signUp).not.toHaveBeenCalled();
  });

  it("Supabase 自身发送限流映射为单独错误码并记录 blocked", async () => {
    const fixture = createFixture();
    fixture.authRepository.signUp.mockResolvedValue({
      ok: false,
      reason: "rate_limited",
    });

    await expect(
      fixture.service.requestRegisterOtp(validInput),
    ).rejects.toMatchObject({
      code: "supabase_otp_send_rate_limited",
      details: { retryAfterSeconds: 60 },
      message: registerOtpMessages.rateLimited,
    });
    expect(fixture.authSecurityRepository.recordAttempt).toHaveBeenCalledWith(
      expect.objectContaining({ result: "blocked" }),
    );
  });
});

describe("AuthService submitRegisterOtp", () => {
  const validInput = {
    email: "user@example.test",
    ipHash: "ip-hash",
    token: "012345",
  } as const;

  it("验证码格式无效时不访问 OTP Repository", async () => {
    const fixture = createFixture();

    await expect(
      fixture.service.submitRegisterOtp({ ...validInput, token: "12345a" }),
    ).rejects.toMatchObject({ code: "otp_format_invalid" });
    expect(
      fixture.authSecurityRepository.findLatestSuccessfulSendAt,
    ).not.toHaveBeenCalled();
  });

  it("失败次数达到 5 次时阻断验证并记录 blocked", async () => {
    const fixture = createFixture();
    fixture.authSecurityRepository.countVerifyFailuresAfter.mockResolvedValue(
      5,
    );

    await expect(
      fixture.service.submitRegisterOtp(validInput),
    ).rejects.toMatchObject({
      code: "otp_too_many_attempts",
      details: { remainingAttempts: 0 },
    });
    expect(fixture.authRepository.verifySignUpOtp).not.toHaveBeenCalled();
    expect(fixture.authSecurityRepository.recordAttempt).toHaveBeenCalledWith(
      expect.objectContaining({ result: "blocked" }),
    );
  });

  it("验证码错误时记录失败并返回剩余次数", async () => {
    const fixture = createFixture();
    fixture.authSecurityRepository.countVerifyFailuresAfter.mockResolvedValue(
      2,
    );
    fixture.authRepository.verifySignUpOtp.mockResolvedValue(false);

    await expect(
      fixture.service.submitRegisterOtp(validInput),
    ).rejects.toMatchObject({
      code: "otp_invalid",
      details: { remainingAttempts: 2 },
    });
    expect(fixture.authSecurityRepository.recordAttempt).toHaveBeenCalledWith(
      expect.objectContaining({ result: "failed" }),
    );
  });

  it("验证成功但 Session 无用户时返回 session_invalid", async () => {
    const fixture = createFixture();
    fixture.authRepository.getCurrentUser.mockResolvedValue(null);

    await expect(
      fixture.service.submitRegisterOtp(validInput),
    ).rejects.toMatchObject({ code: "session_invalid" });
  });

  it("验证成功后通过 #481 的 UserDisplayNameSyncService 同步昵称", async () => {
    const fixture = createFixture();

    await expect(
      fixture.service.submitRegisterOtp(validInput),
    ).resolves.toEqual(authUser);
    expect(fixture.createUserDisplayNameSyncService).toHaveBeenCalledWith(
      userId,
    );
    expect(fixture.syncDisplayName).toHaveBeenCalledWith({
      displayName: "山田太郎",
      userId,
    });
  });

  it("用户 metadata 缺少昵称时不调用 User 模块", async () => {
    const fixture = createFixture();
    fixture.authRepository.getCurrentUser.mockResolvedValue({
      ...authUser,
      displayName: null,
    });

    await expect(
      fixture.service.submitRegisterOtp(validInput),
    ).rejects.toMatchObject({ code: "app_user_sync_failed" });
    expect(fixture.createUserDisplayNameSyncService).not.toHaveBeenCalled();
  });

  it("User 模块同步失败时统一转换为 app_user_sync_failed 并记录安全日志", async () => {
    const fixture = createFixture();
    fixture.syncDisplayName.mockRejectedValue(
      new RepositoryError("user_profile_update_failed", "update failed"),
    );

    await expect(
      fixture.service.submitRegisterOtp(validInput),
    ).rejects.toMatchObject({
      code: "app_user_sync_failed",
      message: registerOtpMessages.appUserSyncFailed,
    });
    expect(fixture.logger.error).toHaveBeenCalledWith(
      "[auth] display name sync after OTP verification failed",
      { errorName: "RepositoryError" },
    );
    expect(
      JSON.stringify(vi.mocked(fixture.logger.error).mock.calls),
    ).not.toContain("update failed");
  });
});

describe("AuthService Google OAuth", () => {
  it("未启用或 Origin 不可信时不调用 OAuth Repository", async () => {
    const fixture = createFixture();
    fixture.isGoogleAuthEnabled.mockReturnValue(false);

    await expect(
      fixture.service.startGoogleAuth({
        nextPath: "/dashboard",
        requestOrigin: "https://kuranote.test",
        source: "login",
      }),
    ).resolves.toMatchObject({ ok: false });

    fixture.isGoogleAuthEnabled.mockReturnValue(true);
    await expect(
      fixture.service.startGoogleAuth({
        nextPath: "/dashboard",
        requestOrigin: "https://user:pass@evil.test",
        source: "login",
      }),
    ).resolves.toMatchObject({ ok: false });
    expect(fixture.authRepository.startGoogleOAuth).not.toHaveBeenCalled();
  });

  it("生成 callback URL 并返回 provider URL", async () => {
    const fixture = createFixture();

    await expect(
      fixture.service.startGoogleAuth({
        nextPath: "/invite/token-123",
        requestOrigin: "https://kuranote.test",
        source: "register",
      }),
    ).resolves.toEqual({
      ok: true,
      providerUrl: "https://accounts.google.test/oauth",
    });
    expect(fixture.authRepository.startGoogleOAuth).toHaveBeenCalledWith(
      "https://kuranote.test/auth/callback?source=register&next=%2Finvite%2Ftoken-123",
    );
  });

  it("用户取消授权时返回固定错误页且不兑换 code", async () => {
    const fixture = createFixture();

    await expect(
      fixture.service.completeGoogleAuth({
        code: null,
        nextPath: "/invite/token-123",
        providerError: "access_denied",
        source: "login",
      }),
    ).resolves.toBe("/login?authError=cancelled&next=%2Finvite%2Ftoken-123");
    expect(fixture.authRepository.exchangeOAuthCode).not.toHaveBeenCalled();
  });

  it("授权 code 兑换成功后返回安全 nextPath", async () => {
    const fixture = createFixture();

    await expect(
      fixture.service.completeGoogleAuth({
        code: "oauth-code",
        nextPath: "https://evil.example",
        providerError: null,
        source: "login",
      }),
    ).resolves.toBe("/dashboard");
    expect(fixture.authRepository.exchangeOAuthCode).toHaveBeenCalledWith(
      "oauth-code",
    );
  });

  it("兑换失败时返回来源页面的固定错误码", async () => {
    const fixture = createFixture();
    fixture.authRepository.exchangeOAuthCode.mockResolvedValue(false);

    await expect(
      fixture.service.completeGoogleAuth({
        code: "oauth-code",
        nextPath: "/dashboard",
        providerError: null,
        source: "register",
      }),
    ).resolves.toBe("/register?authError=callback_failed&next=%2Fdashboard");
  });
});

it("使用具体错误类型区分认证、冲突、限流和仓储失败", () => {
  expect(new AuthenticationError("a", "a")).toBeInstanceOf(Error);
  expect(new ConflictError("c", "c")).toBeInstanceOf(Error);
  expect(new RateLimitError("r", "r")).toBeInstanceOf(Error);
  expect(new RepositoryError("x", "x")).toBeInstanceOf(Error);
});
