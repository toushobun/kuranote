import { OpenAPIHono } from "@hono/zod-openapi";

import type { AppEnv } from "server/appEnv";
import {
  getDashboardHandler,
  getDashboardRoute,
  getStatisticsHandler,
  getStatisticsRoute,
} from "server/statistics/controller/statisticsController";

export const statisticsRouter = new OpenAPIHono<AppEnv>();

statisticsRouter.openapi(getDashboardRoute, getDashboardHandler);
statisticsRouter.openapi(getStatisticsRoute, getStatisticsHandler);
