import type { SupabaseClient } from "@supabase/supabase-js";
import { describe, expect, it, vi } from "vitest";

vi.mock("server-only", () => ({}));

import {
  createExchangeRateRepository,
  type DailyExchangeRate,
} from "./exchangeRateRepository";

describe("exchangeRateRepository", () => {
  it("中途写入失败时不会留下只写了一部分币种的最新日期", async () => {
    const currencies = ["CNY", "JPY", "USD", "GBP", "KRW", "THB"];
    const rates: DailyExchangeRate[] = Array.from(
      { length: 85 },
      (_, index) =>
        new Date(Date.UTC(2026, 0, index + 1)).toISOString().slice(0, 10),
    )
      .flatMap((rate_date) =>
        currencies.map((currency) => ({
          rate_date,
          currency,
          rate_per_eur: 1,
          source: "ecb" as const,
        })),
      )
      .reverse();
    const batches: DailyExchangeRate[][] = [];
    const supabase = {
      from: vi.fn(() => ({
        upsert: vi.fn(async (batch: DailyExchangeRate[]) => {
          batches.push(batch);
          return {
            error: batches.length === 2 ? { code: "temporary_error" } : null,
          };
        }),
      })),
    } as unknown as SupabaseClient;

    await expect(
      createExchangeRateRepository(supabase).upsertRates(rates),
    ).rejects.toThrow("汇率保存失败");

    expect(batches).toHaveLength(2);
    expect(batches[0]).toHaveLength(498);
    expect(batches[1]).toHaveLength(12);

    const firstDates = [...new Set(batches[0].map((row) => row.rate_date))];
    const secondDates = [...new Set(batches[1].map((row) => row.rate_date))];
    expect(firstDates).toHaveLength(83);
    expect(secondDates).toHaveLength(2);
    expect(firstDates.at(-1)! < secondDates[0]).toBe(true);
    for (const date of [...firstDates, ...secondDates]) {
      const batch = firstDates.includes(date) ? batches[0] : batches[1];
      expect(batch.filter((rate) => rate.rate_date === date)).toHaveLength(6);
    }
  });
});
