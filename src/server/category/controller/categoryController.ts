import { createRoute, type RouteHandler } from "@hono/zod-openapi";
import type { Context } from "hono";

import type { AppEnv } from "server/appEnv";
import { revalidateCategoryMutation } from "server/category/adapter/next/revalidate";
import {
  categoryLedgerParamsSchema,
  categoryParamsSchema,
  createCategoryRequestSchema,
  errorResponseSchema,
  okResponseSchema,
  reorderCategoriesRequestSchema,
  updateCategoryRequestSchema,
} from "server/category/schema";
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

export const createCategoryRoute = createRoute({
  method: "post",
  path: "/{ledgerId}",
  request: {
    params: categoryLedgerParamsSchema,
    body: {
      content: {
        "application/json": { schema: createCategoryRequestSchema },
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

export const createCategoryHandler: RouteHandler<
  typeof createCategoryRoute,
  AppEnv
> = async (c) => {
  const userId = requireUserId(c);
  const { ledgerId } = c.req.valid("param");

  await c.get("container").category.service.create({
    ...c.req.valid("json"),
    ledgerId,
    userId,
  });
  revalidateCategoryMutation();

  return c.json({ ok: true as const }, 201);
};

export const updateCategoryRoute = createRoute({
  method: "patch",
  path: "/{ledgerId}/{categoryId}",
  request: {
    params: categoryParamsSchema,
    body: {
      content: {
        "application/json": { schema: updateCategoryRequestSchema },
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

export const updateCategoryHandler: RouteHandler<
  typeof updateCategoryRoute,
  AppEnv
> = async (c) => {
  const userId = requireUserId(c);
  const { categoryId, ledgerId } = c.req.valid("param");

  await c.get("container").category.service.update({
    ...c.req.valid("json"),
    categoryId,
    ledgerId,
    userId,
  });
  revalidateCategoryMutation();

  return c.json({ ok: true as const }, 200);
};

export const archiveCategoryRoute = createRoute({
  method: "delete",
  path: "/{ledgerId}/{categoryId}",
  request: { params: categoryParamsSchema },
  responses: {
    200: {
      content: { "application/json": { schema: okResponseSchema } },
      description: "归档成功",
    },
    ...errorResponses,
  },
});

export const archiveCategoryHandler: RouteHandler<
  typeof archiveCategoryRoute,
  AppEnv
> = async (c) => {
  const userId = requireUserId(c);
  const { categoryId, ledgerId } = c.req.valid("param");

  await c
    .get("container")
    .category.service.archive({ categoryId, ledgerId, userId });
  revalidateCategoryMutation();

  return c.json({ ok: true as const }, 200);
};

export const reorderCategoriesRoute = createRoute({
  method: "put",
  path: "/{ledgerId}/order",
  request: {
    params: categoryLedgerParamsSchema,
    body: {
      content: {
        "application/json": { schema: reorderCategoriesRequestSchema },
      },
    },
  },
  responses: {
    200: {
      content: { "application/json": { schema: okResponseSchema } },
      description: "排序成功",
    },
    ...errorResponses,
  },
});

export const reorderCategoriesHandler: RouteHandler<
  typeof reorderCategoriesRoute,
  AppEnv
> = async (c) => {
  const userId = requireUserId(c);
  const { ledgerId } = c.req.valid("param");

  await c.get("container").category.service.reorder({
    ...c.req.valid("json"),
    ledgerId,
    userId,
  });
  revalidateCategoryMutation();

  return c.json({ ok: true as const }, 200);
};
