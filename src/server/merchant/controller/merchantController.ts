import { createRoute, type RouteHandler } from "@hono/zod-openapi";
import type { Context } from "hono";

import type { AppEnv } from "server/appEnv";
import { revalidateMerchantMutation } from "server/merchant/adapter/next/revalidate";
import {
  createMerchantAliasRequestSchema,
  createMerchantRequestSchema,
  errorResponseSchema,
  merchantAliasIdParamsSchema,
  merchantIdParamsSchema,
  merchantLedgerQuerySchema,
  merchantListQuerySchema,
  merchantListResponseSchema,
  merchantOptionsResponseSchema,
  okResponseSchema,
  updateMerchantRequestSchema,
} from "server/merchant/schema";
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

export const listMerchantsRoute = createRoute({
  method: "get",
  path: "/",
  request: { query: merchantListQuerySchema },
  responses: {
    200: {
      content: { "application/json": { schema: merchantListResponseSchema } },
      description: "读取成功",
    },
    ...errorResponses,
  },
});
export const listMerchantsHandler: RouteHandler<
  typeof listMerchantsRoute,
  AppEnv
> = async (c) => {
  requireUserId(c);
  const { ledgerId, q } = c.req.valid("query");
  const result = await c.get("container").merchant.service.list({
    keyword: q,
    ledgerId,
  });
  return c.json(result, 200);
};

export const listMerchantOptionsRoute = createRoute({
  method: "get",
  path: "/options",
  request: { query: merchantLedgerQuerySchema },
  responses: {
    200: {
      content: {
        "application/json": { schema: merchantOptionsResponseSchema },
      },
      description: "读取成功",
    },
    ...errorResponses,
  },
});
export const listMerchantOptionsHandler: RouteHandler<
  typeof listMerchantOptionsRoute,
  AppEnv
> = async (c) => {
  requireUserId(c);
  const merchants = await c
    .get("container")
    .merchant.service.listActiveOptions(c.req.valid("query"));
  return c.json({ merchants }, 200);
};

export const createMerchantRoute = createRoute({
  method: "post",
  path: "/",
  request: {
    body: {
      content: { "application/json": { schema: createMerchantRequestSchema } },
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
export const createMerchantHandler: RouteHandler<
  typeof createMerchantRoute,
  AppEnv
> = async (c) => {
  requireUserId(c);
  await c.get("container").merchant.service.createMerchant(c.req.valid("json"));
  revalidateMerchantMutation();
  return c.json({ ok: true as const }, 201);
};

export const updateMerchantRoute = createRoute({
  method: "patch",
  path: "/{merchantId}",
  request: {
    params: merchantIdParamsSchema,
    body: {
      content: { "application/json": { schema: updateMerchantRequestSchema } },
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
export const updateMerchantHandler: RouteHandler<
  typeof updateMerchantRoute,
  AppEnv
> = async (c) => {
  requireUserId(c);
  const { merchantId } = c.req.valid("param");
  await c.get("container").merchant.service.updateMerchant({
    ...c.req.valid("json"),
    merchantId,
  });
  revalidateMerchantMutation();
  return c.json({ ok: true as const }, 200);
};

export const archiveMerchantRoute = createRoute({
  method: "delete",
  path: "/{merchantId}",
  request: {
    params: merchantIdParamsSchema,
    query: merchantLedgerQuerySchema,
  },
  responses: {
    200: {
      content: { "application/json": { schema: okResponseSchema } },
      description: "归档成功",
    },
    ...errorResponses,
  },
});
export const archiveMerchantHandler: RouteHandler<
  typeof archiveMerchantRoute,
  AppEnv
> = async (c) => {
  requireUserId(c);
  await c.get("container").merchant.service.archiveMerchant({
    ...c.req.valid("param"),
    ...c.req.valid("query"),
  });
  revalidateMerchantMutation();
  return c.json({ ok: true as const }, 200);
};

export const createMerchantAliasRoute = createRoute({
  method: "post",
  path: "/{merchantId}/aliases",
  request: {
    params: merchantIdParamsSchema,
    body: {
      content: {
        "application/json": { schema: createMerchantAliasRequestSchema },
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
export const createMerchantAliasHandler: RouteHandler<
  typeof createMerchantAliasRoute,
  AppEnv
> = async (c) => {
  requireUserId(c);
  await c.get("container").merchant.service.createAlias({
    ...c.req.valid("json"),
    ...c.req.valid("param"),
  });
  revalidateMerchantMutation();
  return c.json({ ok: true as const }, 201);
};

export const archiveMerchantAliasRoute = createRoute({
  method: "delete",
  path: "/aliases/{aliasId}",
  request: {
    params: merchantAliasIdParamsSchema,
    query: merchantLedgerQuerySchema,
  },
  responses: {
    200: {
      content: { "application/json": { schema: okResponseSchema } },
      description: "归档成功",
    },
    ...errorResponses,
  },
});
export const archiveMerchantAliasHandler: RouteHandler<
  typeof archiveMerchantAliasRoute,
  AppEnv
> = async (c) => {
  requireUserId(c);
  await c.get("container").merchant.service.archiveAlias({
    ...c.req.valid("param"),
    ...c.req.valid("query"),
  });
  revalidateMerchantMutation();
  return c.json({ ok: true as const }, 200);
};
