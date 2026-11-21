import type { z } from "@hono/zod-openapi";
import { requireAuthenticatedUserId } from "internal/shared/auth/authContext";
import type { ControllerContext } from "internal/shared/http/controllerContext";
import { dailyExchangeRateQuerySchema } from "../schema";

type Query = z.infer<typeof dailyExchangeRateQuerySchema>;

export const getDailyExchangeRateHandler = async (
  c: ControllerContext<{ query: Query }>,
) => {
  requireAuthenticatedUserId(c.get("requestDependencies").auth);
  const { exchangeRate } = c.get("container");
  return c.json(
    await exchangeRate.service.getDailyRate(c.req.valid("query")),
    200,
  );
};
