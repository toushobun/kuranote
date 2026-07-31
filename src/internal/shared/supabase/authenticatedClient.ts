import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";

/**
 * 创建携带当前用户 Session、受 RLS 保护的认证 Supabase Client。
 * 默认应使用此工厂；只有确有必要的后台操作才使用 service-role Client。
 */
export async function createAuthenticatedSupabaseClient() {
  const cookieStore = await cookies();

  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) => {
              cookieStore.set(name, value, options);
            });
          } catch {
            // Server Components 无法始终写入 cookie。
            // Proxy 会刷新 Session 并写入更新后的 cookie。
          }
        },
      },
    },
  );
}

export type AuthenticatedSupabaseClient = Awaited<
  ReturnType<typeof createAuthenticatedSupabaseClient>
>;
