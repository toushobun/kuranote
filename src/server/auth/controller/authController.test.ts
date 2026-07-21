// @vitest-environment node

import { OpenAPIHono } from "@hono/zod-openapi";
import { beforeEach, describe, expect, it, vi } from "vitest";

import type { AppEnv } from "server/appEnv";
import {
  checkRegisterEmailAvailabilityHandler,
  checkRegisterEmailAvailabilityRoute,
  getSessionHandler,
  getSessionRoute,
  loginHandler,
  loginRoute,
  logoutHandler,
  logoutRoute,
  registerHandler,
  registerRoute,
  requestRegisterOtpHandler,
  requestRegisterOtpRoute,
  startGoogleAuthHandler,
  startGoogleAuthRoute,
  submitRegisterOtpHandler,
  submitRegisterOtpRoute,
} from "server/auth/controller/authController";
import { hashAuthOtpValue } from "server/auth/otpHash";
import type { RequestContainer } from "server/container";
import { errorHandlingMiddleware } from "server/shared/http/errorResponse";

function createAuthService(
  overrides: Partial<RequestContainer["auth"]["service"]> = {},
): RequestContainer["auth"]["service"] {
  return {
    checkRegisterEmailAvailability: vi.fn(),
    completeGoogleAuth: vi.fn(),
    getSession: vi.fn().mockResolvedValue({ authenticated: false, user: null }),
    login: vi.fn(),
    logout: vi.fn(),
    requestRegisterOtp: vi.fn().mockResolvedValue({ retryAfterSeconds: 60 }),
    startGoogleAuth: vi.fn(),
    submitRegisterOtp: vi.fn(),
    ...overrides,
  } as RequestContainer["auth"]["service"];
}

function createContainer(
  service: RequestContainer["auth"]["service"],
): RequestContainer {
  return {
    auth: { service },
    category: {} as RequestContainer["category"],
    ledger: {} as RequestContainer["ledger"],
    merchant: {} as RequestContainer["merchant"],
    user: {} as RequestContainer["user"],
  };
}

function createControllerApp(service: RequestContainer["auth"]["service"]) {
  const app = new OpenAPIHono<AppEnv>();
  app.use("*", async (c, next) => {
    c.set("container", createContainer(service));
    c.set("requestId", "request-1");
    c.set("requestDependencies", {
      auth: { email: null, isAuthenticated: false, userId: null },
      logger: { error: vi.fn(), info: vi.fn(), warn: vi.fn() },
      requestId: "request-1",
      supabase: {} as never,
    });
    await next();
  });
  app.onError(errorHandlingMiddleware);
  app.openapi(loginRoute, loginHandler);
  app.openapi(registerRoute, registerHandler);
  app.openapi(
    checkRegisterEmailAvailabilityRoute,
    checkRegisterEmailAvailabilityHandler,
  );
  app.openapi(requestRegisterOtpRoute, requestRegisterOtpHandler);
  app.openapi(submitRegisterOtpRoute, submitRegisterOtpHandler);
  app.openapi(startGoogleAuthRoute, startGoogleAuthHandler);
  app.openapi(getSessionRoute, getSessionHandler);
  app.openapi(logoutRoute, logoutHandler);
  return app;
}

const jsonHeaders = {
  "content-type": "application/json",
  "x-real-ip": "203.0.113.10",
};

beforeEach(() => vi.clearAllMocks());

