"use server";

import { redirect } from "next/navigation";

import { routePaths } from "config/paths";
import { isSafeNextPath } from "lib/navigation/safeNextPath";
import { createClient } from "lib/supabase/server";
import { submitRegisterOtp } from "server/actions/auth";
import type {
  LoginActionState,
  SubmitRegisterOtpActionState,
} from "types/auth";

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

  const supabase = await createClient();
  const { error } = await supabase.auth.signInWithPassword({ email, password });

  if (error) {
    return { error: "邮箱或密码不正确。" };
  }

  redirect(isSafeNextPath(nextPath) ? nextPath : routePaths.dashboard);
}

export async function submitRegisterOtpWithRedirect(
  nextPath: string,
  previousState: SubmitRegisterOtpActionState,
  formData: FormData,
): Promise<SubmitRegisterOtpActionState> {
  const result = await submitRegisterOtp(previousState, formData);

  if (result.status !== "success") return result;

  return {
    ...result,
    redirectTo: isSafeNextPath(nextPath) ? nextPath : routePaths.dashboard,
  };
}
