import { createRoute, OpenAPIHono } from "@hono/zod-openapi";
import type { AppEnv } from "internal/appEnv";
import {
  createOpenApiErrorResponses,
  protectedReadErrorStatuses,
} from "internal/shared/http/openApiErrorResponses";
import { getDailyExchangeRateHandler } from "./controller/dailyExchangeRateController";
import {
  dailyExchangeRateQuerySchema,
  dailyExchangeRateResponseSchema,
  exchangeRateErrorResponseSchema,
} from "./schema";

export const getDailyExchangeRateRoute = createRoute({
  method: "get",
  path: "/daily",
  request: { query: dailyExchangeRateQuerySchema },
  responses: {
    200: {
      content: {
        "application/json": { schema: dailyExchangeRateResponseSchema },
      },
      description: "转账日期的参考汇率与实际取值日",
    },
    ...createOpenApiErrorResponses(
      exchangeRateErrorResponseSchema,
      protectedReadErrorStatuses,
    ),
  },
});

export const exchangeRateRouter = new OpenAPIHono<AppEnv>();
exchangeRateRouter.openapi(
  getDailyExchangeRateRoute,
  getDailyExchangeRateHandler,
);