describe("auth controller", () => {
  it("登录 Controller 传递 Schema 规范化后的参数并返回 200", async () => {
    const login = vi.fn();
    const app = createControllerApp(createAuthService({ login }));

    const response = await app.request("https://kuranote.test/login", {
      body: JSON.stringify({
        email: "  user@example.test  ",
        password: "password-1234",
      }),
      headers: jsonHeaders,
      method: "POST",
    });

    expect(response.status).toBe(200);
    expect(login).toHaveBeenCalledWith({
      email: "user@example.test",
      password: "password-1234",
    });
    expect(await response.json()).toEqual({ ok: true });
  });

  it("注册 Controller 统一复用 OTP 安全流程并返回 201", async () => {
    const requestRegisterOtp = vi
      .fn()
      .mockResolvedValue({ retryAfterSeconds: 60 });
    const app = createControllerApp(createAuthService({ requestRegisterOtp }));

    const response = await app.request("https://kuranote.test/register", {
      body: JSON.stringify({
        displayName: "山田太郎",
        email: "user@example.test",
        password: "password-1234",
        passwordConfirm: "password-1234",
        turnstileToken: "turnstile-token",
      }),
      headers: jsonHeaders,
      method: "POST",
    });

    expect(response.status).toBe(201);
    expect(requestRegisterOtp).toHaveBeenCalledWith({
      displayName: "山田太郎",
      email: "user@example.test",
      ipHash: hashAuthOtpValue("203.0.113.10"),
      isResend: false,
      password: "password-1234",
      passwordConfirm: "password-1234",
      remoteIp: "203.0.113.10",
      turnstileToken: "turnstile-token",
    });
    expect(await response.json()).toEqual({
      retryAfterSeconds: 60,
      sent: true,
    });
  });

  it("注册缺少 Turnstile token 时由 Schema 返回 400", async () => {
    const requestRegisterOtp = vi.fn();
    const app = createControllerApp(createAuthService({ requestRegisterOtp }));

    const response = await app.request("https://kuranote.test/register", {
      body: JSON.stringify({
        displayName: "山田太郎",
        email: "user@example.test",
        password: "password-1234",
        passwordConfirm: "password-1234",
      }),
      headers: jsonHeaders,
      method: "POST",
    });

    expect(response.status).toBe(400);
    expect(requestRegisterOtp).not.toHaveBeenCalled();
  });

  it("邮箱可用性 Controller 只传邮箱和哈希后的可信 IP", async () => {
    const checkRegisterEmailAvailability = vi
      .fn()
      .mockResolvedValue({ available: true });
    const app = createControllerApp(
      createAuthService({ checkRegisterEmailAvailability }),
    );

    const response = await app.request(
      "https://kuranote.test/register/email-availability",
      {
        body: JSON.stringify({ email: "user@example.test" }),
        headers: jsonHeaders,
        method: "POST",
      },
    );

    expect(response.status).toBe(200);
    expect(checkRegisterEmailAvailability).toHaveBeenCalledWith({
      email: "user@example.test",
      ipHash: hashAuthOtpValue("203.0.113.10"),
    });
  });

  it("OTP 请求端点固定使用重发语义", async () => {
    const requestRegisterOtp = vi
      .fn()
      .mockResolvedValue({ retryAfterSeconds: 60 });
    const app = createControllerApp(createAuthService({ requestRegisterOtp }));

    const response = await app.request(
      "https://kuranote.test/register/otp/request",
      {
        body: JSON.stringify({
          email: "user@example.test",
          turnstileToken: "turnstile-token",
        }),
        headers: jsonHeaders,
        method: "POST",
      },
    );

    expect(response.status).toBe(200);
    expect(requestRegisterOtp).toHaveBeenCalledWith({
      displayName: "",
      email: "user@example.test",
      ipHash: hashAuthOtpValue("203.0.113.10"),
      isResend: true,
      password: "",
      passwordConfirm: "",
      remoteIp: "203.0.113.10",
      turnstileToken: "turnstile-token",
    });
    expect(await response.json()).toEqual({
      retryAfterSeconds: 60,
      sent: true,
    });
  });

  it("OTP 重发端点忽略首次注册字段并保持重发语义", async () => {
    const requestRegisterOtp = vi
      .fn()
      .mockResolvedValue({ retryAfterSeconds: 60 });
    const app = createControllerApp(createAuthService({ requestRegisterOtp }));

    const response = await app.request(
      "https://kuranote.test/register/otp/request",
      {
        body: JSON.stringify({
          displayName: "山田太郎",
          email: "user@example.test",
          isResend: false,
          password: "password-1234",
          passwordConfirm: "password-1234",
          turnstileToken: "turnstile-token",
        }),
        headers: jsonHeaders,
        method: "POST",
      },
    );

    expect(response.status).toBe(200);
    expect(requestRegisterOtp).toHaveBeenCalledWith(
      expect.objectContaining({
        displayName: "",
        isResend: true,
        password: "",
        passwordConfirm: "",
      }),
    );
  });

  it("OTP 校验 Controller 传递 token 和 IP hash，成功返回 200", async () => {
    const submitRegisterOtp = vi.fn();
    const app = createControllerApp(createAuthService({ submitRegisterOtp }));

    const response = await app.request(
      "https://kuranote.test/register/otp/verify",
      {
        body: JSON.stringify({
          email: "user@example.test",
          token: "012345",
        }),
        headers: jsonHeaders,
        method: "POST",
      },
    );

    expect(response.status).toBe(200);
    expect(submitRegisterOtp).toHaveBeenCalledWith({
      email: "user@example.test",
      ipHash: hashAuthOtpValue("203.0.113.10"),
      token: "012345",
    });
  });

  it("Google OAuth Controller 使用 Origin 并返回 provider URL", async () => {
    const startGoogleAuth = vi.fn().mockResolvedValue({
      ok: true,
      providerUrl: "https://accounts.google.test/oauth",
    });
    const app = createControllerApp(createAuthService({ startGoogleAuth }));

    const response = await app.request(
      "https://kuranote.test/oauth/google/start",
      {
        body: JSON.stringify({ nextPath: "/dashboard", source: "login" }),
        headers: { ...jsonHeaders, origin: "https://kuranote.test" },
        method: "POST",
      },
    );

    expect(response.status).toBe(200);
    expect(startGoogleAuth).toHaveBeenCalledWith({
      nextPath: "/dashboard",
      requestOrigin: "https://kuranote.test",
      source: "login",
    });
    expect(await response.json()).toEqual({
      redirectTo: "https://accounts.google.test/oauth",
    });
  });

  it("Google OAuth 启动失败时返回统一 500 且保留安全回跳详情", async () => {
    const startGoogleAuth = vi.fn().mockResolvedValue({
      failureHref: "/login?authError=start_failed&next=%2Fdashboard",
      ok: false,
    });
    const app = createControllerApp(createAuthService({ startGoogleAuth }));

    const response = await app.request(
      "https://kuranote.test/oauth/google/start",
      {
        body: JSON.stringify({ nextPath: "/dashboard", source: "login" }),
        headers: { ...jsonHeaders, origin: "https://kuranote.test" },
        method: "POST",
      },
    );

    expect(response.status).toBe(500);
    expect(await response.json()).toMatchObject({
      error: {
        code: "google_auth_start_failed",
        details: {
          redirectTo: "/login?authError=start_failed&next=%2Fdashboard",
        },
        status: 500,
      },
    });
  });

  it("Session 读取和登出 Controller 返回稳定响应", async () => {
    const getSession = vi.fn().mockResolvedValue({
      authenticated: true,
      user: {
        displayName: "山田太郎",
        email: "user@example.test",
        id: "00000000-0000-4000-8000-000000000031",
      },
    });
    const logout = vi.fn();
    const app = createControllerApp(createAuthService({ getSession, logout }));

    const sessionResponse = await app.request("https://kuranote.test/session");
    expect(sessionResponse.status).toBe(200);
    expect(await sessionResponse.json()).toMatchObject({ authenticated: true });

    const logoutResponse = await app.request("https://kuranote.test/session", {
      method: "DELETE",
    });
    expect(logoutResponse.status).toBe(200);
    expect(logout).toHaveBeenCalledOnce();
  });
});
