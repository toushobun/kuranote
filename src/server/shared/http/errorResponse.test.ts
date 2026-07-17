// @vitest-environment node

import { Hono } from "hono";
import { describe, expect, it, vi } from "vitest";

import type { AppEnv } from "server/appEnv";
import {
  AuthenticationError,
  ConflictError,
  NotFoundError,
  ValidationError,
} from "server/shared/errors/appError";
import { errorHandlingMiddleware } from "server/shared/http/errorResponse";

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
      expect.objectContaining({ requestId: "req-1" }),
    );
  });
});
