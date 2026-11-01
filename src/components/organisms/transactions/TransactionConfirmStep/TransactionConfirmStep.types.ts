import type { MerchantEntrySuggestions } from "internal/transaction";
import type { TransactionAccountOption } from "types/transactions";
import type { TransactionFormInitialValues } from "organisms/transactions/TransactionForm/TransactionForm.types";
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
  onAccountSelect?: (account: TransactionAccountOption) => void;
  /** 只读详情（#962，编辑页的 `editRestriction`）：只显示内容，不能修改。 */
  readOnly?: boolean;
  /** 编辑记账（#962）：表单 id（离开确认的「保存」按 id 提交）、记录标识与乐观锁版本、保存按钮文字。 */
  formId?: string;
  initialValues?: TransactionFormInitialValues;
  submitLabel?: string;
};
