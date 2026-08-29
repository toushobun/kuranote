import type { z } from "@hono/zod-openapi";

import { revalidateMerchantMutation } from "internal/merchant/adapter/next/revalidate";
import {
  createMerchantAliasRequestSchema,
  createMerchantRequestSchema,
  merchantAliasParamsSchema,
  merchantIconQuerySchema,
  merchantLedgerParamsSchema,
  merchantListQuerySchema,
  merchantParamsSchema,
  updateMerchantRequestSchema,
} from "internal/merchant/schema";
import { requireAuthenticatedUserId } from "internal/shared/auth/authContext";
import type { ControllerContext } from "internal/shared/http/controllerContext";

type MerchantListQuery = z.infer<typeof merchantListQuerySchema>;
type MerchantLedgerParams = z.infer<typeof merchantLedgerParamsSchema>;
type CreateMerchantRequest = z.infer<typeof createMerchantRequestSchema>;
type MerchantParams = z.infer<typeof merchantParamsSchema>;
type UpdateMerchantRequest = z.infer<typeof updateMerchantRequestSchema>;
type CreateMerchantAliasRequest = z.infer<
  typeof createMerchantAliasRequestSchema
>;
type MerchantAliasParams = z.infer<typeof merchantAliasParamsSchema>;
type MerchantIconQuery = z.infer<typeof merchantIconQuerySchema>;

export const listMerchantsHandler = async (
  c: ControllerContext<{
    param: MerchantLedgerParams;
    query: MerchantListQuery;
  }>,
) => {
  requireAuthenticatedUserId(c.get("requestDependencies").auth);
  const { ledgerId } = c.req.valid("param");
  const { q } = c.req.valid("query");
  const result = await c.get("container").merchant.service.list({
    keyword: q,
    ledgerId,
  });
  return c.json(result, 200);
};

export const listMerchantOptionsHandler = async (
  c: ControllerContext<{ param: MerchantLedgerParams }>,
) => {
  requireAuthenticatedUserId(c.get("requestDependencies").auth);
  const merchants = await c
    .get("container")
    .merchant.service.listActiveOptions(c.req.valid("param"));
  return c.json({ merchants }, 200);
};

export const getMerchantIconHandler = async (
  c: ControllerContext<{
    param: MerchantLedgerParams;
    query: MerchantIconQuery;
  }>,
) => {
  requireAuthenticatedUserId(c.get("requestDependencies").auth);
  const icon = await c.get("container").merchant.service.getMerchantIcon({
    ledgerId: c.req.valid("param").ledgerId,
    websiteUrl: c.req.valid("query").websiteUrl,
  });
  return c.body(icon.bytes, 200, {
    "Cache-Control": "private, max-age=86400",
    "Content-Type": icon.contentType,
    "X-Content-Type-Options": "nosniff",
  });
};

export const createMerchantHandler = async (
  c: ControllerContext<{
    json: CreateMerchantRequest;
    param: MerchantLedgerParams;
  }>,
) => {
  requireAuthenticatedUserId(c.get("requestDependencies").auth);
  await c.get("container").merchant.service.createMerchant({
    ...c.req.valid("json"),
    ...c.req.valid("param"),
  });
  revalidateMerchantMutation();
  return c.json({ ok: true as const }, 201);
};

export const updateMerchantHandler = async (
  c: ControllerContext<{
    json: UpdateMerchantRequest;
    param: MerchantParams;
  }>,
) => {
  requireAuthenticatedUserId(c.get("requestDependencies").auth);
  await c.get("container").merchant.service.updateMerchant({
    ...c.req.valid("json"),
    ...c.req.valid("param"),
  });
  revalidateMerchantMutation();
  return c.json({ ok: true as const }, 200);
};

export const archiveMerchantHandler = async (
  c: ControllerContext<{ param: MerchantParams }>,
) => {
  requireAuthenticatedUserId(c.get("requestDependencies").auth);
  await c
    .get("container")
    .merchant.service.archiveMerchant(c.req.valid("param"));
  revalidateMerchantMutation();
  return c.json({ ok: true as const }, 200);
};

export const createMerchantAliasHandler = async (
  c: ControllerContext<{
    json: CreateMerchantAliasRequest;
    param: MerchantParams;
  }>,
) => {
  requireAuthenticatedUserId(c.get("requestDependencies").auth);
  await c.get("container").merchant.service.createAlias({
    ...c.req.valid("json"),
    ...c.req.valid("param"),
  });
  revalidateMerchantMutation();
  return c.json({ ok: true as const }, 201);
};

export const archiveMerchantAliasHandler = async (
  c: ControllerContext<{ param: MerchantAliasParams }>,
) => {
  requireAuthenticatedUserId(c.get("requestDependencies").auth);
  await c.get("container").merchant.service.archiveAlias(c.req.valid("param"));
  revalidateMerchantMutation();
  return c.json({ ok: true as const }, 200);
};
