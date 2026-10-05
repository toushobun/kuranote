import { routePaths } from "config/paths";
import {
  getSafeGoogleAuthNextPath,
  googleAuthErrorCodes,
  googleAuthFailureHref,
  googleAuthSources,
  googleIdentityLinkResultHref,
  googleIdentityLinkResults,
  type GoogleAuthErrorCode,
  type GoogleAuthSource,
  type GoogleSignInSource,
} from "lib/auth/googleOAuth";
import {
  displayNameMaxLength,
  emailMaxLength,
  isValidEmailFormat,
  isValidRegisterPassword,
  passwordMaxLength,
} from "lib/validators/auth";
import {
  googleIdentityLinkMessages,
  loginErrorMessages,
  passwordChangeMessages,
  registerErrorMessages,
  registerOtpMessages,
} from "internal/auth/errors";
import {
  turnstileTokenMaxLength,
  type AuthSession,
  type AuthUser,
  type GoogleIdentityStatus,
} from "internal/auth/entity/auth";
import { hashAuthOtpEmail } from "internal/auth/otpHash";
import type {
  AuthIdentity,
  AuthRepository,
} from "internal/auth/repository/authRepository";
import type { AuthSecurityRepository } from "internal/auth/repository/authSecurityRepository";
import type { TurnstileRepository } from "internal/auth/repository/turnstileRepository";
import { changePasswordRequestSchema } from "internal/auth/schema";
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
/** 与 supabase/config.toml 的 [auth.email] max_frequency 保持一致。 */
export const emailOtpCooldownSeconds = 60;
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

export type ChangePasswordInput = {
  password: string;
  passwordConfirm: string;
  token: string;
};

export type GoogleAuthStartResult =
  | { failureHref: string; ok: false }
  | { ok: true; providerUrl: string };

export type GoogleAuthCallbackInput = {
  code: string | null;
  nextPath: string;
  providerError: string | null;
  /** Supabase Auth 回跳时附带的 error_code，例如 identity_already_exists。 */
  providerErrorCode: string | null;
  source: GoogleAuthSource;
};

