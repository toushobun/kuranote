export function isSameOriginRequest(request: Request): boolean {
  const origin = request.headers.get("origin");
  if (!origin) return false;

  try {
    // Vercel 会将 request.url 规范化为公开访问地址；其他代理环境需保证 Host 转发可信。
    return new URL(origin).origin === new URL(request.url).origin;
  } catch {
    return false;
  }
}
