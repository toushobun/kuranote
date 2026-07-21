import { OpenAPIHono } from "@hono/zod-openapi";

import type { AppEnv } from "server/appEnv";
import {
  convertTransactionHandler,
  convertTransactionRoute,
  createTransactionHandler,
  createTransactionRoute,
  updateTransactionHandler,
  updateTransactionRoute,
  voidTransactionHandler,
  voidTransactionRoute,
} from "server/transaction/controller/transactionController";
import { sameOriginMiddleware } from "server/shared/middleware/sameOriginMiddleware";

export const transactionRouter = new OpenAPIHono<AppEnv>();

transactionRouter.use("*", sameOriginMiddleware);
transactionRouter.openapi(createTransactionRoute, createTransactionHandler);
transactionRouter.openapi(updateTransactionRoute, updateTransactionHandler);
transactionRouter.openapi(convertTransactionRoute, convertTransactionHandler);
transactionRouter.openapi(voidTransactionRoute, voidTransactionHandler);
