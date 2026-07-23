import type { z } from "@hono/zod-openapi";

import { requireAuthenticatedUserId } from "internal/shared/auth/authContext";
import type { ControllerContext } from "internal/shared/http/controllerContext";
import { revalidateUserProfileMutation } from "internal/user/adapter/next/revalidate";
import { updateUserProfileRequestSchema } from "internal/user/schema";

type UpdateUserProfileRequest = z.infer<
  typeof updateUserProfileRequestSchema
>;

export const getCurrentUserProfileHandler = async (c: ControllerContext) => {
  requireAuthenticatedUserId(c.get("requestDependencies").auth);
  const profile = await c.get("container").user.service.getCurrentProfile();
  return c.json(profile, 200);
};

export const updateCurrentUserProfileHandler = async (
  c: ControllerContext<{ json: UpdateUserProfileRequest }>,
) => {
  requireAuthenticatedUserId(c.get("requestDependencies").auth);
  const profile = await c
    .get("container")
    .user.service.updateCurrentProfile(c.req.valid("json"));
  revalidateUserProfileMutation();
  return c.json(profile, 200);
};
