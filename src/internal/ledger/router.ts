import { createRoute, OpenAPIHono } from "@hono/zod-openapi";

import type { AppEnv } from "internal/appEnv";
import { acceptLedgerInviteHandler } from "internal/ledger/controller/ledgerInviteController";
import {
  acceptLedgerInviteRequestSchema,
  acceptLedgerInviteResponseSchema,
  errorResponseSchema,
} from "internal/ledger/schema";

import { sameOriginMiddleware } from "internal/shared/middleware/sameOriginMiddleware";

export const acceptLedgerInviteRoute = createRoute({
  method: "post",
  path: "/accept",
  request: {
    body: {
      content: {
        "application/json": { schema: acceptLedgerInviteRequestSchema },
      },
    },
  },
  responses: {
    200: {
      content: {
        "application/json": { schema: acceptLedgerInviteResponseSchema },
      },
      description: "邀请接受成功",
    },
    400: {
      content: { "application/json": { schema: errorResponseSchema } },
      description: "请求内容无效",
    },
    401: {
      content: { "application/json": { schema: errorResponseSchema } },
      description: "未登录",
    },
    403: {
      content: { "application/json": { schema: errorResponseSchema } },
      description: "来源无效或无权限",
    },
    404: {
      content: { "application/json": { schema: errorResponseSchema } },
      description: "邀请不存在或已失效",
    },
    409: {
      content: { "application/json": { schema: errorResponseSchema } },
      description: "邀请已被使用或撤销",
    },
    500: {
      content: { "application/json": { schema: errorResponseSchema } },
      description: "服务端异常",
    },
  },
});

export const ledgerRouter = new OpenAPIHono<AppEnv>();

ledgerRouter.use("/accept", sameOriginMiddleware);
ledgerRouter.openapi(acceptLedgerInviteRoute, acceptLedgerInviteHandler);
