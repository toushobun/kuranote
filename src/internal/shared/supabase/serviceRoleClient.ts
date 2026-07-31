import "server-only";

import { createClient as createSupabaseClient } from "@supabase/supabase-js";

/**
 * 显式创建 service-role Client，绕过 RLS。
 *
 * 只能在服务端使用；只有确有必要、经过明确审查的后台操作才允许调用，
 * 禁止把它当作默认 Client 使用，也不得自动降级或自动切换。
 */
export function createServiceRoleSupabaseClient() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceRoleKey =
    process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_SECRET_KEY;

  if (!supabaseUrl || !serviceRoleKey) {
    throw new Error("Supabase service role environment variables are missing.");
  }

  return createSupabaseClient(supabaseUrl, serviceRoleKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  });
}
