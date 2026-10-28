import type { MerchantEntrySuggestions } from "internal/transaction";
import type { TransactionAccountOption } from "types/transactions";
import type {
  TransactionFormProps,
  TransactionFormInitialItem,
  TransactionFormInitialValues,
  TransactionItemSummary,
} from "organisms/transactions/TransactionForm/TransactionForm.types";
import type { TransactionPaymentRow } from "organisms/transactions/TransactionPaymentFields/useTransactionPaymentFields";

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
  merchantHasHistory?: boolean;
  prefillAutomaticItems?: boolean;
  initialItems?: TransactionFormInitialItem[];
  initialPayments?: TransactionFormInitialValues["payments"];
};
export type ItemsStepSnapshot = {
  items: TransactionItemSummary[];
  payments: TransactionPaymentRow[];
};
export type TransactionItemsStepProps = ItemsStepOptions & {
  accountOptions: TransactionAccountOption[];
  selectedAccount?: TransactionAccountOption;
  suggestions?: MerchantEntrySuggestions;
  returning?: boolean;
  onConfirm: () => void;
  onChange?: (snapshot: ItemsStepSnapshot) => void;
};
