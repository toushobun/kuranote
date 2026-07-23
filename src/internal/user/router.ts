import { createRoute, OpenAPIHono } from "@hono/zod-openapi";

import type { AppEnv } from "internal/appEnv";
import {
  createOpenApiErrorResponses,
  protectedMutationErrorStatuses,
} from "internal/shared/http/openApiErrorResponses";
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

const errorResponses = createOpenApiErrorResponses(
  errorResponseSchema,
  protectedMutationErrorStatuses,
);

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
