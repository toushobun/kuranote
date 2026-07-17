import { createRoute, type RouteHandler } from "@hono/zod-openapi";

import type { AppEnv } from "server/appEnv";
import { revalidateLedgerMutation } from "server/ledger/adapter/next/revalidateLedger";
import {
  acceptLedgerInviteRequestSchema,
  acceptLedgerInviteResponseSchema,
  errorResponseSchema,
} from "server/ledger/schema";

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

/**
 * Controller 只负责：读取并校验请求（由 Schema 完成）、调用 Service、
 * 在 Service 成功后触发模块级缓存失效、选择成功状态码。
 * 业务规则、权限判断和数据库访问均不在这里发生。
 */
export const acceptLedgerInviteHandler: RouteHandler<
  typeof acceptLedgerInviteRoute,
  AppEnv
> = async (c) => {
  const { token } = c.req.valid("json");
  const container = c.get("container");

  await container.ledger.inviteService.accept(token);
  revalidateLedgerMutation();

  return c.json({ ok: true as const }, 200);
};
