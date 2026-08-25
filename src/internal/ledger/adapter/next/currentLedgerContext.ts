import { redirect } from "next/navigation";
import { cache } from "react";

import { routePaths } from "config/paths";
import { createSupabaseCurrentLedgerRepository } from "internal/ledger/repository/currentLedgerRepository";
import { createRequestId } from "internal/shared/context/requestId";
import { createLogger } from "internal/shared/logging/logger";
import { createAuthenticatedSupabaseClient } from "internal/shared/supabase/authenticatedClient";

export const getCurrentLedgerContext = cache(async () => {
  // cache() 的缓存范围是单次 server request。
  // redirect() 抛出的控制流即使在同一请求内被复用，也只会在该请求内重新触发跳转，不会跨请求污染登录状态。
  const supabase = await createAuthenticatedSupabaseClient();
  const { data, error } = await supabase.auth.getClaims();

  if (error || !data?.claims) {
    redirect(routePaths.login);
  }

  const userId = data.claims.sub;

  if (typeof userId !== "string" || userId.length === 0) {
    redirect(routePaths.login);
  }

  const email =
    typeof data.claims.email === "string" ? data.claims.email : "登录用户";
  const logger = createLogger(createRequestId());

  return createSupabaseCurrentLedgerRepository(supabase, logger).getContext(
    userId,
    email,
  );
});

export async function getCurrentLedgerOrRedirect() {
  const context = await getCurrentLedgerContext();

  if (!context.currentLedger) {
    redirect(routePaths.dashboard);
  }

  return context.currentLedger;
}
