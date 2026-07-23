import type { RouteHandler } from "@hono/zod-openapi";
import type { Context } from "hono";

import type { AppEnv } from "internal/appEnv";
import type {
  createTransactionRoute,
  updateTransactionRoute,
  convertTransactionRoute,
  voidTransactionRoute,
} from "internal/transaction/router";
import { AuthenticationError } from "internal/shared/errors/appError";
import { revalidateTransactionMutation } from "internal/transaction/adapter/next/revalidate";
function requireUserId(c: Context<AppEnv>) {
  const auth = c.get("requestDependencies").auth;
  if (!auth.isAuthenticated) {
    throw new AuthenticationError("auth_required", "请先登录。");
  }
  return auth.userId;
}

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
