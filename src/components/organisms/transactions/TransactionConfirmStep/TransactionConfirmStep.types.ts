import type { MerchantEntrySuggestions } from "internal/transaction";
import type { TransactionAccountOption } from "types/transactions";
import type { useTransactionForm } from "organisms/transactions/TransactionForm/useTransactionForm";
import type { ItemsStepOptions } from "organisms/transactions/TransactionStepFlow/TransactionStepFlow.types";

/** 小票内编辑明细与付款的共用参数：表单由外框 `useTransactionStepFlow` 持有。 */
export type TransactionReceiptProps = ItemsStepOptions & {
  accountOptions: TransactionAccountOption[];
  form: ReturnType<typeof useTransactionForm>;
  automaticItemIds: number[];
  amountItemId: number | null;
  onAmountItemChange: (id: number | null) => void;
  suggestions?: MerchantEntrySuggestions;
  merchantHasHistory?: boolean;
};

export type TransactionConfirmStepProps = TransactionReceiptProps & {
  action: (data: FormData) => void;
  errorMessage?: string;
  successMessage?: string;
  saving: boolean;
  onBack: () => void;
  onAccountSelect: (account: TransactionAccountOption) => void;
  onAddAccount: () => void;
};
