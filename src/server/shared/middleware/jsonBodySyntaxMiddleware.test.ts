// @vitest-environment node

import { Hono } from "hono";
import { describe, expect, it, vi } from "vitest";

import type { AppEnv } from "server/appEnv";
import { errorHandlingMiddleware } from "server/shared/http/errorResponse";
import { jsonBodySyntaxMiddleware } from "server/shared/middleware/jsonBodySyntaxMiddleware";

function createApp() {
  const app = new Hono<AppEnv>();
  app.use("*", async (c, next) => {
    c.set("requestId", "req-json-body");
    await next();
  });
  app.use("*", jsonBodySyntaxMiddleware);
  app.onError(errorHandlingMiddleware);
  return app;
}

describe("jsonBodySyntaxMiddleware", () => {
  it("合法 JSON 进入下游，并复用 Hono 的请求体缓存", async () => {
    const app = createApp();
    const handler = vi.fn(async (c) => c.json(await c.req.json()));
    app.post("/json", handler);

    const response = await app.request("/json", {
      body: JSON.stringify({ value: 1 }),
      headers: { "content-type": "application/json" },
      method: "POST",
    });

    expect(response.status).toBe(200);
    expect(await response.json()).toEqual({ value: 1 });
    expect(handler).toHaveBeenCalledOnce();
  });

  it("损坏 JSON 在进入下游前返回统一 400", async () => {
    const app = createApp();
    const handler = vi.fn((c) => c.json({ ok: true }));
    app.post("/json", handler);

    const response = await app.request("/json", {
      body: "{",
      headers: { "content-type": "application/json" },
      method: "POST",
    });

    expect(response.status).toBe(400);
    expect(handler).not.toHaveBeenCalled();
    expect(await response.json()).toMatchObject({
      error: {
        code: "validation_error",
        requestId: "req-json-body",
        status: 400,
      },
    });
  });

  it("非 JSON Content-Type 不预解析请求体", async () => {
    const app = createApp();
    app.post("/text", async (c) => c.text(await c.req.text()));

    const response = await app.request("/text", {
      body: "plain text",
      headers: { "content-type": "text/plain" },
      method: "POST",
    });

    expect(response.status).toBe(200);
    expect(await response.text()).toBe("plain text");
  });

  it("GET 请求即使声明 JSON Content-Type 也不读取 body", async () => {
    const app = createApp();
    app.get("/safe", (c) => c.json({ ok: true }));

    const response = await app.request("/safe", {
      headers: { "content-type": "application/json" },
      method: "GET",
    });

    expect(response.status).toBe(200);
    expect(await response.json()).toEqual({ ok: true });
  });

  it("无 body 的 DELETE 即使声明 JSON Content-Type 也继续进入下游", async () => {
    const app = createApp();
    const handler = vi.fn((c) => c.json({ ok: true }));
    app.delete("/session", handler);

    const response = await app.request("/session", {
      headers: { "content-type": "application/json" },
      method: "DELETE",
    });

    expect(response.status).toBe(200);
    expect(await response.json()).toEqual({ ok: true });
    expect(handler).toHaveBeenCalledOnce();
  });
});
