import { createRoute, OpenAPIHono } from "@hono/zod-openapi";

import type { AppEnv } from "internal/appEnv";
import {
  archiveCategoryHandler,
  createCategoryHandler,
  reorderCategoriesHandler,
  updateCategoryHandler,
} from "internal/category/controller/categoryController";
import {
  categoryLedgerParamsSchema,
  categoryParamsSchema,
  createCategoryRequestSchema,
  errorResponseSchema,
  okResponseSchema,
  reorderCategoriesRequestSchema,
  updateCategoryRequestSchema,
} from "internal/category/schema";
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

export const categoryRouter = new OpenAPIHono<AppEnv>();

categoryRouter.use("*", sameOriginMiddleware);
categoryRouter.openapi(createCategoryRoute, createCategoryHandler);
categoryRouter.openapi(updateCategoryRoute, updateCategoryHandler);
categoryRouter.openapi(archiveCategoryRoute, archiveCategoryHandler);
categoryRouter.openapi(reorderCategoriesRoute, reorderCategoriesHandler);
