"use server";

import { headers } from "next/headers";
import { redirect } from "next/navigation";

import { routePaths, routeWithQuery } from "config/paths";
import {
  getSafeGoogleAuthNextPath,
  googleAuthErrorCodes,
  googleAuthFailureHref,
  type GoogleAuthSource,
} from "lib/auth/googleOAuth";
import { isSafeNextPath } from "lib/navigation/safeNextPath";
import { hashAuthOtpIp, normalizeAuthOtpIp } from "internal/auth/otpHash";
import {
  registerErrorMessages,
  registerOtpMessages,
} from "internal/auth/errors";
import { createRequestContainer } from "internal/container";
import { createServerRequestDependencies } from "internal/shared/context/createServerRequestDependencies";
import { AppError } from "internal/shared/errors/appError";
import type {
  LoginActionState,
  RegisterEmailAvailabilityState,
  RequestRegisterOtpActionState,
  SubmitRegisterOtpActionState,
} from "types/auth";

function getSafeNextPath(nextPath: string): string {
  return isSafeNextPath(nextPath) ? nextPath : routePaths.dashboard;
}

const loginServiceErrorMessage = "登录服务暂时不可用，请稍后重试。";

function logUnexpectedAdapterError(tag: string, error: unknown): void {
  console.error(tag, {
    errorName: error instanceof Error ? error.name : "unknown",
  });
}

function getNumberDetail(error: AppError, key: string): number | undefined {
  if (
    typeof error.details !== "object" ||
    error.details === null ||
    !(key in error.details)
  ) {
    return undefined;
  }

  const value = (error.details as Record<string, unknown>)[key];
  return typeof value === "number" ? value : undefined;
}

function getBooleanDetail(error: AppError, key: string): boolean | undefined {
  if (
    typeof error.details !== "object" ||
    error.details === null ||
    !(key in error.details)
  ) {
    return undefined;
  }

  const value = (error.details as Record<string, unknown>)[key];
  return typeof value === "boolean" ? value : undefined;
}

async function getAuthService() {
  const dependencies = await createServerRequestDependencies();
  return createRequestContainer(dependencies).auth.service;
}

export async function checkRegisterEmailAvailability(
  email: unknown,
): Promise<RegisterEmailAvailabilityState> {
  if (typeof email !== "string") return { available: false };

  const trimmedEmail = email.trim();
  const requestHeaders = await headers();

  try {
    const result = await (
      await getAuthService()
    ).checkRegisterEmailAvailability({
      email: trimmedEmail,
      ipHash: hashAuthOtpIp(requestHeaders),
    });

    return result.available
      ? { available: true }
      : {
          available: false,
          error: registerErrorMessages.duplicateEmail,
          reason: "email_exists",
        };
  } catch (error) {
    if (!(error instanceof AppError)) {
      logUnexpectedAdapterError(
        "[auth] email availability action failed unexpectedly",
        error,
      );
      return { available: false, error: registerOtpMessages.serviceError };
    }

    if (
      error.code === "email_required" ||
      error.code === "email_too_long" ||
      error.code === "email_invalid"
    ) {
      return { available: false };
    }

    return { available: false, error: error.message };
  }
}

export async function requestRegisterOtp(
  _previousState: RequestRegisterOtpActionState,
  formData: FormData,
): Promise<RequestRegisterOtpActionState> {
  const isResend = formData.get("resend") === "true";
  const requestHeaders = await headers();

  try {
    const result = await (
      await getAuthService()
    ).requestRegisterOtp({
      displayName: String(formData.get("displayName") ?? "").trim(),
      email: String(formData.get("email") ?? "").trim(),
      ipHash: hashAuthOtpIp(requestHeaders),
      isResend,
      password: String(formData.get("password") ?? ""),
      passwordConfirm: String(formData.get("passwordConfirm") ?? ""),
      remoteIp: normalizeAuthOtpIp(requestHeaders),
      turnstileToken: String(formData.get("turnstileToken") ?? ""),
    });

    return {
      resetTurnstile: true,
      retryAfterSeconds: result.retryAfterSeconds,
      status: "success",
      success: registerOtpMessages.success,
    };
  } catch (error) {
    if (!(error instanceof AppError)) {
      logUnexpectedAdapterError(
        "[auth] OTP request action failed unexpectedly",
        error,
      );
      return {
        error: registerOtpMessages.serviceError,
        resetTurnstile: true,
        status: "unknown_error",
      };
    }

    if (error.code === "turnstile_failed") {
      return {
        error: error.message,
        resetTurnstile: true,
        status: "turnstile_failed",
      };
    }
    if (error.code === "otp_send_rate_limited") {
      return {
        error: error.message,
        resetTurnstile: true,
        retryAfterSeconds: getNumberDetail(error, "retryAfterSeconds"),
        status: "rate_limited",
      };
    }
    if (error.code === "supabase_otp_send_rate_limited") {
      return {
        error: error.message,
        resetTurnstile: true,
        status: "send_rate_limited",
      };
    }
    if (error.code === "email_exists") {
      return {
        error: error.message,
        resetTurnstile: true,
        status: "email_unavailable",
      };
    }
    if (
      error.code === "register_fields_required" ||
      error.code === "email_required" ||
      error.code === "email_too_long" ||
      error.code === "email_invalid" ||
      error.code === "display_name_too_long" ||
      error.code === "password_too_long" ||
      error.code === "password_confirm_too_long" ||
      error.code === "password_confirmation_mismatch" ||
      error.code === "weak_password"
    ) {
      return {
        error: error.message,
        ...(getBooleanDetail(error, "resetPassword")
          ? { resetPassword: true }
          : {}),
        resetTurnstile: true,
        status: "validation_error",
      };
    }
    if (error.code === "signup_disabled" || error.code === "register_failed") {
      return {
        error: error.message,
        resetTurnstile: true,
        status: "unknown_error",
      };
    }

    return {
      error: registerOtpMessages.serviceError,
      resetTurnstile: true,
      status: "unknown_error",
    };
  }
}

