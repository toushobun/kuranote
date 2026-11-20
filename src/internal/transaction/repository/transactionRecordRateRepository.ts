import type { Logger } from "internal/shared/logging/logger";
import type { AuthenticatedSupabaseClient } from "internal/shared/supabase/authenticatedClient";
import { toRepositoryError } from "internal/shared/supabase/repositoryError";
import { transactionLoadErrorMessages } from "internal/transaction/errors";
import { chunkArray } from "utils/collections";

export type TransactionRecordLedgerRate = {
  record_id: string;
  record_currency: string | null;
  ledger_rate: number | string | null;
};

/** 交易与统计统一使用同一套按记录 ID 分块的汇率读取。 */
export async function loadTransactionRecordLedgerRates(
  supabase: AuthenticatedSupabaseClient,
  logger: Logger,
  ledgerId: string,
  recordIds: string[],
): Promise<TransactionRecordLedgerRate[]> {
  if (recordIds.length === 0) return [];
  const results = await Promise.all(
    chunkArray([...new Set(recordIds)], 100).map(async (ids) => {
      const { data, error } = await supabase
        .from("transaction_record_ledger_rate")
        .select("record_id,currency,ledger_rate")
        .eq("ledger_id", ledgerId)
        .in("record_id", ids);
      if (error) {
        logger.error("[transaction] failed to load record exchange rates", {
          databaseCode: error.code,
          ledgerId,
        });
        throw toRepositoryError(
          "transaction_record_rates_failed",
          transactionLoadErrorMessages.recordsLoadFailed,
        );
      }
      return (data ?? []).map((row) => ({
        record_id: row.record_id as string,
        record_currency: row.currency as string | null,
        ledger_rate: row.ledger_rate as number | string | null,
      }));
    }),
  );
  return results.flat();
}
