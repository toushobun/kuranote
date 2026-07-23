import type { RouteHandler } from "@hono/zod-openapi";
import type { Context } from "hono";

import type { AppEnv } from "internal/appEnv";
import type {
  listMerchantsRoute,
  listMerchantOptionsRoute,
  createMerchantRoute,
  updateMerchantRoute,
  archiveMerchantRoute,
  createMerchantAliasRoute,
  archiveMerchantAliasRoute,
} from "internal/merchant/router";
import { revalidateMerchantMutation } from "internal/merchant/adapter/next/revalidate";
import { AuthenticationError } from "internal/shared/errors/appError";

function requireUserId(c: Context<AppEnv>): string {
  const auth = c.get("requestDependencies").auth;
  if (!auth.isAuthenticated) {
    throw new AuthenticationError("auth_required", "请先登录。");
  }
  return auth.userId;
}

export const listMerchantsHandler: RouteHandler<
  typeof listMerchantsRoute,
  AppEnv
> = async (c) => {
  requireUserId(c);
  const { ledgerId, q } = c.req.valid("query");
  const result = await c.get("container").merchant.service.list({
    keyword: q,
    ledgerId,
  });
  return c.json(result, 200);
};

export const listMerchantOptionsHandler: RouteHandler<
  typeof listMerchantOptionsRoute,
  AppEnv
> = async (c) => {
  requireUserId(c);
  const merchants = await c
    .get("container")
    .merchant.service.listActiveOptions(c.req.valid("query"));
  return c.json({ merchants }, 200);
};

export const createMerchantHandler: RouteHandler<
  typeof createMerchantRoute,
  AppEnv
> = async (c) => {
  requireUserId(c);
  await c.get("container").merchant.service.createMerchant(c.req.valid("json"));
  revalidateMerchantMutation();
  return c.json({ ok: true as const }, 201);
};

export const updateMerchantHandler: RouteHandler<
  typeof updateMerchantRoute,
  AppEnv
> = async (c) => {
  requireUserId(c);
  const { merchantId } = c.req.valid("param");
  await c.get("container").merchant.service.updateMerchant({
    ...c.req.valid("json"),
    merchantId,
  });
  revalidateMerchantMutation();
  return c.json({ ok: true as const }, 200);
};

export const archiveMerchantHandler: RouteHandler<
  typeof archiveMerchantRoute,
  AppEnv
> = async (c) => {
  requireUserId(c);
  await c.get("container").merchant.service.archiveMerchant({
    ...c.req.valid("param"),
    ...c.req.valid("query"),
  });
  revalidateMerchantMutation();
  return c.json({ ok: true as const }, 200);
};

export const createMerchantAliasHandler: RouteHandler<
  typeof createMerchantAliasRoute,
  AppEnv
> = async (c) => {
  requireUserId(c);
  await c.get("container").merchant.service.createAlias({
    ...c.req.valid("json"),
    ...c.req.valid("param"),
  });
  revalidateMerchantMutation();
  return c.json({ ok: true as const }, 201);
};

export const archiveMerchantAliasHandler: RouteHandler<
  typeof archiveMerchantAliasRoute,
  AppEnv
> = async (c) => {
  requireUserId(c);
  await c.get("container").merchant.service.archiveAlias({
    ...c.req.valid("param"),
    ...c.req.valid("query"),
  });
  revalidateMerchantMutation();
  return c.json({ ok: true as const }, 200);
};
