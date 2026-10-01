import type { User, UserIdentity } from "@supabase/supabase-js";

import type {
  AuthUser,
  RegisterFailureReason,
} from "internal/auth/entity/auth";
import {
  googleIdentityLinkMessages,
  passwordChangeMessages,
} from "internal/auth/errors";
import { RepositoryError } from "internal/shared/errors/appError";
import type { Logger } from "internal/shared/logging/logger";
import type { AuthenticatedSupabaseClient } from "internal/shared/supabase/authenticatedClient";
import { toRepositoryError } from "internal/shared/supabase/repositoryError";

export type SignUpInput = {
  displayName: string;
  email: string;
  password: string;
};

export type SignUpResult =
  | { ok: true }
  | { ok: false; reason: RegisterFailureReason };

export type SendPasswordChangeOtpResult = "sent" | "rate_limited";

export type VerifyPasswordChangeOtpResult =
  | { status: "verified"; userId: string | null }
  | { status: "invalid" }
  | { status: "rate_limited" };

export type UpdatePasswordResult =
  | "updated"
  | "weak_password"
  | "same_password";

/** 当前用户已绑定的登录身份（Supabase auth.identities）。 */
export type AuthIdentity = {
  email: string | null;
  id: string;
  identityId: string;
  provider: string;
  userId: string;
};

export type UnlinkIdentityResult =
  | "unlinked"
  | "email_conflict"
  | "identity_not_found"
  | "single_identity";

export interface AuthRepository {
  exchangeOAuthCode(code: string): Promise<boolean>;
  getCurrentUser(): Promise<AuthUser | null>;
  /** 未登录或会话失效时返回 null。 */
  listCurrentUserIdentities(): Promise<AuthIdentity[] | null>;
  resendSignUpOtp(email: string): Promise<SignUpResult>;
  sendPasswordChangeOtp(email: string): Promise<SendPasswordChangeOtpResult>;
  signInWithPassword(input: {
    email: string;
    password: string;
  }): Promise<boolean>;
  signOut(): Promise<void>;
  signUp(input: SignUpInput): Promise<SignUpResult>;
  startGoogleIdentityLink(redirectTo: string): Promise<string>;
  startGoogleOAuth(redirectTo: string): Promise<string | null>;
  unlinkIdentity(identity: AuthIdentity): Promise<UnlinkIdentityResult>;
  updatePassword(password: string): Promise<UpdatePasswordResult>;
  verifyPasswordChangeOtp(input: {
    email: string;
    token: string;
  }): Promise<VerifyPasswordChangeOtpResult>;
  verifySignUpOtp(input: { email: string; token: string }): Promise<boolean>;
}

function toSafeUnexpectedErrorContext(error: unknown): { errorName: string } {
  return { errorName: error instanceof Error ? error.name : "unknown" };
}

function getErrorCode(error: unknown): string {
  return typeof error === "object" && error !== null && "code" in error
    ? String(error.code ?? "").toLowerCase()
    : "";
}

function getErrorName(error: unknown): string {
  return typeof error === "object" && error !== null && "name" in error
    ? String(error.name ?? "")
    : "";
}

const unauthenticatedUserErrorCodes = new Set([
  "bad_jwt",
  "invalid_jwt",
  "refresh_token_already_used",
  "refresh_token_not_found",
  "session_not_found",
  "user_not_found",
]);

function isUnauthenticatedUserError(error: unknown): boolean {
  const name = getErrorName(error);
  return (
    name === "AuthSessionMissingError" ||
    name === "AuthInvalidJwtError" ||
    unauthenticatedUserErrorCodes.has(getErrorCode(error))
  );
}

function toRegisterFailureReason(error: unknown): RegisterFailureReason {
  const code = getErrorCode(error);

  if (code === "user_already_exists") return "duplicate_email";
  if (code === "invalid_email") return "invalid_email";
  if (code === "weak_password") return "weak_password";
  if (code === "signup_disabled") return "signup_disabled";
  if (code === "over_email_send_rate_limit") return "rate_limited";

  return "failed";
}

function toAuthUser(user: User): AuthUser {
  const displayName =
    typeof user.user_metadata.display_name === "string"
      ? user.user_metadata.display_name.trim() || null
      : null;

  return {
    displayName,
    email: user.email?.trim() || null,
    id: user.id,
  };
}

function toAuthIdentity(identity: UserIdentity): AuthIdentity {
  const email = identity.identity_data?.email;

  return {
    email: typeof email === "string" ? email.trim() || null : null,
    id: identity.id,
    identityId: identity.identity_id,
    provider: identity.provider,
    userId: identity.user_id,
  };
}

