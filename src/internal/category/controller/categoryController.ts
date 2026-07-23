import type { RouteHandler } from "@hono/zod-openapi";
import type { Context } from "hono";

import type { AppEnv } from "internal/appEnv";
import type {
  createCategoryRoute,
  updateCategoryRoute,
  archiveCategoryRoute,
  reorderCategoriesRoute,
} from "internal/category/router";
import { revalidateCategoryMutation } from "internal/category/adapter/next/revalidate";
import { AuthenticationError } from "internal/shared/errors/appError";

function requireUserId(c: Context<AppEnv>): string {
  const auth = c.get("requestDependencies").auth;

  if (!auth.isAuthenticated) {
    throw new AuthenticationError("auth_required", "请先登录。");
  }

  return auth.userId;
}

export const createCategoryHandler: RouteHandler<
  typeof createCategoryRoute,
  AppEnv
> = async (c) => {
  const userId = requireUserId(c);
  const { ledgerId } = c.req.valid("param");

  await c.get("container").category.service.create({
    ...c.req.valid("json"),
    ledgerId,
    userId,
  });
  revalidateCategoryMutation();

  return c.json({ ok: true as const }, 201);
};

export const updateCategoryHandler: RouteHandler<
  typeof updateCategoryRoute,
  AppEnv
> = async (c) => {
  const userId = requireUserId(c);
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

export const archiveCategoryHandler: RouteHandler<
  typeof archiveCategoryRoute,
  AppEnv
> = async (c) => {
  const userId = requireUserId(c);
  const { categoryId, ledgerId } = c.req.valid("param");

  await c
    .get("container")
    .category.service.archive({ categoryId, ledgerId, userId });
  revalidateCategoryMutation();

  return c.json({ ok: true as const }, 200);
};

export const reorderCategoriesHandler: RouteHandler<
  typeof reorderCategoriesRoute,
  AppEnv
> = async (c) => {
  const userId = requireUserId(c);
  const { ledgerId } = c.req.valid("param");

  await c.get("container").category.service.reorder({
    ...c.req.valid("json"),
    ledgerId,
    userId,
  });
  revalidateCategoryMutation();

  return c.json({ ok: true as const }, 200);
};
