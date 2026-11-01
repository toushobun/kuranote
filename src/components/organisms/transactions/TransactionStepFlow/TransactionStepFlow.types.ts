import type { ActionState } from "types/actions";
import type {
  FrequentMerchant,
  MerchantEntrySuggestions,
} from "internal/transaction";
import type { MerchantTag } from "types/merchants";
import type {
  TransactionAccountOption,
  TransactionEntryMethod,
} from "types/transactions";
import type {
  TransactionFormInitialItem,
  TransactionFormInitialValues,
  TransactionFormProps,
} from "organisms/transactions/TransactionForm/TransactionForm.types";
import type { FlowMerchant } from "organisms/transactions/MerchantStep/MerchantStep.types";

/** 小票内编辑明细与付款所需的选项（分类、退款 / 报销选择器、账本开关）与初始值。 */
export type ItemsStepOptions = Pick<
  TransactionFormProps,
  | "categoryOptions"
  | "refundPickerView"
  | "reimbursementPickerView"
  | "loadRefundGroupItemsAction"
  | "loadRefundMoreGroupsAction"
  | "loadRefundSearchPageAction"
  | "loadReimbursementGroupItemsAction"
  | "loadReimbursementMoreGroupsAction"
  | "loadReimbursementSearchPageAction"
  | "transactionItemSpecialStatusEnabled"
  | "multiAccountPaymentEnabled"
> & {
  initialItems?: TransactionFormInitialItem[];
  initialPayments?: TransactionFormInitialValues["payments"];
};

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
  /** 预选商家时直接进入小票。 */
  initialMerchantId?: string;
  initialAccountId?: string;
  onClose: () => void;
  onMethodChange: (method: TransactionEntryMethod) => void;
  onMerchantSelect: (merchant: FlowMerchant) => void;
  onAccountSelect: (account: TransactionAccountOption) => void;
  onAddMerchant?: (name?: string) => void;
  onAddPresets: () => void;
  onAddAccount?: () => void;
};
