import "server-only";

import { createHash, timingSafeEqual } from "node:crypto";
import { createAttachmentCleanupRepository } from "internal/transaction/repository/attachmentCleanupRepository";
import { runAttachmentCleanup } from "internal/transaction/service/attachmentCleanupService";

function isCorrectCronSecret(authorization: string | null, secret: string) {
  if (!authorization?.startsWith("Bearer ")) return false;
  const actual = createHash("sha256").update(authorization.slice(7)).digest();
  const expected = createHash("sha256").update(secret).digest();
  return timingSafeEqual(actual, expected);
}

/**
 * Vercel Cron 使用 Authorization: Bearer <CRON_SECRET>。
 * 校验失败时不得初始化 service_role 客户端，也不能泄露鉴权细节。
 */
export async function handleAttachmentCleanupRequest(
  request: Request,
  options: {
    secret?: string;
    cleanup?: () => Promise<unknown>;
  } = {},
): Promise<Response> {
  const secret = options.secret ?? process.env.CRON_SECRET;
  if (!secret) {
    console.error("[transaction] CRON_SECRET is not configured");
    return Response.json({ error: "Cron is not configured" }, { status: 503 });
  }
  if (!isCorrectCronSecret(request.headers.get("authorization"), secret)) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const cleanup = options.cleanup ??
      (() => runAttachmentCleanup(createAttachmentCleanupRepository()));
    const summary = await cleanup();
    return Response.json(summary, { status: 200 });
  } catch (error) {
    console.error("[transaction] attachment cleanup cron failed", {
      errorName: error instanceof Error ? error.name : "unknown",
    });
    return Response.json({ error: "Cleanup failed" }, { status: 500 });
  }
}
