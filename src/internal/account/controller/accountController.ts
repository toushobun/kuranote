import type { z } from "@hono/zod-openapi";

import { revalidateAccountMutation } from "internal/account/adapter/next/revalidate";
import {
  accountLedgerParamsSchema,
  accountParamsSchema,
  createAccountRequestSchema,
  updateAccountRequestSchema,
} from "internal/account/schema";
import { requireAuthenticatedUserId } from "internal/shared/auth/authContext";
import type { ControllerContext } from "internal/shared/http/controllerContext";

type AccountLedgerParams = z.infer<typeof accountLedgerParamsSchema>;
type AccountParams = z.infer<typeof accountParamsSchema>;
type CreateAccountRequest = z.infer<typeof createAccountRequestSchema>;
type UpdateAccountRequest = z.infer<typeof updateAccountRequestSchema>;

export const getAccountsHandler = async (
  c: ControllerContext<{ param: AccountLedgerParams }>,
) => {
  const userId = requireAuthenticatedUserId(
    c.get("requestDependencies").auth,
  );
  const { ledgerId } = c.req.valid("param");
  const view = await c.get("container").account.service.getView({
    ledgerId,
    userId,
  });
  return c.json(view, 200);
};

export const createAccountHandler = async (
  c: ControllerContext<{
    json: CreateAccountRequest;
    param: AccountLedgerParams;
  }>,
) => {
  const userId = requireAuthenticatedUserId(
    c.get("requestDependencies").auth,
  );
  const { ledgerId } = c.req.valid("param");
  const result = await c.get("container").account.service.create({
    ...c.req.valid("json"),
    ledgerId,
    userId,
  });
  revalidateAccountMutation();
  return c.json(result, 201);
};

export const updateAccountHandler = async (
  c: ControllerContext<{
    json: UpdateAccountRequest;
    param: AccountParams;
  }>,
) => {
  const userId = requireAuthenticatedUserId(
    c.get("requestDependencies").auth,
  );
  const { accountId, ledgerId } = c.req.valid("param");
  await c.get("container").account.service.update({
    ...c.req.valid("json"),
    accountId,
    ledgerId,
    userId,
  });
  revalidateAccountMutation();
  return c.json({ ok: true as const }, 200);
};

export const archiveAccountHandler = async (
  c: ControllerContext<{ param: AccountParams }>,
) => {
  const userId = requireAuthenticatedUserId(
    c.get("requestDependencies").auth,
  );
  const { accountId, ledgerId } = c.req.valid("param");
  await c.get("container").account.service.archive({
    accountId,
    ledgerId,
    userId,
  });
  revalidateAccountMutation();
  return c.json({ ok: true as const }, 200);
};
