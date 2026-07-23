import type { z } from "@hono/zod-openapi";

import { revalidateMerchantMutation } from "internal/merchant/adapter/next/revalidate";
import {
  createMerchantAliasRequestSchema,
  createMerchantRequestSchema,
  merchantAliasIdParamsSchema,
  merchantIdParamsSchema,
  merchantLedgerQuerySchema,
  merchantListQuerySchema,
  updateMerchantRequestSchema,
} from "internal/merchant/schema";
import { requireAuthenticatedUserId } from "internal/shared/auth/authContext";
import type { ControllerContext } from "internal/shared/http/controllerContext";

type MerchantListQuery = z.infer<typeof merchantListQuerySchema>;
type MerchantLedgerQuery = z.infer<typeof merchantLedgerQuerySchema>;
type CreateMerchantRequest = z.infer<typeof createMerchantRequestSchema>;
type MerchantIdParams = z.infer<typeof merchantIdParamsSchema>;
type UpdateMerchantRequest = z.infer<typeof updateMerchantRequestSchema>;
type CreateMerchantAliasRequest = z.infer<
  typeof createMerchantAliasRequestSchema
>;
type MerchantAliasIdParams = z.infer<typeof merchantAliasIdParamsSchema>;

export const listMerchantsHandler = async (
  c: ControllerContext<{ query: MerchantListQuery }>,
) => {
  requireAuthenticatedUserId(c.get("requestDependencies").auth);
  const { ledgerId, q } = c.req.valid("query");
  const result = await c.get("container").merchant.service.list({
    keyword: q,
    ledgerId,
  });
  return c.json(result, 200);
};

export const listMerchantOptionsHandler = async (
  c: ControllerContext<{ query: MerchantLedgerQuery }>,
) => {
  requireAuthenticatedUserId(c.get("requestDependencies").auth);
  const merchants = await c
    .get("container")
    .merchant.service.listActiveOptions(c.req.valid("query"));
  return c.json({ merchants }, 200);
};

export const createMerchantHandler = async (
  c: ControllerContext<{ json: CreateMerchantRequest }>,
) => {
  requireAuthenticatedUserId(c.get("requestDependencies").auth);
  await c.get("container").merchant.service.createMerchant(c.req.valid("json"));
  revalidateMerchantMutation();
  return c.json({ ok: true as const }, 201);
};

export const updateMerchantHandler = async (
  c: ControllerContext<{
    json: UpdateMerchantRequest;
    param: MerchantIdParams;
  }>,
) => {
  requireAuthenticatedUserId(c.get("requestDependencies").auth);
  const { merchantId } = c.req.valid("param");
  await c.get("container").merchant.service.updateMerchant({
    ...c.req.valid("json"),
    merchantId,
  });
  revalidateMerchantMutation();
  return c.json({ ok: true as const }, 200);
};

export const archiveMerchantHandler = async (
  c: ControllerContext<{
    param: MerchantIdParams;
    query: MerchantLedgerQuery;
  }>,
) => {
  requireAuthenticatedUserId(c.get("requestDependencies").auth);
  await c.get("container").merchant.service.archiveMerchant({
    ...c.req.valid("param"),
    ...c.req.valid("query"),
  });
  revalidateMerchantMutation();
  return c.json({ ok: true as const }, 200);
};

export const createMerchantAliasHandler = async (
  c: ControllerContext<{
    json: CreateMerchantAliasRequest;
    param: MerchantIdParams;
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
  c: ControllerContext<{
    param: MerchantAliasIdParams;
    query: MerchantLedgerQuery;
  }>,
) => {
  requireAuthenticatedUserId(c.get("requestDependencies").auth);
  await c.get("container").merchant.service.archiveAlias({
    ...c.req.valid("param"),
    ...c.req.valid("query"),
  });
  revalidateMerchantMutation();
  return c.json({ ok: true as const }, 200);
};
