// @vitest-environment node
import { OpenAPIHono } from "@hono/zod-openapi";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { googleAuthNextPathMaxLength } from "lib/auth/googleOAuth";
import { type AppEnv } from "internal/appEnv";
import { authRouter } from "internal/auth/router";
import { type RequestContainer } from "internal/container";
import { RateLimitError } from "internal/shared/errors/appError";
import {
  errorHandlingMiddleware,
  openApiValidationErrorHook,
} from "internal/shared/http/errorResponse";
describe("auth router", () => {
  function createService(
    overrides: Partial<RequestContainer["auth"]["service"]> = {},
  ): RequestContainer["auth"]["service"] {
    return {
      checkRegisterEmailAvailability: vi.fn(),
      completeGoogleAuth: vi.fn(),
      getSession: vi
        .fn()
        .mockResolvedValue({ authenticated: false, user: null }),
      login: vi.fn(),
      logout: vi.fn(),
      requestRegisterOtp: vi.fn().mockResolvedValue({ retryAfterSeconds: 60 }),
      startGoogleAuth: vi.fn(),
      submitRegisterOtp: vi.fn(),
      ...overrides,
    } as RequestContainer["auth"]["service"];
  }
  function createApp(service: RequestContainer["auth"]["service"]) {
    const app = new OpenAPIHono<AppEnv>({
      defaultHook: openApiValidationErrorHook,
    });
    app.use("*", async (c, next) => {
      c.set("container", {
        account: {} as RequestContainer["account"],
        auth: { service },
        category: {} as RequestContainer["category"],
        ledger: {} as RequestContainer["ledger"],
        merchant: {} as RequestContainer["merchant"],
        statistics: {} as RequestContainer["statistics"],
        transaction: {} as RequestContainer["transaction"],
        user: {} as RequestContainer["user"],
      });
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
    app.route("/auth", authRouter);
    return app;
  }
  const validLoginBody = JSON.stringify({
    email: "user@example.test",
    password: "password-1234",
  });
  beforeEach(() => vi.clearAllMocks());
  it("Cookie 写请求缺少同源 Origin 时返回 403 且不调用 Service", async () => {
    const login = vi.fn();
    const app = createApp(createService({ login }));
    const response = await app.request("https://kuranote.test/auth/login", {
      body: validLoginBody,
      headers: { "content-type": "application/json" },
      method: "POST",
    });
    expect(response.status).toBe(403);
    expect(login).not.toHaveBeenCalled();
    expect(await response.json()).toMatchObject({
      error: { code: "forbidden", status: 403 },
    });
  });
  it("Schema 校验失败返回统一错误体，不暴露 Zod 内部细节", async () => {
    const login = vi.fn();
    const app = createApp(createService({ login }));
    const response = await app.request("https://kuranote.test/auth/login", {
      body: JSON.stringify({ password: "password-1234" }),
      headers: {
        "content-type": "application/json",
        origin: "https://kuranote.test",
      },
      method: "POST",
    });
    expect(response.status).toBe(400);
    expect(login).not.toHaveBeenCalled();
    const body = await response.json();
    expect(body).toEqual({
      error: {
        code: "validation_error",
        message: "请求参数无效。",
        requestId: "request-1",
        status: 400,
      },
    });
    expect(JSON.stringify(body)).not.toContain("ZodError");
  });
  it("JSON 请求体损坏时返回统一 400，而不是内部 500", async () => {
    const login = vi.fn();
    const app = createApp(createService({ login }));
    const response = await app.request("https://kuranote.test/auth/login", {
      body: "{",
      headers: {
        "content-type": "application/json",
        origin: "https://kuranote.test",
      },
      method: "POST",
    });
    expect(response.status).toBe(400);
    expect(login).not.toHaveBeenCalled();
    expect(await response.json()).toEqual({
      error: {
        code: "validation_error",
        message: "请求参数无效。",
        requestId: "request-1",
        status: 400,
      },
    });
  });
  it("同源登录请求进入 Controller 并返回 200", async () => {
    const login = vi.fn();
    const app = createApp(createService({ login }));
    const response = await app.request("https://kuranote.test/auth/login", {
      body: validLoginBody,
      headers: {
        "content-type": "application/json",
        origin: "https://kuranote.test",
      },
      method: "POST",
    });
    expect(response.status).toBe(200);
    expect(login).toHaveBeenCalledOnce();
  });
  it("GET Session 属于安全方法，不要求 Origin", async () => {
    const getSession = vi
      .fn()
      .mockResolvedValue({ authenticated: false, user: null });
    const app = createApp(createService({ getSession }));
    const response = await app.request("https://kuranote.test/auth/session");
    expect(response.status).toBe(200);
    expect(getSession).toHaveBeenCalledOnce();
  });
  it("OTP 限流错误返回 429、统一错误体和 Retry-After", async () => {
    const requestRegisterOtp = vi
      .fn()
      .mockRejectedValue(
        new RateLimitError(
          "otp_send_rate_limited",
          "验证码发送过于频繁，请稍后再试",
          { details: { retryAfterSeconds: 42 } },
        ),
      );
    const app = createApp(createService({ requestRegisterOtp }));
    const response = await app.request(
      "https://kuranote.test/auth/register/otp/request",
      {
        body: JSON.stringify({
          email: "user@example.test",
          turnstileToken: "turnstile-token",
        }),
        headers: {
          "content-type": "application/json",
          origin: "https://kuranote.test",
          "x-real-ip": "203.0.113.10",
        },
        method: "POST",
      },
    );
    expect(response.status).toBe(429);
    expect(response.headers.get("Retry-After")).toBe("42");
    expect(await response.json()).toMatchObject({
      error: {
        code: "otp_send_rate_limited",
        details: { retryAfterSeconds: 42 },
        status: 429,
      },
    });
  });
  it("未登记路径由上层 Router 继续处理为 404", async () => {
    const app = createApp(createService());
    const response = await app.request("https://kuranote.test/auth/unknown");
    expect(response.status).toBe(404);
  });
  it("Google OAuth nextPath 超长时返回统一 validation_error", async () => {
    const startGoogleAuth = vi.fn();
    const app = createApp(createService({ startGoogleAuth }));
    const oversizedNextPath = `/${"x".repeat(googleAuthNextPathMaxLength)}`;

    const response = await app.request(
      "https://kuranote.test/auth/oauth/google/start",
      {
        body: JSON.stringify({ nextPath: oversizedNextPath, source: "login" }),
        headers: {
          "content-type": "application/json",
          origin: "https://kuranote.test",
        },
        method: "POST",
      },
    );

    expect(response.status).toBe(400);
    expect(startGoogleAuth).not.toHaveBeenCalled();
    expect(await response.json()).toEqual({
      error: {
        code: "validation_error",
        message: "请求参数无效。",
        requestId: "request-1",
        status: 400,
      },
    });
  });
});
describe("auth router middleware order", () => {
  function createApp() {
    const app = new OpenAPIHono<AppEnv>();
    app.use("*", async (c, next) => {
      c.set("requestId", "request-order");
      await next();
    });
    app.onError(errorHandlingMiddleware);
    app.route("/auth", authRouter);
    return app;
  }
  it("returns 403 before parsing an untrusted request body", async () => {
    const response = await createApp().request(
      "https://kuranote.test/auth/login",
      {
        body: "{",
        headers: { "content-type": "application/json" },
        method: "POST",
      },
    );
    expect(response.status).toBe(403);
    expect(await response.json()).toMatchObject({
      error: { code: "forbidden", status: 403 },
    });
  });
  it("returns 400 for malformed same-origin JSON", async () => {
    const response = await createApp().request(
      "https://kuranote.test/auth/login",
      {
        body: "{",
        headers: {
          "content-type": "application/json",
          origin: "https://kuranote.test",
        },
        method: "POST",
      },
    );
    expect(response.status).toBe(400);
    expect(await response.json()).toEqual({
      error: {
        code: "validation_error",
        message: "请求参数无效。",
        requestId: "request-order",
        status: 400,
      },
    });
  });
});
