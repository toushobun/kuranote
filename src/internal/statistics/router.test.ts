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
import { statisticsRouter } from "internal/statistics/router";

const ledgerId = "00000000-0000-4000-8000-000000000032";
const userId = "00000000-0000-4000-8000-000000000031";

function createApp(
  overrides: Partial<RequestContainer["statistics"]["service"]> = {},
  auth: RequestDependencies["auth"] = {
    email: "user@example.com",
    isAuthenticated: true,
    userId,
  },
) {
  const service = {
    getDashboard: vi.fn().mockResolvedValue({
      accountSummaries: [],
      hasLedger: true,
      monthLabel: "2026年6月",
      monthSummary: {
        balance: "0",
        currency: "JPY",
        expense: "0",
        income: "0",
      },
      recentTransactions: [],
    }),
    getMonthly: vi.fn().mockResolvedValue({
      categoryExpenseRanking: [],
      ledgerName: "家庭账本",
      merchantExpenseRanking: [],
      month: "2026-06",
      monthLabel: "2026年6月",
      nextMonth: "2026-07",
      previousMonth: "2026-05",
      summary: {
        balance: "0",
        currency: "JPY",
        expense: "0",
        income: "0",
      },
    }),
    ...overrides,
  } as RequestContainer["statistics"]["service"];
  const app = new OpenAPIHono<AppEnv>({
    defaultHook: openApiValidationErrorHook,
  });

  app.use("*", async (c, next) => {
    c.set("container", { statistics: { service } } as RequestContainer);
    c.set("requestDependencies", {
      auth,
      logger: { error: vi.fn(), info: vi.fn(), warn: vi.fn() },
      requestId: "request-1",
      supabase: {} as never,
    });
    c.set("requestId", "request-1");
    await next();
  });
  app.onError(errorHandlingMiddleware);
  app.route("/statistics", statisticsRouter);

  return { app, service };
}

describe("statisticsRouter", () => {
  it("返回 Dashboard 数据并传入账本 ID", async () => {
    const { app, service } = createApp();
    const response = await app.request(`/statistics/${ledgerId}/dashboard`);

    expect(response.status).toBe(200);
    expect(service.getDashboard).toHaveBeenCalledWith({ ledgerId });
  });

  it("返回指定月份的统计数据", async () => {
    const { app, service } = createApp();
    const response = await app.request(`/statistics/${ledgerId}?month=2026-06`);

    expect(response.status).toBe(200);
    expect(service.getMonthly).toHaveBeenCalledWith({
      ledgerId,
      month: "2026-06",
    });
  });

  it("无效月份在调用 Service 前返回 400", async () => {
    const { app, service } = createApp();
    const response = await app.request(`/statistics/${ledgerId}?month=2026-13`);

    expect(response.status).toBe(400);
    expect(service.getMonthly).not.toHaveBeenCalled();
  });

  it("未登录请求返回统一 401", async () => {
    const { app, service } = createApp(
      {},
      { email: null, isAuthenticated: false, userId: null },
    );
    const response = await app.request(`/statistics/${ledgerId}/dashboard`);

    expect(response.status).toBe(401);
    expect(service.getDashboard).not.toHaveBeenCalled();
  });
});
