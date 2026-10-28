import type { Logger } from "internal/shared/logging/logger";
import type { AuthenticatedSupabaseClient } from "internal/shared/supabase/authenticatedClient";
import { toRepositoryError } from "internal/shared/supabase/repositoryError";
import type { MerchantEntryHistoryRecord } from "internal/transaction/entity/merchantEntryHistory";
import { merchantEntryErrorMessages } from "internal/transaction/errors";
import type { FrequentMerchant } from "internal/transaction/schema";

export interface MerchantEntryRepository {
  loadFrequentMerchantCounts(
    ledgerId: string,
    limit: number,
  ): Promise<FrequentMerchant[]>;
  loadMerchantHistory(
    ledgerId: string,
    merchantId: string,
    limit: number,
  ): Promise<MerchantEntryHistoryRecord[]>;
}

export function createMerchantEntryRepository(
  supabase: AuthenticatedSupabaseClient,
  logger: Logger,
): MerchantEntryRepository {
  function fail(code: string | undefined): never {
    logger.error("[transaction] failed to load merchant entry suggestions", {
      databaseCode: code,
    });
    throw toRepositoryError(
      "transaction_merchant_suggestions_load_failed",
      merchantEntryErrorMessages.loadFailed,
    );
  }
  return {
    async loadFrequentMerchantCounts(ledgerId, limit) {
      const { data, error } = await supabase.rpc(
        "load_frequent_transaction_merchants",
        { p_ledger_id: ledgerId, p_limit: limit },
      );
      if (error) fail(error.code);
      return (
        (data ?? []) as { merchant_id: string; record_count: number | string }[]
      ).map((row) => ({
        merchantId: row.merchant_id,
        recordCount: Number(row.record_count),
      }));
    },
    async loadMerchantHistory(ledgerId, merchantId, limit) {
      const { data, error } = await supabase.rpc(
        "load_merchant_entry_history",
        { p_ledger_id: ledgerId, p_merchant_id: merchantId, p_limit: limit },
      );
      if (error) fail(error.code);
      return (data ?? []) as MerchantEntryHistoryRecord[];
    },
  };
}
