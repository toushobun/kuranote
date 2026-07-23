import { createRoute, OpenAPIHono } from "@hono/zod-openapi";

import type { AppEnv } from "internal/appEnv";
import {
  createLedgerHandler,
  createLedgerInviteHandler,
  listPendingLedgerInvitesHandler,
  revokeLedgerInviteHandler,
  switchCurrentLedgerHandler,
  updateLedgerSettingsHandler,
} from "internal/ledger/controller/ledgerController";
import {
  createLedgerInviteRequestSchema,
  createLedgerRequestSchema,
  createdLedgerInviteResponseSchema,
  errorResponseSchema,
  ledgerIdParamsSchema,
  ledgerInviteParamsSchema,
  okResponseSchema,
  pendingLedgerInvitesResponseSchema,
  switchCurrentLedgerRequestSchema,
  updateLedgerSettingsRequestSchema,
} from "internal/ledger/schema";
import {
  createOpenApiErrorResponses,
  standardMutationErrorStatuses,
} from "internal/shared/http/openApiErrorResponses";
import { sameOriginMiddleware } from "internal/shared/middleware/sameOriginMiddleware";

const errorResponses = createOpenApiErrorResponses(
  errorResponseSchema,
  standardMutationErrorStatuses,
);

export const createLedgerRoute = createRoute({
  method: "post",
  path: "/",
  request: {
    body: {
      content: { "application/json": { schema: createLedgerRequestSchema } },
    },
  },
  responses: {
    201: {
      content: { "application/json": { schema: okResponseSchema } },
      description: "创建成功",
    },
    ...errorResponses,
  },
});

export const switchCurrentLedgerRoute = createRoute({
  method: "post",
  path: "/current",
  request: {
    body: {
      content: {
        "application/json": { schema: switchCurrentLedgerRequestSchema },
      },
    },
  },
  responses: {
    200: {
      content: { "application/json": { schema: okResponseSchema } },
      description: "切换成功",
    },
    ...errorResponses,
  },
});

export const updateLedgerSettingsRoute = createRoute({
  method: "patch",
  path: "/{ledgerId}/settings",
  request: {
    params: ledgerIdParamsSchema,
    body: {
      content: {
        "application/json": { schema: updateLedgerSettingsRequestSchema },
      },
    },
  },
  responses: {
    200: {
      content: { "application/json": { schema: okResponseSchema } },
      description: "更新成功",
    },
    ...errorResponses,
  },
});

export const createLedgerInviteRoute = createRoute({
  method: "post",
  path: "/{ledgerId}/invites",
  request: {
    params: ledgerIdParamsSchema,
    body: {
      content: {
        "application/json": { schema: createLedgerInviteRequestSchema },
      },
    },
  },
  responses: {
    201: {
      content: {
        "application/json": { schema: createdLedgerInviteResponseSchema },
      },
      description: "创建成功",
    },
    ...errorResponses,
  },
});

export const revokeLedgerInviteRoute = createRoute({
  method: "delete",
  path: "/{ledgerId}/invites/{inviteId}",
  request: { params: ledgerInviteParamsSchema },
  responses: {
    200: {
      content: { "application/json": { schema: okResponseSchema } },
      description: "撤销成功",
    },
    ...errorResponses,
  },
});

export const listPendingLedgerInvitesRoute = createRoute({
  method: "get",
  path: "/{ledgerId}/invites",
  request: { params: ledgerIdParamsSchema },
  responses: {
    200: {
      content: {
        "application/json": { schema: pendingLedgerInvitesResponseSchema },
      },
      description: "读取成功",
    },
    ...errorResponses,
  },
});

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