export async function submitRegisterOtpWithRedirect(
  nextPath: string,
  _previousState: SubmitRegisterOtpActionState,
  formData: FormData,
): Promise<SubmitRegisterOtpActionState> {
  const email = String(formData.get("email") ?? "").trim();
  const safeNextPath = getSafeNextPath(nextPath);
  const requestHeaders = await headers();

  try {
    await (
      await getAuthService()
    ).submitRegisterOtp({
      email,
      ipHash: hashAuthOtpIp(requestHeaders),
      token: String(formData.get("token") ?? "").trim(),
    });

    return {
      redirectTo: safeNextPath,
      status: "success",
      success: "注册完成。",
    };
  } catch (error) {
    if (!(error instanceof AppError)) {
      logUnexpectedAdapterError(
        "[auth] OTP verification action failed unexpectedly",
        error,
      );
      return {
        error: registerOtpMessages.serviceError,
        status: "unknown_error",
      };
    }

    if (
      error.code === "otp_fields_required" ||
      error.code === "email_too_long" ||
      error.code === "email_invalid" ||
      error.code === "otp_format_invalid"
    ) {
      return { error: error.message, status: "validation_error" };
    }
    if (error.code === "otp_invalid") {
      return {
        error: error.message,
        remainingAttempts: getNumberDetail(error, "remainingAttempts"),
        status: "otp_invalid",
      };
    }
    if (error.code === "otp_too_many_attempts") {
      return {
        error: error.message,
        remainingAttempts: 0,
        status: "too_many_attempts",
      };
    }
    if (error.code === "session_invalid") {
      return {
        redirectTo: routeWithQuery(routePaths.login, {
          email,
          next: safeNextPath,
        }),
        status: "session_invalid",
      };
    }
    if (error.code === "app_user_sync_failed") {
      return { error: error.message, status: "app_user_sync_failed" };
    }

    return {
      error: registerOtpMessages.serviceError,
      status: "unknown_error",
    };
  }
}

export async function loginWithRedirect(
  nextPath: string,
  _previousState: LoginActionState,
  formData: FormData,
): Promise<LoginActionState> {
  try {
    await (
      await getAuthService()
    ).login({
      email: String(formData.get("email") ?? "").trim(),
      password: String(formData.get("password") ?? ""),
    });
  } catch (error) {
    if (error instanceof AppError) return { error: error.message };

    logUnexpectedAdapterError("[auth] login action failed unexpectedly", error);
    return { error: loginServiceErrorMessage };
  }

  redirect(getSafeNextPath(nextPath));
}

export async function startGoogleAuth(
  source: GoogleAuthSource,
  nextPath: string,
): Promise<void> {
  const safeNextPath = getSafeGoogleAuthNextPath(nextPath);
  const failureHref = googleAuthFailureHref(
    source,
    googleAuthErrorCodes.startFailed,
    safeNextPath,
  );

  let redirectTarget = failureHref;

  try {
    const result = await (
      await getAuthService()
    ).startGoogleAuth({
      nextPath: safeNextPath,
      requestOrigin: (await headers()).get("origin"),
      source,
    });

    redirectTarget = result.ok ? result.providerUrl : result.failureHref;
  } catch (error) {
    if (!(error instanceof AppError)) {
      logUnexpectedAdapterError(
        "[auth] Google OAuth start action failed unexpectedly",
        error,
      );
    }
  }

  redirect(redirectTarget);
}

export async function logout(): Promise<void> {
  try {
    await (await getAuthService()).logout();
  } catch (error) {
    logUnexpectedAdapterError(
      "[auth] logout action failed unexpectedly",
      error,
    );
  }

  redirect(routePaths.login);
}
