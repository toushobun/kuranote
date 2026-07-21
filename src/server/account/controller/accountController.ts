import { createRoute, type RouteHandler } from "@hono/zod-openapi";
import type { Context } from "hono";

import { revalidateAccountMutation } from "server/account/adapter/next/revalidate";
import {
  accountLedgerParamsSchema,
  accountParamsSchema,
  accountsViewResponseSchema,
  createAccountRequestSchema,
  createdAccountResponseSchema,
  errorResponseSchema,
  okResponseSchema,
  updateAccountRequestSchema,
} from "server/account/schema";
import type { AppEnv } from "server/appEnv";
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
  if (!auth.isAuthenticated) {
    throw new AuthenticationError("auth_required", "请先登录。");
  }
  return auth.userId;
}

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

export const getAccountsHandler: RouteHandler<
  typeof getAccountsRoute,
  AppEnv
> = async (c) => {
  const userId = requireUserId(c);
  const { ledgerId } = c.req.valid("param");
  const view = await c.get("container").account.service.getView({
    ledgerId,
    userId,
  });
  return c.json(view, 200);
};

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

export const createAccountHandler: RouteHandler<
  typeof createAccountRoute,
  AppEnv
> = async (c) => {
  const userId = requireUserId(c);
  const { ledgerId } = c.req.valid("param");
  const result = await c.get("container").account.service.create({
    ...c.req.valid("json"),
    ledgerId,
    userId,
  });
  revalidateAccountMutation();
  return c.json(result, 201);
};

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

export const updateAccountHandler: RouteHandler<
  typeof updateAccountRoute,
  AppEnv
> = async (c) => {
  const userId = requireUserId(c);
  const { accountId, ledgerId } = c.req.valid("param");
  await c.get("container").account.service.update({
    ...c.req.valid("json"),
    accountId,
    ledgerId,
    userId,
  });
  revalidateAccountMutation();
  return c.json({ ok: true as const }, 200);
};

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

export const archiveAccountHandler: RouteHandler<
  typeof archiveAccountRoute,
  AppEnv
> = async (c) => {
  const userId = requireUserId(c);
  const { accountId, ledgerId } = c.req.valid("param");
  await c.get("container").account.service.archive({
    accountId,
    ledgerId,
    userId,
  });
  revalidateAccountMutation();
  return c.json({ ok: true as const }, 200);
};
