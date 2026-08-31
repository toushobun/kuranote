import { routePaths } from "config/paths";
import {
  getSafeGoogleAuthNextPath,
  googleAuthErrorCodes,
  googleAuthFailureHref,
  type GoogleAuthErrorCode,
  type GoogleAuthSource,
} from "lib/auth/googleOAuth";
import {
  displayNameMaxLength,
  emailMaxLength,
  isValidEmailFormat,
  isValidRegisterPassword,
  passwordMaxLength,
} from "lib/validators/auth";
import {
  registerErrorMessages,
  registerOtpMessages,
} from "internal/auth/errors";
import {
  turnstileTokenMaxLength,
  type AuthSession,
  type AuthUser,
} from "internal/auth/entity/auth";
import { hashAuthOtpEmail } from "internal/auth/otpHash";
import type { AuthRepository } from "internal/auth/repository/authRepository";
import type { AuthSecurityRepository } from "internal/auth/repository/authSecurityRepository";
import type { TurnstileRepository } from "internal/auth/repository/turnstileRepository";
import {
  AuthenticationError,
  AuthorizationError,
  ConflictError,
  RateLimitError,
  RepositoryError,
  ValidationError,
} from "internal/shared/errors/appError";
import type { Logger } from "internal/shared/logging/logger";
import type { UserDisplayNameSyncService } from "internal/user";

function toSafeUnexpectedErrorContext(error: unknown): { errorName: string } {
  return { errorName: error instanceof Error ? error.name : "unknown" };
}

const maxRegisterOtpVerifyFailures = 5;
export const registerOtpCooldownSeconds = 60;
const hourWindowSeconds = 60 * 60;
const dayWindowSeconds = 24 * hourWindowSeconds;
const emailHourLimit = 5;
const emailDayLimit = 10;
const ipHourLimit = 20;
const ipDayLimit = 100;
const emailSendLookupLimit = emailDayLimit + 1;
const ipSendLookupLimit = ipDayLimit + 1;
const availabilityCheckMinuteLimit = 10;
const availabilityCheckHourLimit = 100;
const availabilityCheckLookupLimit = availabilityCheckHourLimit + 1;

export type RegisterInput = {
  displayName: string;
  email: string;
  password: string;
  passwordConfirm: string;
};

export type RequestRegisterOtpInput = RegisterInput & {
  ipHash: string | null;
  isResend: boolean;
  remoteIp: string | null;
  turnstileToken: string;
};

export type SubmitRegisterOtpInput = {
  email: string;
  ipHash: string | null;
  token: string;
};

export type GoogleAuthStartResult =
  | { failureHref: string; ok: false }
  | { ok: true; providerUrl: string };

export type GoogleAuthCallbackInput = {
  code: string | null;
  nextPath: string;
  providerError: string | null;
  source: GoogleAuthSource;
};

export interface AuthService {
  checkRegisterEmailAvailability(input: {
    email: string;
    ipHash: string | null;
  }): Promise<{ available: boolean }>;
  completeGoogleAuth(input: GoogleAuthCallbackInput): Promise<string>;
  getSession(): Promise<AuthSession>;
  login(input: { email: string; password: string }): Promise<void>;
  logout(): Promise<void>;
  requestRegisterOtp(
    input: RequestRegisterOtpInput,
  ): Promise<{ retryAfterSeconds: number }>;
  startGoogleAuth(input: {
    nextPath: string;
    requestOrigin: string | null;
    source: GoogleAuthSource;
  }): Promise<GoogleAuthStartResult>;
  submitRegisterOtp(input: SubmitRegisterOtpInput): Promise<AuthUser>;
}

type AuthServiceDependencies = {
  authRepository: AuthRepository;
  authSecurityRepository: AuthSecurityRepository;
  createUserDisplayNameSyncService: (
    userId: string,
  ) => UserDisplayNameSyncService;
  isGoogleAuthEnabled: () => boolean;
  logger: Logger;
  now?: () => Date;
  turnstileRepository: TurnstileRepository;
};

function toIsoBefore(now: Date, seconds: number): string {
  return new Date(now.getTime() - seconds * 1000).toISOString();
}

