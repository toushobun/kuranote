import { createRoute, OpenAPIHono } from "@hono/zod-openapi";
import {
  attachmentSignedReadResponseSchema,
  attachmentUploadResponseSchema,
} from "config/transactionAttachmentResponses";

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
  requestAttachmentUploadHandler,
  confirmAttachmentUploadHandler,
  deleteAttachmentDraftHandler,
  getRecordAttachmentsHandler,
} from "internal/transaction/controller/transactionAttachmentController";
import {
  createTransactionHandler,
  updateTransactionHandler,
  voidTransactionHandler,
} from "internal/transaction/controller/transactionController";
import {
  attachmentIdParamsSchema,
  attachmentUploadRequestSchema,
  merchantEntrySuggestionsQuerySchema,
  merchantEntrySuggestionsSchema,
  frequentMerchantsSchema,
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

/** #1120：签名上传、确认、撤销草稿及记录照片只读签名。 */
export const attachmentUploadRoute = createRoute({
  method: "post",
  path: "/attachments/upload-requests",
  request: {
    body: {
      content: {
        "application/json": { schema: attachmentUploadRequestSchema },
      },
    },
  },
  responses: {
    201: {
      content: {
        "application/json": { schema: attachmentUploadResponseSchema },
      },
      description: "签发大图与缩略图上传 URL",
    },
    ...errorResponses,
  },
});

export const attachmentConfirmRoute = createRoute({
  method: "post",
  path: "/attachments/{attachmentId}/confirm",
  request: {
    params: attachmentIdParamsSchema,
    body: {
      content: { "application/json": { schema: transactionLedgerQuerySchema } },
    },
  },
  responses: {
    200: {
      content: { "application/json": { schema: okResponseSchema } },
      description: "确认照片上传完成",
    },
    ...errorResponses,
  },
});

export const attachmentDraftDeleteRoute = createRoute({
  method: "delete",
  path: "/attachments/{attachmentId}",
  request: {
    params: attachmentIdParamsSchema,
    query: transactionLedgerQuerySchema,
  },
  responses: {
    200: {
      content: { "application/json": { schema: okResponseSchema } },
      description: "取消未认领照片",
    },
    ...errorResponses,
  },
});

export const transactionAttachmentsRoute = createRoute({
  method: "get",
  path: "/{transactionRecordId}/attachments",
  request: {
    params: transactionIdParamsSchema,
    query: transactionLedgerQuerySchema,
  },
  responses: {
    200: {
      content: {
        "application/json": { schema: attachmentSignedReadResponseSchema },
      },
      description: "获取记录照片的短期签名 URL",
    },
    ...readErrorResponses,
  },
});

export const transactionRouter = new OpenAPIHono<AppEnv>();

transactionRouter.use("*", sameOriginMiddleware);
transactionRouter.openapi(createTransactionRoute, createTransactionHandler);
transactionRouter.openapi(updateTransactionRoute, updateTransactionHandler);
transactionRouter.openapi(voidTransactionRoute, voidTransactionHandler);
transactionRouter.openapi(
  attachmentUploadRoute,
  requestAttachmentUploadHandler,
);
transactionRouter.openapi(
  attachmentConfirmRoute,
  confirmAttachmentUploadHandler,
);
transactionRouter.openapi(
  attachmentDraftDeleteRoute,
  deleteAttachmentDraftHandler,
);
transactionRouter.openapi(
  transactionAttachmentsRoute,
  getRecordAttachmentsHandler,
);

transactionRouter.openapi(frequentMerchantsRoute, frequentMerchantsHandler);
transactionRouter.openapi(
  merchantEntrySuggestionsRoute,
  merchantEntrySuggestionsHandler,
);
