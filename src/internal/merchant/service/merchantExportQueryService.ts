import type { MerchantExportSummary } from "internal/merchant/entity/merchantExportSummary";
import type { MerchantRepository } from "internal/merchant/repository/merchantRepository";
import {
  requireActiveLedgerMemberRole,
  type LedgerAccessService,
} from "internal/ledger";

export interface MerchantExportQueryService {
  findExportSummaries(input: {
    ledgerId: string;
    userId: string;
    merchantIds: string[];
  }): Promise<MerchantExportSummary[]>;
}

export function createMerchantExportQueryService({
  merchantRepository,
  ledgerAccessService,
}: {
  merchantRepository: Pick<
    MerchantRepository,
    "findSummariesByIds" | "listExportTagNames"
  >;
  ledgerAccessService: LedgerAccessService;
}): MerchantExportQueryService {
  return {
    async findExportSummaries({ ledgerId, userId, merchantIds }) {
      await requireActiveLedgerMemberRole(ledgerAccessService, {
        ledgerId,
        userId,
      });
      const [merchants, tags] = await Promise.all([
        merchantRepository.findSummariesByIds(ledgerId, merchantIds),
        merchantRepository.listExportTagNames(ledgerId, merchantIds),
      ]);
      const tagsByMerchant = new Map<string, string[]>();
      for (const tag of tags) {
        const names = tagsByMerchant.get(tag.merchantId) ?? [];
        names.push(tag.name);
        tagsByMerchant.set(tag.merchantId, names);
      }
      return merchants.map(({ id, name }) => ({
        id,
        name,
        tagNames: tagsByMerchant.get(id) ?? [],
      }));
    },
  };
}
