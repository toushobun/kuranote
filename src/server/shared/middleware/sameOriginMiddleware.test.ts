// @vitest-environment node

import { Hono } from "hono";
import { describe, expect, it } from "vitest";

import { sameOriginMiddleware } from "server/shared/middleware/sameOriginMiddleware";

function createApp() {
  const app = new Hono();
  app.use("*", sameOriginMiddleware);
  app.get("/", (c) => c.json({ ok: true }));
  app.post("/", (c) => c.json({ ok: true }));
  app.onError((error, c) => c.json({ message: error.message }, 403));
  return app;
}

const sameOriginUrl = "https://kuranote.example/";

describe("sameOriginMiddleware", () => {
  it("Origin 与请求 URL 同源时放行写请求", async () => {
    const response = await createApp().request(sameOriginUrl, {
      headers: { origin: "https://kuranote.example" },
      method: "POST",
    });

    expect(response.status).toBe(200);
  });

  it("安全方法缺少 Origin 时仍放行", async () => {
    const response = await createApp().request(sameOriginUrl, {
      method: "GET",
    });

    expect(response.status).toBe(200);
  });

  it("写请求缺少 Origin 时拒绝", async () => {
    const response = await createApp().request(sameOriginUrl, {
      method: "POST",
    });

    expect(response.status).toBe(403);
  });

  it("跨站 Origin 的写请求时拒绝", async () => {
    const response = await createApp().request(sameOriginUrl, {
      headers: { origin: "https://evil.example" },
      method: "POST",
    });

    expect(response.status).toBe(403);
  });
});
