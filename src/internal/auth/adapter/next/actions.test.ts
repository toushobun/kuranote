// @vitest-environment node
import { beforeEach, describe, expect, it, vi } from "vitest";
import {
  checkRegisterEmailAvailability,
  loginWithRedirect,
  logout,
  requestRegisterOtp,
  startGoogleAuth,
  submitRegisterOtpWithRedirect,
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
  registerErrorMessages,
  registerOtpMessages,
} from "internal/auth/errors";
import { TurnstileConfigurationError } from "internal/auth/turnstileKeys";
const mocks = vi.hoisted(() => ({
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
  requestRegisterOtp: vi.fn(),
  startGoogleAuth: vi.fn(),
  submitRegisterOtp: vi.fn(),
}));
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
          checkRegisterEmailAvailability: mocks.checkRegisterEmailAvailability,
          getSession: mocks.getSession,
          login: mocks.login,
          logout: mocks.logout,
          requestRegisterOtp: mocks.requestRegisterOtp,
          startGoogleAuth: mocks.startGoogleAuth,
          submitRegisterOtp: mocks.submitRegisterOtp,
        },
      },
    });
    mocks.checkRegisterEmailAvailability.mockResolvedValue({ available: true });
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
      new AuthenticationError("invalid_credentials", "邮箱或密码不正确。"),
    );
    await expect(
      loginWithRedirect("/dashboard", {}, createLoginFormData()),
    ).resolves.toEqual({ error: "邮箱或密码不正确。" });
    expect(mocks.redirect).not.toHaveBeenCalled();
  });
  it("登录普通异常返回安全服务文案且不记录原始消息", async () => {
    const consoleError = vi
      .spyOn(console, "error")
      .mockImplementation(() => undefined);
    mocks.login.mockRejectedValue(new Error("private login details"));
    await expect(
      loginWithRedirect("/dashboard", {}, createLoginFormData()),
    ).resolves.toEqual({ error: "登录服务暂时不可用，请稍后重试。" });
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
      error: "这个邮箱已经注册过了，请直接登录或换一个邮箱。",
      reason: "email_exists",
    });
    mocks.checkRegisterEmailAvailability.mockRejectedValue(
      new ValidationError("email_invalid", "邮箱格式有误"),
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
    ).resolves.toEqual({ available: false, error: "服务异常，请稍后再试" });
    await expect(
      requestRegisterOtp({}, createRequestOtpFormData()),
    ).resolves.toEqual({
      error: "服务异常，请稍后再试",
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
      error: "服务异常，请稍后再试",
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
      success: "如果该邮箱可以注册，我们已发送验证码。请查收邮件。",
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
        "验证码发送过于频繁，请稍后再试",
        { details: { retryAfterSeconds: 42 } },
      ),
    );
    await expect(
      requestRegisterOtp({}, createRequestOtpFormData()),
    ).resolves.toEqual({
      error: "验证码发送过于频繁，请稍后再试",
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
