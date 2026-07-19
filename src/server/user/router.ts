import { OpenAPIHono } from "@hono/zod-openapi";

import type { AppEnv } from "server/appEnv";
import { sameOriginMiddleware } from "server/shared/middleware/sameOriginMiddleware";
import {
  getCurrentUserProfileHandler,
  getCurrentUserProfileRoute,
  updateCurrentUserProfileHandler,
  updateCurrentUserProfileRoute,
} from "server/user/controller/userController";

export const userRouter = new OpenAPIHono<AppEnv>();

userRouter.use("*", sameOriginMiddleware);
userRouter.openapi(getCurrentUserProfileRoute, getCurrentUserProfileHandler);
userRouter.openapi(
  updateCurrentUserProfileRoute,
  updateCurrentUserProfileHandler,
);
