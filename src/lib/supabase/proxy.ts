import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

export async function updateSession(request: NextRequest) {
  let supabaseResponse = NextResponse.next({
    request,
  });

  try {
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!,
      {
        cookies: {
          getAll() {
            return request.cookies.getAll();
          },
          setAll(cookiesToSet) {
            cookiesToSet.forEach(({ name, value }) => {
              request.cookies.set(name, value);
            });

            supabaseResponse = NextResponse.next({
              request,
            });

            cookiesToSet.forEach(({ name, value, options }) => {
              supabaseResponse.cookies.set(name, value, options);
            });
          },
        },
      },
    );

    await supabase.auth.getClaims();
  } catch (error) {
    if (!isPublicEntryPath(request.nextUrl.pathname)) {
      throw error;
    }

    // 首页、邀请、登录与注册允许未登录访问。会话刷新失败时继续请求，
    // 由页面自身决定登录或注册流程；不记录 URL 或异常原文，避免
    // 邀请 token 等敏感路径进入日志。
    console.error(
      "[supabaseProxy] failed to refresh auth claims for public route",
    );
  }

  return supabaseResponse;
}

function isPublicEntryPath(pathname: string): boolean {
  const normalizedPathname =
    pathname.length > 1 && pathname.endsWith("/")
      ? pathname.slice(0, -1)
      : pathname;

  return (
    normalizedPathname === "/" ||
    normalizedPathname === "/invite" ||
    normalizedPathname.startsWith("/invite/") ||
    normalizedPathname === "/login" ||
    normalizedPathname === "/register"
  );
}
