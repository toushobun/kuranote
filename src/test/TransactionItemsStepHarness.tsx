import { TransactionItemsStep } from "organisms/transactions/TransactionItemsStep/TransactionItemsStep";
import { useTransactionStepFlow } from "organisms/transactions/TransactionStepFlow/useTransactionStepFlow";
import type { ItemsStepOptions } from "organisms/transactions/TransactionItemsStep/TransactionItemsStep.types";
import type { MerchantEntrySuggestions } from "internal/transaction";
import type { TransactionAccountOption } from "types/transactions";
import { flowFixture } from "test/mocks/transactionStepFlow";

export type ItemsStepHarnessProps = ItemsStepOptions & {
  accountOptions: TransactionAccountOption[];
  selectedAccount?: TransactionAccountOption;
  suggestions?: MerchantEntrySuggestions;
  returning?: boolean;
  onConfirm: () => void;
};

// 测试与 Story 共用外框的表单所有权，明细组件只接收受控数据与操作。
export function TransactionItemsStepHarness(props: ItemsStepHarnessProps) {
  const w = useTransactionStepFlow({
    ...flowFixture,
    accounts: props.accountOptions,
    suggestions: props.suggestions,
    initialAccountId: props.selectedAccount?.id,
    initialStep: 3,
    itemsOptions: props,
  });
  return (
    <TransactionItemsStep
      {...props}
      form={w.form}
      automaticItemIds={w.automaticItemIds}
      amountItemId={w.amountItemId}
      onAmountItemChange={w.setAmountItemId}
    />
  );
}
