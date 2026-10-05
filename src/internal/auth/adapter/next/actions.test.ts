// @vitest-environment node
import { beforeEach, describe, expect, it, vi } from "vitest";
import {
  changePassword,
  checkRegisterEmailAvailability,
  loginWithRedirect,
  logout,
  requestPasswordChangeOtp,
  requestRegisterOtp,
  startGoogleAuth,
  startGoogleIdentityLink,
  submitRegisterOtpWithRedirect,
  unlinkGoogleIdentity,
} from "internal/auth/adapter/next/actions";
import {
  AuthenticationError,
  ConflictError,
  RateLimitError,
  RepositoryError,
  ValidationError,
  AuthorizationError,
} from "internal/shared/errors/appError";
import { googleAuthNextPathMaxLength } from "lib/auth/googleOAuth";
import {
  googleIdentityLinkMessages,
  loginErrorMessages,
  passwordChangeMessages,
  registerErrorMessages,
  registerOtpMessages,
} from "internal/auth/errors";
import { TurnstileConfigurationError } from "internal/auth/turnstileKeys";
const mocks = vi.hoisted(() => ({
  changePassword: vi.fn(),
  checkRegisterEmailAvailability: vi.fn(),
  createRequestContainer: vi.fn(),
  createServerRequestDependencies: vi.fn(),
  getSession: vi.fn(),
  headers: vi.fn(),
  login: vi.fn(),
  logout: vi.fn(),
  redirect: vi.fn((path: string) => {
    throw new Error(`NEXT_REDIRECT:${path}`);
  }),
  requestPasswordChangeOtp: vi.fn(),
  requestRegisterOtp: vi.fn(),
  revalidatePath: vi.fn(),
  startGoogleAuth: vi.fn(),
  startGoogleIdentityLink: vi.fn(),
  submitRegisterOtp: vi.fn(),
  unlinkGoogleIdentity: vi.fn(),
}));
vi.mock("next/cache", () => ({ revalidatePath: mocks.revalidatePath }));
vi.mock("next/headers", () => ({ headers: mocks.headers }));
vi.mock("next/navigation", () => ({ redirect: mocks.redirect }));
vi.mock("internal/shared/context/createServerRequestDependencies", () => ({
  createServerRequestDependencies: mocks.createServerRequestDependencies,
}));
vi.mock("internal/container", () => ({
  createRequestContainer: mocks.createRequestContainer,
}));
describe("auth Next actions", () => {
  function createLoginFormData() {
    const formData = new FormData();
    formData.set("email", "user@example.test");
    formData.set("password", "password-1234");
    return formData;
  }
  function createRequestOtpFormData(overrides: Record<string, string> = {}) {
    const formData = new FormData();
    formData.set("displayName", "山田太郎");
    formData.set("email", "user@example.test");
    formData.set("password", "password-1234");
    formData.set("passwordConfirm", "password-1234");
    formData.set("turnstileToken", "turnstile-token");
    for (const [key, value] of Object.entries(overrides))
      formData.set(key, value);
    return formData;
  }
  function createSubmitOtpFormData(overrides: Record<string, string> = {}) {
    const formData = new FormData();
    formData.set("email", "user@example.test");
    formData.set("token", "012345");
    for (const [key, value] of Object.entries(overrides))
      formData.set(key, value);
    return formData;
  }
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.headers.mockResolvedValue(
      new Headers({
        origin: "https://kuranote.test",
        "x-real-ip": "203.0.113.10",
      }),
    );
    mocks.createServerRequestDependencies.mockResolvedValue({});
    mocks.createRequestContainer.mockReturnValue({
      auth: {
        service: {
          changePassword: mocks.changePassword,
          checkRegisterEmailAvailability: mocks.checkRegisterEmailAvailability,
          getSession: mocks.getSession,
          login: mocks.login,
          logout: mocks.logout,
          requestPasswordChangeOtp: mocks.requestPasswordChangeOtp,
          requestRegisterOtp: mocks.requestRegisterOtp,
          startGoogleAuth: mocks.startGoogleAuth,
          submitRegisterOtp: mocks.submitRegisterOtp,
        },
      },
    });
    mocks.changePassword.mockResolvedValue(undefined);
    mocks.checkRegisterEmailAvailability.mockResolvedValue({ available: true });
    mocks.requestPasswordChangeOtp.mockResolvedValue({ retryAfterSeconds: 60 });
    mocks.login.mockResolvedValue(undefined);
    mocks.logout.mockResolvedValue(undefined);
    mocks.requestRegisterOtp.mockResolvedValue({ retryAfterSeconds: 60 });
    mocks.startGoogleAuth.mockResolvedValue({
      ok: true,
      providerUrl: "https://accounts.google.test/oauth",
    });
    mocks.submitRegisterOtp.mockResolvedValue({
      displayName: "山田太郎",
      email: "user@example.test",
      id: "user-1",
    });
  });
  it("登录成功后跳转安全 nextPath，不安全地址退回首页", async () => {
    await expect(
      loginWithRedirect("/invite/token", {}, createLoginFormData()),
    ).rejects.toThrow("NEXT_REDIRECT:/invite/token");
    expect(mocks.login).toHaveBeenCalledWith({
      email: "user@example.test",
      password: "password-1234",
    });
    await expect(
      loginWithRedirect("https://evil.example", {}, createLoginFormData()),
    ).rejects.toThrow("NEXT_REDIRECT:/dashboard");
  });
  it("登录应用错误返回现有表单错误结构", async () => {
    mocks.login.mockRejectedValue(
      new AuthenticationError(
        "invalid_credentials",
        loginErrorMessages.invalidCredentials,
      ),
    );
    await expect(
      loginWithRedirect("/dashboard", {}, createLoginFormData()),
    ).resolves.toEqual({ error: loginErrorMessages.invalidCredentials });
    expect(mocks.redirect).not.toHaveBeenCalled();
  });
  it("登录普通异常返回安全服务文案且不记录原始消息", async () => {
    const consoleError = vi
      .spyOn(console, "error")
      .mockImplementation(() => undefined);
    mocks.login.mockRejectedValue(new Error("private login details"));
    await expect(
      loginWithRedirect("/dashboard", {}, createLoginFormData()),
    ).resolves.toEqual({ error: loginErrorMessages.serviceUnavailable });
    expect(JSON.stringify(consoleError.mock.calls)).not.toContain(
      "private login details",
    );
    consoleError.mockRestore();
  });
  it("邮箱可用性保持现有 available / reason 结构", async () => {
    mocks.checkRegisterEmailAvailability.mockResolvedValue({
      available: false,
    });
    await expect(
      checkRegisterEmailAvailability("user@example.test"),
    ).resolves.toEqual({
      available: false,
      error: registerErrorMessages.duplicateEmail,
      reason: "email_exists",
    });
    mocks.checkRegisterEmailAvailability.mockRejectedValue(
      new ValidationError(
        "email_invalid",
        registerErrorMessages.emailFormatInvalid,
      ),
    );
    await expect(checkRegisterEmailAvailability("not-email")).resolves.toEqual({
      available: false,
    });
  });
  it("邮箱检查和 OTP 普通异常保持原有安全降级结构", async () => {
    const consoleError = vi
      .spyOn(console, "error")
      .mockImplementation(() => undefined);
    mocks.checkRegisterEmailAvailability.mockRejectedValueOnce(
      new Error("private availability details"),
    );
    mocks.requestRegisterOtp.mockRejectedValueOnce(
      new Error("private request details"),
    );
    mocks.submitRegisterOtp.mockRejectedValueOnce(
      new Error("private verify details"),
    );
    await expect(
      checkRegisterEmailAvailability("user@example.test"),
    ).resolves.toEqual({
      available: false,
      error: registerOtpMessages.serviceError,
    });
    await expect(
      requestRegisterOtp({}, createRequestOtpFormData()),
    ).resolves.toEqual({
      error: registerOtpMessages.serviceError,
      resetTurnstile: true,
      status: "unknown_error",
    });
    await expect(
      submitRegisterOtpWithRedirect(
        "/dashboard",
        {},
        createSubmitOtpFormData(),
      ),
    ).resolves.toEqual({
      error: registerOtpMessages.serviceError,
      status: "unknown_error",
    });
    expect(JSON.stringify(consoleError.mock.calls)).not.toContain("private");
    consoleError.mockRestore();
  });
  it("OTP 发送成功保持 cooldown、Turnstile 重置和成功文案", async () => {
    await expect(
      requestRegisterOtp({}, createRequestOtpFormData()),
    ).resolves.toEqual({
      resetTurnstile: true,
      retryAfterSeconds: 60,
      status: "success",
      success: registerOtpMessages.success,
    });
    expect(mocks.requestRegisterOtp).toHaveBeenCalledWith(
      expect.objectContaining({
        displayName: "山田太郎",
        email: "user@example.test",
        ipHash: expect.stringMatching(/^[a-f0-9]{64}$/),
        remoteIp: "203.0.113.10",
      }),
    );
  });
  it("OTP 应用限流保留 retryAfterSeconds 和 rate_limited 状态", async () => {
    mocks.requestRegisterOtp.mockRejectedValue(
      new RateLimitError(
        "otp_send_rate_limited",
        registerOtpMessages.rateLimited,
        { details: { retryAfterSeconds: 42 } },
      ),
    );
    await expect(
      requestRegisterOtp({}, createRequestOtpFormData()),
    ).resolves.toEqual({
      error: registerOtpMessages.rateLimited,
      resetTurnstile: true,
      retryAfterSeconds: 42,
      status: "rate_limited",
    });
  });
  it("邮箱冲突和弱密码映射为现有 OTP 表单状态", async () => {
    mocks.requestRegisterOtp.mockRejectedValueOnce(
      new ConflictError("email_exists", "邮箱已存在"),
    );
    await expect(
      requestRegisterOtp({}, createRequestOtpFormData()),
    ).resolves.toEqual({
      error: "邮箱已存在",
      resetTurnstile: true,
      status: "email_unavailable",
    });
    mocks.requestRegisterOtp.mockRejectedValueOnce(
      new ValidationError("weak_password", "密码太弱", {
        details: { resetPassword: true },
      }),
    );
    await expect(
      requestRegisterOtp({}, createRequestOtpFormData()),
    ).resolves.toEqual({
      error: "密码太弱",
      resetPassword: true,
      resetTurnstile: true,
      status: "validation_error",
    });
  });
  it("OTP 校验成功保留邀请回跳，Session 无效时保留 email 和 next", async () => {
    await expect(
      submitRegisterOtpWithRedirect(
        "/invite/token",
        {},
        createSubmitOtpFormData(),
      ),
    ).resolves.toEqual({
      redirectTo: "/invite/token",
      status: "success",
      success: "注册完成。",
    });
    mocks.submitRegisterOtp.mockRejectedValue(
      new AuthenticationError("session_invalid", "invalid"),
    );
    await expect(
      submitRegisterOtpWithRedirect(
        "/invite/token",
        {},
        createSubmitOtpFormData(),
      ),
    ).resolves.toEqual({
      redirectTo: "/login?email=user%40example.test&next=%2Finvite%2Ftoken",
      status: "session_invalid",
    });
  });
  it("OTP 错误和同步失败保持现有状态字段", async () => {
    mocks.submitRegisterOtp.mockRejectedValueOnce(
      new AuthenticationError("otp_invalid", "验证码错误", {
        details: { remainingAttempts: 3 },
      }),
    );
    await expect(
      submitRegisterOtpWithRedirect(
        "/dashboard",
        {},
        createSubmitOtpFormData(),
      ),
    ).resolves.toEqual({
      error: "验证码错误",
      remainingAttempts: 3,
      status: "otp_invalid",
    });
    mocks.submitRegisterOtp.mockRejectedValueOnce(
      new RepositoryError("app_user_sync_failed", "资料同步失败"),
    );
    await expect(
      submitRegisterOtpWithRedirect(
        "/dashboard",
        {},
        createSubmitOtpFormData(),
      ),
    ).resolves.toEqual({
      error: "资料同步失败",
      status: "app_user_sync_failed",
    });
  });
  it("Google OAuth 成功和失败都使用 Service 返回的安全跳转地址", async () => {
    await expect(startGoogleAuth("login", "/invite/token")).rejects.toThrow(
      "NEXT_REDIRECT:https://accounts.google.test/oauth",
    );
    mocks.startGoogleAuth.mockResolvedValue({
      failureHref: "/login?authError=start_failed&next=%2Fdashboard",
      ok: false,
    });
    await expect(
      startGoogleAuth("login", "https://evil.example"),
    ).rejects.toThrow(
      "NEXT_REDIRECT:/login?authError=start_failed&next=%2Fdashboard",
    );
  });
  it("Google OAuth RepositoryError 退回固定失败页", async () => {
    mocks.startGoogleAuth.mockRejectedValue(
      new RepositoryError("google_auth_start_failed", "service failed"),
    );
    await expect(startGoogleAuth("register", "/dashboard")).rejects.toThrow(
      "NEXT_REDIRECT:/register?authError=start_failed&next=%2Fdashboard",
    );
  });
  it("Google OAuth 普通异常也退回固定失败页", async () => {
    const consoleError = vi
      .spyOn(console, "error")
      .mockImplementation(() => undefined);
    mocks.startGoogleAuth.mockRejectedValue(new Error("private oauth details"));
    await expect(startGoogleAuth("login", "/dashboard")).rejects.toThrow(
      "NEXT_REDIRECT:/login?authError=start_failed&next=%2Fdashboard",
    );
    expect(JSON.stringify(consoleError.mock.calls)).not.toContain(
      "private oauth details",
    );
    consoleError.mockRestore();
  });
  it("登出调用 Service 后跳转登录页", async () => {
    await expect(logout()).rejects.toThrow("NEXT_REDIRECT:/login");
    expect(mocks.logout).toHaveBeenCalledOnce();
  });
  it("登出普通异常仍跳转登录页", async () => {
    const consoleError = vi
      .spyOn(console, "error")
      .mockImplementation(() => undefined);
    mocks.logout.mockRejectedValue(new Error("private logout details"));
    await expect(logout()).rejects.toThrow("NEXT_REDIRECT:/login");
    expect(JSON.stringify(consoleError.mock.calls)).not.toContain(
      "private logout details",
    );
    consoleError.mockRestore();
  });
  describe("修改密码 Server Action", () => {
    function createChangePasswordFormData() {
      const formData = new FormData();
      formData.set("token", "123456");
      formData.set("password", "newpass123");
      formData.set("passwordConfirm", "newpass123");
      return formData;
    }

    it("发送验证码成功时返回冷却秒数和成功文案", async () => {
      await expect(requestPasswordChangeOtp()).resolves.toEqual({
        retryAfterSeconds: 60,
        success: "验证码已发送，请查收邮件。",
        successKey: expect.any(String),
      });
    });

    it("发送限流时返回 Service 文案和 retryAfterSeconds", async () => {
      mocks.requestPasswordChangeOtp.mockRejectedValue(
        new RateLimitError(
          "password_change_otp_send_rate_limited",
          passwordChangeMessages.otpSendRateLimited,
          { details: { retryAfterSeconds: 60 } },
        ),
      );

      await expect(requestPasswordChangeOtp()).resolves.toEqual({
        error: passwordChangeMessages.otpSendRateLimited,
        errorKey: expect.any(String),
        retryAfterSeconds: 60,
      });
    });

    it("发送时普通异常只返回安全文案且日志不泄露原始消息", async () => {
      const consoleError = vi
        .spyOn(console, "error")
        .mockImplementation(() => undefined);
      mocks.requestPasswordChangeOtp.mockRejectedValue(
        new Error("raw failure"),
      );

      await expect(requestPasswordChangeOtp()).resolves.toEqual({
        error: passwordChangeMessages.otpSendFailed,
        errorKey: expect.any(String),
      });
      expect(JSON.stringify(consoleError.mock.calls)).not.toContain(
        "raw failure",
      );
      consoleError.mockRestore();
    });

    it("把表单值原样交给 Service，成功时返回成功文案", async () => {
      await expect(
        changePassword({}, createChangePasswordFormData()),
      ).resolves.toEqual({
        success: "密码已修改。",
        successKey: expect.any(String),
      });
      expect(mocks.changePassword).toHaveBeenCalledWith({
        password: "newpass123",
        passwordConfirm: "newpass123",
        token: "123456",
      });
    });

    it("应用错误返回 Service 的中文文案", async () => {
      mocks.changePassword.mockRejectedValue(
        new ValidationError(
          "password_change_otp_invalid",
          passwordChangeMessages.invalidOtp,
        ),
      );

      await expect(
        changePassword({}, createChangePasswordFormData()),
      ).resolves.toEqual({
        error: passwordChangeMessages.invalidOtp,
        errorKey: expect.any(String),
      });
    });

    it("修改时普通异常只返回安全文案", async () => {
      const consoleError = vi
        .spyOn(console, "error")
        .mockImplementation(() => undefined);
      mocks.changePassword.mockRejectedValue(new Error("raw failure"));

      await expect(
        changePassword({}, createChangePasswordFormData()),
      ).resolves.toEqual({
        error: passwordChangeMessages.passwordUpdateFailed,
        errorKey: expect.any(String),
      });
      expect(JSON.stringify(consoleError.mock.calls)).not.toContain(
        "raw failure",
      );
      consoleError.mockRestore();
    });
  });
});

