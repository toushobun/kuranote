import { ledgerSetupAccountCandidates } from "internal/ledger/entity/ledgerSetupTemplate/accountCandidates";
import { ledgerSetupMerchantTags } from "internal/ledger/entity/ledgerSetupTemplate/merchantTags";
import { ledgerSetupMerchants } from "internal/ledger/entity/ledgerSetupTemplate/merchants";
import {
  isLedgerSetupRegion,
  type LedgerSetupTemplate,
} from "internal/ledger/entity/ledgerSetupTemplate/ledgerSetupTemplate";

/** 完整目录仅由服务端装配，前端通过向导或商家预设读取接口取得。 */
export function getLedgerSetupTemplate(
  region: unknown,
): LedgerSetupTemplate | null {
  if (!isLedgerSetupRegion(region)) return null;
  return {
    region,
    version: 5,
    accountCandidatesByRegion: ledgerSetupAccountCandidates,
    merchantTags: ledgerSetupMerchantTags,
    merchants: ledgerSetupMerchants,
  };
}
