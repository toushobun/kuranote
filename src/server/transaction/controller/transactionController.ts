import { createRoute, type RouteHandler } from "@hono/zod-openapi";
import type { Context } from "hono";

import type { AppEnv } from "server/appEnv";
import { AuthenticationError } from "server/shared/errors/appError";
import { revalidateTransactionMutation } from "server/transaction/adapter/next/revalidate";
import {
  convertTransactionRequestSchema,
  createTransactionRequestSchema,
  errorResponseSchema,
  okResponseSchema,
  transactionIdParamsSchema,
  transactionLedgerQuerySchema,
  updateTransactionRequestSchema,
} from "server/transaction/schema";

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

function requireUserId(c: Context<AppEnv>) {
  const auth = c.get("requestDependencies").auth;
  if (!auth.isAuthenticated) {
    throw new AuthenticationError("auth_required", "请先登录。");
  }
  return auth.userId;
}

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

export const createTransactionHandler: RouteHandler<
  typeof createTransactionRoute,
  AppEnv
> = async (c) => {
  requireUserId(c);
  const input = c.req.valid("json");
  const service = c.get("container").transaction.service;
  if (input.type === "transfer") {
    await service.createTransfer({
      accountId: input.accountId,
      ledgerId: input.ledgerId,
      note: input.note,
      transactionAt: input.transactionAt,
      transferAmount: input.transferAmount,
      transferTargetAccountId: input.transferTargetAccountId,
    });
  } else {
    await service.createNormal(input);
  }
  revalidateTransactionMutation();
  return c.json({ ok: true as const }, 201);
};

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

export const updateTransactionHandler: RouteHandler<
  typeof updateTransactionRoute,
  AppEnv
> = async (c) => {
  requireUserId(c);
  const input = c.req.valid("json");
  const transactionRecordId = c.req.valid("param").transactionRecordId;
  const service = c.get("container").transaction.service;
  if (input.type === "transfer") {
    await service.updateTransfer({
      accountId: input.accountId,
      ledgerId: input.ledgerId,
      note: input.note,
      transactionAt: input.transactionAt,
      transactionRecordId,
      transferAmount: input.transferAmount,
      transferTargetAccountId: input.transferTargetAccountId,
    });
  } else {
    await service.updateNormal({ ...input, transactionRecordId });
  }
  revalidateTransactionMutation();
  return c.json({ ok: true as const }, 200);
};

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

export const convertTransactionHandler: RouteHandler<
  typeof convertTransactionRoute,
  AppEnv
> = async (c) => {
  requireUserId(c);
  await c.get("container").transaction.service.convert({
    ...c.req.valid("json"),
    transactionRecordId: c.req.valid("param").transactionRecordId,
  });
  revalidateTransactionMutation();
  return c.json({ ok: true as const }, 200);
};

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

export const voidTransactionHandler: RouteHandler<
  typeof voidTransactionRoute,
  AppEnv
> = async (c) => {
  requireUserId(c);
  await c.get("container").transaction.service.void({
    ...c.req.valid("param"),
    ...c.req.valid("query"),
  });
  revalidateTransactionMutation();
  return c.json({ ok: true as const }, 200);
};
