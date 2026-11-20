import "server-only";

import { authenticateCronRequest } from "internal/shared/middleware/cronAuthorization";
import { executeExchangeRateRefresh } from "internal/exchangeRate";

export async function handleExchangeRateRefreshRequest(
  request: Request,
  options: { secret?: string; refresh?: () => Promise<unknown> } = {},
): Promise<Response> {
  const rejection = authenticateCronRequest(request, options.secret ?? process.env.CRON_SECRET, "exchangeRate");
  if (rejection) return rejection;
  try {
    const summary = await (options.refresh ?? executeExchangeRateRefresh)();
    return Response.json(summary, { status: 200 });
  } catch (error) {
    console.error("[exchangeRate] daily refresh failed", {
      errorName: error instanceof Error ? error.name : "unknown",
    });
    return Response.json({ error: "Exchange rate refresh failed" }, { status: 500 });
  }
}
