import type { EntryReceiptDraft } from "../useEntryReceiptGuard";
import type { ActionState } from "types/actions";
import type {
  FrequentMerchant,
  MerchantEntrySuggestions,
} from "internal/transaction";
import type { MerchantTag } from "types/merchants";
import type {
  TransactionAccountOption,
  TransactionCategoryOption,
  TransactionEntryMethod,
  TransactionGroupPage,
  TransactionMonthPage,
  TransactionSearchPage,
  TransactionTimeGroupViewData,
} from "types/transactions";
import type {
  TransactionFormInitialItem,
  TransactionFormInitialValues,
} from "organisms/transactions/TransactionForm/TransactionForm.types";
import type { FlowMerchant } from "organisms/transactions/MerchantStep/MerchantStep.types";

/** 小票内编辑明细与付款所需的选项（分类、退款 / 报销选择器、账本开关）与初始值。 */
export type ItemsStepOptions = {
  categoryOptions: TransactionCategoryOption[];
  refundPickerView?: TransactionTimeGroupViewData;
  reimbursementPickerView?: TransactionTimeGroupViewData;
  loadRefundGroupItemsAction?: (
    groupKey: string,
    offset: number,
  ) => Promise<TransactionMonthPage>;
  loadRefundMoreGroupsAction?: (
    offset: number,
  ) => Promise<TransactionGroupPage>;
  loadRefundSearchPageAction?: (
    query: string,
    offset: number,
  ) => Promise<TransactionSearchPage>;
  loadReimbursementGroupItemsAction?: (
    groupKey: string,
    offset: number,
  ) => Promise<TransactionMonthPage>;
  loadReimbursementMoreGroupsAction?: (
    offset: number,
  ) => Promise<TransactionGroupPage>;
  loadReimbursementSearchPageAction?: (
    query: string,
    offset: number,
  ) => Promise<TransactionSearchPage>;
  transactionItemSpecialStatusEnabled?: boolean;
  /** 账本是否开启多账户付款（#931）；关闭时不显示「添加付款账户」。 */
  multiAccountPaymentEnabled?: boolean;
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
  draft?: EntryReceiptDraft;
  merchantPickerSuspended?: boolean;
  merchants: FlowMerchant[];
  merchantTags: MerchantTag[];
  frequentMerchants: FrequentMerchant[];
  accounts: TransactionAccountOption[];
  suggestions?: MerchantEntrySuggestions;
  itemsOptions?: ItemsStepOptions;
  onClose: () => void;
  onMethodChange: (method: TransactionEntryMethod) => void;
  onMerchantSelect: (merchant: FlowMerchant) => void;
  onAccountSelect: (account: TransactionAccountOption) => void;
  onAddPresets: () => void;
};
