import { createRoute, OpenAPIHono } from "@hono/zod-openapi";

import type { AppEnv } from "internal/appEnv";
import {
  checkRegisterEmailAvailabilityHandler,
  getSessionHandler,
  loginHandler,
  logoutHandler,
  registerHandler,
  requestRegisterOtpHandler,
  startGoogleAuthHandler,
  submitRegisterOtpHandler,
} from "internal/auth/controller/authController";
import {
  emailAvailabilityResponseSchema,
  errorResponseSchema,
  googleAuthStartResponseSchema,
  loginRequestSchema,
  okResponseSchema,
  otpRequestResponseSchema,
  registerEmailAvailabilityRequestSchema,
  registerRouteRequestSchema,
  requestRegisterOtpRequestSchema,
  sessionResponseSchema,
  startGoogleAuthRequestSchema,
  submitRegisterOtpRequestSchema,
} from "internal/auth/schema";
import { jsonBodySyntaxMiddleware } from "internal/shared/middleware/jsonBodySyntaxMiddleware";
import { sameOriginMiddleware } from "internal/shared/middleware/sameOriginMiddleware";

const errorResponses = {
  400: {
    content: { "application/json": { schema: errorResponseSchema } },
    description: "请求无效",
  },
  401: {
    content: { "application/json": { schema: errorResponseSchema } },
    description: "认证失败",
  },
  403: {
    content: { "application/json": { schema: errorResponseSchema } },
    description: "请求被拒绝",
  },
  409: {
    content: { "application/json": { schema: errorResponseSchema } },
    description: "资源冲突",
  },
  429: {
    content: { "application/json": { schema: errorResponseSchema } },
    description: "请求过于频繁",
  },
  500: {
    content: { "application/json": { schema: errorResponseSchema } },
    description: "服务异常",
  },
} as const;

export const loginRoute = createRoute({
  method: "post",
  path: "/login",
  request: {
    body: { content: { "application/json": { schema: loginRequestSchema } } },
  },
  responses: {
    200: {
      content: { "application/json": { schema: okResponseSchema } },
      description: "登录成功",
    },
    ...errorResponses,
  },
});

export const registerRoute = createRoute({
  method: "post",
  path: "/register",
  request: {
    body: {
      content: { "application/json": { schema: registerRouteRequestSchema } },
    },
  },
  responses: {
    201: {
      content: { "application/json": { schema: otpRequestResponseSchema } },
      description: "注册验证码已发送",
    },
    ...errorResponses,
  },
});

export const checkRegisterEmailAvailabilityRoute = createRoute({
  method: "post",
  path: "/register/email-availability",
  request: {
    body: {
      content: {
        "application/json": { schema: registerEmailAvailabilityRequestSchema },
      },
    },
  },
  responses: {
    200: {
      content: {
        "application/json": { schema: emailAvailabilityResponseSchema },
      },
      description: "邮箱可用性检查完成",
    },
    ...errorResponses,
  },
});

export const requestRegisterOtpRoute = createRoute({
  method: "post",
  path: "/register/otp/request",
  request: {
    body: {
      content: {
        "application/json": { schema: requestRegisterOtpRequestSchema },
      },
    },
  },
  responses: {
    200: {
      content: { "application/json": { schema: otpRequestResponseSchema } },
      description: "验证码已重新发送",
    },
    ...errorResponses,
  },
});

export const submitRegisterOtpRoute = createRoute({
  method: "post",
  path: "/register/otp/verify",
  request: {
    body: {
      content: {
        "application/json": { schema: submitRegisterOtpRequestSchema },
      },
    },
  },
  responses: {
    200: {
      content: { "application/json": { schema: okResponseSchema } },
      description: "验证码校验成功",
    },
    ...errorResponses,
  },
});

export const startGoogleAuthRoute = createRoute({
  method: "post",
  path: "/oauth/google/start",
  request: {
    body: {
      content: {
        "application/json": { schema: startGoogleAuthRequestSchema },
      },
    },
  },
  responses: {
    200: {
      content: {
        "application/json": { schema: googleAuthStartResponseSchema },
      },
      description: "Google OAuth 跳转地址已生成",
    },
    ...errorResponses,
  },
});

export const getSessionRoute = createRoute({
  method: "get",
  path: "/session",
  responses: {
    200: {
      content: { "application/json": { schema: sessionResponseSchema } },
      description: "读取当前 Session",
    },
    ...errorResponses,
  },
});

export const logoutRoute = createRoute({
  method: "delete",
  path: "/session",
  responses: {
    200: {
      content: { "application/json": { schema: okResponseSchema } },
      description: "已退出登录",
    },
    ...errorResponses,
  },
});

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
