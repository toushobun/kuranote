import { createRoute, type RouteHandler } from "@hono/zod-openapi";
import type { Context } from "hono";

import type { AppEnv } from "server/appEnv";
import { AuthenticationError } from "server/shared/errors/appError";
import { revalidateUserProfileMutation } from "server/user/adapter/next/revalidate";
import {
  errorResponseSchema,
  updateUserProfileRequestSchema,
  userProfileResponseSchema,
} from "server/user/schema";

const errorResponses = {
  400: {
    content: { "application/json": { schema: errorResponseSchema } },
    description: "请求无效",
  },
  401: {
    content: { "application/json": { schema: errorResponseSchema } },
    description: "未登录",
  },
  403: {
    content: { "application/json": { schema: errorResponseSchema } },
    description: "无权限",
  },
  404: {
    content: { "application/json": { schema: errorResponseSchema } },
    description: "资源不存在",
  },
  500: {
    content: { "application/json": { schema: errorResponseSchema } },
    description: "服务异常",
  },
} as const;

function requireUserId(c: Context<AppEnv>): string {
  const auth = c.get("requestDependencies").auth;
  if (!auth.isAuthenticated) {
    throw new AuthenticationError("auth_required", "请先登录。");
  }
  return auth.userId;
}

export const getCurrentUserProfileRoute = createRoute({
  method: "get",
  path: "/me",
  responses: {
    200: {
      content: { "application/json": { schema: userProfileResponseSchema } },
      description: "读取成功",
    },
    ...errorResponses,
  },
});

export const getCurrentUserProfileHandler: RouteHandler<
  typeof getCurrentUserProfileRoute,
  AppEnv
> = async (c) => {
  requireUserId(c);
  const profile = await c.get("container").user.service.getCurrentProfile();
  return c.json(profile, 200);
};

export const updateCurrentUserProfileRoute = createRoute({
  method: "patch",
  path: "/me",
  request: {
    body: {
      content: {
        "application/json": { schema: updateUserProfileRequestSchema },
      },
    },
  },
  responses: {
    200: {
      content: { "application/json": { schema: userProfileResponseSchema } },
      description: "更新成功",
    },
    ...errorResponses,
  },
});

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
