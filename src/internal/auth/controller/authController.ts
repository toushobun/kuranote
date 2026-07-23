import type { z } from "@hono/zod-openapi";

import { hashAuthOtpIp, normalizeAuthOtpIp } from "internal/auth/otpHash";
import {
  loginRequestSchema,
  registerEmailAvailabilityRequestSchema,
  registerRouteRequestSchema,
  requestRegisterOtpRequestSchema,
  startGoogleAuthRequestSchema,
  submitRegisterOtpRequestSchema,
} from "internal/auth/schema";
import { RepositoryError } from "internal/shared/errors/appError";
import type { ControllerContext } from "internal/shared/http/controllerContext";

type LoginRequest = z.infer<typeof loginRequestSchema>;
type RegisterRouteRequest = z.infer<typeof registerRouteRequestSchema>;
type RegisterEmailAvailabilityRequest = z.infer<
  typeof registerEmailAvailabilityRequestSchema
>;
type RequestRegisterOtpRequest = z.infer<
  typeof requestRegisterOtpRequestSchema
>;
type SubmitRegisterOtpRequest = z.infer<typeof submitRegisterOtpRequestSchema>;
type StartGoogleAuthRequest = z.infer<typeof startGoogleAuthRequestSchema>;

export const loginHandler = async (
  c: ControllerContext<{ json: LoginRequest }>,
) => {
  await c.get("container").auth.service.login(c.req.valid("json"));
  return c.json({ ok: true }, 200);
};

export const registerHandler = async (
  c: ControllerContext<{ json: RegisterRouteRequest }>,
) => {
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

export const checkRegisterEmailAvailabilityHandler = async (
  c: ControllerContext<{ json: RegisterEmailAvailabilityRequest }>,
) => {
  const result = await c
    .get("container")
    .auth.service.checkRegisterEmailAvailability({
      email: c.req.valid("json").email,
      ipHash: hashAuthOtpIp(c.req.raw.headers),
    });
  return c.json(result, 200);
};

export const requestRegisterOtpHandler = async (
  c: ControllerContext<{ json: RequestRegisterOtpRequest }>,
) => {
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

export const submitRegisterOtpHandler = async (
  c: ControllerContext<{ json: SubmitRegisterOtpRequest }>,
) => {
  const input = c.req.valid("json");
  await c.get("container").auth.service.submitRegisterOtp({
    ...input,
    ipHash: hashAuthOtpIp(c.req.raw.headers),
  });
  return c.json({ ok: true }, 200);
};

export const startGoogleAuthHandler = async (
  c: ControllerContext<{ json: StartGoogleAuthRequest }>,
) => {
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

export const getSessionHandler = async (c: ControllerContext) =>
  c.json(await c.get("container").auth.service.getSession(), 200);

export const logoutHandler = async (c: ControllerContext) => {
  await c.get("container").auth.service.logout();
  return c.json({ ok: true }, 200);
};
