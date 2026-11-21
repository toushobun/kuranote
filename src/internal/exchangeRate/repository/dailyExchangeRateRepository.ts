import "server-only";

import { RepositoryError } from "internal/shared/errors/appError";
import type { Logger } from "internal/shared/logging/logger";
import type { AuthenticatedSupabaseClient } from "internal/shared/supabase/authenticatedClient";
import { exchangeRateErrorCodes, exchangeRateErrorMessages } from "../errors";
import type {
  DailyExchangeRateQuery,
  DailyExchangeRateResult,
} from "../schema";

export interface DailyExchangeRateRepository {
  getDailyRate(query: DailyExchangeRateQuery): Promise<DailyExchangeRateResult>;
}

export function createDailyExchangeRateRepository(
  supabase: AuthenticatedSupabaseClient,
  logger: Logger,
): DailyExchangeRateRepository {
  return {
    async getDailyRate({ from, to, date }) {
      const { data, error } = await supabase.rpc("exchange_rate_with_date", {
        p_from: from,
        p_to: to,
        p_date: date,
      });
      if (error) {
        logger.error("[exchangeRate] daily rate query failed", {
          code: error.code,
        });
        throw new RepositoryError(
          exchangeRateErrorCodes.readFailed,
          exchangeRateErrorMessages[exchangeRateErrorCodes.readFailed],
        );
      }
      const row: unknown = Array.isArray(data) ? data[0] : null;
      if (
        !row ||
        typeof row !== "object" ||
        !("rate" in row) ||
        !("rate_date" in row)
      ) {
        throw new RepositoryError(
          exchangeRateErrorCodes.readFailed,
          exchangeRateErrorMessages[exchangeRateErrorCodes.readFailed],
        );
      }
      const { rate, rate_date: rateDate } = row;
      if (rate === null && rateDate === null)
        return { rate: null, rateDate: null };
      const value =
        typeof rate === "string" || typeof rate === "number"
          ? Number(rate)
          : NaN;
      if (
        !Number.isFinite(value) ||
        value <= 0 ||
        typeof rateDate !== "string"
      ) {
        throw new RepositoryError(
          exchangeRateErrorCodes.readFailed,
          exchangeRateErrorMessages[exchangeRateErrorCodes.readFailed],
        );
      }
      return { rate: value, rateDate };
    },
  };
}