export function createSupabaseAuthRepository(
  supabase: AuthenticatedSupabaseClient,
  logger: Logger,
): AuthRepository {
  return {
    async exchangeOAuthCode(code) {
      try {
        const { error } = await supabase.auth.exchangeCodeForSession(code);

        if (error) {
          logger.warn("[auth] OAuth code exchange failed", {
            code: error.code,
          });
          return false;
        }

        return true;
      } catch (error) {
        logger.error(
          "[auth] OAuth code exchange crashed",
          toSafeUnexpectedErrorContext(error),
        );
        throw toRepositoryError(
          "oauth_exchange_failed",
          "Google 登录回调处理失败，请稍后重试。",
        );
      }
    },

    async getCurrentUser() {
      try {
        const { data, error } = await supabase.auth.getUser();

        if (error) {
          if (isUnauthenticatedUserError(error)) {
            logger.warn("[auth] session is unavailable or invalid", {
              code: getErrorCode(error) || undefined,
              errorName: getErrorName(error) || undefined,
            });
            return null;
          }

          logger.error("[auth] session user lookup failed", {
            code: getErrorCode(error) || undefined,
            errorName: getErrorName(error) || undefined,
          });
          throw toRepositoryError(
            "auth_session_load_failed",
            "登录状态读取失败，请稍后重试。",
          );
        }

        return data.user ? toAuthUser(data.user) : null;
      } catch (error) {
        if (error instanceof RepositoryError) throw error;

        logger.error(
          "[auth] session user lookup crashed",
          toSafeUnexpectedErrorContext(error),
        );
        throw toRepositoryError(
          "auth_session_load_failed",
          "登录状态读取失败，请稍后重试。",
        );
      }
    },

    async listCurrentUserIdentities() {
      try {
        // getUserIdentities 内部调用 getUser()，由 Supabase Auth 服务端校验会话。
        const { data, error } = await supabase.auth.getUserIdentities();

        if (!error) return data.identities.map(toAuthIdentity);
        if (isUnauthenticatedUserError(error)) {
          logger.warn("[auth] session is unavailable for identity lookup", {
            code: getErrorCode(error) || undefined,
            errorName: getErrorName(error) || undefined,
          });
          return null;
        }

        logger.error("[auth] identity lookup failed", {
          code: getErrorCode(error) || undefined,
          errorName: getErrorName(error) || undefined,
        });
      } catch (error) {
        logger.error(
          "[auth] identity lookup crashed",
          toSafeUnexpectedErrorContext(error),
        );
      }

      throw toRepositoryError(
        "identity_load_failed",
        googleIdentityLinkMessages.statusLoadFailed,
      );
    },

    async resendSignUpOtp(email) {
      try {
        const { error } = await supabase.auth.resend({ email, type: "signup" });

        return error
          ? { ok: false, reason: toRegisterFailureReason(error) }
          : { ok: true };
      } catch (error) {
        logger.error(
          "[auth] signup OTP resend crashed",
          toSafeUnexpectedErrorContext(error),
        );
        throw toRepositoryError(
          "signup_otp_resend_failed",
          "验证码发送失败，请稍后重试。",
        );
      }
    },

    async sendPasswordChangeOtp(email) {
      try {
        // 只向已存在的账号发送邮箱验证码，不创建新用户。
        const { error } = await supabase.auth.signInWithOtp({
          email,
          options: { shouldCreateUser: false },
        });

        if (!error) return "sent";

        const code = getErrorCode(error);
        if (code === "over_email_send_rate_limit") return "rate_limited";

        logger.error("[auth] password change OTP send failed", {
          code: code || undefined,
        });
      } catch (error) {
        logger.error(
          "[auth] password change OTP send crashed",
          toSafeUnexpectedErrorContext(error),
        );
      }

      throw toRepositoryError(
        "password_change_otp_send_failed",
        passwordChangeMessages.otpSendFailed,
      );
    },

    async signInWithPassword(input) {
      try {
        const { error } = await supabase.auth.signInWithPassword(input);
        return error === null;
      } catch (error) {
        logger.error(
          "[auth] password sign-in crashed",
          toSafeUnexpectedErrorContext(error),
        );
        throw toRepositoryError(
          "login_service_unavailable",
          "登录服务暂时不可用，请稍后重试。",
        );
      }
    },

    async signOut() {
      try {
        const { error } = await supabase.auth.signOut();

        if (error) {
          logger.warn("[auth] sign-out returned an error", {
            code: error.code,
          });
        }
      } catch (error) {
        logger.warn(
          "[auth] sign-out crashed",
          toSafeUnexpectedErrorContext(error),
        );
      }
    },

    async signUp(input) {
      try {
        const { error } = await supabase.auth.signUp({
          email: input.email,
          password: input.password,
          options: { data: { display_name: input.displayName } },
        });

        return error
          ? { ok: false, reason: toRegisterFailureReason(error) }
          : { ok: true };
      } catch (error) {
        logger.error(
          "[auth] signup crashed",
          toSafeUnexpectedErrorContext(error),
        );
        throw toRepositoryError(
          "register_service_unavailable",
          "注册服务暂时不可用，请稍后重试。",
        );
      }
    },

    async startGoogleIdentityLink(redirectTo) {
      try {
        const { data, error } = await supabase.auth.linkIdentity({
          provider: "google",
          options: { redirectTo },
        });

        if (!error && data.url) return data.url;

        // 例如 manual_linking_disabled：只记录稳定 code，不向客户端透出。
        logger.error("[auth] Google identity link start failed", {
          code: getErrorCode(error) || undefined,
        });
      } catch (error) {
        logger.error(
          "[auth] Google identity link start crashed",
          toSafeUnexpectedErrorContext(error),
        );
      }

      throw toRepositoryError(
        "google_identity_link_start_failed",
        googleIdentityLinkMessages.startFailed,
      );
    },

    async startGoogleOAuth(redirectTo) {
      try {
        const { data, error } = await supabase.auth.signInWithOAuth({
          provider: "google",
          options: { redirectTo },
        });

        if (error) {
          logger.warn("[auth] Google OAuth start failed", {
            code: error.code,
          });
          return null;
        }

        return data.url;
      } catch (error) {
        logger.error(
          "[auth] Google OAuth start crashed",
          toSafeUnexpectedErrorContext(error),
        );
        throw toRepositoryError(
          "google_auth_start_failed",
          "Google 登录暂时不可用，请稍后重试。",
        );
      }
    },

    async unlinkIdentity(identity) {
      try {
        // unlinkIdentity 只使用 identity_id，其余字段按 UserIdentity 类型补齐。
        const { error } = await supabase.auth.unlinkIdentity({
          id: identity.id,
          identity_id: identity.identityId,
          provider: identity.provider,
          user_id: identity.userId,
        });

        if (!error) return "unlinked";

        const code = getErrorCode(error);
        if (code === "single_identity_not_deletable") return "single_identity";
        if (code === "identity_not_found") return "identity_not_found";
        if (code === "email_conflict_identity_not_deletable") {
          return "email_conflict";
        }

        logger.error("[auth] identity unlink failed", {
          code: code || undefined,
        });
      } catch (error) {
        logger.error(
          "[auth] identity unlink crashed",
          toSafeUnexpectedErrorContext(error),
        );
      }

      throw toRepositoryError(
        "identity_unlink_failed",
        googleIdentityLinkMessages.unlinkFailed,
      );
    },

    async updatePassword(password) {
      try {
        const { error } = await supabase.auth.updateUser({ password });

        if (!error) return "updated";

        const code = getErrorCode(error);
        if (code === "weak_password") return "weak_password";
        if (code === "same_password") return "same_password";

        logger.error("[auth] password update failed", {
          code: code || undefined,
        });
      } catch (error) {
        logger.error(
          "[auth] password update crashed",
          toSafeUnexpectedErrorContext(error),
        );
      }

      throw toRepositoryError(
        "password_update_failed",
        passwordChangeMessages.passwordUpdateFailed,
      );
    },

    async verifyPasswordChangeOtp(input) {
      try {
        const { data, error } = await supabase.auth.verifyOtp({
          email: input.email,
          token: input.token,
          type: "email",
        });

        if (!error) {
          return { status: "verified", userId: data.user?.id ?? null };
        }

        // Supabase 对错误和过期的验证码都返回 otp_expired，无法区分。
        const code = getErrorCode(error);
        if (code === "otp_expired") return { status: "invalid" };
        if (code === "over_request_rate_limit") {
          return { status: "rate_limited" };
        }

        logger.error("[auth] password change OTP verification failed", {
          code: code || undefined,
        });
      } catch (error) {
        logger.error(
          "[auth] password change OTP verification crashed",
          toSafeUnexpectedErrorContext(error),
        );
      }

      throw toRepositoryError(
        "password_change_otp_verify_failed",
        passwordChangeMessages.passwordUpdateFailed,
      );
    },

    async verifySignUpOtp(input) {
      try {
        const { error } = await supabase.auth.verifyOtp({
          email: input.email,
          token: input.token,
          type: "signup",
        });

        return error === null;
      } catch (error) {
        logger.error(
          "[auth] signup OTP verification crashed",
          toSafeUnexpectedErrorContext(error),
        );
        throw toRepositoryError(
          "signup_otp_verify_failed",
          "验证码校验服务暂时不可用，请稍后重试。",
        );
      }
    },
  };
}
