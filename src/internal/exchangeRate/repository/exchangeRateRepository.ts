import "server-only";

import type { SupabaseClient } from "@supabase/supabase-js";
import { RepositoryError } from "internal/shared/errors/appError";
import { createServiceRoleSupabaseClient } from "internal/shared/supabase/serviceRoleClient";

export type DailyExchangeRate = {
  rate_date: string;
  currency: string;
  rate_per_eur: number;
  source: "ecb";
};

export interface ExchangeRateRepository {
  latestDate(): Promise<string | null>;
  upsertRates(rates: DailyExchangeRate[]): Promise<void>;
}

const batchSize = 500;

export function createExchangeRateRepository(
  supabase: SupabaseClient = createServiceRoleSupabaseClient(),
): ExchangeRateRepository {
  return {
    async latestDate() {
      const { data, error } = await supabase
        .from("exchange_rate")
        .select("rate_date")
        .order("rate_date", { ascending: false })
        .limit(1)
        .maybeSingle();
      if (error) {
        console.error("[exchangeRate] latest date query failed", {
          code: error.code,
        });
        throw new RepositoryError("exchange_rate_read_failed", "汇率读取失败");
      }
      return data?.rate_date ?? null;
    },
    async upsertRates(rates) {
      for (let index = 0; index < rates.length; index += batchSize) {
        const { error } = await supabase
          .from("exchange_rate")
          .upsert(rates.slice(index, index + batchSize), {
            onConflict: "rate_date,currency",
          });
        if (error) {
          console.error("[exchangeRate] upsert failed", { code: error.code });
          throw new RepositoryError(
            "exchange_rate_write_failed",
            "汇率保存失败",
          );
        }
      }
    },
  };
}
