import type { AuthenticatedSupabaseClient } from "internal/shared/supabase/authenticatedClient";
import type { Logger } from "internal/shared/logging/logger";
import { toRepositoryError } from "internal/shared/supabase/repositoryError";

/** 账户总额专用的服务端汇率读取，不把客户端直接暴露给组件。 */
export async function loadAccountLedgerRates(
  supabase: AuthenticatedSupabaseClient,
  logger: Logger,
  ledgerId: string,
): Promise<Map<string, number | string | null>> {
  const { data, error } = await supabase
    .from("account_ledger_rate")
    .select("account_id,ledger_rate")
    .eq("ledger_id", ledgerId);
  if (error) {
    logger.error("[account] failed to load ledger rates", { code: error.code, ledgerId });
    throw toRepositoryError("account_rate_load_failed", "账户汇率读取失败");
  }
  return new Map((data ?? []).map((row) => [
    row.account_id as string,
    row.ledger_rate as number | string | null,
  ]));
}
