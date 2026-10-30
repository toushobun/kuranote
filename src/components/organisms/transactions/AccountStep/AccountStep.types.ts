import type { MerchantEntrySuggestions } from "internal/transaction";
import type { TransactionAccountOption } from "types/transactions";

export type AccountStepProps = {
  accounts: TransactionAccountOption[];
  recommendedAccountIds?: MerchantEntrySuggestions["recommendedAccountIds"];
  selectedAccount?: TransactionAccountOption;
  hasDetails?: boolean;
  onSelect: (account: TransactionAccountOption) => void;
  /** 不传时不显示「新增账户」入口（编辑记账，#962）。 */
  onAddAccount?: () => void;
};
