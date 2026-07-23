import type { RouteHandler } from "@hono/zod-openapi";
import type { Context } from "hono";

import type { AppEnv } from "internal/appEnv";
import type {
  getCurrentUserProfileRoute,
  updateCurrentUserProfileRoute,
} from "internal/user/router";
import { AuthenticationError } from "internal/shared/errors/appError";
import { revalidateUserProfileMutation } from "internal/user/adapter/next/revalidate";
function requireUserId(c: Context<AppEnv>): string {
  const auth = c.get("requestDependencies").auth;
  if (!auth.isAuthenticated) {
    throw new AuthenticationError("auth_required", "请先登录。");
  }
  return auth.userId;
}

export const getCurrentUserProfileHandler: RouteHandler<
  typeof getCurrentUserProfileRoute,
  AppEnv
> = async (c) => {
  requireUserId(c);
  const profile = await c.get("container").user.service.getCurrentProfile();
  return c.json(profile, 200);
};

export const updateCurrentUserProfileHandler: RouteHandler<
  typeof updateCurrentUserProfileRoute,
  AppEnv
> = async (c) => {
  requireUserId(c);
  const profile = await c
    .get("container")
    .user.service.updateCurrentProfile(c.req.valid("json"));
  revalidateUserProfileMutation();
  return c.json(profile, 200);
};
