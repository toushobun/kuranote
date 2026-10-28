import type { MerchantEntrySuggestions } from "internal/transaction";
import type { TransactionAccountOption } from "types/transactions";
import type {
  TransactionFormProps,
  TransactionFormInitialItem,
  TransactionFormInitialValues,
} from "organisms/transactions/TransactionForm/TransactionForm.types";
import type { useTransactionForm } from "organisms/transactions/TransactionForm/useTransactionForm";

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
  prefillAutomaticItems?: boolean;
  initialItems?: TransactionFormInitialItem[];
  initialPayments?: TransactionFormInitialValues["payments"];
};
export type TransactionItemsStepProps = ItemsStepOptions & {
  merchantHasHistory?: boolean;
  accountOptions: TransactionAccountOption[];
  form: ReturnType<typeof useTransactionForm>;
  automaticItemIds: number[];
  amountItemId: number | null;
  onAmountItemChange: (id: number | null) => void;
  suggestions?: MerchantEntrySuggestions;
  returning?: boolean;
  onConfirm: () => void;
};
