// @vitest-environment node
import { OpenAPIHono } from "@hono/zod-openapi";
import { describe, expect, it, vi } from "vitest";

import type { AppEnv } from "internal/appEnv";
import type { RequestContainer } from "internal/container";
import type { RequestDependencies } from "internal/shared/context/requestDependencies";
import {
  errorHandlingMiddleware,
  openApiValidationErrorHook,
} from "internal/shared/http/errorResponse";
import { exchangeRateRouter } from "./router";

const validPath = "/exchange-rates/daily?from=CNY&to=JPY&date=2026-11-21";

function createApp(authenticated = true) {
  const service = {
    getDailyRate: vi
      .fn()
      .mockResolvedValue({ rate: 21.05, rateDate: "2026-11-20" }),
  };
  const app = new OpenAPIHono<AppEnv>({
    defaultHook: openApiValidationErrorHook,
  });
  app.use("*", async (c, next) => {
    c.set("container", {
      exchangeRate: { service },
    } as unknown as RequestContainer);
    c.set("requestDependencies", {
      auth: authenticated
        ? { email: "user@example.com", isAuthenticated: true, userId: "user-1" }
        : { email: null, isAuthenticated: false, userId: null },
      logger: { error: vi.fn(), warn: vi.fn(), info: vi.fn() },
      requestId: "request-1",
      supabase: {} as never,
    } satisfies RequestDependencies);
    c.set("requestId", "request-1");
    await next();
  });
  app.onError(errorHandlingMiddleware);
  app.route("/exchange-rates", exchangeRateRouter);
  return { app, service };
}

describe("exchangeRateRouter", () => {
  it("返回汇率与实际取值日期", async () => {
    const { app, service } = createApp();
    const response = await app.request(validPath);
    expect(response.status).toBe(200);
    expect(await response.json()).toEqual({
      rate: 21.05,
      rateDate: "2026-11-20",
    });
    expect(service.getDailyRate).toHaveBeenCalledWith({
      from: "CNY",
      to: "JPY",
      date: "2026-11-21",
    });
  });

  it("两币种汇率取值日不同也通过 API 返回", async () => {
    const { app, service } = createApp();
    service.getDailyRate.mockResolvedValueOnce({
      rate: 21.05,
      rateDate: "2026-11-19",
      fromRateDate: "2026-11-20",
      toRateDate: "2026-11-19",
    });
    const response = await app.request(validPath);
    expect(response.status).toBe(200);
    expect(await response.json()).toEqual({
      rate: 21.05,
      rateDate: "2026-11-19",
      fromRateDate: "2026-11-20",
      toRateDate: "2026-11-19",
    });
  });

  it("缺少汇率仍然返回 200 和 null", async () => {
    const { app, service } = createApp();
    service.getDailyRate.mockResolvedValueOnce({ rate: null, rateDate: null });
    const response = await app.request(validPath);
    expect(response.status).toBe(200);
    expect(await response.json()).toEqual({ rate: null, rateDate: null });
  });

  it.each([
    "/exchange-rates/daily?from=XYZ&to=JPY&date=2026-11-21",
    "/exchange-rates/daily?from=CNY&to=JPY&date=2026-02-30",
    "/exchange-rates/daily?from=CNY&to=JPY&date=2026-11-2",
  ])("不合法的参数 %s 返回 400", async (path) => {
    const { app, service } = createApp();
    const response = await app.request(path);
    expect(response.status).toBe(400);
    const body = await response.json();
    expect(body.error.status).toBe(400);
    expect(service.getDailyRate).not.toHaveBeenCalled();
  });

  it("未登录返回统一 401 且不查询", async () => {
    const { app, service } = createApp(false);
    const response = await app.request(validPath);
    expect(response.status).toBe(401);
    const body = await response.json();
    expect(body.error.status).toBe(401);
    expect(service.getDailyRate).not.toHaveBeenCalled();
  });
});
