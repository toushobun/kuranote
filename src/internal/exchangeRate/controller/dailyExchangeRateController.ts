import type { z } from "@hono/zod-openapi";
import { requireAuthenticatedUserId } from "internal/shared/auth/authContext";
import { RepositoryError } from "internal/shared/errors/appError";
import type { ControllerContext } from "internal/shared/http/controllerContext";
import { exchangeRateErrorCodes, exchangeRateErrorMessages } from "../errors";
import { dailyExchangeRateQuerySchema } from "../schema";

type Query = z.infer<typeof dailyExchangeRateQuerySchema>;

export const getDailyExchangeRateHandler = async (
  c: ControllerContext<{ query: Query }>,
) => {
  requireAuthenticatedUserId(c.get("requestDependencies").auth);
  const exchangeRate = c.get("container").exchangeRate;
  if (!exchangeRate) {
    throw new RepositoryError(
      exchangeRateErrorCodes.readFailed,
      exchangeRateErrorMessages[exchangeRateErrorCodes.readFailed],
    );
  }
  return c.json(
    await exchangeRate.service.getDailyRate(c.req.valid("query")),
    200,
  );
};
