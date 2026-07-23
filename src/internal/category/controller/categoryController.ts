import type { z } from "@hono/zod-openapi";

import { revalidateCategoryMutation } from "internal/category/adapter/next/revalidate";
import {
  categoryLedgerParamsSchema,
  categoryParamsSchema,
  createCategoryRequestSchema,
  reorderCategoriesRequestSchema,
  updateCategoryRequestSchema,
} from "internal/category/schema";
import { requireAuthenticatedUserId } from "internal/shared/auth/authContext";
import type { ControllerContext } from "internal/shared/http/controllerContext";

type CategoryLedgerParams = z.infer<typeof categoryLedgerParamsSchema>;
type CategoryParams = z.infer<typeof categoryParamsSchema>;
type CreateCategoryRequest = z.infer<typeof createCategoryRequestSchema>;
type UpdateCategoryRequest = z.infer<typeof updateCategoryRequestSchema>;
type ReorderCategoriesRequest = z.infer<
  typeof reorderCategoriesRequestSchema
>;

export const createCategoryHandler = async (
  c: ControllerContext<{
    json: CreateCategoryRequest;
    param: CategoryLedgerParams;
  }>,
) => {
  const userId = requireAuthenticatedUserId(
    c.get("requestDependencies").auth,
  );
  const { ledgerId } = c.req.valid("param");

  await c.get("container").category.service.create({
    ...c.req.valid("json"),
    ledgerId,
    userId,
  });
  revalidateCategoryMutation();

  return c.json({ ok: true as const }, 201);
};

export const updateCategoryHandler = async (
  c: ControllerContext<{
    json: UpdateCategoryRequest;
    param: CategoryParams;
  }>,
) => {
  const userId = requireAuthenticatedUserId(
    c.get("requestDependencies").auth,
  );
  const { categoryId, ledgerId } = c.req.valid("param");

  await c.get("container").category.service.update({
    ...c.req.valid("json"),
    categoryId,
    ledgerId,
    userId,
  });
  revalidateCategoryMutation();

  return c.json({ ok: true as const }, 200);
};

export const archiveCategoryHandler = async (
  c: ControllerContext<{ param: CategoryParams }>,
) => {
  const userId = requireAuthenticatedUserId(
    c.get("requestDependencies").auth,
  );
  const { categoryId, ledgerId } = c.req.valid("param");

  await c
    .get("container")
    .category.service.archive({ categoryId, ledgerId, userId });
  revalidateCategoryMutation();

  return c.json({ ok: true as const }, 200);
};

export const reorderCategoriesHandler = async (
  c: ControllerContext<{
    json: ReorderCategoriesRequest;
    param: CategoryLedgerParams;
  }>,
) => {
  const userId = requireAuthenticatedUserId(
    c.get("requestDependencies").auth,
  );
  const { ledgerId } = c.req.valid("param");

  await c.get("container").category.service.reorder({
    ...c.req.valid("json"),
    ledgerId,
    userId,
  });
  revalidateCategoryMutation();

  return c.json({ ok: true as const }, 200);
};
