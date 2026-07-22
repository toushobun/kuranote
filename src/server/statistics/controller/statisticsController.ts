import { createRoute, type RouteHandler } from "@hono/zod-openapi";
import type { Context } from "hono";

import type { AppEnv } from "server/appEnv";
import { AuthenticationError } from "server/shared/errors/appError";
import {
  dashboardResponseSchema,
  errorResponseSchema,
  statisticsLedgerParamsSchema,
  statisticsMonthQuerySchema,
  statisticsResponseSchema,
} from "server/statistics/schema";

const errorResponses = {
  400: {
    content: { "application/json": { schema: errorResponseSchema } },
    description: "请求无效",
  },
  401: {
    content: { "application/json": { schema: errorResponseSchema } },
    description: "未登录",
  },
  404: {
    content: { "application/json": { schema: errorResponseSchema } },
    description: "资源不存在",
  },
  500: {
    content: { "application/json": { schema: errorResponseSchema } },
    description: "服务异常",
  },
} as const;

function requireUserId(c: Context<AppEnv>): string {
  const auth = c.get("requestDependencies").auth;

  if (!auth.isAuthenticated) {
    throw new AuthenticationError("auth_required", "请先登录。");
  }

  return auth.userId;
}

export const getDashboardRoute = createRoute({
  method: "get",
  path: "/{ledgerId}/dashboard",
  request: { params: statisticsLedgerParamsSchema },
  responses: {
    200: {
      content: { "application/json": { schema: dashboardResponseSchema } },
      description: "Dashboard 数据",
    },
    ...errorResponses,
  },
});

export const getDashboardHandler: RouteHandler<
  typeof getDashboardRoute,
  AppEnv
> = async (c) => {
  requireUserId(c);
  const { ledgerId } = c.req.valid("param");
  const view = await c.get("container").statistics.service.getDashboard({
    ledgerId,
  });

  return c.json(view, 200);
};

export const getStatisticsRoute = createRoute({
  method: "get",
  path: "/{ledgerId}",
  request: {
    params: statisticsLedgerParamsSchema,
    query: statisticsMonthQuerySchema,
  },
  responses: {
    200: {
      content: { "application/json": { schema: statisticsResponseSchema } },
      description: "月度统计数据",
    },
    ...errorResponses,
  },
});

export const getStatisticsHandler: RouteHandler<
  typeof getStatisticsRoute,
  AppEnv
> = async (c) => {
  requireUserId(c);
  const { ledgerId } = c.req.valid("param");
  const { month } = c.req.valid("query");
  const view = await c.get("container").statistics.service.getMonthly({
    ledgerId,
    month,
  });

  return c.json(view, 200);
};
