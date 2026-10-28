import type { MerchantEntrySuggestions } from "internal/transaction";
import type { TransactionAccountOption } from "types/transactions";

export type AccountStepProps = {
  accounts: TransactionAccountOption[];
  recommendedAccountIds?: MerchantEntrySuggestions["recommendedAccountIds"];
  selectedAccount?: TransactionAccountOption;
  hasDetails?: boolean;
  onSelect: (account: TransactionAccountOption) => void;
  onAddAccount: () => void;
};
