import type { z } from "@hono/zod-openapi";

import { requireAuthenticatedUserId } from "internal/shared/auth/authContext";
import type { ControllerContext } from "internal/shared/http/controllerContext";
import { revalidateTransactionMutation } from "internal/transaction/adapter/next/revalidate";
import {
  convertTransactionRequestSchema,
  createTransactionRequestSchema,
  transactionIdParamsSchema,
  transactionLedgerQuerySchema,
  updateTransactionRequestSchema,
} from "internal/transaction/schema";

type CreateTransactionRequest = z.infer<
  typeof createTransactionRequestSchema
>;
type UpdateTransactionRequest = z.infer<
  typeof updateTransactionRequestSchema
>;
type ConvertTransactionRequest = z.infer<
  typeof convertTransactionRequestSchema
>;
type TransactionIdParams = z.infer<typeof transactionIdParamsSchema>;
type TransactionLedgerQuery = z.infer<typeof transactionLedgerQuerySchema>;

export const createTransactionHandler = async (
  c: ControllerContext<{ json: CreateTransactionRequest }>,
) => {
  requireAuthenticatedUserId(c.get("requestDependencies").auth);
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

export const updateTransactionHandler = async (
  c: ControllerContext<{
    json: UpdateTransactionRequest;
    param: TransactionIdParams;
  }>,
) => {
  requireAuthenticatedUserId(c.get("requestDependencies").auth);
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

export const convertTransactionHandler = async (
  c: ControllerContext<{
    json: ConvertTransactionRequest;
    param: TransactionIdParams;
  }>,
) => {
  requireAuthenticatedUserId(c.get("requestDependencies").auth);
  await c.get("container").transaction.service.convert({
    ...c.req.valid("json"),
    transactionRecordId: c.req.valid("param").transactionRecordId,
  });
  revalidateTransactionMutation();
  return c.json({ ok: true as const }, 200);
};

export const voidTransactionHandler = async (
  c: ControllerContext<{
    param: TransactionIdParams;
    query: TransactionLedgerQuery;
  }>,
) => {
  requireAuthenticatedUserId(c.get("requestDependencies").auth);
  await c.get("container").transaction.service.void({
    ...c.req.valid("param"),
    ...c.req.valid("query"),
  });
  revalidateTransactionMutation();
  return c.json({ ok: true as const }, 200);
};
