import { merchantRecentTransactionLimit } from "@/constants/recentUsage";
import {
  requireActiveLedgerMemberRole,
  type LedgerAccessService,
} from "internal/ledger";
import type { MerchantQueryService } from "internal/merchant";
import {
  NotFoundError,
  ValidationError,
} from "internal/shared/errors/appError";
import {
  merchantEntryErrorMessages,
  transactionErrorCodes,
  transactionValidationErrorMessages,
} from "internal/transaction/errors";
import type { MerchantEntryRepository } from "internal/transaction/repository/merchantEntryRepository";
import {
  transactionLedgerQuerySchema,
  merchantEntrySuggestionsQuerySchema,
  type FrequentMerchant,
  type MerchantEntrySuggestions,
} from "internal/transaction/schema";
import { requireTransactionUserId } from "internal/transaction/service/read/transactionReadAccess";
import { frequentMerchantLimit } from "internal/transaction/service/read/recentUsage";
import { buildMerchantEntrySuggestions } from "internal/transaction/util/merchantEntrySuggestions";

export interface MerchantEntryQueryService {
  getFrequentMerchants(input: {
    ledgerId: string;
  }): Promise<FrequentMerchant[]>;
  getMerchantSuggestions(input: {
    ledgerId: string;
    merchantId: string;
  }): Promise<MerchantEntrySuggestions>;
}

type MerchantEntryQueryServiceDependencies = {
  currentUserId: string | null;
  ledgerAccessService: LedgerAccessService;
  merchantQueryService: Pick<MerchantQueryService, "findSummariesByIds">;
  repository: MerchantEntryRepository;
};

export function createMerchantEntryQueryService({
  currentUserId,
  ledgerAccessService,
  merchantQueryService,
  repository,
}: MerchantEntryQueryServiceDependencies): MerchantEntryQueryService {
  async function authorize(ledgerId: string) {
    await requireActiveLedgerMemberRole(ledgerAccessService, {
      ledgerId,
      userId: requireTransactionUserId(currentUserId),
    });
  }
  function invalid(): never {
    throw new ValidationError(
      "validation_failed",
      merchantEntryErrorMessages.invalid,
    );
  }
  return {
    async getFrequentMerchants(input) {
      requireTransactionUserId(currentUserId);
      const parsed = transactionLedgerQuerySchema.safeParse(input);
      if (!parsed.success) invalid();
      await authorize(parsed.data.ledgerId);
      return repository.loadFrequentMerchantCounts(
        parsed.data.ledgerId,
        frequentMerchantLimit,
      );
    },
    async getMerchantSuggestions(input) {
      requireTransactionUserId(currentUserId);
      const parsed = merchantEntrySuggestionsQuerySchema.safeParse(input);
      if (!parsed.success) invalid();
      const { ledgerId, merchantId } = parsed.data;
      await authorize(ledgerId);
      const merchants = await merchantQueryService.findSummariesByIds({
        ledgerId,
        merchantIds: [merchantId],
      });
      if (!merchants.some((merchant) => merchant.id === merchantId)) {
        throw new NotFoundError(
          transactionErrorCodes.merchantInvalid,
          transactionValidationErrorMessages[
            transactionErrorCodes.merchantInvalid
          ],
        );
      }
      return buildMerchantEntrySuggestions(
        await repository.loadMerchantHistory(
          ledgerId,
          merchantId,
          merchantRecentTransactionLimit,
        ),
      );
    },
  };
}
