import { createRoute, OpenAPIHono } from "@hono/zod-openapi";

import type { AppEnv } from "internal/appEnv";
import {
  convertTransactionHandler,
  createTransactionHandler,
  updateTransactionHandler,
  voidTransactionHandler,
} from "internal/transaction/controller/transactionController";
import {
  convertTransactionRequestSchema,
  createTransactionRequestSchema,
  errorResponseSchema,
  okResponseSchema,
  transactionIdParamsSchema,
  transactionLedgerQuerySchema,
  updateTransactionRequestSchema,
} from "internal/transaction/schema";

import { sameOriginMiddleware } from "internal/shared/middleware/sameOriginMiddleware";

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
  500: {
    content: { "application/json": { schema: errorResponseSchema } },
    description: "服务异常",
  },
} as const;

export const createTransactionRoute = createRoute({
  method: "post",
  path: "/",
  request: {
    body: {
      content: {
        "application/json": { schema: createTransactionRequestSchema },
      },
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

export const updateTransactionRoute = createRoute({
  method: "patch",
  path: "/{transactionRecordId}",
  request: {
    params: transactionIdParamsSchema,
    body: {
      content: {
        "application/json": { schema: updateTransactionRequestSchema },
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

export const convertTransactionRoute = createRoute({
  method: "post",
  path: "/{transactionRecordId}/conversion",
  request: {
    params: transactionIdParamsSchema,
    body: {
      content: {
        "application/json": { schema: convertTransactionRequestSchema },
      },
    },
  },
  responses: {
    200: {
      content: { "application/json": { schema: okResponseSchema } },
      description: "转换成功",
    },
    ...errorResponses,
  },
});

export const voidTransactionRoute = createRoute({
  method: "delete",
  path: "/{transactionRecordId}",
  request: {
    params: transactionIdParamsSchema,
    query: transactionLedgerQuerySchema,
  },
  responses: {
    200: {
      content: { "application/json": { schema: okResponseSchema } },
      description: "删除成功",
    },
    ...errorResponses,
  },
});

export const transactionRouter = new OpenAPIHono<AppEnv>();

transactionRouter.use("*", sameOriginMiddleware);
transactionRouter.openapi(createTransactionRoute, createTransactionHandler);
transactionRouter.openapi(updateTransactionRoute, updateTransactionHandler);
transactionRouter.openapi(convertTransactionRoute, convertTransactionHandler);
transactionRouter.openapi(voidTransactionRoute, voidTransactionHandler);
