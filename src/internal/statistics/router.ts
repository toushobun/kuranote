import { createRoute, OpenAPIHono } from "@hono/zod-openapi";

import type { AppEnv } from "internal/appEnv";
import {
  createOpenApiErrorResponses,
  protectedReadErrorStatuses,
} from "internal/shared/http/openApiErrorResponses";
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

const errorResponses = createOpenApiErrorResponses(
  errorResponseSchema,
  protectedReadErrorStatuses,
);

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
