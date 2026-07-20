import { createRoute, type RouteHandler } from "@hono/zod-openapi";

import type { AppEnv } from "server/appEnv";
import { hashAuthOtpIp, normalizeAuthOtpIp } from "server/auth/otpHash";
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
} from "server/auth/schema";
import { RepositoryError } from "server/shared/errors/appError";

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

export const loginHandler: RouteHandler<typeof loginRoute, AppEnv> = async (
  c,
) => {
  await c.get("container").auth.service.login(c.req.valid("json"));
  return c.json({ ok: true }, 200);
};

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

export const registerHandler: RouteHandler<
  typeof registerRoute,
  AppEnv
> = async (c) => {
  const input = c.req.valid("json");
  const result = await c.get("container").auth.service.requestRegisterOtp({
    ...input,
    ipHash: hashAuthOtpIp(c.req.raw.headers),
    isResend: false,
    remoteIp: normalizeAuthOtpIp(c.req.raw.headers),
  });

  return c.json(
    { retryAfterSeconds: result.retryAfterSeconds, sent: true as const },
    201,
  );
};

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

export const checkRegisterEmailAvailabilityHandler: RouteHandler<
  typeof checkRegisterEmailAvailabilityRoute,
  AppEnv
> = async (c) => {
  const result = await c
    .get("container")
    .auth.service.checkRegisterEmailAvailability({
      email: c.req.valid("json").email,
      ipHash: hashAuthOtpIp(c.req.raw.headers),
    });
  return c.json(result, 200);
};

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

export const requestRegisterOtpHandler: RouteHandler<
  typeof requestRegisterOtpRoute,
  AppEnv
> = async (c) => {
  const input = c.req.valid("json");
  const result = await c.get("container").auth.service.requestRegisterOtp({
    displayName: "",
    email: input.email,
    ipHash: hashAuthOtpIp(c.req.raw.headers),
    isResend: true,
    password: "",
    passwordConfirm: "",
    remoteIp: normalizeAuthOtpIp(c.req.raw.headers),
    turnstileToken: input.turnstileToken,
  });

  return c.json(
    { retryAfterSeconds: result.retryAfterSeconds, sent: true as const },
    200,
  );
};

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

export const submitRegisterOtpHandler: RouteHandler<
  typeof submitRegisterOtpRoute,
  AppEnv
> = async (c) => {
  const input = c.req.valid("json");
  await c.get("container").auth.service.submitRegisterOtp({
    ...input,
    ipHash: hashAuthOtpIp(c.req.raw.headers),
  });
  return c.json({ ok: true }, 200);
};

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

export const startGoogleAuthHandler: RouteHandler<
  typeof startGoogleAuthRoute,
  AppEnv
> = async (c) => {
  const input = c.req.valid("json");
  const result = await c.get("container").auth.service.startGoogleAuth({
    ...input,
    requestOrigin: c.req.header("origin") ?? null,
  });

  if (!result.ok) {
    throw new RepositoryError(
      "google_auth_start_failed",
      "Google 登录暂时不可用，请稍后重试。",
      { details: { redirectTo: result.failureHref } },
    );
  }

  return c.json({ redirectTo: result.providerUrl }, 200);
};

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

export const getSessionHandler: RouteHandler<
  typeof getSessionRoute,
  AppEnv
> = async (c) =>
  c.json(await c.get("container").auth.service.getSession(), 200);

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

export const logoutHandler: RouteHandler<typeof logoutRoute, AppEnv> = async (
  c,
) => {
  await c.get("container").auth.service.logout();
  return c.json({ ok: true }, 200);
};
