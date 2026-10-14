import type { LedgerSetupTemplate } from "internal/ledger";

export type MerchantPresetOptions = {
  addedKeys: string[];
  currency: string;
  template: LedgerSetupTemplate | null;
};
