import type { ActionState } from "types/actions";
import type { ItemsStepOptions } from "organisms/transactions/TransactionItemsStep/TransactionItemsStep.types";
import type {
  FrequentMerchant,
  MerchantEntrySuggestions,
} from "internal/transaction";
import type { MerchantTag } from "types/merchants";
import type {
  TransactionAccountOption,
  TransactionEntryMethod,
} from "types/transactions";
import type { FlowMerchant } from "organisms/transactions/MerchantStep/MerchantStep.types";
export type TransactionStepFlowProps = {
  action: (
    previousState: ActionState,
    formData: FormData,
  ) => Promise<ActionState>;
  suggestionsMerchantId?: string;
  open: boolean;
  merchants: FlowMerchant[];
  merchantTags: MerchantTag[];
  frequentMerchants: FrequentMerchant[];
  accounts: TransactionAccountOption[];
  suggestions?: MerchantEntrySuggestions;
  itemsOptions?: ItemsStepOptions;
  hasDetails?: boolean;
  initialMerchantId?: string;
  initialAccountId?: string;
  initialStep?: number;
  onClose: () => void;
  onMethodChange: (method: TransactionEntryMethod) => void;
  onMerchantSelect: (merchant: FlowMerchant) => void;
  onAccountSelect: (account: TransactionAccountOption) => void;
  onAddMerchant: (name?: string) => void;
  onAddPresets: () => void;
  onAddAccount: () => void;
};
