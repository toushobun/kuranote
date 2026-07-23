import { createRoute, OpenAPIHono } from "@hono/zod-openapi";

import type { AppEnv } from "internal/appEnv";
import {
  getDashboardHandler,
  getStatisticsHandler,
} from "internal/statistics/controller/statisticsController";
import {
  dashboardResponseSchema,
  errorResponseSchema,
  statisticsLedgerParamsSchema,
  statisticsMonthQuerySchema,
  statisticsResponseSchema,
} from "internal/statistics/schema";

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

export const statisticsRouter = new OpenAPIHono<AppEnv>();

statisticsRouter.openapi(getDashboardRoute, getDashboardHandler);
statisticsRouter.openapi(getStatisticsRoute, getStatisticsHandler);
