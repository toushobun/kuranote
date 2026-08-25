import { redirect } from "next/navigation";
import { cache } from "react";

import { routePaths } from "config/paths";
import { createSupabaseCurrentLedgerRepository } from "internal/ledger/repository/currentLedgerRepository";
import { createServerRequestDependencies } from "internal/shared/context/createServerRequestDependencies";

export const getCurrentLedgerContext = cache(async () => {
  // cache() 的缓存范围是单次 server request。
  // redirect() 抛出的控制流即使在同一请求内被复用，也只会在该请求内重新触发跳转，不会跨请求污染登录状态。
  const { auth, logger, supabase } = await createServerRequestDependencies();

  if (!auth.isAuthenticated) {
    redirect(routePaths.login);
  }

  return createSupabaseCurrentLedgerRepository(supabase, logger).getContext(
    auth.userId,
    auth.email ?? "登录用户",
  );
});

export async function getCurrentLedgerOrRedirect() {
  const context = await getCurrentLedgerContext();

  if (!context.currentLedger) {
    redirect(routePaths.dashboard);
  }

  return context.currentLedger;
}
