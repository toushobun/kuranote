import { createRoute, OpenAPIHono } from "@hono/zod-openapi";

import type { AppEnv } from "internal/appEnv";
import {
  archiveMerchantAliasHandler,
  archiveMerchantHandler,
  createMerchantAliasHandler,
  createMerchantHandler,
  listMerchantOptionsHandler,
  listMerchantsHandler,
  updateMerchantHandler,
} from "internal/merchant/controller/merchantController";
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
} from "internal/merchant/schema";
import {
  createOpenApiErrorResponses,
  standardMutationErrorStatuses,
} from "internal/shared/http/openApiErrorResponses";
import { sameOriginMiddleware } from "internal/shared/middleware/sameOriginMiddleware";

const errorResponses = createOpenApiErrorResponses(
  errorResponseSchema,
  standardMutationErrorStatuses,
);

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

export const merchantRouter = new OpenAPIHono<AppEnv>();

merchantRouter.use("*", sameOriginMiddleware);
merchantRouter.openapi(listMerchantsRoute, listMerchantsHandler);
merchantRouter.openapi(listMerchantOptionsRoute, listMerchantOptionsHandler);
merchantRouter.openapi(createMerchantRoute, createMerchantHandler);
merchantRouter.openapi(updateMerchantRoute, updateMerchantHandler);
merchantRouter.openapi(archiveMerchantRoute, archiveMerchantHandler);
merchantRouter.openapi(createMerchantAliasRoute, createMerchantAliasHandler);
merchantRouter.openapi(archiveMerchantAliasRoute, archiveMerchantAliasHandler);
