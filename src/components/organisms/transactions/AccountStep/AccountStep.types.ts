import type { MerchantEntrySuggestions } from "internal/transaction";
import type { TransactionAccountOption } from "types/transactions";

export type AccountStepProps = {
  accounts: TransactionAccountOption[];
  recommendedAccountIds?: MerchantEntrySuggestions["recommendedAccountIds"];
  selectedAccount?: TransactionAccountOption;
  /** 清空账户后仍用原币种判断是否需要确认。 */
  previousCurrency?: string;
  hasDetails?: boolean;
  onSelect: (account: TransactionAccountOption) => void;
  /** 不传时不显示「新增账户」入口（无管理权限时不传）。 */
  onAddAccount?: (
    onCreated: (account: TransactionAccountOption) => Promise<boolean | void>,
  ) => void;
};
