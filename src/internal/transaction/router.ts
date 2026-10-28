import { createRoute, OpenAPIHono } from "@hono/zod-openapi";

import type { AppEnv } from "internal/appEnv";
import {
  createOpenApiErrorResponses,
  protectedMutationErrorStatuses,
  protectedReadErrorStatuses,
} from "internal/shared/http/openApiErrorResponses";
import { sameOriginMiddleware } from "internal/shared/middleware/sameOriginMiddleware";
import {
  frequentMerchantsHandler,
  merchantEntrySuggestionsHandler,
} from "internal/transaction/controller/merchantEntryController";
import {
  convertTransactionHandler,
  createTransactionHandler,
  updateTransactionHandler,
  voidTransactionHandler,
} from "internal/transaction/controller/transactionController";
import {
  merchantEntrySuggestionsQuerySchema,
  merchantEntrySuggestionsSchema,
  frequentMerchantsSchema,
  convertTransactionRequestSchema,
  createTransactionRequestSchema,
  errorResponseSchema,
  okResponseSchema,
  transactionIdParamsSchema,
  transactionLedgerQuerySchema,
  updateTransactionRequestSchema,
} from "internal/transaction/schema";

const errorResponses = createOpenApiErrorResponses(
  errorResponseSchema,
  protectedMutationErrorStatuses,
);

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

const readErrorResponses = createOpenApiErrorResponses(
  errorResponseSchema,
  protectedReadErrorStatuses,
);
export const frequentMerchantsRoute = createRoute({
  method: "get",
  path: "/frequent-merchants",
  request: { query: transactionLedgerQuerySchema },
  responses: {
    200: {
      content: { "application/json": { schema: frequentMerchantsSchema } },
      description: "常用商家",
    },
    ...readErrorResponses,
  },
});
export const merchantEntrySuggestionsRoute = createRoute({
  method: "get",
  path: "/merchant-entry-suggestions",
  request: { query: merchantEntrySuggestionsQuerySchema },
  responses: {
    200: {
      content: {
        "application/json": { schema: merchantEntrySuggestionsSchema },
      },
      description: "商家记账建议",
    },
    ...readErrorResponses,
  },
});

export const transactionRouter = new OpenAPIHono<AppEnv>();

transactionRouter.use("*", sameOriginMiddleware);
transactionRouter.openapi(createTransactionRoute, createTransactionHandler);
transactionRouter.openapi(updateTransactionRoute, updateTransactionHandler);
transactionRouter.openapi(convertTransactionRoute, convertTransactionHandler);
transactionRouter.openapi(voidTransactionRoute, voidTransactionHandler);

transactionRouter.openapi(frequentMerchantsRoute, frequentMerchantsHandler);
transactionRouter.openapi(
  merchantEntrySuggestionsRoute,
  merchantEntrySuggestionsHandler,
);
