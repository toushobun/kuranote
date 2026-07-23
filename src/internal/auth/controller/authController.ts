import type { RouteHandler } from "@hono/zod-openapi";

import type { AppEnv } from "internal/appEnv";
import type {
  loginRoute,
  registerRoute,
  checkRegisterEmailAvailabilityRoute,
  requestRegisterOtpRoute,
  submitRegisterOtpRoute,
  startGoogleAuthRoute,
  getSessionRoute,
  logoutRoute,
} from "internal/auth/router";
import { hashAuthOtpIp, normalizeAuthOtpIp } from "internal/auth/otpHash";
import { RepositoryError } from "internal/shared/errors/appError";

export const loginHandler: RouteHandler<typeof loginRoute, AppEnv> = async (
  c,
) => {
  await c.get("container").auth.service.login(c.req.valid("json"));
  return c.json({ ok: true }, 200);
};

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

export const getSessionHandler: RouteHandler<
  typeof getSessionRoute,
  AppEnv
> = async (c) =>
  c.json(await c.get("container").auth.service.getSession(), 200);

export const logoutHandler: RouteHandler<typeof logoutRoute, AppEnv> = async (
  c,
) => {
  await c.get("container").auth.service.logout();
  return c.json({ ok: true }, 200);
};
