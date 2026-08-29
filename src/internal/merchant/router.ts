import { createRoute, OpenAPIHono, z } from "@hono/zod-openapi";

import type { AppEnv } from "internal/appEnv";
import {
  archiveMerchantAliasHandler,
  archiveMerchantHandler,
  createMerchantAliasHandler,
  createMerchantHandler,
  getMerchantIconHandler,
  listMerchantOptionsHandler,
  listMerchantsHandler,
  updateMerchantHandler,
} from "internal/merchant/controller/merchantController";
import {
  createMerchantAliasRequestSchema,
  createMerchantRequestSchema,
  errorResponseSchema,
  merchantAliasParamsSchema,
  merchantLedgerParamsSchema,
  merchantIconQuerySchema,
  merchantListQuerySchema,
  merchantListResponseSchema,
  merchantOptionsResponseSchema,
  merchantParamsSchema,
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
  path: "/{ledgerId}/merchants",
  request: {
    params: merchantLedgerParamsSchema,
    query: merchantListQuerySchema,
  },
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
  path: "/{ledgerId}/merchants/options",
  request: { params: merchantLedgerParamsSchema },
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

export const getMerchantIconRoute = createRoute({
  method: "get",
  path: "/{ledgerId}/merchants/icon",
  request: {
    params: merchantLedgerParamsSchema,
    query: merchantIconQuerySchema,
  },
  responses: {
    200: {
      content: {
        "application/octet-stream": {
          schema: z.string().openapi({ format: "binary" }),
        },
      },
      description: "头像读取成功",
    },
    ...errorResponses,
  },
});

export const createMerchantRoute = createRoute({
  method: "post",
  path: "/{ledgerId}/merchants",
  request: {
    params: merchantLedgerParamsSchema,
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
  path: "/{ledgerId}/merchants/{merchantId}",
  request: {
    params: merchantParamsSchema,
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
  path: "/{ledgerId}/merchants/{merchantId}",
  request: { params: merchantParamsSchema },
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
  path: "/{ledgerId}/merchants/{merchantId}/aliases",
  request: {
    params: merchantParamsSchema,
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
  path: "/{ledgerId}/merchants/aliases/{aliasId}",
  request: { params: merchantAliasParamsSchema },
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
merchantRouter.openapi(getMerchantIconRoute, getMerchantIconHandler);
merchantRouter.openapi(createMerchantRoute, createMerchantHandler);
merchantRouter.openapi(updateMerchantRoute, updateMerchantHandler);
merchantRouter.openapi(archiveMerchantRoute, archiveMerchantHandler);
merchantRouter.openapi(createMerchantAliasRoute, createMerchantAliasHandler);
merchantRouter.openapi(archiveMerchantAliasRoute, archiveMerchantAliasHandler);
