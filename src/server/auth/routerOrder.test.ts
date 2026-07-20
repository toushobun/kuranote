// @vitest-environment node

import { OpenAPIHono } from "@hono/zod-openapi";
import { describe, expect, it } from "vitest";

import type { AppEnv } from "server/appEnv";
import { authRouter } from "server/auth/router";
import { errorHandlingMiddleware } from "server/shared/http/errorResponse";

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

describe("auth router middleware order", () => {
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