function secondsUntil(
  createdAt: string,
  windowSeconds: number,
  now: Date,
): number {
  const expiresAt = new Date(createdAt).getTime() + windowSeconds * 1000;
  return Math.max(0, Math.ceil((expiresAt - now.getTime()) / 1000));
}

function sortTimesAscending(times: string[]): string[] {
  return [...times].sort((left, right) =>
    left < right ? -1 : left > right ? 1 : 0,
  );
}

function getLimitRetryAfterSeconds(
  times: string[],
  limit: number,
  windowSeconds: number,
  now: Date,
): number {
  if (times.length < limit) return 0;

  const expiryIndex = times.length - limit;
  return secondsUntil(times[expiryIndex], windowSeconds, now);
}

function validateRegisterInput(input: RegisterInput): RegisterInput {
  const displayName = input.displayName.trim();
  const email = input.email.trim();

  if (!displayName || !email || !input.password || !input.passwordConfirm) {
    throw new ValidationError(
      "register_fields_required",
      "请输入昵称、邮箱和密码。",
    );
  }
  if (email.length > emailMaxLength) {
    throw new ValidationError(
      "email_too_long",
      `邮箱最多 ${emailMaxLength} 个字符。`,
    );
  }
  if (!isValidEmailFormat(email)) {
    throw new ValidationError("email_invalid", "邮箱格式有误");
  }
  if (displayName.length > displayNameMaxLength) {
    throw new ValidationError(
      "display_name_too_long",
      `昵称最多 ${displayNameMaxLength} 个字符。`,
    );
  }
  if (input.password.length > passwordMaxLength) {
    throw new ValidationError(
      "password_too_long",
      `密码最多 ${passwordMaxLength} 个字符。`,
      { details: { resetPassword: true } },
    );
  }
  if (input.passwordConfirm.length > passwordMaxLength) {
    throw new ValidationError(
      "password_confirm_too_long",
      `确认密码最多 ${passwordMaxLength} 个字符。`,
    );
  }
  if (input.password !== input.passwordConfirm) {
    throw new ValidationError(
      "password_confirmation_mismatch",
      "两次输入的密码不一致。",
    );
  }
  if (!isValidRegisterPassword(input.password)) {
    throw new ValidationError(
      "weak_password",
      registerErrorMessages.weakPassword,
      {
        details: { resetPassword: true },
      },
    );
  }

  return { ...input, displayName, email };
}

function validateResendEmail(emailValue: string): string {
  const email = emailValue.trim();

  if (!email) {
    throw new ValidationError("email_required", "请输入邮箱。");
  }
  if (email.length > emailMaxLength) {
    throw new ValidationError(
      "email_too_long",
      `邮箱最多 ${emailMaxLength} 个字符。`,
    );
  }
  if (!isValidEmailFormat(email)) {
    throw new ValidationError("email_invalid", "邮箱格式有误");
  }

  return email;
}

function validateOtpInput(input: SubmitRegisterOtpInput): {
  email: string;
  token: string;
} {
  const email = input.email.trim();
  const token = input.token.trim();

  if (!email || !token) {
    throw new ValidationError("otp_fields_required", "请输入邮箱和验证码。");
  }
  if (email.length > emailMaxLength) {
    throw new ValidationError(
      "email_too_long",
      `邮箱最多 ${emailMaxLength} 个字符。`,
    );
  }
  if (!isValidEmailFormat(email)) {
    throw new ValidationError("email_invalid", "邮箱格式有误");
  }
  if (!/^\d{6}$/.test(token)) {
    throw new ValidationError("otp_format_invalid", "请输入 6 位数字验证码");
  }

  return { email, token };
}

function validateTurnstileToken(token: string): string {
  if (!token || token.length > turnstileTokenMaxLength) {
    throw new ValidationError(
      "turnstile_failed",
      registerOtpMessages.turnstileFailed,
    );
  }

  return token;
}

function requireTrustedIpHash(ipHash: string | null, logger: Logger): string {
  if (!ipHash) {
    logger.warn("[auth] trusted IP hash is unavailable");
    throw new RepositoryError(
      "trusted_ip_unavailable",
      registerOtpMessages.serviceError,
    );
  }

  return ipHash;
}