describe("startGoogleAuth nextPath \u8FB9\u754C", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.headers.mockResolvedValue(
      new Headers({ origin: "https://kuranote.test" }),
    );
    mocks.createServerRequestDependencies.mockResolvedValue({});
    mocks.createRequestContainer.mockReturnValue({
      auth: { service: { startGoogleAuth: mocks.startGoogleAuth } },
    });
    mocks.startGoogleAuth.mockResolvedValue({
      ok: true,
      providerUrl: "https://accounts.google.test/oauth",
    });
  });
  it("Server Action 会在调用 Service 前把超长 nextPath 退回首页", async () => {
    const oversizedNextPath = `/${"x".repeat(googleAuthNextPathMaxLength)}`;
    await expect(startGoogleAuth("login", oversizedNextPath)).rejects.toThrow(
      "NEXT_REDIRECT:https://accounts.google.test/oauth",
    );
    expect(mocks.startGoogleAuth).toHaveBeenCalledWith({
      nextPath: "/dashboard",
      requestOrigin: "https://kuranote.test",
      source: "login",
    });
  });
});
describe("requestRegisterOtp \u6CE8\u518C\u5931\u8D25\u6587\u6848", () => {
  function createRegisterFormData() {
    const formData = new FormData();
    formData.set("displayName", "山田太郎");
    formData.set("email", "user@example.test");
    formData.set("password", "password-1234");
    formData.set("passwordConfirm", "password-1234");
    formData.set("turnstileToken", "turnstile-token");
    return formData;
  }
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.headers.mockResolvedValue(
      new Headers({
        origin: "https://kuranote.test",
        "x-real-ip": "203.0.113.10",
      }),
    );
    mocks.createServerRequestDependencies.mockResolvedValue({});
    mocks.createRequestContainer.mockReturnValue({
      auth: { service: { requestRegisterOtp: mocks.requestRegisterOtp } },
    });
  });
  it("注册关闭和注册兜底失败时保留 Service 的安全文案", async () => {
    mocks.requestRegisterOtp.mockRejectedValueOnce(
      new AuthorizationError(
        "signup_disabled",
        registerErrorMessages.signupDisabled,
      ),
    );
    await expect(
      requestRegisterOtp({}, createRegisterFormData()),
    ).resolves.toEqual({
      error: registerErrorMessages.signupDisabled,
      resetTurnstile: true,
      status: "unknown_error",
    });
    mocks.requestRegisterOtp.mockRejectedValueOnce(
      new ValidationError("register_failed", registerErrorMessages.fallback),
    );
    await expect(
      requestRegisterOtp({}, createRegisterFormData()),
    ).resolves.toEqual({
      error: registerErrorMessages.fallback,
      resetTurnstile: true,
      status: "unknown_error",
    });
  });
  it("未列入白名单的应用错误继续返回通用安全文案", async () => {
    mocks.requestRegisterOtp.mockRejectedValue(
      new RepositoryError("unexpected_auth_error", "不应透出的内部文案"),
    );
    await expect(
      requestRegisterOtp({}, createRegisterFormData()),
    ).resolves.toEqual({
      error: registerOtpMessages.serviceError,
      resetTurnstile: true,
      status: "unknown_error",
    });
  });
  it("Turnstile 配置错误只返回通用文案且日志不泄露配置细节", async () => {
    const consoleError = vi
      .spyOn(console, "error")
      .mockImplementation(() => undefined);
    mocks.requestRegisterOtp.mockRejectedValue(
      new TurnstileConfigurationError(),
    );
    await expect(
      requestRegisterOtp({}, createRegisterFormData()),
    ).resolves.toEqual({
      error: registerOtpMessages.serviceError,
      resetTurnstile: true,
      status: "unknown_error",
    });
    expect(consoleError).toHaveBeenCalledWith(
      "[auth] OTP request action failed unexpectedly",
      { errorName: "TurnstileConfigurationError" },
    );
    expect(JSON.stringify(consoleError.mock.calls)).not.toContain(
      "TURNSTILE_SECRET_KEY",
    );
    consoleError.mockRestore();
  });
});
describe("Google 账号绑定 Server Action", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.headers.mockResolvedValue(
      new Headers({ origin: "https://kuranote.test" }),
    );
    mocks.createServerRequestDependencies.mockResolvedValue({});
    mocks.createRequestContainer.mockReturnValue({
      auth: {
        service: {
          startGoogleIdentityLink: mocks.startGoogleIdentityLink,
          unlinkGoogleIdentity: mocks.unlinkGoogleIdentity,
        },
      },
    });
    mocks.startGoogleIdentityLink.mockResolvedValue({
      providerUrl: "https://accounts.google.test/link",
    });
    mocks.unlinkGoogleIdentity.mockResolvedValue(undefined);
  });

  it("开始绑定时把请求 Origin 交给 Service 并跳转到 Google 授权页", async () => {
    await expect(startGoogleIdentityLink()).rejects.toThrow(
      "NEXT_REDIRECT:https://accounts.google.test/link",
    );
    expect(mocks.startGoogleIdentityLink).toHaveBeenCalledWith({
      requestOrigin: "https://kuranote.test",
    });
  });

  it("开始绑定的应用错误返回 Service 文案且不跳转", async () => {
    mocks.startGoogleIdentityLink.mockRejectedValue(
      new ConflictError(
        "google_identity_already_linked",
        googleIdentityLinkMessages.alreadyLinked,
      ),
    );

    await expect(startGoogleIdentityLink()).resolves.toEqual({
      error: googleIdentityLinkMessages.alreadyLinked,
      errorKey: expect.any(String),
    });
    expect(mocks.redirect).not.toHaveBeenCalled();
  });

  it("开始绑定的普通异常只返回安全文案且日志不泄露原始消息", async () => {
    const consoleError = vi
      .spyOn(console, "error")
      .mockImplementation(() => undefined);
    mocks.startGoogleIdentityLink.mockRejectedValue(
      new Error("private provider details"),
    );

    await expect(startGoogleIdentityLink()).resolves.toEqual({
      error: googleIdentityLinkMessages.startFailed,
      errorKey: expect.any(String),
    });
    expect(JSON.stringify(consoleError.mock.calls)).not.toContain(
      "private provider details",
    );
    consoleError.mockRestore();
  });

  it("解除绑定成功后刷新个人主页并返回成功状态", async () => {
    await expect(unlinkGoogleIdentity()).resolves.toEqual({
      success: "已解除 Google 绑定。",
      successKey: expect.any(String),
    });
    expect(mocks.revalidatePath).toHaveBeenCalledWith("/settings/profile");
  });

  it("解除绑定的应用错误返回 Service 文案且不刷新页面", async () => {
    mocks.unlinkGoogleIdentity.mockRejectedValue(
      new ValidationError(
        "google_identity_only_login_identity",
        googleIdentityLinkMessages.onlyLoginIdentity,
      ),
    );

    await expect(unlinkGoogleIdentity()).resolves.toEqual({
      error: googleIdentityLinkMessages.onlyLoginIdentity,
      errorKey: expect.any(String),
    });
    expect(mocks.revalidatePath).not.toHaveBeenCalled();
  });

  it("解除绑定的普通异常只返回安全文案", async () => {
    const consoleError = vi
      .spyOn(console, "error")
      .mockImplementation(() => undefined);
    mocks.unlinkGoogleIdentity.mockRejectedValue(new Error("private details"));

    await expect(unlinkGoogleIdentity()).resolves.toEqual({
      error: googleIdentityLinkMessages.unlinkFailed,
      errorKey: expect.any(String),
    });
    expect(JSON.stringify(consoleError.mock.calls)).not.toContain(
      "private details",
    );
    consoleError.mockRestore();
  });
});
