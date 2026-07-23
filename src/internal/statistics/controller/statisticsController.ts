import type { z } from "@hono/zod-openapi";

import { requireAuthenticatedUserId } from "internal/shared/auth/authContext";
import type { ControllerContext } from "internal/shared/http/controllerContext";
import {
  statisticsLedgerParamsSchema,
  statisticsMonthQuerySchema,
} from "internal/statistics/schema";

type StatisticsLedgerParams = z.infer<typeof statisticsLedgerParamsSchema>;
type StatisticsMonthQuery = z.infer<typeof statisticsMonthQuerySchema>;

export const getDashboardHandler = async (
  c: ControllerContext<{ param: StatisticsLedgerParams }>,
) => {
  requireAuthenticatedUserId(c.get("requestDependencies").auth);
  const { ledgerId } = c.req.valid("param");
  const view = await c.get("container").statistics.service.getDashboard({
    ledgerId,
  });

  return c.json(view, 200);
};

export const getStatisticsHandler = async (
  c: ControllerContext<{
    param: StatisticsLedgerParams;
    query: StatisticsMonthQuery;
  }>,
) => {
  requireAuthenticatedUserId(c.get("requestDependencies").auth);
  const { ledgerId } = c.req.valid("param");
  const { month } = c.req.valid("query");
  const view = await c.get("container").statistics.service.getMonthly({
    ledgerId,
    month,
  });

  return c.json(view, 200);
};
