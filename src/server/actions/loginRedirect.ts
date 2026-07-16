"use server";

import { redirect } from "next/navigation";

import { routePaths, routeWithQuery } from "config/paths";
import { isSafeNextPath } from "lib/navigation/safeNextPath";
import { createClient } from "lib/supabase/server";
import { submitRegisterOtp } from "server/actions/auth";
import type {
  LoginActionState,
  SubmitRegisterOtpActionState,
} from "types/auth";

const loginServiceErrorMessage = "登录服务暂时不可用，请稍后重试。";

export async function loginWithRedirect(
  nextPath: string,
  _previousState: LoginActionState,
  formData: FormData,
): Promise<LoginActionState> {
  const email = String(formData.get("email") ?? "").trim();
  const password = String(formData.get("password") ?? "");

  if (!email || !password) {
    return { error: "请输入邮箱和密码。" };
  }

  try {
    const supabase = await createClient();
    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) {
      return { error: "邮箱或密码不正确。" };
    }
  } catch {
    console.error("[login] sign in failed unexpectedly");
    return { error: loginServiceErrorMessage };
  }

  redirect(getSafeNextPath(nextPath));
}

export async function submitRegisterOtpWithRedirect(
  nextPath: string,
  previousState: SubmitRegisterOtpActionState,
  formData: FormData,
): Promise<SubmitRegisterOtpActionState> {
  const result = await submitRegisterOtp(previousState, formData);
  const safeNextPath = getSafeNextPath(nextPath);

  if (result.status === "session_invalid") {
    const email = String(formData.get("email") ?? "").trim();

    return {
      ...result,
      redirectTo: routeWithQuery(routePaths.login, {
        email,
        next: safeNextPath,
      }),
    };
  }

  if (result.status !== "success") return result;

  return {
    ...result,
    redirectTo: safeNextPath,
  };
}

function getSafeNextPath(nextPath: string): string {
  return isSafeNextPath(nextPath) ? nextPath : routePaths.dashboard;
}
