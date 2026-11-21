import { AuthenticationError } from "internal/shared/errors/appError";
import { sharedErrorMessages } from "internal/shared/errors/sharedErrorMessages";
import type { DailyExchangeRateRepository } from "../repository/dailyExchangeRateRepository";
import type { DailyExchangeRateQuery } from "../schema";

export function createDailyExchangeRateService({
  currentUserId,
  repository,
}: {
  currentUserId: string | null;
  repository: DailyExchangeRateRepository;
}) {
  return {
    async getDailyRate(query: DailyExchangeRateQuery) {
      if (!currentUserId)
        throw new AuthenticationError(
          "auth_required",
          sharedErrorMessages.authRequired,
        );
      return repository.getDailyRate(query);
    },
  };
}