export interface AuthService {
  changePassword(input: ChangePasswordInput): Promise<void>;
  checkRegisterEmailAvailability(input: {
    email: string;
    ipHash: string | null;
  }): Promise<{ available: boolean }>;
  completeGoogleAuth(input: GoogleAuthCallbackInput): Promise<string>;
  getGoogleIdentityStatus(): Promise<GoogleIdentityStatus>;
  getSession(): Promise<AuthSession>;
  login(input: { email: string; password: string }): Promise<void>;
  logout(): Promise<void>;
  requestPasswordChangeOtp(): Promise<{ retryAfterSeconds: number }>;
  requestRegisterOtp(
    input: RequestRegisterOtpInput,
  ): Promise<{ retryAfterSeconds: number }>;
  startGoogleAuth(input: {
    nextPath: string;
    requestOrigin: string | null;
    source: GoogleSignInSource;
  }): Promise<GoogleAuthStartResult>;
  startGoogleIdentityLink(input: {
    requestOrigin: string | null;
  }): Promise<{ providerUrl: string }>;
  submitRegisterOtp(input: SubmitRegisterOtpInput): Promise<AuthUser>;
  unlinkGoogleIdentity(): Promise<void>;
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
      registerErrorMessages.fieldsRequired,
    );
  }
  if (email.length > emailMaxLength) {
    throw new ValidationError(
      "email_too_long",
      registerErrorMessages.emailTooLong,
    );
  }
  if (!isValidEmailFormat(email)) {
    throw new ValidationError(
      "email_invalid",
      registerErrorMessages.emailFormatInvalid,
    );
  }
  if (displayName.length > displayNameMaxLength) {
    throw new ValidationError(
      "display_name_too_long",
      registerErrorMessages.displayNameTooLong,
    );
  }
  if (input.password.length > passwordMaxLength) {
    throw new ValidationError(
      "password_too_long",
      registerErrorMessages.passwordTooLong,
      { details: { resetPassword: true } },
    );
  }
  if (input.passwordConfirm.length > passwordMaxLength) {
    throw new ValidationError(
      "password_confirm_too_long",
      registerErrorMessages.passwordConfirmTooLong,
    );
  }
  if (input.password !== input.passwordConfirm) {
    throw new ValidationError(
      "password_confirmation_mismatch",
      registerErrorMessages.passwordConfirmationMismatch,
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
    throw new ValidationError(
      "email_required",
      registerErrorMessages.emailRequired,
    );
  }
  if (email.length > emailMaxLength) {
    throw new ValidationError(
      "email_too_long",
      registerErrorMessages.emailTooLong,
    );
  }
  if (!isValidEmailFormat(email)) {
    throw new ValidationError(
      "email_invalid",
      registerErrorMessages.emailFormatInvalid,
    );
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
    throw new ValidationError(
      "otp_fields_required",
      registerOtpMessages.fieldsRequired,
    );
  }
  if (email.length > emailMaxLength) {
    throw new ValidationError(
      "email_too_long",
      registerErrorMessages.emailTooLong,
    );
  }
  if (!isValidEmailFormat(email)) {
    throw new ValidationError(
      "email_invalid",
      registerErrorMessages.emailFormatInvalid,
    );
  }
  if (!/^\d{6}$/.test(token)) {
    throw new ValidationError(
      "otp_format_invalid",
      registerOtpMessages.otpFormatInvalid,
    );
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

/** OAuth 回调地址：登录、注册与绑定共用同一个回调路由，用 source 区分场景。 */
function googleAuthCallbackUrl(
  requestOrigin: string,
  source: GoogleAuthSource,
  nextPath: string,
): string {
  const callbackUrl = new URL(routePaths.authCallback, requestOrigin);
  callbackUrl.searchParams.set("source", source);
  callbackUrl.searchParams.set("next", nextPath);
  return callbackUrl.toString();
}

const googleProvider = "google";
/** Supabase Auth 在该 Google 账号已属于其他用户时回跳的 error_code。 */
const identityAlreadyExistsErrorCode = "identity_already_exists";

function findGoogleIdentity(identities: AuthIdentity[]): AuthIdentity | null {
  return (
    identities.find((identity) => identity.provider === googleProvider) ?? null
  );
}

/**
 * Supabase 只允许在解绑后仍至少保留 1 个身份时解除绑定。
 * 只用 Google 注册的用户设置密码后不会新增 email 身份（GoTrue 默认关闭
 * CreateEmailIdentityOnPasswordSet），因此以身份数量而不是「是否设置过密码」判断。
 */
function hasOtherIdentity(identities: AuthIdentity[]): boolean {
  return identities.length > 1;
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
            emailOtpCooldownSeconds,
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
    const minuteStartIso = toIsoBefore(now, emailOtpCooldownSeconds);
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
        emailOtpCooldownSeconds,
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

  async function requireCurrentUserWithEmail(): Promise<{
    email: string;
    id: string;
  }> {
    const user = await authRepository.getCurrentUser();

    if (!user) {
      throw new AuthenticationError(
        "session_invalid",
        passwordChangeMessages.sessionInvalid,
      );
    }
    if (!user.email) {
      throw new ValidationError(
        "password_change_email_unavailable",
        passwordChangeMessages.emailUnavailable,
      );
    }

    return { email: user.email, id: user.id };
  }

  async function requireCurrentUserIdentities(): Promise<AuthIdentity[]> {
    const identities = await authRepository.listCurrentUserIdentities();

    if (!identities) {
      throw new AuthenticationError(
        "session_invalid",
        googleIdentityLinkMessages.sessionInvalid,
      );
    }

    return identities;
  }

  return {
    async changePassword(input) {
      const parsed = changePasswordRequestSchema.safeParse(input);

      if (!parsed.success) {
        throw new ValidationError(
          "password_change_invalid",
          parsed.error.issues[0]?.message ??
            passwordChangeMessages.passwordUpdateFailed,
        );
      }

      // 验证码只发送到当前登录邮箱，校验时也只使用服务端读取的邮箱。
      const user = await requireCurrentUserWithEmail();
      const verified = await authRepository.verifyPasswordChangeOtp({
        email: user.email,
        token: parsed.data.token,
      });

      if (verified.status === "rate_limited") {
        throw new RateLimitError(
          "password_change_otp_verify_rate_limited",
          passwordChangeMessages.otpVerifyRateLimited,
        );
      }
      if (verified.status === "invalid") {
        throw new ValidationError(
          "password_change_otp_invalid",
          passwordChangeMessages.invalidOtp,
        );
      }
      // 验证码换取的会话必须属于当前登录用户，否则不修改密码。
      if (verified.userId !== user.id) {
        logger.warn("[auth] password change OTP user mismatch");
        // 校验时会话可能已被替换，登出以免停留在非预期账号。
        await authRepository.signOut();
        throw new AuthorizationError(
          "password_change_user_mismatch",
          passwordChangeMessages.userMismatch,
        );
      }

      const updated = await authRepository.updatePassword(parsed.data.password);

      if (updated === "weak_password") {
        throw new ValidationError(
          "weak_password",
          passwordChangeMessages.weakPassword,
        );
      }
      if (updated === "same_password") {
        throw new ValidationError(
          "same_password",
          passwordChangeMessages.samePassword,
        );
      }
    },

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

      const isLink = input.source === googleAuthSources.link;

      if (!isGoogleAuthEnabled()) {
        return failure(googleAuthErrorCodes.startFailed);
      }
      if (
        isLink &&
        input.providerErrorCode === identityAlreadyExistsErrorCode
      ) {
        return googleIdentityLinkResultHref(
          googleIdentityLinkResults.identityAlreadyExists,
        );
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
      if (!exchanged) return failure(googleAuthErrorCodes.callbackFailed);

      return isLink
        ? googleIdentityLinkResultHref(googleIdentityLinkResults.linked)
        : safeNextPath;
    },

    async getGoogleIdentityStatus() {
      const identities = await requireCurrentUserIdentities();
      const googleIdentity = findGoogleIdentity(identities);

      if (!googleIdentity) return { linked: false };

      return {
        email: googleIdentity.email,
        linked: true,
        unlinkDisabledReason: hasOtherIdentity(identities)
          ? null
          : googleIdentityLinkMessages.onlyLoginIdentity,
      };
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
          loginErrorMessages.fieldsRequired,
        );
      }

      const signedIn = await authRepository.signInWithPassword({
        email,
        password: input.password,
      });

      if (!signedIn) {
        throw new AuthenticationError(
          "invalid_credentials",
          loginErrorMessages.invalidCredentials,
        );
      }
    },

    async logout() {
      await authRepository.signOut();
    },

    async requestPasswordChangeOtp() {
      const { email } = await requireCurrentUserWithEmail();
      const result = await authRepository.sendPasswordChangeOtp(email);

      if (result === "rate_limited") {
        throw new RateLimitError(
          "password_change_otp_send_rate_limited",
          passwordChangeMessages.otpSendRateLimited,
          { details: { retryAfterSeconds: emailOtpCooldownSeconds } },
        );
      }

      return { retryAfterSeconds: emailOtpCooldownSeconds };
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
            { details: { retryAfterSeconds: emailOtpCooldownSeconds } },
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

      return { retryAfterSeconds: emailOtpCooldownSeconds };
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

      const providerUrl = await authRepository.startGoogleOAuth(
        googleAuthCallbackUrl(requestOrigin, input.source, safeNextPath),
      );

      return providerUrl
        ? { ok: true, providerUrl }
        : { failureHref, ok: false };
    },

    async startGoogleIdentityLink(input) {
      if (!isGoogleAuthEnabled()) {
        throw new AuthorizationError(
          "google_identity_link_unavailable",
          googleIdentityLinkMessages.unavailable,
        );
      }

      const identities = await requireCurrentUserIdentities();
      if (findGoogleIdentity(identities)) {
        throw new ConflictError(
          "google_identity_already_linked",
          googleIdentityLinkMessages.alreadyLinked,
        );
      }

      const requestOrigin = getRequestOrigin(input.requestOrigin);
      if (!requestOrigin) {
        throw new ValidationError(
          "google_identity_link_origin_invalid",
          googleIdentityLinkMessages.startFailed,
        );
      }

      // 绑定完成后固定回到个人主页，不接受客户端传入的跳转路径。
      const providerUrl = await authRepository.startGoogleIdentityLink(
        googleAuthCallbackUrl(
          requestOrigin,
          googleAuthSources.link,
          routePaths.settingsProfile,
        ),
      );

      return { providerUrl };
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
          registerOtpMessages.sessionInvalid,
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

    async unlinkGoogleIdentity() {
      const identities = await requireCurrentUserIdentities();
      const googleIdentity = findGoogleIdentity(identities);

      const notLinkedError = () =>
        new ConflictError(
          "google_identity_not_linked",
          googleIdentityLinkMessages.notLinked,
        );
      const onlyLoginIdentityError = () =>
        new ValidationError(
          "google_identity_only_login_identity",
          googleIdentityLinkMessages.onlyLoginIdentity,
        );

      if (!googleIdentity) throw notLinkedError();
      if (!hasOtherIdentity(identities)) throw onlyLoginIdentityError();

      const result = await authRepository.unlinkIdentity(googleIdentity);

      // 读取身份后状态可能已变化，以 Supabase 的判定结果为准。
      if (result === "single_identity") throw onlyLoginIdentityError();
      if (result === "identity_not_found") throw notLinkedError();
      if (result === "email_conflict") {
        throw new ConflictError(
          "google_identity_unlink_email_conflict",
          googleIdentityLinkMessages.emailConflict,
        );
      }
    },
  };
}
