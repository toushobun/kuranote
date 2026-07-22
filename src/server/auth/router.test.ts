// @vitest-environment node

import { OpenAPIHono } from "@hono/zod-openapi";
import { beforeEach, describe, expect, it, vi } from "vitest";

import type { AppEnv } from "server/appEnv";
import { authRouter } from "server/auth/router";
import type { RequestContainer } from "server/container";
import { RateLimitError } from "server/shared/errors/appError";
import {
  errorHandlingMiddleware,
  openApiValidationErrorHook,
} from "server/shared/http/errorResponse";

function createService(
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

describe("auth router", () => {
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
});
