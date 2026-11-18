import { handleAttachmentCleanupRequest } from "internal/transaction/adapter/next/attachmentCleanupRoute";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/** 由 Vercel Cron 每天调用一次，不接受浏览器或普通用户请求。 */
export async function GET(request: Request) {
  return handleAttachmentCleanupRequest(request);
}
