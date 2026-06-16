"use server";

import { redirect } from "next/navigation";

import { routePaths } from "config/paths";
import {
  displayNameMaxLength,
  emailMaxLength,
  isValidEmailFormat,
  isValidRegisterPassword,
  passwordMaxLength,
  passwordRuleMessage,
} from "lib/validators/auth";
import { createClient } from "lib/supabase/server";
import type {
  EmailAvailabilityState,
  LoginActionState,
  RegisterActionState,
} from "types/auth";

const registerErrorMessages = {
  duplicateEmail: "这个邮箱已经注册过了，请直接登录或换一个邮箱。",
  invalidEmail: "邮箱格式看起来不正确，请检查后再试。",
  weakPassword: `密码强度不足。${passwordRuleMessage}`,
  signupDisabled: "当前暂时无法开放新用户注册，请稍后再试。",
  rateLimited: "注册请求太频繁了，请稍等一会儿再试。",
  fallback: "注册失败，请确认邮箱和密码后再试。",
} as const;

function validateRegisterFields({
  displayName,
  email,
  password,
  passwordConfirm,
}: {
  displayName: string;
  email: string;
  password: string;
  passwordConfirm: string;
}): RegisterActionState | null {
  if (!displayName || !email || !password || !passwordConfirm) {
    return {
      error: "请输入昵称、邮箱和密码。",
    };
  }

  if (email.length > emailMaxLength) {
    return {
      error: `邮箱最多 ${emailMaxLength} 个字符。`,
    };
  }

  if (!isValidEmailFormat(email)) {
    return {
      error: "邮箱格式有误",
    };
  }

  if (displayName.length > displayNameMaxLength) {
    return {
      error: `昵称最多 ${displayNameMaxLength} 个字符。`,
    };
  }

  if (password.length > passwordMaxLength) {
    return {
      error: `密码最多 ${passwordMaxLength} 个字符。`,
      resetPassword: true,
    };
  }

  if (passwordConfirm.length > passwordMaxLength) {
    return {
      error: `确认密码最多 ${passwordMaxLength} 个字符。`,
    };
  }

  if (password !== passwordConfirm) {
    return {
      error: "两次输入的密码不一致。",
    };
  }

  if (!isValidRegisterPassword(password)) {
    return {
      error: registerErrorMessages.weakPassword,
      resetPassword: true,
    };
  }

  return null;
}

function getRegisterErrorMessage(error: unknown) {
  const code =
    typeof error === "object" && error !== null && "code" in error
      ? String(error.code ?? "").toLowerCase()
      : "";

  if (code === "user_already_exists") {
    return registerErrorMessages.duplicateEmail;
  }

  if (code === "invalid_email") {
    return registerErrorMessages.invalidEmail;
  }

  if (code === "weak_password") {
    return registerErrorMessages.weakPassword;
  }

  if (code === "signup_disabled") {
    return registerErrorMessages.signupDisabled;
  }

  if (code === "over_email_send_rate_limit") {
    return registerErrorMessages.rateLimited;
  }

  return registerErrorMessages.fallback;
}

export async function login(
  _previousState: LoginActionState,
  formData: FormData,
): Promise<LoginActionState> {
  const email = String(formData.get("email") ?? "").trim();
  const password = String(formData.get("password") ?? "");

  if (!email || !password) {
    return {
      error: "请输入邮箱和密码。",
    };
  }

  const supabase = await createClient();

  const { error } = await supabase.auth.signInWithPassword({
    email,
    password,
  });

  if (error) {
    return {
      error: "邮箱或密码不正确。",
    };
  }

  redirect(routePaths.dashboard);
}

export async function validateRegisterEmailFormat(
  email: string,
): Promise<EmailAvailabilityState> {
  const trimmedEmail = email.trim();

  if (!trimmedEmail) {
    return {
      error: "请输入邮箱后再校验。",
    };
  }

  if (trimmedEmail.length > emailMaxLength) {
    return {
      error: `邮箱最多 ${emailMaxLength} 个字符。`,
    };
  }

  if (!isValidEmailFormat(trimmedEmail)) {
    return {
      error: "邮箱格式有误",
    };
  }

  return {
    success: "该邮箱格式可以使用。",
  };
}

export async function register(
  _previousState: RegisterActionState,
  formData: FormData,
): Promise<RegisterActionState> {
  const displayName = String(formData.get("displayName") ?? "").trim();
  const email = String(formData.get("email") ?? "").trim();
  const password = String(formData.get("password") ?? "");
  const passwordConfirm = String(formData.get("passwordConfirm") ?? "");

  const validationError = validateRegisterFields({
    displayName,
    email,
    password,
    passwordConfirm,
  });

  if (validationError) {
    return validationError;
  }

  const supabase = await createClient();

  const { error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      data: {
        display_name: displayName,
      },
    },
  });

  if (error) {
    const errorMessage = getRegisterErrorMessage(error);

    return {
      error: errorMessage,
      ...(errorMessage === registerErrorMessages.weakPassword
        ? { resetPassword: true }
        : {}),
    };
  }

  return {
    success: "注册申请已提交。请查收确认邮件后再登录。",
  };
}
