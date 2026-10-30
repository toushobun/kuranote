import { TransactionConfirmStep } from "organisms/transactions/TransactionConfirmStep/TransactionConfirmStep";
import type { TransactionFormInitialValues } from "organisms/transactions/TransactionForm/TransactionForm.types";
import { useTransactionForm } from "organisms/transactions/TransactionForm/useTransactionForm";
import type { ItemsStepOptions } from "organisms/transactions/TransactionStepFlow/TransactionStepFlow.types";
import { flowFixture } from "./mocks/transactionStepFlow";

/** 只读小票（#962）的测试 / Storybook 外壳：已选 7-Eleven，明细与付款按参数预填。 */
export function ReadOnlyReceipt({
  itemsOptions,
  note,
}: {
  itemsOptions: ItemsStepOptions;
  note: string;
}) {
  const initialValues: TransactionFormInitialValues = {
    items: itemsOptions.initialItems ?? [],
    merchantId: "seven",
    note,
    payments: itemsOptions.initialPayments ?? [
      { accountId: "paypay", amount: null },
    ],
    transactionAt: "",
    type: "expense",
  };
  const form = useTransactionForm({
    accountOptions: flowFixture.accounts,
    categoryOptions: itemsOptions.categoryOptions,
    initialValues,
    merchantOptions: flowFixture.merchants,
  });
  return (
    <TransactionConfirmStep
      {...itemsOptions}
      readOnly
      form={form}
      accountOptions={flowFixture.accounts}
      automaticItemIds={[]}
      amountItemId={null}
      onAmountItemChange={() => {}}
      action={() => {}}
      saving={false}
      onBack={() => {}}
      onAccountSelect={() => {}}
      onAddAccount={() => {}}
    />
  );
}