function throwForRegisterFailure(
  reason:
    | "duplicate_email"
    | "invalid_email"
    | "weak_password"
    | "signup_disabled"
    | "failed",
): never {
  if (reason === "duplicate_email") {
    throw new ConflictError(
      "email_exists",
      registerErrorMessages.duplicateEmail,
    );
  }
  if (reason === "invalid_email") {
    throw new ValidationError(
      "email_invalid",
      registerErrorMessages.invalidEmail,
    );
  }
  if (reason === "weak_password") {
    throw new ValidationError(
      "weak_password",
      registerErrorMessages.weakPassword,
      {
        details: { resetPassword: true },
      },
    );
  }
  if (reason === "signup_disabled") {
    throw new AuthorizationError(
      "signup_disabled",
      registerErrorMessages.signupDisabled,
    );
  }

  throw new ValidationError("register_failed", registerErrorMessages.fallback);
}

function getRequestOrigin(value: string | null): string | null {
  if (!value) return null;

  try {
    const url = new URL(value);

    if (url.protocol !== "http:" && url.protocol !== "https:") return null;
    if (url.username || url.password) return null;
    if (url.pathname !== "/" || url.search || url.hash) return null;

    return url.origin;
  } catch {
    return null;
  }
}

export function createAuthService({
  authRepository,
  authSecurityRepository,
  createUserDisplayNameSyncService,
  isGoogleAuthEnabled,
  logger,
  now: getNow = () => new Date(),
  turnstileRepository,
}: AuthServiceDependencies): AuthService {
  async function loadEmailAvailability(email: string): Promise<boolean> {
    return authSecurityRepository.isRegisterEmailAvailable(email);
  }

  async function checkSendRateLimit(input: {
    emailHash: string;
    ipHash: string;
  }): Promise<number> {
    const now = getNow();
    const hourStartIso = toIsoBefore(now, hourWindowSeconds);
    const dayStartIso = toIsoBefore(now, dayWindowSeconds);
    const [emailTimesRaw, ipTimesRaw] = await Promise.all([
      authSecurityRepository.listSuccessfulSendTimes({
        dimension: "email_hash",
        hash: input.emailHash,
        limit: emailSendLookupLimit,
        purpose: "signup",
        since: dayStartIso,
      }),
      authSecurityRepository.listSuccessfulSendTimes({
        dimension: "ip_hash",
        hash: input.ipHash,
        limit: ipSendLookupLimit,
        purpose: "signup",
        since: dayStartIso,
      }),
    ]);
    const emailTimes = sortTimesAscending(emailTimesRaw);
    const ipTimes = sortTimesAscending(ipTimesRaw);

    return Math.max(
      emailTimes.length > 0
        ? secondsUntil(
            emailTimes[emailTimes.length - 1],
            registerOtpCooldownSeconds,
            now,
          )
        : 0,
      getLimitRetryAfterSeconds(
        emailTimes.filter((time) => time >= hourStartIso),
        emailHourLimit,
        hourWindowSeconds,
        now,
      ),
      getLimitRetryAfterSeconds(
        emailTimes,
        emailDayLimit,
        dayWindowSeconds,
        now,
      ),
      getLimitRetryAfterSeconds(
        ipTimes.filter((time) => time >= hourStartIso),
        ipHourLimit,
        hourWindowSeconds,
        now,
      ),
      getLimitRetryAfterSeconds(ipTimes, ipDayLimit, dayWindowSeconds, now),
    );
  }

  async function checkAvailabilityRateLimit(ipHash: string): Promise<number> {
    const now = getNow();
    const hourStartIso = toIsoBefore(now, hourWindowSeconds);
    const minuteStartIso = toIsoBefore(now, registerOtpCooldownSeconds);
    const times = sortTimesAscending(
      await authSecurityRepository.listAvailabilityCheckTimes({
        ipHash,
        limit: availabilityCheckLookupLimit,
        purpose: "signup",
        since: hourStartIso,
      }),
    );

    return Math.max(
      getLimitRetryAfterSeconds(
        times.filter((time) => time >= minuteStartIso),
        availabilityCheckMinuteLimit,
        registerOtpCooldownSeconds,
        now,
      ),
      getLimitRetryAfterSeconds(
        times,
        availabilityCheckHourLimit,
        hourWindowSeconds,
        now,
      ),
    );
  }

  return {
    async checkRegisterEmailAvailability(input) {
      const email = validateResendEmail(input.email);
      const ipHash = requireTrustedIpHash(input.ipHash, logger);
      const retryAfterSeconds = await checkAvailabilityRateLimit(ipHash);

      if (retryAfterSeconds > 0) {
        throw new RateLimitError(
          "email_availability_rate_limited",
          registerErrorMessages.emailCheckRateLimited,
          { details: { retryAfterSeconds } },
        );
      }

      const emailHash = hashAuthOtpEmail(email);

      try {
        const available = await loadEmailAvailability(email);
        await authSecurityRepository.recordAttempt({
          attemptType: "availability_check",
          emailHash,
          ipHash,
          purpose: "signup",
          result: "success",
        });
        return { available };
      } catch (error) {
        await authSecurityRepository
          .recordAttempt({
            attemptType: "availability_check",
            emailHash,
            ipHash,
            purpose: "signup",
            result: "failed",
          })
          .catch(() => undefined);
        throw error;
      }
    },

    async completeGoogleAuth(input) {
      const safeNextPath = getSafeGoogleAuthNextPath(input.nextPath);
      const failure = (code: GoogleAuthErrorCode) =>
        googleAuthFailureHref(input.source, code, safeNextPath);

      if (!isGoogleAuthEnabled()) {
        return failure(googleAuthErrorCodes.startFailed);
      }
      if (input.providerError) {
        return failure(
          input.providerError === "access_denied"
            ? googleAuthErrorCodes.cancelled
            : googleAuthErrorCodes.callbackFailed,
        );
      }
      if (!input.code) return failure(googleAuthErrorCodes.callbackFailed);

      const exchanged = await authRepository.exchangeOAuthCode(input.code);
      return exchanged
        ? safeNextPath
        : failure(googleAuthErrorCodes.callbackFailed);
    },

    async getSession() {
      const user = await authRepository.getCurrentUser();
      return user
        ? { authenticated: true, user }
        : { authenticated: false, user: null };
    },

    async login(input) {
      const email = input.email.trim();

      if (!email || !input.password) {
        throw new ValidationError(
          "login_fields_required",
          "请输入邮箱和密码。",
        );
      }

      const signedIn = await authRepository.signInWithPassword({
        email,
        password: input.password,
      });

      if (!signedIn) {
        throw new AuthenticationError(
          "invalid_credentials",
          "邮箱或密码不正确。",
        );
      }
    },

    async logout() {
      await authRepository.signOut();
    },

    async requestRegisterOtp(input) {
      const normalized = input.isResend
        ? {
            displayName: input.displayName.trim(),
            email: validateResendEmail(input.email),
            password: input.password,
            passwordConfirm: input.passwordConfirm,
          }
        : validateRegisterInput(input);
      const ipHash = requireTrustedIpHash(input.ipHash, logger);
      const turnstileToken = validateTurnstileToken(input.turnstileToken);
      const emailHash = hashAuthOtpEmail(normalized.email);
      const retryAfterSeconds = await checkSendRateLimit({ emailHash, ipHash });

      if (retryAfterSeconds > 0) {
        await authSecurityRepository.recordAttempt({
          attemptType: "send",
          emailHash,
          ipHash,
          purpose: "signup",
          result: "blocked",
        });
        throw new RateLimitError(
          "otp_send_rate_limited",
          registerOtpMessages.rateLimited,
          { details: { retryAfterSeconds } },
        );
      }

      const turnstilePassed = await turnstileRepository.verify({
        remoteIp: input.remoteIp,
        token: turnstileToken,
      });

      if (!turnstilePassed) {
        throw new ValidationError(
          "turnstile_failed",
          registerOtpMessages.turnstileFailed,
        );
      }

      if (!input.isResend && !(await loadEmailAvailability(normalized.email))) {
        throw new ConflictError(
          "email_exists",
          registerErrorMessages.duplicateEmail,
        );
      }

      const result = input.isResend
        ? await authRepository.resendSignUpOtp(normalized.email)
        : await authRepository.signUp({
            displayName: normalized.displayName,
            email: normalized.email,
            password: normalized.password,
          });

      if (!result.ok) {
        await authSecurityRepository.recordAttempt({
          attemptType: "send",
          emailHash,
          ipHash,
          purpose: "signup",
          result: result.reason === "rate_limited" ? "blocked" : "failed",
        });

        if (result.reason === "rate_limited") {
          throw new RateLimitError(
            "supabase_otp_send_rate_limited",
            registerOtpMessages.rateLimited,
            { details: { retryAfterSeconds: registerOtpCooldownSeconds } },
          );
        }
        throwForRegisterFailure(result.reason);
      }

      await authSecurityRepository.recordAttempt({
        attemptType: "send",
        emailHash,
        ipHash,
        purpose: "signup",
        result: "success",
      });

      return { retryAfterSeconds: registerOtpCooldownSeconds };
    },

    async startGoogleAuth(input) {
      const safeNextPath = getSafeGoogleAuthNextPath(input.nextPath);
      const failureHref = googleAuthFailureHref(
        input.source,
        googleAuthErrorCodes.startFailed,
        safeNextPath,
      );

      if (!isGoogleAuthEnabled()) return { failureHref, ok: false };

      const requestOrigin = getRequestOrigin(input.requestOrigin);
      if (!requestOrigin) return { failureHref, ok: false };

      const callbackUrl = new URL(routePaths.authCallback, requestOrigin);
      callbackUrl.searchParams.set("source", input.source);
      callbackUrl.searchParams.set("next", safeNextPath);

      const providerUrl = await authRepository.startGoogleOAuth(
        callbackUrl.toString(),
      );

      return providerUrl
        ? { ok: true, providerUrl }
        : { failureHref, ok: false };
    },

    async submitRegisterOtp(input) {
      const normalized = validateOtpInput(input);
      const ipHash = requireTrustedIpHash(input.ipHash, logger);
      const emailHash = hashAuthOtpEmail(normalized.email);
      const now = getNow();
      const latestSendAt =
        await authSecurityRepository.findLatestSuccessfulSendAt({
          emailHash,
          purpose: "signup",
          since: toIsoBefore(now, dayWindowSeconds),
        });
      const failureCount = latestSendAt
        ? await authSecurityRepository.countVerifyFailuresAfter({
            emailHash,
            since: latestSendAt,
          })
        : 0;

      if (failureCount >= maxRegisterOtpVerifyFailures) {
        await authSecurityRepository.recordAttempt({
          attemptType: "verify_failure",
          emailHash,
          ipHash,
          purpose: "signup",
          result: "blocked",
        });
        throw new RateLimitError(
          "otp_too_many_attempts",
          registerOtpMessages.tooManyAttempts,
          { details: { remainingAttempts: 0 } },
        );
      }

      const verified = await authRepository.verifySignUpOtp(normalized);

      if (!verified) {
        await authSecurityRepository.recordAttempt({
          attemptType: "verify_failure",
          emailHash,
          ipHash,
          purpose: "signup",
          result: "failed",
        });
        throw new AuthenticationError(
          "otp_invalid",
          registerOtpMessages.invalidOtp,
          {
            details: {
              remainingAttempts: Math.max(
                0,
                maxRegisterOtpVerifyFailures - failureCount - 1,
              ),
            },
          },
        );
      }

      const user = await authRepository.getCurrentUser();
      if (!user) {
        throw new AuthenticationError(
          "session_invalid",
          "登录状态无效，请重新登录。",
        );
      }
      if (!user.displayName || user.displayName.length > displayNameMaxLength) {
        throw new RepositoryError(
          "app_user_sync_failed",
          registerOtpMessages.appUserSyncFailed,
        );
      }

      try {
        await createUserDisplayNameSyncService(user.id).syncDisplayName({
          displayName: user.displayName,
          userId: user.id,
        });
      } catch (error) {
        logger.error(
          "[auth] display name sync after OTP verification failed",
          toSafeUnexpectedErrorContext(error),
        );
        throw new RepositoryError(
          "app_user_sync_failed",
          registerOtpMessages.appUserSyncFailed,
        );
      }

      return user;
    },
  };
}
