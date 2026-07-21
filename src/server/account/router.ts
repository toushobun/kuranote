import { OpenAPIHono } from "@hono/zod-openapi";

import {
  archiveAccountHandler,
  archiveAccountRoute,
  createAccountHandler,
  createAccountRoute,
  getAccountsHandler,
  getAccountsRoute,
  updateAccountHandler,
  updateAccountRoute,
} from "server/account/controller/accountController";
import type { AppEnv } from "server/appEnv";
import { sameOriginMiddleware } from "server/shared/middleware/sameOriginMiddleware";

export const accountRouter = new OpenAPIHono<AppEnv>();

accountRouter.use("*", sameOriginMiddleware);
accountRouter.openapi(getAccountsRoute, getAccountsHandler);
accountRouter.openapi(createAccountRoute, createAccountHandler);
accountRouter.openapi(updateAccountRoute, updateAccountHandler);
accountRouter.openapi(archiveAccountRoute, archiveAccountHandler);
