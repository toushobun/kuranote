import { OpenAPIHono } from "@hono/zod-openapi";

import type { AppEnv } from "server/appEnv";
import {
  acceptLedgerInviteHandler,
  acceptLedgerInviteRoute,
} from "server/ledger/controller/ledgerInviteController";
import { sameOriginMiddleware } from "server/shared/middleware/sameOriginMiddleware";

export const ledgerRouter = new OpenAPIHono<AppEnv>();

ledgerRouter.use("/accept", sameOriginMiddleware);
ledgerRouter.openapi(acceptLedgerInviteRoute, acceptLedgerInviteHandler);
