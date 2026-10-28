import type { FrequentMerchant } from "internal/transaction";
import type { MerchantTag } from "types/merchants";
import type { TransactionMerchantOption } from "types/transactions";

export type FlowMerchant = TransactionMerchantOption & { tags: MerchantTag[] };
export type MerchantStepProps = {
  merchants: FlowMerchant[];
  merchantTags: MerchantTag[];
  frequentMerchants: FrequentMerchant[];
  onSelect: (merchant: FlowMerchant) => void;
  onAddMerchant: (name?: string) => void;
  onAddPresets: () => void;
};
