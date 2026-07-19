import { OpenAPIHono } from "@hono/zod-openapi";

import type { AppEnv } from "server/appEnv";
import {
  createLedgerHandler,
  createLedgerInviteHandler,
  createLedgerInviteRoute,
  createLedgerRoute,
  listPendingLedgerInvitesHandler,
  listPendingLedgerInvitesRoute,
  revokeLedgerInviteHandler,
  revokeLedgerInviteRoute,
  switchCurrentLedgerHandler,
  switchCurrentLedgerRoute,
  updateLedgerSettingsHandler,
  updateLedgerSettingsRoute,
} from "server/ledger/controller/ledgerController";
import { sameOriginMiddleware } from "server/shared/middleware/sameOriginMiddleware";

export const ledgerManagementRouter = new OpenAPIHono<AppEnv>();

ledgerManagementRouter.use("*", sameOriginMiddleware);
ledgerManagementRouter.openapi(createLedgerRoute, createLedgerHandler);
ledgerManagementRouter.openapi(
  switchCurrentLedgerRoute,
  switchCurrentLedgerHandler,
);
ledgerManagementRouter.openapi(
  updateLedgerSettingsRoute,
  updateLedgerSettingsHandler,
);
ledgerManagementRouter.openapi(
  createLedgerInviteRoute,
  createLedgerInviteHandler,
);
ledgerManagementRouter.openapi(
  revokeLedgerInviteRoute,
  revokeLedgerInviteHandler,
);
ledgerManagementRouter.openapi(
  listPendingLedgerInvitesRoute,
  listPendingLedgerInvitesHandler,
);
