import { createRoute, type RouteHandler } from "@hono/zod-openapi";
import type { Context } from "hono";

import type { AppEnv } from "server/appEnv";
import { revalidateLedgerMutation } from "server/ledger/adapter/next/revalidateLedger";
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
} from "server/ledger/schema";
import { AuthenticationError } from "server/shared/errors/appError";

const errorResponses = {
  400: {
    content: { "application/json": { schema: errorResponseSchema } },
    description: "请求无效",
  },
  401: {
    content: { "application/json": { schema: errorResponseSchema } },
    description: "未登录",
  },
  403: {
    content: { "application/json": { schema: errorResponseSchema } },
    description: "无权限",
  },
  404: {
    content: { "application/json": { schema: errorResponseSchema } },
    description: "资源不存在",
  },
  409: {
    content: { "application/json": { schema: errorResponseSchema } },
    description: "资源冲突",
  },
  500: {
    content: { "application/json": { schema: errorResponseSchema } },
    description: "服务异常",
  },
} as const;

function requireUserId(c: Context<AppEnv>): string {
  const auth = c.get("requestDependencies").auth;
  if (!auth.isAuthenticated)
    throw new AuthenticationError("auth_required", "请先登录。");
  return auth.userId;
}

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
export const createLedgerHandler: RouteHandler<
  typeof createLedgerRoute,
  AppEnv
> = async (c) => {
  requireUserId(c);
  await c.get("container").ledger.service.create(c.req.valid("json"));
  revalidateLedgerMutation();
  return c.json({ ok: true as const }, 201);
};

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
export const switchCurrentLedgerHandler: RouteHandler<
  typeof switchCurrentLedgerRoute,
  AppEnv
> = async (c) => {
  const userId = requireUserId(c);
  await c
    .get("container")
    .ledger.currentLedgerService.switch({ ...c.req.valid("json"), userId });
  revalidateLedgerMutation();
  return c.json({ ok: true as const }, 200);
};

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
export const updateLedgerSettingsHandler: RouteHandler<
  typeof updateLedgerSettingsRoute,
  AppEnv
> = async (c) => {
  const userId = requireUserId(c);
  const { ledgerId } = c.req.valid("param");
  const body = c.req.valid("json");
  await c.get("container").ledger.settingsService.update(
    body.intent === "ledger"
      ? {
          intent: "ledger",
          ledgerId,
          settings: {
            baseCurrency: body.baseCurrency,
            ledgerName: body.ledgerName,
          },
          userId,
        }
      : {
          intent: "member",
          ledgerId,
          settings: {
            displayColor: body.displayColor,
            displayName: body.displayName,
            role: body.role,
            userId: body.userId,
          },
          userId,
        },
  );
  revalidateLedgerMutation([`/ledgers/${ledgerId}/settings`]);
  return c.json({ ok: true as const }, 200);
};

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
export const createLedgerInviteHandler: RouteHandler<
  typeof createLedgerInviteRoute,
  AppEnv
> = async (c) => {
  const userId = requireUserId(c);
  const { ledgerId } = c.req.valid("param");
  const result = await c.get("container").ledger.inviteService.create({
    ledgerId,
    role: c.req.valid("json").role,
    userId,
  });
  revalidateLedgerMutation([`/ledgers/${ledgerId}/settings`]);
  return c.json(result, 201);
};

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
export const revokeLedgerInviteHandler: RouteHandler<
  typeof revokeLedgerInviteRoute,
  AppEnv
> = async (c) => {
  const userId = requireUserId(c);
  const { ledgerId, inviteId } = c.req.valid("param");
  await c
    .get("container")
    .ledger.inviteService.revoke({ inviteId, ledgerId, userId });
  revalidateLedgerMutation([`/ledgers/${ledgerId}/settings`]);
  return c.json({ ok: true as const }, 200);
};

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
export const listPendingLedgerInvitesHandler: RouteHandler<
  typeof listPendingLedgerInvitesRoute,
  AppEnv
> = async (c) => {
  const userId = requireUserId(c);
  const { ledgerId } = c.req.valid("param");
  const invites = await c
    .get("container")
    .ledger.inviteService.listPending({ ledgerId, userId });
  return c.json({ invites }, 200);
};
