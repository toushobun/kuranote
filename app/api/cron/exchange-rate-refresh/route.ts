import { handleExchangeRateRefreshRequest } from "internal/exchangeRate/adapter/next/exchangeRateRefreshRoute";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 60;

/** Vercel 在 UTC 16:00 自动同步 ECB 日参考汇率。 */
export async function GET(request: Request) {
  return handleExchangeRateRefreshRequest(request);
}
