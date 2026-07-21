// @vitest-environment node

import { OpenAPIHono } from "@hono/zod-openapi";
import { describe, expect, it, vi } from "vitest";

import { googleAuthNextPathMaxLength } from "lib/auth/googleOAuth";
import type { AppEnv } from "server/appEnv";
import {
  startGoogleAuthHandler,
  startGoogleAuthRoute,
} from "server/auth/controller/authController";
import { authRouter } from "server/auth/router";
import { startGoogleAuthRequestSchema } from "server/auth/schema";
import type { RequestContainer } from "server/container";
import {
  errorHandlingMiddleware,
  openApiValidationErrorHook,
} from "server/shared/http/errorResponse";

function createService(
  startGoogleAuth: RequestContainer["auth"]["service"]["startGoogleAuth"],
): RequestContainer["auth"]["service"] {
  return {
    checkRegisterEmailAvailability: vi.fn(),
    completeGoogleAuth: vi.fn(),
    getSession: vi.fn().mockResolvedValue({ authenticated: false, user: null }),
    login: vi.fn(),
    logout: vi.fn(),
    requestRegisterOtp: vi.fn().mockResolvedValue({ retryAfterSeconds: 60 }),
    startGoogleAuth,
    submitRegisterOtp: vi.fn(),
  } as RequestContainer["auth"]["service"];
}

function addRequestContext(
  app: OpenAPIHono<AppEnv>,
  service: RequestContainer["auth"]["service"],
) {
  app.use("*", async (c, next) => {
    c.set("container", {
      auth: { service },
      category: {} as RequestContainer["category"],
      ledger: {} as RequestContainer["ledger"],
      merchant: {} as RequestContainer["merchant"],
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
}

function createControllerApp(service: RequestContainer["auth"]["service"]) {
  const app = new OpenAPIHono<AppEnv>({
    defaultHook: openApiValidationErrorHook,
  });
  addRequestContext(app, service);
  app.openapi(startGoogleAuthRoute, startGoogleAuthHandler);
  return app;
}

function createRouterApp(service: RequestContainer["auth"]["service"]) {
  const app = new OpenAPIHono<AppEnv>({
    defaultHook: openApiValidationErrorHook,
  });
  addRequestContext(app, service);
  app.route("/auth", authRouter);
  return app;
}

const maxLengthNextPath = `/${"x".repeat(googleAuthNextPathMaxLength - 1)}`;
const oversizedNextPath = `/${"x".repeat(googleAuthNextPathMaxLength)}`;
const requestHeaders = {
  "content-type": "application/json",
  origin: "https://kuranote.test",
};

function createRequestBody(nextPath: string) {
  return JSON.stringify({ nextPath, source: "login" });
}

describe("Google OAuth nextPath 长度边界", () => {
  it("Schema 接受上限长度并拒绝超长 nextPath", () => {
    expect(
      startGoogleAuthRequestSchema.safeParse({
        nextPath: maxLengthNextPath,
        source: "login",
      }).success,
    ).toBe(true);
    expect(
      startGoogleAuthRequestSchema.safeParse({
        nextPath: oversizedNextPath,
        source: "login",
      }).success,
    ).toBe(false);
  });

  it("Controller 在超长 nextPath 时返回 400 且不调用 Service", async () => {
    const startGoogleAuth = vi.fn();
    const app = createControllerApp(createService(startGoogleAuth));

    const response = await app.request(
      "https://kuranote.test/oauth/google/start",
      {
        body: createRequestBody(oversizedNextPath),
        headers: requestHeaders,
        method: "POST",
      },
    );

    expect(response.status).toBe(400);
    expect(startGoogleAuth).not.toHaveBeenCalled();
  });

  it("Router 对超长 nextPath 返回统一 validation_error", async () => {
    const startGoogleAuth = vi.fn();
    const app = createRouterApp(createService(startGoogleAuth));

    const response = await app.request(
      "https://kuranote.test/auth/oauth/google/start",
      {
        body: createRequestBody(oversizedNextPath),
        headers: requestHeaders,
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
