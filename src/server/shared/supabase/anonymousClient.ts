import { createClient as createSupabaseClient } from "@supabase/supabase-js";

/**
 * 创建不携带用户 Session 的匿名 Supabase Client（仅使用 anon /
 * publishable key，仍受 RLS 保护）。用于确有必要在未登录场景下
 * 做只读查询的场景（例如登录前的公开状态检查）。
 *
 * 不持久化 Session、不自动刷新 Token——每次调用都应显式创建新实例，
 * 不得跨请求复用。
 */
export function createAnonymousSupabaseClient() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const publishableKey = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;

  if (!supabaseUrl || !publishableKey) {
    throw new Error(
      "Supabase anonymous client environment variables are missing.",
    );
  }

  return createSupabaseClient(supabaseUrl, publishableKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  });
}
