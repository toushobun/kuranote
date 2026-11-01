"use client";
import { flowMessages as m } from "config/transactionStepFlowMessages";
import { TransactionBottomEditorDrawer } from "molecules/transactions/TransactionBottomEditorDrawer/TransactionBottomEditorDrawer";
import { MerchantStep } from "organisms/transactions/MerchantStep/MerchantStep";
import type { useReceiptMerchantPicker } from "./useReceiptMerchantPicker";
import type { MerchantStepProps } from "organisms/transactions/MerchantStep/MerchantStep.types";

/** 新增与编辑小票使用同一个商家抽屉，保留底层小票和新增弹层期间的搜索状态。 */
export function ReceiptMerchantDrawer({
  picker,
  ...selection
}: Omit<MerchantStepProps, "onSelect" | "onAddMerchant"> & {
  picker: ReturnType<typeof useReceiptMerchantPicker>;
}) {
  return (
    <TransactionBottomEditorDrawer
      open={picker.open}
      suspended={picker.suspended}
      title={m.merchant}
      onClose={picker.closePicker}
    >
      <MerchantStep
        {...selection}
        onSelect={picker.selectMerchant}
        onAddMerchant={picker.onAddMerchant}
      />
    </TransactionBottomEditorDrawer>
  );
}
