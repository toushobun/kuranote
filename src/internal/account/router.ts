import { createRoute, OpenAPIHono } from "@hono/zod-openapi";

import {
  archiveAccountHandler,
  createAccountHandler,
  getAccountsHandler,
  updateAccountHandler,
} from "internal/account/controller/accountController";
import {
  accountLedgerParamsSchema,
  accountParamsSchema,
  accountsViewResponseSchema,
  createAccountRequestSchema,
  createdAccountResponseSchema,
  errorResponseSchema,
  okResponseSchema,
  updateAccountRequestSchema,
} from "internal/account/schema";
import type { AppEnv } from "internal/appEnv";
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
  409: {
    content: { "application/json": { schema: errorResponseSchema } },
    description: "资源冲突",
  },
  500: {
    content: { "application/json": { schema: errorResponseSchema } },
    description: "服务异常",
  },
} as const;

export const getAccountsRoute = createRoute({
  method: "get",
  path: "/{ledgerId}/accounts",
  request: { params: accountLedgerParamsSchema },
  responses: {
    200: {
      content: { "application/json": { schema: accountsViewResponseSchema } },
      description: "读取成功",
    },
    ...errorResponses,
  },
});

export const createAccountRoute = createRoute({
  method: "post",
  path: "/{ledgerId}/accounts",
  request: {
    params: accountLedgerParamsSchema,
    body: {
      content: { "application/json": { schema: createAccountRequestSchema } },
    },
  },
  responses: {
    201: {
      content: { "application/json": { schema: createdAccountResponseSchema } },
      description: "创建成功",
    },
    ...errorResponses,
  },
});

export const updateAccountRoute = createRoute({
  method: "patch",
  path: "/{ledgerId}/accounts/{accountId}",
  request: {
    params: accountParamsSchema,
    body: {
      content: { "application/json": { schema: updateAccountRequestSchema } },
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

export const archiveAccountRoute = createRoute({
  method: "delete",
  path: "/{ledgerId}/accounts/{accountId}",
  request: { params: accountParamsSchema },
  responses: {
    200: {
      content: { "application/json": { schema: okResponseSchema } },
      description: "删除成功",
    },
    ...errorResponses,
  },
});

export const accountRouter = new OpenAPIHono<AppEnv>();

accountRouter.use("*", sameOriginMiddleware);
accountRouter.openapi(getAccountsRoute, getAccountsHandler);
accountRouter.openapi(createAccountRoute, createAccountHandler);
accountRouter.openapi(updateAccountRoute, updateAccountHandler);
accountRouter.openapi(archiveAccountRoute, archiveAccountHandler);
