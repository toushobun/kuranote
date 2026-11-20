import "server-only";

import type { SupabaseClient } from "@supabase/supabase-js";
import { RepositoryError } from "internal/shared/errors/appError";
import { exchangeRateErrorCodes, exchangeRateErrorMessages } from "../errors";
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
        throw new RepositoryError(exchangeRateErrorCodes.readFailed,
          exchangeRateErrorMessages[exchangeRateErrorCodes.readFailed]);
      }
      return data?.rate_date ?? null;
    },
    async upsertRates(rates) {
      // 同一天的汇率必须在同一次原子 upsert 中写完。
      // 否则中途失败后，latestDate 可能跳过当天尚未写入的币种。
      const ratesByDate = new Map<string, DailyExchangeRate[]>();
      for (const rate of rates) {
        const dailyRates = ratesByDate.get(rate.rate_date) ?? [];
        dailyRates.push(rate);
        ratesByDate.set(rate.rate_date, dailyRates);
      }

      async function upsertBatch(batch: DailyExchangeRate[]) {
        const { error } = await supabase
          .from("exchange_rate")
          .upsert(batch, { onConflict: "rate_date,currency" });
        if (error) {
          console.error("[exchangeRate] upsert failed", { code: error.code });
          throw new RepositoryError(
            exchangeRateErrorCodes.writeFailed,
            exchangeRateErrorMessages[exchangeRateErrorCodes.writeFailed],
          );
        }
      }

      let batch: DailyExchangeRate[] = [];
      for (const date of [...ratesByDate.keys()].sort()) {
        const dailyRates = ratesByDate.get(date) ?? [];
        if (batch.length > 0 && batch.length + dailyRates.length > batchSize) {
          await upsertBatch(batch);
          batch = [];
        }
        batch.push(...dailyRates);
      }
      if (batch.length > 0) await upsertBatch(batch);
    },
  };
}
