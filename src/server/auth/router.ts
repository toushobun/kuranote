import { OpenAPIHono } from "@hono/zod-openapi";

import type { AppEnv } from "server/appEnv";
import {
  checkRegisterEmailAvailabilityHandler,
  checkRegisterEmailAvailabilityRoute,
  getSessionHandler,
  getSessionRoute,
  loginHandler,
  loginRoute,
  logoutHandler,
  logoutRoute,
  registerHandler,
  registerRoute,
  requestRegisterOtpHandler,
  requestRegisterOtpRoute,
  startGoogleAuthHandler,
  startGoogleAuthRoute,
  submitRegisterOtpHandler,
  submitRegisterOtpRoute,
} from "server/auth/controller/authController";
import { jsonBodySyntaxMiddleware } from "server/shared/middleware/jsonBodySyntaxMiddleware";
import { sameOriginMiddleware } from "server/shared/middleware/sameOriginMiddleware";

export const authRouter = new OpenAPIHono<AppEnv>();

authRouter.use("*", sameOriginMiddleware);
authRouter.use("*", jsonBodySyntaxMiddleware);
authRouter.openapi(loginRoute, loginHandler);
authRouter.openapi(registerRoute, registerHandler);
authRouter.openapi(
  checkRegisterEmailAvailabilityRoute,
  checkRegisterEmailAvailabilityHandler,
);
authRouter.openapi(requestRegisterOtpRoute, requestRegisterOtpHandler);
authRouter.openapi(submitRegisterOtpRoute, submitRegisterOtpHandler);
authRouter.openapi(startGoogleAuthRoute, startGoogleAuthHandler);
authRouter.openapi(getSessionRoute, getSessionHandler);
authRouter.openapi(logoutRoute, logoutHandler);
