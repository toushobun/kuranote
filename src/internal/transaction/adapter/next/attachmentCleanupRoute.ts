import "server-only";

import { authenticateCronRequest } from "internal/shared/middleware/cronAuthorization";
import { executeAttachmentCleanup } from "internal/transaction/attachmentCleanup";

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
  const rejection = authenticateCronRequest(request, options.secret ?? process.env.CRON_SECRET, "transaction");
  if (rejection) return rejection;

  try {
    const cleanup = options.cleanup ?? executeAttachmentCleanup;
    const summary = await cleanup();
    return Response.json(summary, { status: 200 });
  } catch (error) {
    console.error("[transaction] attachment cleanup cron failed", {
      errorName: error instanceof Error ? error.name : "unknown",
    });
    return Response.json({ error: "Cleanup failed" }, { status: 500 });
  }
}
