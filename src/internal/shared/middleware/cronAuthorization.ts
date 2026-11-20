import { createHash, timingSafeEqual } from "node:crypto";

/** 两个 Vercel Cron 共用鉴权；失败时禁止初始化 service_role 仓储。 */
export function authenticateCronRequest(
  request: Request,
  secret: string | undefined,
  logModule: string,
): Response | null {
  if (!secret) {
    console.error(`[${logModule}] CRON_SECRET is not configured`);
    return Response.json({ error: "Cron is not configured" }, { status: 503 });
  }
  const authorization = request.headers.get("authorization");
  if (!authorization?.startsWith("Bearer ")) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }
  const actual = createHash("sha256").update(authorization.slice(7)).digest();
  const expected = createHash("sha256").update(secret).digest();
  if (!timingSafeEqual(actual, expected)) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }
  return null;
}
