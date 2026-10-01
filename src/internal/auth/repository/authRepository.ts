import type { User } from "@supabase/supabase-js";

import type {
  AuthUser,
  RegisterFailureReason,
} from "internal/auth/entity/auth";
import { passwordChangeMessages } from "internal/auth/errors";
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

export interface AuthRepository {
  exchangeOAuthCode(code: string): Promise<boolean>;
  getCurrentUser(): Promise<AuthUser | null>;
  resendSignUpOtp(email: string): Promise<SignUpResult>;
  sendPasswordChangeOtp(email: string): Promise<SendPasswordChangeOtpResult>;
  signInWithPassword(input: {
    email: string;
    password: string;
  }): Promise<boolean>;
  signOut(): Promise<void>;
  signUp(input: SignUpInput): Promise<SignUpResult>;
  startGoogleOAuth(redirectTo: string): Promise<string | null>;
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
