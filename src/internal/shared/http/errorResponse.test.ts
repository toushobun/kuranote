// @vitest-environment node

import { OpenAPIHono, createRoute, z } from "@hono/zod-openapi";
import { Hono } from "hono";
import { describe, expect, it, vi } from "vitest";

import type { AppEnv } from "internal/appEnv";
import {
  AuthenticationError,
  ConflictError,
  NotFoundError,
  RateLimitError,
  ValidationError,
} from "internal/shared/errors/appError";
import {
  errorHandlingMiddleware,
  openApiValidationErrorHook,
} from "internal/shared/http/errorResponse";
import { jsonBodySyntaxMiddleware } from "internal/shared/middleware/jsonBodySyntaxMiddleware";

function appThatThrows(error: unknown) {
  const app = new Hono<AppEnv>();
  app.onError(errorHandlingMiddleware);
  app.get("/boom", () => {
    throw error;
  });
  return app;
}

describe("errorHandlingMiddleware", () => {
  it.each([
    [new ValidationError("invalid_request", "请求内容无效。"), 400],
    [new AuthenticationError("auth_required", "请先登录后再继续。"), 401],
    [new NotFoundError("invite_invalid", "该邀请链接无效或已失效。"), 404],
    [new ConflictError("invite_already_used", "该邀请链接已经被使用。"), 409],
  ])("把 %s 映射为对应的 HTTP 状态", async (error, expectedStatus) => {
    const response = await appThatThrows(error).request("/boom");

    expect(response.status).toBe(expectedStatus);
    const body = (await response.json()) as {
      error: { code: string; message: string; status: number };
    };
    expect(body.error.code).toBe(error.code);
    expect(body.error.message).toBe(error.message);
    expect(body.error.status).toBe(expectedStatus);
  });

  it("限流错误返回 details 和 Retry-After 响应头", async () => {
    const response = await appThatThrows(
      new RateLimitError("rate_limited", "请求过于频繁。", {
        details: { retryAfterSeconds: 42 },
      }),
    ).request("/boom");

    expect(response.status).toBe(429);
    expect(response.headers.get("Retry-After")).toBe("42");
    expect(await response.json()).toMatchObject({
      error: {
        code: "rate_limited",
        details: { retryAfterSeconds: 42 },
        status: 429,
      },
    });
  });

  it("OpenAPI Schema 校验失败返回统一安全错误体", async () => {
    const app = new OpenAPIHono<AppEnv>({
      defaultHook: openApiValidationErrorHook,
    });
    app.use("*", async (c, next) => {
      c.set("requestId", "req-validation");
      await next();
    });
    const route = createRoute({
      method: "post",
      path: "/validate",
      request: {
        body: {
          content: {
            "application/json": { schema: z.object({ email: z.string() }) },
          },
        },
      },
      responses: { 200: { description: "ok" } },
    });
    app.openapi(route, (c) => c.json({}, 200));

    const response = await app.request("/validate", {
      body: JSON.stringify({}),
      headers: { "content-type": "application/json" },
      method: "POST",
    });

    expect(response.status).toBe(400);
    expect(await response.json()).toEqual({
      error: {
        code: "validation_error",
        message: "请求参数无效。",
        requestId: "req-validation",
        status: 400,
      },
    });
  });

  it("损坏的 JSON 请求体由专用中间件映射为安全 400", async () => {
    const app = new Hono<AppEnv>();
    app.use("*", async (c, next) => {
      c.set("requestId", "req-json");
      await next();
    });
    app.use("*", jsonBodySyntaxMiddleware);
    app.onError(errorHandlingMiddleware);
    app.post("/json", async (c) => {
      await c.req.json();
      return c.json({ ok: true });
    });

    const response = await app.request("/json", {
      body: "{",
      headers: { "content-type": "application/json" },
      method: "POST",
    });

    expect(response.status).toBe(400);
    expect(await response.json()).toEqual({
      error: {
        code: "validation_error",
        message: "请求参数无效。",
        requestId: "req-json",
        status: 400,
      },
    });
  });

  it("业务代码内部的 SyntaxError 保持为安全 500，不伪装成客户端 JSON 错误", async () => {
    const app = new Hono<AppEnv>();
    app.use("*", async (c, next) => {
      c.set("requestId", "req-syntax");
      await next();
    });
    app.use("*", jsonBodySyntaxMiddleware);
    app.onError(errorHandlingMiddleware);
    app.post("/boom", () => {
      throw new SyntaxError("internal parser failed");
    });

    const response = await app.request("/boom", {
      body: JSON.stringify({ ok: true }),
      headers: { "content-type": "application/json" },
      method: "POST",
    });

    expect(response.status).toBe(500);
    expect(await response.json()).toEqual({
      error: {
        code: "internal_error",
        message: "服务器发生未知错误，请稍后重试。",
        requestId: "req-syntax",
        status: 500,
      },
    });
  });

  it("未知异常统一转换为安全的 500，不暴露原始异常信息", async () => {
    const response = await appThatThrows(
      new Error("db connection leaked"),
    ).request("/boom");

    expect(response.status).toBe(500);
    const body = (await response.json()) as {
      error: { code: string; message: string };
    };
    expect(body.error.code).toBe("internal_error");
    expect(body.error.message).not.toContain("db connection leaked");
  });

  it("已有请求级 logger 时，未知异常通过该 logger 记录，而非直接使用 console.error", async () => {
    const loggerError = vi.fn();
    const app = new Hono<AppEnv>();
    app.use("*", async (c, next) => {
      c.set("requestId", "req-1");
      c.set("requestDependencies", {
        auth: { email: null, isAuthenticated: false, userId: null },
        logger: { error: loggerError, info: vi.fn(), warn: vi.fn() },
        requestId: "req-1",
        supabase: {} as never,
      });
      await next();
    });
    app.onError(errorHandlingMiddleware);
    app.get("/boom", () => {
      throw new Error("unexpected");
    });

    await app.request("/boom");

    expect(loggerError).toHaveBeenCalledWith(
      "[server] unhandled error",
      expect.objectContaining({
        errorName: "Error",
        requestId: "req-1",
      }),
    );
    expect(JSON.stringify(loggerError.mock.calls)).not.toContain("unexpected");
  });
});
