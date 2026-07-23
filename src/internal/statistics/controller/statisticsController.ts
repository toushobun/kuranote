import type { RouteHandler } from "@hono/zod-openapi";
import type { Context } from "hono";

import type { AppEnv } from "internal/appEnv";
import type {
  getDashboardRoute,
  getStatisticsRoute,
} from "internal/statistics/router";
import { AuthenticationError } from "internal/shared/errors/appError";
function requireUserId(c: Context<AppEnv>): string {
  const auth = c.get("requestDependencies").auth;

  if (!auth.isAuthenticated) {
    throw new AuthenticationError("auth_required", "请先登录。");
  }

  return auth.userId;
}

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
