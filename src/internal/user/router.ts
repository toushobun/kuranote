import { createRoute, OpenAPIHono } from "@hono/zod-openapi";

import type { AppEnv } from "internal/appEnv";
import { sameOriginMiddleware } from "internal/shared/middleware/sameOriginMiddleware";
import {
  getCurrentUserProfileHandler,
  updateCurrentUserProfileHandler,
} from "internal/user/controller/userController";
import {
  errorResponseSchema,
  updateUserProfileRequestSchema,
  userProfileResponseSchema,
} from "internal/user/schema";

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

export const userRouter = new OpenAPIHono<AppEnv>();

userRouter.use("*", sameOriginMiddleware);
userRouter.openapi(getCurrentUserProfileRoute, getCurrentUserProfileHandler);
userRouter.openapi(
  updateCurrentUserProfileRoute,
  updateCurrentUserProfileHandler,
);
