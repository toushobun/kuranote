import { createClient } from "lib/supabase/server";

/**
 * 创建携带当前用户 Session、受 RLS 保护的认证 Supabase Client。
 * 默认应使用此工厂；只有确有必要的后台操作才使用 service-role Client。
 *
 * 复用 lib/supabase/server 现有实现：该实现基于 next/headers 的 cookies()，
 * 在 Hono Route Handler 和 Server Component 两条请求路径下都能正确工作。
 */
export const createAuthenticatedSupabaseClient = createClient;

export type AuthenticatedSupabaseClient = Awaited<
  ReturnType<typeof createAuthenticatedSupabaseClient>
>;
