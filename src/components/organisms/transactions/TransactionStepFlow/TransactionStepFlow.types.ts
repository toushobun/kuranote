import type {
  FrequentMerchant,
  MerchantEntrySuggestions,
} from "internal/transaction";
import type { MerchantTag } from "types/merchants";
import type {
  TransactionAccountOption,
  TransactionMerchantOption,
} from "types/transactions";
export type FlowMerchant = TransactionMerchantOption & { tags: MerchantTag[] };
export type EntryMethod = "merchant" | "transfer" | "standard";
export type TransactionStepFlowProps = {
  open: boolean;
  merchants: FlowMerchant[];
  merchantTags: MerchantTag[];
  frequentMerchants: FrequentMerchant[];
  accounts: TransactionAccountOption[];
  suggestions?: MerchantEntrySuggestions;
  hasDetails?: boolean;
  initialMerchantId?: string;
  initialAccountId?: string;
  initialStep?: number;
  initialCompletedSteps?: number[];
  onClose: () => void;
  onMethodChange: (method: EntryMethod) => void;
  onMerchantSelect: (merchant: FlowMerchant) => void;
  onAccountSelect: (account: TransactionAccountOption) => void;
  onAddMerchant: (name?: string) => void;
  onAddPresets: () => void;
  onAddAccount: () => void;
};
