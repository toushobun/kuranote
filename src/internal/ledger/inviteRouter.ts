import { createRoute, OpenAPIHono } from "@hono/zod-openapi";

import type { AppEnv } from "internal/appEnv";
import { acceptLedgerInviteHandler } from "internal/ledger/controller/ledgerInviteController";
import {
  acceptLedgerInviteRequestSchema,
  acceptLedgerInviteResponseSchema,
  errorResponseSchema,
} from "internal/ledger/schema";
import { createOpenApiErrorResponses } from "internal/shared/http/openApiErrorResponses";
import { sameOriginMiddleware } from "internal/shared/middleware/sameOriginMiddleware";

const errorResponses = createOpenApiErrorResponses(
  errorResponseSchema,
  [400, 401, 403, 404, 409, 500],
  {
    400: "请求内容无效",
    403: "来源无效或无权限",
    404: "邀请不存在或已失效",
    409: "邀请已被使用或撤销",
    500: "服务端异常",
  },
);

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
    ...errorResponses,
  },
});

export const ledgerInviteRouter = new OpenAPIHono<AppEnv>();

ledgerInviteRouter.use("/accept", sameOriginMiddleware);
ledgerInviteRouter.openapi(acceptLedgerInviteRoute, acceptLedgerInviteHandler);
