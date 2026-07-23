import { AuthenticationError } from "internal/shared/errors/appError";
import type { AuthenticatedSupabaseClient } from "internal/shared/supabase/authenticatedClient";

export type AuthContext =
  | { isAuthenticated: true; userId: string; email: string | null }
  | { isAuthenticated: false; userId: null; email: null };

/**
 * 读取当前请求的登录状态。供多个业务模块复用的认证基础能力，
 * 不属于 auth 业务模块本身（登录 / 注册 / OTP 等）。
 */
export async function getAuthContext(
  supabase: AuthenticatedSupabaseClient,
): Promise<AuthContext> {
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { email: null, isAuthenticated: false, userId: null };
  }

  return { email: user.email ?? null, isAuthenticated: true, userId: user.id };
}

/**
 * Controller 和其他请求边界统一使用这一窄函数读取已认证用户 ID，
 * 避免各模块重复实现相同的登录状态判断。
 */
export function requireAuthenticatedUserId(auth: AuthContext): string {
  if (!auth.isAuthenticated) {
    throw new AuthenticationError("auth_required", "请先登录。");
  }

  return auth.userId;
}
