import type { RouteHandler } from "@hono/zod-openapi";
import type { Context } from "hono";

import { revalidateAccountMutation } from "internal/account/adapter/next/revalidate";
import type { AppEnv } from "internal/appEnv";
import type {
  getAccountsRoute,
  createAccountRoute,
  updateAccountRoute,
  archiveAccountRoute,
} from "internal/account/router";
import { AuthenticationError } from "internal/shared/errors/appError";

function requireUserId(c: Context<AppEnv>): string {
  const auth = c.get("requestDependencies").auth;
  if (!auth.isAuthenticated) {
    throw new AuthenticationError("auth_required", "请先登录。");
  }
  return auth.userId;
}

export const getAccountsHandler: RouteHandler<
  typeof getAccountsRoute,
  AppEnv
> = async (c) => {
  const userId = requireUserId(c);
  const { ledgerId } = c.req.valid("param");
  const view = await c.get("container").account.service.getView({
    ledgerId,
    userId,
  });
  return c.json(view, 200);
};

export const createAccountHandler: RouteHandler<
  typeof createAccountRoute,
  AppEnv
> = async (c) => {
  const userId = requireUserId(c);
  const { ledgerId } = c.req.valid("param");
  const result = await c.get("container").account.service.create({
    ...c.req.valid("json"),
    ledgerId,
    userId,
  });
  revalidateAccountMutation();
  return c.json(result, 201);
};

export const updateAccountHandler: RouteHandler<
  typeof updateAccountRoute,
  AppEnv
> = async (c) => {
  const userId = requireUserId(c);
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

export const archiveAccountHandler: RouteHandler<
  typeof archiveAccountRoute,
  AppEnv
> = async (c) => {
  const userId = requireUserId(c);
  const { accountId, ledgerId } = c.req.valid("param");
  await c.get("container").account.service.archive({
    accountId,
    ledgerId,
    userId,
  });
  revalidateAccountMutation();
  return c.json({ ok: true as const }, 200);
};
