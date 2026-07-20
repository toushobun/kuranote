import { z } from "@hono/zod-openapi";

import {
  googleAuthNextPathMaxLength,
  turnstileTokenMaxLength,
} from "server/auth/entity/auth";

import {
  displayNameMaxLength,
  emailMaxLength,
  passwordMaxLength,
} from "lib/validators/auth";

const emailSchema = z.string().trim().min(1).max(emailMaxLength).email();
const passwordSchema = z.string().min(1).max(passwordMaxLength);
const turnstileTokenSchema = z.string().min(1).max(turnstileTokenMaxLength);

export const loginRequestSchema = z.object({
  email: emailSchema,
  password: passwordSchema,
});

export const registerRequestSchema = z.object({
  displayName: z.string().trim().min(1).max(displayNameMaxLength),
  email: emailSchema,
  password: passwordSchema,
  passwordConfirm: passwordSchema,
});

export const registerRouteRequestSchema = registerRequestSchema.extend({
  turnstileToken: turnstileTokenSchema,
});

export const registerEmailAvailabilityRequestSchema = z.object({
  email: emailSchema,
});

export const requestRegisterOtpRequestSchema = z.object({
  email: emailSchema,
  turnstileToken: turnstileTokenSchema,
});

export const submitRegisterOtpRequestSchema = z.object({
  email: emailSchema,
  token: z.string().regex(/^\d{6}$/),
});

export const startGoogleAuthRequestSchema = z.object({
  nextPath: z.string().max(googleAuthNextPathMaxLength),
  source: z.enum(["login", "register"]),
});

export const okResponseSchema = z.object({ ok: z.literal(true) });

export const emailAvailabilityResponseSchema = z.object({
  available: z.boolean(),
});

export const otpRequestResponseSchema = z.object({
  retryAfterSeconds: z.number().int().nonnegative(),
  sent: z.literal(true),
});

export const googleAuthStartResponseSchema = z.object({
  redirectTo: z.string().url(),
});

export const authUserResponseSchema = z.object({
  displayName: z.string().nullable(),
  email: z.string().email().nullable(),
  id: z.string().uuid(),
});

export const sessionResponseSchema = z.discriminatedUnion("authenticated", [
  z.object({ authenticated: z.literal(false), user: z.null() }),
  z.object({ authenticated: z.literal(true), user: authUserResponseSchema }),
]);

export const errorResponseSchema = z.object({
  error: z.object({
    code: z.string(),
    details: z.unknown().optional(),
    message: z.string(),
    requestId: z.string().optional(),
    status: z.number(),
  }),
});
